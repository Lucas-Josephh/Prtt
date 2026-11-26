import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { NewsArticle } from "@prtt/database";
import { SessionGuard } from "../auth/session.guard";
import { HexIdPipe } from "../common/hex-id";
import { CreateNewsDto } from "./dto/create-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { NewsService } from "./news.service";

const NEWS_ID = new HexIdPipe("Actualité introuvable");

@Controller("news")
export class NewsController {
  constructor(private readonly news: NewsService) {}

  /** Public : actualités publiées, les plus récentes d'abord. `?limit=4` pour n'en garder que 4. */
  @Get()
  findPublished(@Query("limit") limit?: string): Promise<NewsArticle[]> {
    const parsed = limit === undefined ? undefined : Number.parseInt(limit, 10);
    if (parsed !== undefined && (!Number.isInteger(parsed) || parsed < 1 || parsed > 100)) {
      throw new BadRequestException("limit doit être un entier entre 1 et 100");
    }
    return this.news.findPublished(parsed);
  }

  /** Admin : toutes les actualités, brouillons compris. */
  @Get("all")
  @UseGuards(SessionGuard)
  findAll(): Promise<NewsArticle[]> {
    return this.news.findAll();
  }

  /** Admin : création d'une actualité. */
  @Post()
  @UseGuards(SessionGuard)
  create(@Body() dto: CreateNewsDto): Promise<NewsArticle> {
    return this.news.create(dto);
  }

  /** Admin : modification d'une actualité (seuls les champs envoyés changent). */
  @Patch(":id")
  @UseGuards(SessionGuard)
  update(@Param("id", NEWS_ID) id: string, @Body() dto: UpdateNewsDto): Promise<NewsArticle> {
    return this.news.update(id, dto);
  }

  /** Admin : suppression définitive d'une actualité. */
  @Delete(":id")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  remove(@Param("id", NEWS_ID) id: string): Promise<void> {
    return this.news.remove(id);
  }
}
