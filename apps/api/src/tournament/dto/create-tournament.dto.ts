import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  IsIn,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";
import { MAX_CATEGORIES, MIN_CATEGORIES, categoryRank, isCategoryRangeValid } from "../categories";

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
/** Chaîne vide → null (champ facultatif laissé vide). */
const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};
const trimUpper =({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toUpperCase() : value);

/** La catégorie minimale d'un tableau ne peut pas être au-dessus de sa catégorie maximale. */
@ValidatorConstraint({ name: "categoryRange" })
class CategoryRangeConstraint implements ValidatorConstraintInterface {
  validate(maximumCat: unknown, args: ValidationArguments): boolean {
    const { minimumCat } = args.object as CreateTableDto;
    // Valeurs hors liste : déjà signalées par @IsIn
    if (typeof minimumCat !== "string" || typeof maximumCat !== "string") return true;
    if (categoryRank(minimumCat) === -1 || categoryRank(maximumCat) === -1) return true;
    return isCategoryRangeValid(minimumCat, maximumCat);
  }

  defaultMessage(args: ValidationArguments): string {
    const { letter } = args.object as CreateTableDto;
    return `Tableau ${letter ?? ""} : la catégorie minimale ne peut pas être supérieure à la catégorie maximale`;
  }
}

/** Un tableau du tournoi (A, B, C…). */
export class CreateTableDto {
  @Transform(trimUpper)
  @IsString({ message: "La lettre du tableau doit être un texte" })
  @Matches(/^[A-Z0-9]{1,10}$/, { message: "La lettre du tableau doit contenir 1 à 10 lettres ou chiffres (ex : A)" })
  letter!: string;

  @Transform(trim)
  @IsIn(MIN_CATEGORIES, { message: `La catégorie minimale doit être l'une de : ${MIN_CATEGORIES.join(", ")}` })
  minimumCat!: string;

  @Transform(trim)
  @IsIn(MAX_CATEGORIES, { message: `La catégorie maximale doit être l'une de : ${MAX_CATEGORIES.join(", ")}` })
  @Validate(CategoryRangeConstraint)
  maximumCat!: string;

  @IsDateString({}, { message: "La date de début du tableau est invalide" })
  startAt!: string;

  @IsInt({ message: "Le nombre maximum de joueurs doit être un entier" })
  @Min(2, { message: "Un tableau doit accepter au moins 2 joueurs" })
  @Max(1000, { message: "Un tableau ne peut pas dépasser 1000 joueurs" })
  maxPlayers!: number;

  /** Prix d'inscription en euros, 2 décimales au maximum (ex. 8.5) */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Le prix doit être un montant en euros (2 décimales au maximum)" })
  @Min(0, { message: "Le prix ne peut pas être négatif" })
  @Max(9999.99, { message: "Le prix ne peut pas dépasser 9 999,99 €" })
  price!: number;

  /** Tableau « en plus » : ne compte pas dans la limite de tableaux par jour */
  @IsOptional()
  @IsBoolean({ message: "« Tableau en plus » doit être vrai ou faux" })
  extra?: boolean;
}

export class CreateTournamentDto {
  @Transform(trim)
  @IsString({ message: "Le titre doit être un texte" })
  @IsNotEmpty({ message: "Le titre est obligatoire" })
  @MaxLength(191, { message: "Le titre ne doit pas dépasser 191 caractères" })
  title!: string;

  /** Juge-arbitre */
  @Transform(trim)
  @IsString({ message: "Le nom du JA doit être un texte" })
  @IsNotEmpty({ message: "Le nom du JA est obligatoire" })
  @MaxLength(191, { message: "Le nom du JA ne doit pas dépasser 191 caractères" })
  ja!: string;

  /** Email du JA (facultatif ; vide = null) */
  @IsOptional()
  @Transform(trimOrNull)
  @IsEmail({}, { message: "L'email du JA est invalide" })
  @MaxLength(191, { message: "L'email du JA ne doit pas dépasser 191 caractères" })
  email?: string | null;

  /** Téléphone du JA (facultatif ; vide = null) */
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: "Le téléphone du JA doit être un texte" })
  @MaxLength(20, { message: "Le téléphone du JA ne doit pas dépasser 20 caractères" })
  phone?: string | null;

  /** Adresse de la salle (obligatoire) : affichée sur le site et dans le mail de confirmation */
  @Transform(trim)
  @IsString({ message: "L'adresse de la salle doit être un texte" })
  @IsNotEmpty({ message: "L'adresse de la salle est obligatoire" })
  @MaxLength(255, { message: "L'adresse de la salle ne doit pas dépasser 255 caractères" })
  address!: string;

  @IsDateString({}, { message: "La date de début est invalide" })
  startDate!: string;

  @IsDateString({}, { message: "La date de fin est invalide" })
  endDate!: string;

  /** Clôture des inscriptions */
  @IsDateString({}, { message: "La date de clôture des inscriptions est invalide" })
  registrationEndAt!: string;

  /** Nombre maximum de tableaux par jour et par joueur (hors tableaux « en plus ») */
  @IsInt({ message: "Le nombre de tableaux par jour doit être un entier" })
  @Min(1, { message: "Un joueur doit pouvoir choisir au moins 1 tableau par jour" })
  @Max(50, { message: "Le nombre de tableaux par jour ne peut pas dépasser 50" })
  tabMax!: number;

  @IsArray({ message: "Les tableaux doivent être une liste" })
  @ArrayMinSize(1, { message: "Ajoutez au moins un tableau" })
  @ArrayMaxSize(50, { message: "Un tournoi ne peut pas avoir plus de 50 tableaux" })
  @ValidateNested({ each: true })
  @Type(() => CreateTableDto)
  tables!: CreateTableDto[];
}
