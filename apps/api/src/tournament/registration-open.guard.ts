import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../database/prisma.service";

/**
 * Bloque toute requête d'inscription quand les inscriptions sont closes.
 * Un guard s'exécute avant la validation du corps de la requête : passé la date de clôture,
 * la réponse est toujours « inscriptions closes », quel que soit le contenu envoyé.
 */
@Injectable()
export class RegistrationOpenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const id = context.switchToHttp().getRequest<Request>().params.id;
    if (typeof id !== "string" || !/^[0-9a-f]{32}$/.test(id)) throw new NotFoundException("Tournoi introuvable");

    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      select: { registrationEndAt: true, endDate: true },
    });
    if (!tournament) throw new NotFoundException("Tournoi introuvable");

    const now = new Date();
    if (tournament.registrationEndAt <= now || tournament.endDate < now) {
      throw new ForbiddenException("Les inscriptions à ce tournoi sont closes");
    }
    return true;
  }
}
