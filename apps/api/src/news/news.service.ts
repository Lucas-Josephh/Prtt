import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Prisma, type NewsArticle } from "@prtt/database";
import { PrismaService } from "../database/prisma.service";
import { isRecordNotFound } from "../common/hex-id";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { ImageStorageService } from "../uploads/image-storage.service";

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: ImageStorageService,
  ) {}

  /**
   * Actualités publiées (date de publication passée), les plus récentes d'abord.
   * Les articles de tournoi (tournament = true) n'en font pas partie : ils sont affichés sur la page Tournoi.
   */
  findPublished(limit?: number): Promise<NewsArticle[]> {
    return this.prisma.newsArticle.findMany({
      where: { tournament: false, publishedAt: { lte: new Date() } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  /** Toutes les actualités, brouillons et publications programmées compris (admin), hors articles de tournoi. */
  findAll(): Promise<NewsArticle[]> {
    // Les plus récentes d'abord ; les brouillons (sans date de publication) arrivent en fin de liste
    return this.prisma.newsArticle.findMany({
      where: { tournament: false },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(dto: CreateNewsDto): Promise<NewsArticle> {
    await this.images.assertExists(dto.imageUrl);
    return this.prisma.newsArticle.create({
      data: {
        id: randomBytes(16).toString("hex"),
        title: dto.title,
        content: dto.content,
        // Un article de tournoi est toujours de catégorie « tournoi », jamais « à la une » des actualités
        featured: dto.tournament ? false : dto.featured ?? false,
        tournament: dto.tournament ?? false,
        category: dto.tournament ? "tournoi" : dto.category ?? "autre",
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        imageUrl: dto.imageUrl ?? null,
      },
    });
  }

  /** Modifie uniquement les champs envoyés (aucune date de modification n'est enregistrée). */
  async update(id: string, dto: UpdateNewsDto): Promise<NewsArticle> {
    const data: Prisma.NewsArticleUpdateInput = {};
    // null n'est accepté que pour publishedAt (= brouillon) ; ailleurs il est ignoré.
    // `tournament` n'est pas modifiable : un article reste un article de tournoi ou une actualité.
    if (dto.title != null) data.title = dto.title;
    if (dto.content != null) data.content = dto.content;
    if (dto.featured != null) data.featured = dto.featured;
    if (dto.category != null) data.category = dto.category;
    if (dto.publishedAt !== undefined) data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;

    // Image : null la retire ; l'ancienne image est supprimée du disque une fois remplacée
    let previousImage: string | null = null;
    if (dto.imageUrl !== undefined) {
      const current = await this.prisma.newsArticle.findUnique({ where: { id }, select: { imageUrl: true } });
      if (!current) throw new NotFoundException("Actualité introuvable");
      await this.images.assertExists(dto.imageUrl);
      previousImage = current.imageUrl;
      data.imageUrl = dto.imageUrl;
    }

    try {
      const article = await this.prisma.newsArticle.update({ where: { id }, data });
      if (previousImage && previousImage !== article.imageUrl) await this.images.remove(previousImage);
      return article;
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundException("Actualité introuvable");
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const article = await this.prisma.newsArticle.delete({ where: { id } });
      await this.images.remove(article.imageUrl);
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundException("Actualité introuvable");
      throw error;
    }
  }
}
