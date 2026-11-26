import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { IMAGE_PATH } from "../../uploads/image-storage.service";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
/** Chaîne vide → null (champ facultatif laissé vide). */
const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Ajout d'un membre du bureau. `position` n'est pas fournie par le client :
 * le nouveau membre est placé en fin de liste pour ne pas changer l'ordre existant.
 */
export class CreateDeskDto {
  @Transform(trim)
  @IsString({ message: "Le prénom doit être un texte" })
  @IsNotEmpty({ message: "Le prénom est obligatoire" })
  @MaxLength(100, { message: "Le prénom ne doit pas dépasser 100 caractères" })
  name!: string;

  @Transform(trim)
  @IsString({ message: "Le nom doit être un texte" })
  @IsNotEmpty({ message: "Le nom est obligatoire" })
  @MaxLength(100, { message: "Le nom ne doit pas dépasser 100 caractères" })
  surname!: string;

  @Transform(trim)
  @IsString({ message: "Le rôle doit être un texte" })
  @IsNotEmpty({ message: "Le rôle est obligatoire" })
  @MaxLength(100, { message: "Le rôle ne doit pas dépasser 100 caractères" })
  role!: string;

  @Transform(trim)
  @IsEmail({}, { message: "L'email est invalide" })
  @MaxLength(191, { message: "L'email ne doit pas dépasser 191 caractères" })
  email!: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: "Le téléphone doit être un texte" })
  @MaxLength(20, { message: "Le téléphone ne doit pas dépasser 20 caractères" })
  phone?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: "La description doit être un texte" })
  @MaxLength(5000, { message: "La description ne doit pas dépasser 5 000 caractères" })
  description?: string | null;

  /** Photo renvoyée par POST /uploads. null = pas de photo (ou la retirer). */
  @IsOptional()
  @Matches(IMAGE_PATH, { message: "La photo est invalide" })
  imageUrl?: string | null;
}
