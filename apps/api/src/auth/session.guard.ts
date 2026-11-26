import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";
import { PrismaService } from "../database/prisma.service";
import { AuthenticatedRequest, clearSession, touchSession } from "./session";

/**
 * Protège une route : exige une session encore enregistrée en base et la prolonge de 15 min
 * (chaque requête authentifiée compte comme une activité).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const valid = await touchSession(this.prisma, req, res);
    if (!valid) {
      clearSession(res);
      throw new UnauthorizedException("Session expirée");
    }

    req.user = valid.user;
    req.session = valid.session;
    return true;
  }
}
