import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";
import { PrismaService } from "../database/prisma.service";
import { AuthenticatedRequest, clearSession, issueSession, readSession } from "./session";

/**
 * Protège une route : exige une session valide et la prolonge de 15 min
 * (chaque requête authentifiée compte comme une activité).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const session = readSession(req);
    if (!session) {
      clearSession(res);
      throw new UnauthorizedException("Session expirée");
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { id: true, identifier: true },
    });
    if (!user) {
      clearSession(res);
      throw new UnauthorizedException("Session invalide");
    }

    req.user = user;
    req.session = issueSession(res, user.id);
    return true;
  }
}
