import { PartialType } from "@nestjs/mapped-types";
import { CreateDeskDto } from "./create-desk.dto";

/**
 * Modification d'un membre du bureau : seuls les champs envoyés changent.
 * `position` n'existe pas dans le DTO : l'ordre d'affichage ne peut pas changer via une modification.
 * `phone` et `description` acceptent null (ou "") pour être vidés.
 */
export class UpdateDeskDto extends PartialType(CreateDeskDto) {}
