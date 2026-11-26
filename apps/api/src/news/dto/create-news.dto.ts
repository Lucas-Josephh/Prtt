import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { IMAGE_PATH } from "../../uploads/image-storage.service";

export const NEWS_CATEGORIES = ["match", "tournoi", "club", "formation", "autre"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);

export class CreateNewsDto {
  @Transform(trim)
  @IsString({ message: "Le titre doit être un texte" })
  @IsNotEmpty({ message: "Le titre est obligatoire" })
  @MaxLength(191, { message: "Le titre ne doit pas dépasser 191 caractères" })
  title!: string;

  @Transform(trim)
  @IsString({ message: "Le contenu doit être un texte" })
  @IsNotEmpty({ message: "Le contenu est obligatoire" })
  @MaxLength(50_000, { message: "Le contenu ne doit pas dépasser 50 000 caractères" })
  content!: string;

  @IsOptional()
  @IsBoolean({ message: "« À la une » doit être vrai ou faux" })
  featured?: boolean;

  /** true = article de présentation du tournoi (page Tournoi), exclu des actualités. */
  @IsOptional()
  @IsBoolean({ message: "« Article de tournoi » doit être vrai ou faux" })
  tournament?: boolean;

  @IsOptional()
  @IsIn(NEWS_CATEGORIES, { message: `La catégorie doit être : ${NEWS_CATEGORIES.join(", ")}` })
  category?: NewsCategory;

  /** Date de publication (ISO 8601). null ou absent = brouillon. */
  @IsOptional()
  @IsDateString({}, { message: "La date de publication est invalide" })
  publishedAt?: string | null;

  /** Image de couverture renvoyée par POST /uploads. null = pas d'image (ou la retirer). */
  @IsOptional()
  @Matches(IMAGE_PATH, { message: "L'image est invalide" })
  imageUrl?: string | null;
}
