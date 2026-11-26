import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";

/** Envoi d'emails (SMTP) ; MailService est disponible dans tous les modules. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
