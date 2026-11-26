import { OmitType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, Matches, ValidateNested } from "class-validator";
import { CreateTableDto, CreateTournamentDto } from "./create-tournament.dto";

/** Tableau envoyé lors d'une modification : avec `id` = tableau existant, sans `id` = nouveau tableau. */
export class UpdateTableDto extends CreateTableDto {
  @IsOptional()
  @Matches(/^[0-9a-f]{32}$/, { message: "Identifiant de tableau invalide" })
  id?: string;
}

/**
 * Modification complète d'un tournoi (le formulaire renvoie toutes les valeurs).
 * Les tableaux absents de la liste sont supprimés, sauf s'ils ont déjà des inscrits.
 */
export class UpdateTournamentDto extends OmitType(CreateTournamentDto, ["tables"] as const) {
  @IsArray({ message: "Les tableaux doivent être une liste" })
  @ArrayMinSize(1, { message: "Ajoutez au moins un tableau" })
  @ArrayMaxSize(50, { message: "Un tournoi ne peut pas avoir plus de 50 tableaux" })
  @ValidateNested({ each: true })
  @Type(() => UpdateTableDto)
  tables!: UpdateTableDto[];
}
