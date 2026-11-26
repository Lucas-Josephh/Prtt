import { Injectable, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";
import { PrismaService } from "../database/prisma.service";

const TIME_ZONE = "Europe/Paris";
/** Jour (heure de Paris) "AAAA-MM-JJ", pour regrouper les tableaux par jour. */
const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
/** « Samedi 5 décembre » */
const dayLabel = (date: Date) => {
  const label = date.toLocaleDateString("fr-FR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/**
 * Excel n'a pas de fuseau horaire et exceljs écrit les dates en UTC : on fabrique une date dont
 * l'heure UTC est l'heure affichée à Paris, pour que la cellule montre l'heure locale.
 */
function parisWallClock(date: Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second));
}

export interface RegistrationExport {
  filename: string;
  buffer: Buffer;
}

interface PlayerRow {
  surname: string;
  name: string;
  licence: string;
  ranking: number;
  numbered: number | null;
  club: string;
  email: string;
  phone: string | null;
  /** Lettres des tableaux, par jour */
  tablesByDay: Map<string, string[]>;
  total: number;
  registeredAt: Date;
}

@Injectable()
export class RegistrationExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fichier Excel des inscrits d'un tournoi : une ligne par joueur (regroupé par licence),
   * une colonne par jour avec les tableaux joués, et le prix total du week-end.
   */
  async export(tournamentId: string): Promise<RegistrationExport> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tables: {
          orderBy: [{ startAt: "asc" }, { letter: "asc" }],
          include: { players: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
    if (!tournament) throw new NotFoundException("Tournoi introuvable");

    // Jours du tournoi qui ont au moins un tableau, dans l'ordre
    const days = new Map<string, string>();
    for (const table of tournament.tables) days.set(dayKey(table.startAt), dayLabel(table.startAt));

    // Une inscription = une ligne Player par tableau : on regroupe par licence
    const players = new Map<string, PlayerRow>();
    for (const table of tournament.tables) {
      for (const player of table.players) {
        let row = players.get(player.licence);
        if (!row) {
          row = {
            surname: player.surname, name: player.name, licence: player.licence, ranking: player.ranking,
            numbered: player.numbered, club: player.club, email: player.email, phone: player.phone,
            tablesByDay: new Map(), total: 0, registeredAt: player.createdAt,
          };
          players.set(player.licence, row);
        } else if (player.createdAt > row.registeredAt) {
          // Inscrit en plusieurs fois : on garde les coordonnées les plus récentes
          Object.assign(row, {
            surname: player.surname, name: player.name, ranking: player.ranking, numbered: player.numbered,
            club: player.club, email: player.email, phone: player.phone ?? row.phone,
          });
        }
        if (player.createdAt < row.registeredAt) row.registeredAt = player.createdAt;

        const key = dayKey(table.startAt);
        row.tablesByDay.set(key, [...(row.tablesByDay.get(key) ?? []), table.letter]);
        row.total += Number(table.price);
      }
    }

    const rows = [...players.values()].sort((a, b) =>
      a.surname.localeCompare(b.surname, "fr", { sensitivity: "base" }) || a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PRTT";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Inscrits", { views: [{ state: "frozen", ySplit: 1 }] });

    sheet.columns = [
      { header: "Nom", key: "surname", width: 20 },
      { header: "Prénom", key: "name", width: 18 },
      { header: "Licence", key: "licence", width: 12 },
      { header: "Classement", key: "ranking", width: 12 },
      { header: "Numéroté", key: "numbered", width: 11 },
      { header: "Club", key: "club", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: "Téléphone", key: "phone", width: 16 },
      ...[...days.entries()].map(([key, label]) => ({ header: label, key: `day:${key}`, width: 22 })),
      { header: "Total (€)", key: "total", width: 12, style: { numFmt: '#,##0.00 "€"' } },
      { header: "Inscrit le", key: "registeredAt", width: 18, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    ];

    for (const row of rows) {
      sheet.addRow({
        surname: row.surname,
        name: row.name,
        licence: row.licence,
        ranking: row.ranking,
        numbered: row.numbered ?? "",
        club: row.club,
        email: row.email,
        phone: row.phone ?? "",
        // Tableaux du jour par ordre alphabétique : « A, B, C »
        ...Object.fromEntries([...days.keys()].map((key) => [
          `day:${key}`,
          [...(row.tablesByDay.get(key) ?? [])].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })).join(", "),
        ])),
        total: Math.round(row.total * 100) / 100,
        registeredAt: parisWallClock(row.registeredAt),
      });
    }

    // Ligne de total général
    if (rows.length > 0) {
      const totalRow = sheet.addRow({
        surname: `${rows.length} inscrit${rows.length > 1 ? "s" : ""}`,
        total: Math.round(rows.reduce((sum, r) => sum + r.total, 0) * 100) / 100,
      });
      totalRow.font = { bold: true };
    }

    // En-tête aux couleurs du club
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    header.alignment = { vertical: "middle" };
    header.height = 22;
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const slug = tournament.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    return { filename: `inscrits-${slug || "tournoi"}.xlsx`, buffer };
  }
}
