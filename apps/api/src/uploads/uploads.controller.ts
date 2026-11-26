import { BadRequestException, Controller, HttpCode, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { SessionGuard } from "../auth/session.guard";
import { ImageStorageService, MAX_UPLOAD_BYTES } from "./image-storage.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly images: ImageStorageService) {}

  /**
   * Admin : envoi d'une image (champ « file » d'un formulaire multipart).
   * Renvoie `{ url: "/uploads/<id>.webp" }`, à enregistrer dans `imageUrl` d'une actualité ou d'un membre.
   */
  @Post()
  @HttpCode(201)
  @UseGuards(SessionGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  // Sans `dest`, multer garde le fichier en mémoire : seule la version compressée est écrite sur le disque
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined): Promise<{ url: string }> {
    if (!file) throw new BadRequestException("Aucune image reçue");
    return { url: await this.images.save(file.buffer) };
  }
}
