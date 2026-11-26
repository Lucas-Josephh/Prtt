import { Injectable, UnauthorizedException } from "@nestjs/common";
import { compare, hashSync } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { SessionUser } from "./session";

// Hash factice comparé quand l'identifiant n'existe pas, pour que la réponse
// prenne le même temps et ne révèle pas quels identifiants existent.
const DUMMY_HASH = hashSync(randomBytes(16).toString("hex"), 12);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(identifier: string, password: string): Promise<SessionUser> {
    const admin = await this.prisma.adminUser.findUnique({ where: { identifier } });

    const valid = await compare(password, admin?.password ?? DUMMY_HASH);
    if (!admin || !valid) {
      throw new UnauthorizedException("Identifiant ou mot de passe incorrect");
    }

    return { id: admin.id, identifier: admin.identifier };
  }
}
