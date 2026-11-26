import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedRequest, clearSession, issueSession } from "./session";
import { SessionGuard } from "./session.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Vérifie les identifiants et crée la session (cookie signé, 15 min). */
  @Post("login")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateCredentials(dto.identifier, dto.password);
    const session = issueSession(res, user.id);
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

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSession(res);
  }
}
