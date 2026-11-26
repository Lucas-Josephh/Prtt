import { PartialType } from "@nestjs/mapped-types";
import { CreateNewsDto } from "./create-news.dto";

/**
 * Tous les champs sont optionnels : seuls ceux envoyés sont modifiés.
 * `publishedAt: null` repasse l'actualité en brouillon.
 */
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
