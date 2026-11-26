import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TournamentController } from "./tournament.controller";
import { TournamentService } from "./tournament.service";
import { RegistrationService } from "./registration.service";
import { RegistrationOpenGuard } from "./registration-open.guard";
import { RegistrationExportService } from "./registration-export.service";
import { RegistrationFileService } from "./registration-file.service";
import { RegistrationMailService } from "./registration-mail.service";
import { PlayerAdminService } from "./player-admin.service";

@Module({
  imports: [AuthModule],
  controllers: [TournamentController],
  providers: [TournamentService, RegistrationService, RegistrationOpenGuard, RegistrationExportService, RegistrationFileService, RegistrationMailService, PlayerAdminService],
})
export class TournamentModule {}
