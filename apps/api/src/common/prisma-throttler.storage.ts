import { Injectable } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import { Prisma } from "@prtt/database";
import { PrismaService } from "../database/prisma.service";

/** Schéma PostgreSQL indiqué par `?schema=` dans l'URL de connexion (« public » par défaut, comme Prisma). */
function schemaFromUrl(url: string | undefined): string {
  try {
    return (url && new URL(url).searchParams.get("schema")) || "public";
  } catch {
    return "public";
  }
}

/** Nom SQL entre guillemets ; refuse tout caractère inattendu (le nom est inséré tel quel dans la requête). */
function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(name)) throw new Error(`Nom de schéma invalide dans DATABASE_URL : ${name}`);
  return `"${name}"`;
}

/**
 * Compteurs de @nestjs/throttler en base PostgreSQL (table RateLimit) au lieu de la mémoire du processus :
 * sur Vercel, plusieurs instances traitent les requêtes en parallèle et s'arrêtent à tout moment,
 * un compteur en mémoire serait donc remis à zéro et contournable.
 * Fenêtre fixe : `limit` requêtes par `ttl` ms ; au-delà, la requête est refusée jusqu'à la fin de la fenêtre.
 */
@Injectable()
export class PrismaThrottlerStorage implements ThrottlerStorage {
  /**
   * Table qualifiée par son schéma : Prisma place ses tables dans le schéma `?schema=` de DATABASE_URL
   * (ex. « prtt » sur TiDB Cloud), mais certains serveurs ne changent pas le search_path,
   * donc une requête SQL écrite à la main doit nommer le schéma elle-même.
   */
  private readonly table: Prisma.Sql;

  constructor(private readonly prisma: PrismaService) {
    this.table = Prisma.raw(`${quoteIdent(schemaFromUrl(process.env.DATABASE_URL))}."RateLimit"`);
  }

  async increment(key: string, ttl: number, limit: number): Promise<ThrottlerStorageRecord> {
    const id = key.slice(0, 191);
    const ttlMs = Math.max(1, Math.round(ttl));
    const t = this.table;

    // Incrément atomique en une seule requête : ouvre une nouvelle fenêtre si la précédente est terminée.
    // Alias « r » : dans DO UPDATE, r.* désigne la ligne existante (anciennes valeurs).
    const rows = await this.prisma.$queryRaw<{ hits: number; remaining_ms: number }[]>`
      INSERT INTO ${t} AS r ("id", "hits", "expiresAt")
      VALUES (${id}, 1, NOW() + make_interval(secs => ${ttlMs}::double precision / 1000))
      ON CONFLICT ("id") DO UPDATE SET
        "hits" = CASE WHEN r."expiresAt" <= NOW() THEN 1 ELSE r."hits" + 1 END,
        "expiresAt" = CASE WHEN r."expiresAt" <= NOW()
          THEN NOW() + make_interval(secs => ${ttlMs}::double precision / 1000)
          ELSE r."expiresAt" END
      RETURNING "hits", (EXTRACT(EPOCH FROM ("expiresAt" - NOW())) * 1000)::int AS remaining_ms`;

    // Ménage occasionnel des compteurs expirés (1 appel sur 50)
    if (Math.random() < 0.02) {
      await this.prisma.$executeRaw`DELETE FROM ${t} WHERE "expiresAt" < NOW() - INTERVAL '1 hour'`.catch(() => undefined);
    }

    const totalHits = Number(rows[0]?.hits ?? 1);
    // throttler attend des secondes
    const timeToExpire = Math.max(1, Math.ceil(Number(rows[0]?.remaining_ms ?? ttlMs) / 1000));
    const isBlocked = totalHits > limit;
    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire: isBlocked ? timeToExpire : 0 };
  }
}
