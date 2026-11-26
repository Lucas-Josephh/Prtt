import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prtt/database";
import { PrismaService } from "../database/prisma.service";
import { CreateRegistrationDto, NUMBERED_MIN_RANKING } from "./dto/create-registration.dto";
import { isRankingAllowed } from "./ranking";

export interface RegistrationResult {
  /** Lettres des tableaux auxquels le joueur vient d'être inscrit */
  tables: string[];
}

/** Jour (heure de Paris) d'un tableau, ex. "2027-05-23" : sert à appliquer la limite de tableaux par jour. */
const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const dayLabel = (date: Date) => date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inscrit un joueur aux tableaux choisis (une ligne Player par tableau).
   * Tout est vérifié dans une transaction sérialisable : si un seul tableau pose problème,
   * rien n'est enregistré, et deux inscriptions simultanées ne peuvent pas dépasser le maximum.
   */
  async register(tournamentId: string, dto: CreateRegistrationDto): Promise<RegistrationResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: tournamentId },
          include: {
            // Tous les tableaux : il faut aussi connaître ceux où cette licence est déjà inscrite (limite par jour)
            tables: {
              include: {
                _count: { select: { players: true } },
                players: { where: { licence: dto.licence }, select: { id: true } },
              },
            },
          },
        });
        if (!tournament) throw new NotFoundException("Tournoi introuvable");

        // Inscriptions closes : on refuse avant toute autre vérification
        const now = new Date();
        if (tournament.registrationEndAt <= now || tournament.endDate < now) {
          throw new ForbiddenException("Les inscriptions à ce tournoi sont closes");
        }

        const chosen = tournament.tables.filter((t) => dto.tableIds.includes(t.id));
        const errors: string[] = [];
        if (chosen.length !== dto.tableIds.length) errors.push("Un des tableaux choisis n'appartient pas à ce tournoi");

        for (const table of chosen) {
          if (table.startAt <= now) errors.push(`Le tableau ${table.letter} a déjà commencé`);
          if (table._count.players >= table.maxPlayers) errors.push(`Le tableau ${table.letter} est complet`);
          if (table.players.length > 0) errors.push(`Cette licence est déjà inscrite au tableau ${table.letter}`);
          if (!isRankingAllowed(dto.ranking, table.minimumCat, table.maximumCat)) {
            errors.push(`Votre classement (${dto.ranking}) ne permet pas de jouer le tableau ${table.letter} (${table.minimumCat} - ${table.maximumCat})`);
          }
        }

        // Limite de tableaux par jour (les tableaux « en plus » ne comptent pas),
        // en ajoutant ceux où cette licence est déjà inscrite
        const perDay = new Map<string, { label: string; count: number }>();
        const countTable = (table: (typeof tournament.tables)[number]) => {
          if (table.extra) return;
          const key = dayKey(table.startAt);
          const entry = perDay.get(key) ?? { label: dayLabel(table.startAt), count: 0 };
          entry.count += 1;
          perDay.set(key, entry);
        };
        tournament.tables.filter((t) => t.players.length > 0).forEach(countTable);
        chosen.filter((t) => t.players.length === 0).forEach(countTable);
        for (const { label, count } of perDay.values()) {
          if (count > tournament.tabMax) {
            errors.push(`Vous ne pouvez pas jouer plus de ${tournament.tabMax} tableau${tournament.tabMax > 1 ? "x" : ""} le ${label} (hors tableaux en plus)`);
          }
        }

        if (errors.length > 0) throw new BadRequestException(errors);

        // Le numéro n'a de sens qu'à partir de 2000 points
        const numbered = dto.ranking >= NUMBERED_MIN_RANKING ? dto.numbered ?? null : null;

        await tx.player.createMany({
          data: chosen.map((table) => ({
            id: randomBytes(16).toString("hex"),
            tableId: table.id,
            name: dto.name,
            surname: dto.surname,
            licence: dto.licence,
            ranking: dto.ranking,
            numbered,
            club: dto.club,
            email: dto.email,
            phone: dto.phone ?? null,
          })),
        });

        return { tables: chosen.map((t) => t.letter).sort() };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2034 : conflit entre deux inscriptions simultanées ; P2002 : licence déjà inscrite (contrainte unique)
        if (error.code === "P2034") throw new ConflictException("Beaucoup d'inscriptions en même temps, réessayez dans un instant");
        if (error.code === "P2002") throw new ConflictException("Cette licence est déjà inscrite à l'un de ces tableaux");
      }
      throw error;
    }
  }
}
