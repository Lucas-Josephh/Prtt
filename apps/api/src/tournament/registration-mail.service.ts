import { Injectable, Logger } from "@nestjs/common";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaService } from "../database/prisma.service";
import { MailService } from "../mail/mail.service";
import type { CreateRegistrationDto } from "./dto/create-registration.dto";
import { NUMBERED_MIN_RANKING } from "./dto/create-registration.dto";
import {
  registrationMailHtml,
  registrationMailSubject,
  registrationMailText,
  type RegistrationMailData,
} from "./registration-mail.template";

/**
 * Logo joint au mail, relatif au code compilé (dist/tournament → apps/api/assets) :
 * fonctionne quel que soit le dossier de lancement (serveur local ou fonction Vercel).
 */
const LOGO_PATH = resolve(__dirname, "../../assets/mail/logo.jpg");
const LOGO_CID = "logo@prtt";

/** Email de confirmation envoyé au joueur après son inscription. */
@Injectable()
export class RegistrationMailService {
  private readonly logger = new Logger(RegistrationMailService.name);
  private readonly hasLogo = existsSync(LOGO_PATH);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** À appeler sans attendre (`void`) : une erreur d'envoi est journalisée, jamais renvoyée au joueur. */
  async sendConfirmation(tournamentId: string, dto: CreateRegistrationDto): Promise<void> {
    if (!this.mail.enabled) return;
    try {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { tables: { where: { id: { in: dto.tableIds } } } },
      });
      if (!tournament || tournament.tables.length === 0) return;

      const data: RegistrationMailData = {
        tournament,
        player: {
          name: dto.name,
          surname: dto.surname,
          licence: dto.licence,
          ranking: dto.ranking,
          numbered: dto.ranking >= NUMBERED_MIN_RANKING ? dto.numbered ?? null : null,
          club: dto.club,
          email: dto.email,
          phone: dto.phone ?? null,
        },
        tables: tournament.tables.map((t) => ({
          letter: t.letter,
          minimumCat: t.minimumCat,
          maximumCat: t.maximumCat,
          startAt: t.startAt,
          price: Number(t.price),
          extra: t.extra,
        })),
        logoCid: this.hasLogo ? LOGO_CID : null,
      };

      await this.mail.send({
        to: { name: `${dto.name} ${dto.surname}`, address: dto.email },
        // Les réponses vont au juge-arbitre (ou à MAIL_REPLY_TO s'il n'a pas d'email)
        replyTo: tournament.email ?? this.mail.defaultReplyTo,
        subject: registrationMailSubject(data),
        html: registrationMailHtml(data),
        text: registrationMailText(data),
        attachments: this.hasLogo ? [{ filename: "logo.jpg", path: LOGO_PATH, cid: LOGO_CID }] : [],
      });
    } catch (error) {
      this.logger.error(
        `Impossible d'envoyer l'email de confirmation (tournoi ${tournamentId})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
