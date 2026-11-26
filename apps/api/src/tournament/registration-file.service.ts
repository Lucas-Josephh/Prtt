import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { RegistrationExportService } from "./registration-export.service";

/**
 * Tient à jour, sur le disque, un fichier Excel unique par tournoi contenant tous les inscrits.
 * La base de données reste la source de vérité (places, doublons, inscriptions simultanées) :
 * le fichier est régénéré à partir d'elle après chaque inscription.
 */
@Injectable()
export class RegistrationFileService {
  private readonly logger = new Logger(RegistrationFileService.name);
  private readonly directory: string;
  /** File d'attente par tournoi : deux écritures du même fichier ne se chevauchent jamais. */
  private readonly queues = new Map<string, Promise<void>>();

  constructor(
    private readonly exports: RegistrationExportService,
    config: ConfigService,
  ) {
    this.directory = resolve(config.get<string>("REGISTRATIONS_DIR", "storage/inscriptions"));
  }

  /**
   * Régénère le fichier du tournoi. Une erreur est journalisée mais ne fait pas échouer l'inscription.
   * Sur Vercel, le disque n'est pas conservé : rien n'est écrit, le bouton « Exporter les inscrits »
   * (GET /tournaments/:id/registrations/export) génère toujours le fichier à jour depuis la base.
   */
  sync(tournamentId: string): Promise<void> {
    if (process.env.VERCEL) return Promise.resolve();
    const previous = this.queues.get(tournamentId) ?? Promise.resolve();
    const next = previous
      .then(() => this.write(tournamentId))
      .catch((error: unknown) => {
        this.logger.error(`Impossible d'écrire le fichier Excel du tournoi ${tournamentId}`, error instanceof Error ? error.stack : String(error));
      });
    this.queues.set(tournamentId, next);
    void next.finally(() => {
      if (this.queues.get(tournamentId) === next) this.queues.delete(tournamentId);
    });
    return next;
  }

  private async write(tournamentId: string): Promise<void> {
    const { filename, buffer } = await this.exports.export(tournamentId);
    await mkdir(this.directory, { recursive: true });
    // Écriture dans un fichier temporaire puis renommage : le fichier n'est jamais à moitié écrit
    const target = join(this.directory, filename.replace(/\.xlsx$/, `-${tournamentId.slice(0, 8)}.xlsx`));
    const temp = `${target}.tmp`;
    await writeFile(temp, buffer);
    await rename(temp, target);
  }
}
