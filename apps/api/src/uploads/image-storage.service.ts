import { BadRequestException, Injectable, Logger, PayloadTooLargeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BlobNotFoundError, del, head, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { access, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

/**
 * Taille maximale d'un fichier envoyé. Vercel refuse les requêtes de plus de 4,5 Mo :
 * le front compresse l'image avant l'envoi, cette limite n'est qu'un garde-fou.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Plus grand côté de l'image enregistrée, en pixels. */
const MAX_DIMENSION = 1600;
/** Formats d'image acceptés en entrée (détectés à partir du contenu, pas de l'extension). */
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);

/** Préfixe public des images sur le disque : servies par l'API sur /api/uploads/<id>.webp. */
export const UPLOADS_PREFIX = "/uploads/";
/**
 * Chemin d'une image tel qu'enregistré en base :
 * - disque (développement) : « /uploads/<id>.webp »
 * - Vercel Blob (production) : « https://<store>.public.blob.vercel-storage.com/uploads/<id>.webp »
 */
export const IMAGE_PATH = /^(?:\/uploads\/|https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/)[0-9a-f]{32}\.webp$/;
const LOCAL_PATH = /^\/uploads\/[0-9a-f]{32}\.webp$/;

/**
 * Stockage des images, hors base de données.
 * - Avec BLOB_READ_WRITE_TOKEN ou BLOB_STORE_ID (Vercel) : Vercel Blob, le disque d'une fonction Vercel n'étant pas conservé.
 * - Sans : dossier UPLOADS_DIR sur le disque du serveur (développement local).
 * Chaque image est redimensionnée, convertie en WebP, débarrassée de ses métadonnées et nommée au hasard.
 */
@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);
  /** Dossier des images sur le disque (utilisé uniquement sans Vercel Blob). */
  readonly directory: string;
  /** Jeton Blob explicite ; sans lui, la bibliothèque utilise l'authentification OIDC de Vercel (BLOB_STORE_ID). */
  private readonly blobToken: string | undefined;
  private readonly blobEnabled: boolean;

  constructor(config: ConfigService) {
    this.directory = resolve(config.get<string>("UPLOADS_DIR", "storage/images"));
    this.blobToken = config.get<string>("BLOB_READ_WRITE_TOKEN")?.trim() || undefined;
    // Store Blob relié au projet Vercel : soit un jeton BLOB_READ_WRITE_TOKEN, soit BLOB_STORE_ID (+ jeton OIDC fourni par Vercel)
    this.blobEnabled = this.blobToken !== undefined || Boolean(config.get<string>("BLOB_STORE_ID")?.trim());
  }

  /** Vrai si les images sont stockées sur Vercel Blob (sinon sur le disque). */
  get usesBlob(): boolean {
    return this.blobEnabled;
  }

  /** Compresse et enregistre l'image ; renvoie le chemin à enregistrer en base. */
  async save(buffer: Buffer): Promise<string> {
    if (buffer.length > MAX_UPLOAD_BYTES) throw new PayloadTooLargeException("L'image ne doit pas dépasser 4 Mo");

    let output: Buffer;
    try {
      // limitInputPixels : refuse les images démesurées (ex. 20 000 × 20 000) qui satureraient la mémoire
      const image = sharp(buffer, { limitInputPixels: 50_000_000, animated: false });
      const { format } = await image.metadata();
      if (!format || !ACCEPTED_FORMATS.has(format)) throw new Error(`format ${format ?? "inconnu"}`);

      output = await image
        .rotate() // applique l'orientation EXIF (photos de téléphone), puis supprime les métadonnées (GPS…)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      throw new BadRequestException("Le fichier n'est pas une image valide (JPG, PNG ou WebP)");
    }

    const name = `${randomBytes(16).toString("hex")}.webp`;

    if (this.blobEnabled) {
      const blob = await put(`uploads/${name}`, output, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        // Le nom est aléatoire et ne change jamais : cache d'un an
        cacheControlMaxAge: 365 * 24 * 60 * 60,
        token: this.blobToken,
      });
      return blob.url;
    }

    await mkdir(this.directory, { recursive: true });
    const target = join(this.directory, name);
    await writeFile(`${target}.tmp`, output);
    await rename(`${target}.tmp`, target);
    return `${UPLOADS_PREFIX}${name}`;
  }

  /** Vrai si le chemin désigne une image existante de ce stockage. */
  async exists(path: string): Promise<boolean> {
    if (!IMAGE_PATH.test(path)) return false;

    if (this.blobEnabled) {
      if (LOCAL_PATH.test(path)) return false;
      try {
        // Échoue aussi pour une URL d'un autre « store » Blob que le nôtre
        await head(path, { token: this.blobToken });
        return true;
      } catch (error) {
        if (!(error instanceof BlobNotFoundError)) this.logger.warn(`Vérification de l'image impossible : ${(error as Error).message}`);
        return false;
      }
    }

    if (!LOCAL_PATH.test(path)) return false;
    try {
      await access(this.fileOf(path));
      return true;
    } catch {
      return false;
    }
  }

  /** Supprime une image qui n'est plus utilisée. Ne lève jamais d'erreur. */
  async remove(path: string | null | undefined): Promise<void> {
    if (!path || !IMAGE_PATH.test(path)) return;

    if (this.blobEnabled) {
      if (LOCAL_PATH.test(path)) return;
      try {
        await del(path, { token: this.blobToken });
      } catch (error) {
        this.logger.warn(`Impossible de supprimer l'image ${path} : ${(error as Error).message}`);
      }
      return;
    }

    if (!LOCAL_PATH.test(path)) return;
    try {
      await unlink(this.fileOf(path));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn(`Impossible de supprimer l'image ${path} : ${(error as Error).message}`);
      }
    }
  }

  /** Vérifie qu'une image envoyée dans un formulaire existe bien (400 sinon). */
  async assertExists(path: string | null | undefined): Promise<void> {
    if (path && !(await this.exists(path))) {
      throw new BadRequestException("L'image n'existe plus, envoyez-la à nouveau");
    }
  }

  private fileOf(path: string): string {
    return join(this.directory, path.slice(UPLOADS_PREFIX.length));
  }
}
