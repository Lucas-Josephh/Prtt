import { randomBytes } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { Prisma } from "@prtt/database";
import type { PrismaService } from "../database/prisma.service";

export const SESSION_COOKIE = "prtt_session";

/** Durée de vie de la session : 15 minutes, réinitialisée à chaque activité. */
export const SESSION_TTL_MS = 15 * 60 * 1000;

/** Session valide, telle que vue par les routes protégées. */
export interface SessionPayload {
  /** Id de la session (table AdminSession) */
  id: string;
  /** Date d'expiration (timestamp ms) */
  exp: number;
}

export interface SessionUser {
  id: string;
  identifier: string;
}

export type AuthenticatedRequest = Request & { user: SessionUser; session: SessionPayload };

/**
 * Le cookie appartient au domaine de l'API : le site et la page de connexion (apps/login) le partagent.
 * « lax » (défaut) suffit si les trois domaines ont le même domaine principal (ex. prtt.fr, admin.prtt.fr, api.prtt.fr).
 * Avec des domaines principaux différents, mettre SESSION_COOKIE_SAMESITE="none" (HTTPS obligatoire).
 */
function sameSite(): "lax" | "none" {
  return process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase() === "none" ? "none" : "lax";
}

function cookieOptions(): CookieOptions {
  const policy = sameSite();
  return {
    httpOnly: true,
    signed: true,
    sameSite: policy,
    // SameSite=None n'est accepté par les navigateurs qu'avec Secure
    secure: policy === "none" || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

function setSessionCookie(res: Response, id: string) {
  res.cookie(SESSION_COOKIE, id, cookieOptions());
}

export function clearSession(res: Response) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE, options);
}

/** Id de session lu dans le cookie signé ; null si absent ou falsifié (signature invalide). */
export function readSessionId(req: Request): string | null {
  const raw: unknown = req.signedCookies?.[SESSION_COOKIE];
  return typeof raw === "string" && /^[0-9a-f]{64}$/.test(raw) ? raw : null;
}

/**
 * Ouvre une session : enregistrée en base, l'id (aléatoire, 256 bits) part dans un cookie signé.
 * Au passage, supprime les sessions expirées.
 */
export async function openSession(prisma: PrismaService, res: Response, adminId: string): Promise<SessionPayload> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.adminSession.create({ data: { id, adminId, expiresAt } });
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
  setSessionCookie(res, id);
  return { id, exp: expiresAt.getTime() };
}

/**
 * Vérifie la session du cookie et la prolonge de 15 min.
 * Renvoie null si elle n'existe plus en base (déconnexion), a expiré ou si le cookie est absent / falsifié.
 */
export async function touchSession(
  prisma: PrismaService,
  req: Request,
  res: Response,
): Promise<{ session: SessionPayload; user: SessionUser } | null> {
  const id = readSessionId(req);
  if (!id) return null;

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  try {
    // Une seule requête : ne prolonge que si la session existe encore et n'a pas expiré
    const updated = await prisma.adminSession.update({
      where: { id, expiresAt: { gt: new Date() } },
      data: { expiresAt },
      select: { admin: { select: { id: true, identifier: true } } },
    });
    setSessionCookie(res, id);
    return { session: { id, exp: expiresAt.getTime() }, user: updated.admin };
  } catch (error) {
    // P2025 : aucune session correspondante (supprimée à la déconnexion, ou expirée)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  }
}

/** Déconnexion : supprime la session en base (le cookie devient inutilisable) et efface le cookie. */
export async function closeSession(prisma: PrismaService, req: Request, res: Response): Promise<void> {
  const id = readSessionId(req);
  if (id) await prisma.adminSession.deleteMany({ where: { id } });
  clearSession(res);
}
