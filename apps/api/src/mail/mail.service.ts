import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

/**
 * Envoi des emails en SMTP. Configuration dans packages/database/.env (SMTP_*, MAIL_FROM).
 * Sans SMTP_HOST, l'envoi est désactivé : l'application fonctionne, aucun email n'est envoyé.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;
  readonly defaultReplyTo: string | undefined;

  constructor(config: ConfigService) {
    const host = config.get<string>("SMTP_HOST")?.trim();
    const port = Number(config.get<string>("SMTP_PORT") ?? 587);
    const secureSetting = config.get<string>("SMTP_SECURE")?.trim().toLowerCase();
    const user = config.get<string>("SMTP_USER")?.trim();
    const pass = config.get<string>("SMTP_PASS");

    this.from = config.get<string>("MAIL_FROM")?.trim() || user;
    this.defaultReplyTo = config.get<string>("MAIL_REPLY_TO")?.trim() || undefined;
    this.transporter = host
      ? createTransport({
          host,
          port,
          // 465 = TLS direct ; 587 = STARTTLS (chiffrement négocié après connexion)
          secure: secureSetting ? secureSetting === "true" : port === 465,
          auth: user ? { user, pass } : undefined,
        })
      : null;
  }

  get enabled(): boolean {
    return this.transporter !== null;
  }

  /** Vérifie la connexion SMTP au démarrage (sans bloquer le lancement de l'API). */
  onModuleInit(): void {
    if (!this.transporter) {
      this.logger.warn("SMTP_HOST non renseigné : les emails de confirmation ne seront pas envoyés");
      return;
    }
    if (!this.from) this.logger.warn("MAIL_FROM non renseigné : renseignez l'adresse d'expédition");
    this.transporter.verify().then(
      () => this.logger.log("Connexion SMTP opérationnelle"),
      (error: unknown) => this.logger.error(`Connexion SMTP impossible : ${error instanceof Error ? error.message : String(error)}`),
    );
  }

  /** Envoie un email. Renvoie false (sans lever d'erreur) si l'envoi est désactivé. */
  async send(message: Omit<Mail.Options, "from">): Promise<boolean> {
    if (!this.transporter) return false;
    const info = await this.transporter.sendMail({ from: this.from, ...message });
    // Ex. « 250 2.0.0 Ok: queued as … » : le serveur SMTP a accepté le mail (la suite dépend du destinataire)
    this.logger.log(`Email « ${String(message.subject)} » accepté par le serveur SMTP : ${info.response}`);
    return true;
  }
}
