import { Injectable } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import { PrismaService } from "../database/prisma.service";

/**
 * Compteurs de @nestjs/throttler en base PostgreSQL (table RateLimit) au lieu de la mémoire du processus :
 * sur Vercel, plusieurs instances traitent les requêtes en parallèle et s'arrêtent à tout moment,
 * un compteur en mémoire serait donc remis à zéro et contournable.
 * Fenêtre fixe : `limit` requêtes par `ttl` ms ; au-delà, la requête est refusée jusqu'à la fin de la fenêtre.
 */
@Injectable()
export class PrismaThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly prisma: PrismaService) {}

  async increment(key: string, ttl: number, limit: number): Promise<ThrottlerStorageRecord> {
    const id = key.slice(0, 191);
    const ttlMs = Math.max(1, Math.round(ttl));

    // Incrément atomique en une seule requête : ouvre une nouvelle fenêtre si la précédente est terminée.
    // Dans DO UPDATE, les colonnes non préfixées désignent encore la ligne existante (anciennes valeurs).
    const rows = await this.prisma.$queryRaw<{ hits: number; remaining_ms: number }[]>`
      INSERT INTO "RateLimit" ("id", "hits", "expiresAt")
      VALUES (${id}, 1, NOW() + make_interval(secs => ${ttlMs}::double precision / 1000))
      ON CONFLICT ("id") DO UPDATE SET
        "hits" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN 1 ELSE "RateLimit"."hits" + 1 END,
        "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= NOW()
          THEN NOW() + make_interval(secs => ${ttlMs}::double precision / 1000)
          ELSE "RateLimit"."expiresAt" END
      RETURNING "hits", (EXTRACT(EPOCH FROM ("expiresAt" - NOW())) * 1000)::int AS remaining_ms`;

    // Ménage occasionnel des compteurs expirés (1 appel sur 50)
    if (Math.random() < 0.02) {
      await this.prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "expiresAt" < NOW() - INTERVAL '1 hour'`.catch(() => undefined);
    }

    const totalHits = Number(rows[0]?.hits ?? 1);
    // throttler attend des secondes
    const timeToExpire = Math.max(1, Math.ceil(Number(rows[0]?.remaining_ms ?? ttlMs) / 1000));
    const isBlocked = totalHits > limit;
    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire: isBlocked ? timeToExpire : 0 };
  }
}
