import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/** À partir de ce classement, le joueur peut indiquer son numéro (joueurs numérotés). */
export const NUMBERED_MIN_RANKING = 2000;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
/** Chaîne vide → null (champ facultatif laissé vide). */
const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};
/** "" ou null → null ; nombre ou chaîne de chiffres → nombre. */
const toIntOrNull = ({ value }: { value: unknown }) => {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return value;
};

/** Classement : 4 chiffres au maximum ; une valeur plus longue (ex. « 01250 ») reste une chaîne et est refusée par @IsInt. */
const rankingToInt = ({ value }: { value: unknown }) => {
  if (typeof value === "string") return /^\d{1,4}$/.test(value.trim()) ? Number(value.trim()) : value;
  return value;
};

/** Inscription d'un joueur à un ou plusieurs tableaux du tournoi. */
export class CreateRegistrationDto {
  /** Nom de famille */
  @Transform(trim)
  @IsString({ message: "Le nom doit être un texte" })
  @IsNotEmpty({ message: "Le nom est obligatoire" })
  @MaxLength(100, { message: "Le nom ne doit pas dépasser 100 caractères" })
  surname!: string;

  /** Prénom */
  @Transform(trim)
  @IsString({ message: "Le prénom doit être un texte" })
  @IsNotEmpty({ message: "Le prénom est obligatoire" })
  @MaxLength(100, { message: "Le prénom ne doit pas dépasser 100 caractères" })
  name!: string;

  @Transform(trim)
  @IsString({ message: "Le numéro de licence doit être un texte" })
  @Matches(/^[A-Za-z0-9]{1,20}$/, { message: "Le numéro de licence ne doit contenir que des lettres et des chiffres (20 max)" })
  licence!: string;

  @Transform(rankingToInt)
  @IsInt({ message: "Le classement doit être un nombre entier de 4 chiffres maximum" })
  @Min(0, { message: "Le classement ne peut pas être négatif" })
  @Max(5000, { message: "Le classement semble invalide" })
  ranking!: number;

  /** Numéro de classement national : uniquement à partir de 2000 points, sinon ignoré. */
  @IsOptional()
  @Transform(toIntOrNull)
  @IsInt({ message: "Le numéro doit être un nombre entier" })
  @Min(1, { message: "Le numéro doit être supérieur à 0" })
  @Max(100000, { message: "Le numéro semble invalide" })
  numbered?: number | null;

  @Transform(trim)
  @IsString({ message: "Le club doit être un texte" })
  @IsNotEmpty({ message: "Le club est obligatoire" })
  @MaxLength(191, { message: "Le club ne doit pas dépasser 191 caractères" })
  club!: string;

  @Transform(trim)
  @IsEmail({}, { message: "L'email est invalide" })
  @MaxLength(191, { message: "L'email ne doit pas dépasser 191 caractères" })
  email!: string;

  /** Facultatif, mais utile pour être prévenu lors des annonces de match (vide = null) */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: "Le téléphone doit être un texte" })
  @MaxLength(20, { message: "Le téléphone ne doit pas dépasser 20 caractères" })
  phone?: string | null;

  @IsArray({ message: "Les tableaux doivent être une liste" })
  @ArrayMinSize(1, { message: "Choisissez au moins un tableau" })
  @ArrayMaxSize(50, { message: "Trop de tableaux sélectionnés" })
  @ArrayUnique({ message: "Un tableau est sélectionné plusieurs fois" })
  @Matches(/^[0-9a-f]{32}$/, { each: true, message: "Tableau invalide" })
  tableIds!: string[];
}
