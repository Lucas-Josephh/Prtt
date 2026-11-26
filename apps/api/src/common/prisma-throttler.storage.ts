import { Injectable } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import { PrismaService } from "../database/prisma.service";

/**
 * Compteurs de @nestjs/throttler en base MySQL (table RateLimit) au lieu de la mémoire du processus :
 * sur Vercel, plusieurs instances traitent les requêtes en parallèle et s'arrêtent à tout moment,
 * un compteur en mémoire serait donc remis à zéro et contournable.
 * Fenêtre fixe : `limit` requêtes par `ttl` ms ; au-delà, la requête est refusée jusqu'à la fin de la fenêtre.
 */
@Injectable()
export class PrismaThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly prisma: PrismaService) {}

  async increment(key: string, ttl: number, limit: number): Promise<ThrottlerStorageRecord> {
    const id = key.slice(0, 191);
    const ttlMicro = Math.max(1, Math.round(ttl)) * 1000;

    // Incrément atomique (une seule requête) : ouvre une nouvelle fenêtre si la précédente est terminée.
    // L'ordre des affectations compte : `expiresAt` est mis à jour après `hits`, qui lit encore l'ancienne valeur.
    await this.prisma.$executeRaw`
      INSERT INTO RateLimit (id, hits, expiresAt)
      VALUES (${id}, 1, DATE_ADD(NOW(3), INTERVAL ${ttlMicro} MICROSECOND))
      ON DUPLICATE KEY UPDATE
        hits = IF(expiresAt <= NOW(3), 1, hits + 1),
        expiresAt = IF(expiresAt <= NOW(3), DATE_ADD(NOW(3), INTERVAL ${ttlMicro} MICROSECOND), expiresAt)`;

    const rows = await this.prisma.$queryRaw<{ hits: number | bigint; remaining: number | bigint | null }[]>`
      SELECT hits, TIMESTAMPDIFF(MICROSECOND, NOW(3), expiresAt) AS remaining FROM RateLimit WHERE id = ${id}`;

    // Ménage occasionnel des compteurs expirés (1 appel sur 50)
    if (Math.random() < 0.02) {
      await this.prisma.$executeRaw`DELETE FROM RateLimit WHERE expiresAt < DATE_SUB(NOW(3), INTERVAL 1 HOUR)`.catch(() => undefined);
    }

    const totalHits = Number(rows[0]?.hits ?? 1);
    // throttler attend des secondes
    const timeToExpire = Math.max(1, Math.ceil(Number(rows[0]?.remaining ?? ttlMicro) / 1_000_000));
    const isBlocked = totalHits > limit;
    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire: isBlocked ? timeToExpire : 0 };
  }
}
