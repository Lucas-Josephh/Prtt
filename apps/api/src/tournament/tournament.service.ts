import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Prisma, type NewsArticle, type Table, type Tournament } from "@prtt/database";
import { PrismaService } from "../database/prisma.service";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { ImageStorageService } from "../uploads/image-storage.service";

/** Tableau avec le nombre de joueurs déjà inscrits. */
export type TableWithCount = Table & { _count: { players: number } };
export type TournamentWithTables = Tournament & { tables: TableWithCount[] };

/** Tableaux triés par heure de début puis lettre, avec le nombre d'inscrits. */
const TABLES_INCLUDE = {
  tables: {
    orderBy: [{ startAt: "asc" }, { letter: "asc" }],
    include: { _count: { select: { players: true } } },
  },
} satisfies Prisma.TournamentInclude;

const newId = () => randomBytes(16).toString("hex");

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

@Injectable()
export class TournamentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: ImageStorageService,
  ) {}

  /**
   * Tournoi en cours : un tournoi dont la date de fin n'est pas encore passée
   * (il peut donc être à venir ou se dérouler en ce moment). null s'il n'y en a pas.
   */
  findCurrent(): Promise<TournamentWithTables | null> {
    return this.prisma.tournament.findFirst({
      where: { endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      include: TABLES_INCLUDE,
    });
  }

  /**
   * Article de présentation d'un tournoi : le plus récent article `tournament = true`
   * créé après le tournoi (un article d'une édition précédente n'est donc jamais repris).
   */
  findArticle(tournament: Tournament): Promise<NewsArticle | null> {
    return this.prisma.newsArticle.findFirst({
      where: { tournament: true, createdAt: { gte: tournament.createdAt } },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Crée un tournoi et ses tableaux. Refusé si un tournoi est déjà en cours. */
  async create(dto: CreateTournamentDto): Promise<TournamentWithTables> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.validateDates(dto, startDate, endDate, { startNotInPast: true });

    // Vérification + création dans une même transaction sérialisable :
    // deux créations simultanées ne peuvent pas passer toutes les deux.
    try {
      return await this.createIfNoneInProgress(dto, startDate, endDate);
    } catch (error) {
      // Conflit d'écriture entre deux créations simultanées (MySQL annule l'une des deux)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw new ConflictException("Un autre tournoi est en cours de création, réessayez dans un instant");
      }
      throw error;
    }
  }

  private createIfNoneInProgress(dto: CreateTournamentDto, startDate: Date, endDate: Date): Promise<TournamentWithTables> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.tournament.findFirst({
        where: { endDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
      });
      if (current) {
        throw new ConflictException(
          `Un tournoi est déjà en cours : « ${current.title} » (jusqu'au ${dateFormatter.format(current.endDate)}). ` +
          "Vous pourrez en créer un nouveau une fois celui-ci terminé.",
        );
      }

      return tx.tournament.create({
        data: {
          id: newId(),
          title: dto.title,
          ja: dto.ja,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          startDate,
          endDate,
          registrationEndAt: new Date(dto.registrationEndAt),
          tabMax: dto.tabMax,
          tables: {
            create: dto.tables.map((t) => ({
              id: newId(),
              letter: t.letter,
              minimumCat: t.minimumCat,
              maximumCat: t.maximumCat,
              startAt: new Date(t.startAt),
              maxPlayers: t.maxPlayers,
              price: t.price,
              extra: t.extra ?? false,
            })),
          },
        },
        include: TABLES_INCLUDE,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Modifie un tournoi et synchronise ses tableaux :
   * avec `id` = modifié, sans `id` = créé, absent de la liste = supprimé.
   * Un tableau qui a des inscrits ne peut être ni supprimé, ni réduit sous son nombre d'inscrits.
   */
  async update(id: string, dto: UpdateTournamentDto): Promise<TournamentWithTables> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.validateDates(dto, startDate, endDate);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tournament.findUnique({ where: { id }, include: TABLES_INCLUDE });
      if (!existing) throw new NotFoundException("Tournoi introuvable");

      const existingById = new Map(existing.tables.map((t) => [t.id, t]));
      const keptIds = new Set<string>();
      const errors: string[] = [];

      for (const table of dto.tables) {
        if (!table.id) continue;
        const current = existingById.get(table.id);
        if (!current) {
          errors.push(`Le tableau ${table.letter} n'appartient pas à ce tournoi`);
          continue;
        }
        keptIds.add(table.id);
        if (table.maxPlayers < current._count.players) {
          errors.push(`Le tableau ${table.letter} a déjà ${current._count.players} inscrits : le maximum ne peut pas être inférieur`);
        }
      }

      const removed = existing.tables.filter((t) => !keptIds.has(t.id));
      for (const table of removed) {
        if (table._count.players > 0) {
          errors.push(`Le tableau ${table.letter} a déjà ${table._count.players} inscrit${table._count.players > 1 ? "s" : ""} et ne peut pas être supprimé`);
        }
      }
      if (errors.length > 0) throw new BadRequestException(errors);

      if (removed.length > 0) {
        await tx.table.deleteMany({ where: { id: { in: removed.map((t) => t.id) } } });
      }

      // Lettres provisoires d'abord : permet d'échanger deux lettres (A ↔ B)
      // sans heurter la contrainte d'unicité (tournoi, lettre)
      const updated = dto.tables.filter((t) => t.id);
      for (const [index, table] of updated.entries()) {
        await tx.table.update({ where: { id: table.id }, data: { letter: `#${index}` } });
      }
      for (const table of updated) {
        await tx.table.update({
          where: { id: table.id },
          data: {
            letter: table.letter,
            minimumCat: table.minimumCat,
            maximumCat: table.maximumCat,
            startAt: new Date(table.startAt),
            maxPlayers: table.maxPlayers,
            price: table.price,
            extra: table.extra ?? false,
          },
        });
      }

      return tx.tournament.update({
        where: { id },
        data: {
          title: dto.title,
          ja: dto.ja,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          startDate,
          endDate,
          registrationEndAt: new Date(dto.registrationEndAt),
          tabMax: dto.tabMax,
          tables: {
            create: dto.tables.filter((t) => !t.id).map((t) => ({
              id: newId(),
              letter: t.letter,
              minimumCat: t.minimumCat,
              maximumCat: t.maximumCat,
              startAt: new Date(t.startAt),
              maxPlayers: t.maxPlayers,
              price: t.price,
              extra: t.extra ?? false,
            })),
          },
        },
        include: TABLES_INCLUDE,
      });
    });
  }

  /**
   * Supprime un tournoi. Ses tableaux et leurs inscriptions sont supprimés en cascade,
   * ainsi que son article de présentation (qui ne serait plus affiché nulle part).
   */
  async remove(id: string): Promise<void> {
    const removedImages = await this.prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({ where: { id } });
      if (!tournament) throw new NotFoundException("Tournoi introuvable");

      const articleFilter = { tournament: true, createdAt: { gte: tournament.createdAt } };
      const articles = await tx.newsArticle.findMany({ where: articleFilter, select: { imageUrl: true } });
      await tx.newsArticle.deleteMany({ where: articleFilter });
      await tx.tournament.delete({ where: { id } });
      return articles.map((a) => a.imageUrl);
    });
    // Images des articles supprimés : effacées du disque une fois la suppression validée
    await Promise.all(removedImages.map((path) => this.images.remove(path)));
  }

  /** Règles qui portent sur plusieurs champs à la fois. */
  private validateDates(dto: CreateTournamentDto | UpdateTournamentDto, startDate: Date, endDate: Date, options: { startNotInPast?: boolean } = {}) {
    const errors: string[] = [];

    if (endDate < startDate) errors.push("La date de fin doit être après la date de début");
    if (endDate < new Date()) errors.push("La date de fin est déjà passée");
    // À la création, le tournoi ne peut pas commencer avant aujourd'hui (marge de 24 h pour les fuseaux horaires)
    if (options.startNotInPast && startDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) errors.push("La date de début ne peut pas être dans le passé");

    // Clôture des inscriptions : au plus tard à la fin du tournoi ; à la création, pas dans le passé
    const registrationEndAt = new Date(dto.registrationEndAt);
    if (registrationEndAt > endDate) errors.push("La clôture des inscriptions doit être avant la fin du tournoi");
    if (options.startNotInPast && registrationEndAt.getTime() < Date.now() - 5 * 60 * 1000) {
      errors.push("La clôture des inscriptions ne peut pas être dans le passé");
    }

    const letters = new Set<string>();
    for (const table of dto.tables) {
      if (letters.has(table.letter)) errors.push(`Le tableau ${table.letter} est présent plusieurs fois`);
      letters.add(table.letter);

      const startAt = new Date(table.startAt);
      if (startAt < startDate || startAt > endDate) {
        errors.push(`Le tableau ${table.letter} doit commencer pendant le tournoi`);
      }
    }

    if (errors.length > 0) throw new BadRequestException(errors);
  }
}
