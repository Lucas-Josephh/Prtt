import { NotFoundException, PipeTransform } from "@nestjs/common";
import { Prisma } from "@prtt/database";

const HEX_ID = /^[0-9a-f]{32}$/;

/**
 * Vérifie qu'un paramètre de route est un identifiant hexadécimal de 32 caractères.
 * Un identifiant mal formé ne peut correspondre à rien : on répond 404.
 * S'utilise comme instance : `@Param("id", new HexIdPipe("… introuvable"))`.
 */
export class HexIdPipe implements PipeTransform<string, string> {
  constructor(private readonly notFoundMessage = "Élément introuvable") {}

  transform(value: string): string {
    if (!HEX_ID.test(value)) throw new NotFoundException(this.notFoundMessage);
    return value;
  }
}

/** Vrai si l'erreur Prisma signifie « enregistrement introuvable » (update/delete). */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
