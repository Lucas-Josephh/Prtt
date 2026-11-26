import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ImageStorageService } from "./image-storage.service";
import { UploadsController } from "./uploads.controller";

/** Envoi et stockage des images ; ImageStorageService est disponible dans tous les modules. */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [ImageStorageService],
  exports: [ImageStorageService],
})
export class UploadsModule {}
