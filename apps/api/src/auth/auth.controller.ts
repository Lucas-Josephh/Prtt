import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { PrismaService } from "../database/prisma.service";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedRequest, closeSession, openSession } from "./session";
import { SessionGuard } from "./session.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** Vérifie les identifiants et ouvre une session (enregistrée en base, id dans un cookie signé, 15 min). */
  @Post("login")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateCredentials(dto.identifier, dto.password);
    const session = await openSession(this.prisma, res, user.id);
    return { user, expiresAt: session.exp };
  }

  /** Session courante (la prolonge au passage). */
  @Get("me")
  @UseGuards(SessionGuard)
  me(@Req() req: AuthenticatedRequest) {
    return { user: req.user, expiresAt: req.session.exp };
  }

  /** Appelé par le front à chaque activité de l'utilisateur pour prolonger la session. */
  @Post("refresh")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  refresh(@Req() req: AuthenticatedRequest) {
    return { user: req.user, expiresAt: req.session.exp };
  }

  /** Supprime la session en base : le cookie, même conservé ou renvoyé plus tard, ne donne plus aucun droit. */
  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await closeSession(this.prisma, req, res);
  }
}
