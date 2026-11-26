import { runInBackground } from "../common/background";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { RegistrationFileService } from "./registration-file.service";

/** Garde-fou : nombre maximum de joueurs renvoyés (un tournoi en compte quelques centaines). */
const SEARCH_LIMIT = 1000;

export interface RegisteredPlayer {
  licence: string;
  name: string;
  surname: string;
  club: string;
  ranking: number;
  numbered: number | null;
  email: string;
  phone: string | null;
  /** Tableaux auxquels le joueur est inscrit, dans l'ordre chronologique */
  tables: { tableId: string; letter: string; startAt: Date }[];
}

/**
 * Administration des inscrits d'un tournoi : recherche, désinscription d'un tableau, suppression du tournoi.
 * Un joueur = une licence (une inscription crée une ligne Player par tableau).
 * Après chaque modification, le fichier Excel des inscrits est régénéré.
 */
@Injectable()
export class PlayerAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registrationFiles: RegistrationFileService,
  ) {}

  /** Joueurs dont le nom, le prénom, la licence ou le club contient `query` (insensible à la casse) ; tous si `query` est vide. */
  async search(tournamentId: string, query: string): Promise<RegisteredPlayer[]> {
    await this.assertTournament(tournamentId);
    const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 5);
    // Recherche vide : tous les inscrits du tournoi

    // Chaque mot doit apparaître dans au moins un champ (sans tenir compte des majuscules) : « dupont jean » trouve Jean Dupont
    // groupBy (et non findMany + distinct) : la limite porte sur les joueurs, pas sur les lignes par tableau
    const matching = await this.prisma.player.groupBy({
      by: ["licence", "surname", "name"],
      where: {
        table: { tournamentId },
        AND: words.map((word) => ({
          OR: [
            { surname: { contains: word, mode: "insensitive" } },
            { name: { contains: word, mode: "insensitive" } },
            { licence: { contains: word, mode: "insensitive" } },
            { club: { contains: word, mode: "insensitive" } },
          ],
        })),
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }, { licence: "asc" }],
      take: SEARCH_LIMIT,
    });
    if (matching.length === 0) return [];

    const rows = await this.prisma.player.findMany({
      where: { table: { tournamentId }, licence: { in: matching.map((m) => m.licence) } },
      include: { table: { select: { id: true, letter: true, startAt: true } } },
      orderBy: [{ surname: "asc" }, { name: "asc" }, { table: { startAt: "asc" } }, { table: { letter: "asc" } }],
    });

    const players = new Map<string, RegisteredPlayer>();
    for (const row of rows) {
      let player = players.get(row.licence);
      if (!player) {
        player = {
          licence: row.licence, name: row.name, surname: row.surname, club: row.club,
          ranking: row.ranking, numbered: row.numbered, email: row.email, phone: row.phone, tables: [],
        };
        players.set(row.licence, player);
      }
      player.tables.push({ tableId: row.table.id, letter: row.table.letter, startAt: row.table.startAt });
    }
    return [...players.values()];
  }

  /** Désinscrit le joueur d'un seul tableau. */
  async unregisterFromTable(tournamentId: string, licence: string, tableId: string): Promise<void> {
    const { count } = await this.prisma.player.deleteMany({
      where: { licence, tableId, table: { tournamentId } },
    });
    if (count === 0) throw new NotFoundException("Ce joueur n'est pas inscrit à ce tableau");
    runInBackground(this.registrationFiles.sync(tournamentId));
  }

  /** Supprime le joueur du tournoi (tous ses tableaux). */
  async removeFromTournament(tournamentId: string, licence: string): Promise<void> {
    const { count } = await this.prisma.player.deleteMany({
      where: { licence, table: { tournamentId } },
    });
    if (count === 0) throw new NotFoundException("Ce joueur n'est pas inscrit à ce tournoi");
    runInBackground(this.registrationFiles.sync(tournamentId));
  }

  private async assertTournament(tournamentId: string): Promise<void> {
    const exists = await this.prisma.tournament.count({ where: { id: tournamentId } });
    if (!exists) throw new NotFoundException("Tournoi introuvable");
  }
}
