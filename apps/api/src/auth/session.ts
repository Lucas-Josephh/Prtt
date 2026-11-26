import type { CookieOptions, Request, Response } from "express";

export const SESSION_COOKIE = "prtt_session";

/** Durée de vie de la session : 15 minutes, réinitialisée à chaque activité. */
export const SESSION_TTL_MS = 15 * 60 * 1000;

/** Contenu du cookie (signé par cookie-parser avec SESSION_SECRET). */
export interface SessionPayload {
  /** Id de l'AdminUser */
  sub: string;
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

/** Crée (ou prolonge) la session : nouveau cookie signé valable 15 min. */
export function issueSession(res: Response, userId: string): SessionPayload {
  const payload: SessionPayload = { sub: userId, exp: Date.now() + SESSION_TTL_MS };
  res.cookie(SESSION_COOKIE, payload, cookieOptions());
  return payload;
}

export function clearSession(res: Response) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE, options);
}

/**
 * Lit le cookie signé. Renvoie null si absent, falsifié (signature invalide)
 * ou expiré côté serveur.
 */
export function readSession(req: Request): SessionPayload | null {
  const raw: unknown = req.signedCookies?.[SESSION_COOKIE];
  if (!raw || typeof raw !== "object") return null;

  const { sub, exp } = raw as Partial<SessionPayload>;
  if (typeof sub !== "string" || typeof exp !== "number") return null;
  if (exp <= Date.now()) return null;

  return { sub, exp };
}
