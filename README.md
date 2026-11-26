# PRTT

Monorepo pnpm + Turborepo du site du Perpignan Roussillon Tennis de Table.

## Architecture

```
apps/
  web/        Frontend Next.js            → http://localhost:3000
  api/        Backend NestJS (préfixe /api) → http://localhost:3001/api
packages/
  database/   Schéma Prisma (PostgreSQL), migrations et client Prisma partagé (@prtt/database)
docker-compose.yml   Base PostgreSQL locale (port 5434)
turbo.json           Orchestration des tâches (dev, build, lint, typecheck)
```

L'API importe le client Prisma via `@prtt/database` (voir `apps/api/src/database/prisma.service.ts`).

## Prérequis

- Node.js 20.11+
- pnpm 10+
- Docker (pour la base locale) ou un serveur PostgreSQL existant (ex. Neon)

## Installation

```bash
pnpm install
Copy-Item packages/database/.env.example packages/database/.env   # PowerShell
pnpm db:up        # démarre PostgreSQL dans Docker (port 5434)
pnpm db:migrate   # applique les migrations + génère le client Prisma
pnpm dev          # lance le front et l'API en parallèle
```

Si Docker Hub n'est pas accessible, une image MariaDB déjà présente fonctionne aussi :
`$env:DB_IMAGE="mariadb:latest"; docker compose up -d --wait`

Pour utiliser un PostgreSQL existant, il suffit de modifier `DATABASE_URL` et `DATABASE_URL_UNPOOLED` dans `packages/database/.env`.

Vérification : `http://localhost:3001/api/health` renvoie `{"status":"ok","database":"ok"}`.

## Scripts

| Commande          | Rôle                                                       |
| ----------------- | ---------------------------------------------------------- |
| `pnpm dev`        | Front + API en mode watch                                  |
| `pnpm build`      | Build de toutes les apps                                   |
| `pnpm lint`       | ESLint sur toutes les apps                                 |
| `pnpm typecheck`  | Vérification TypeScript                                    |
| `pnpm db:up/down` | Démarre / arrête le conteneur PostgreSQL                      |
| `pnpm db:migrate` | Crée/applique une migration en dev (`prisma migrate dev`)  |
| `pnpm db:deploy`  | Applique les migrations en production                      |
| `pnpm db:generate`| Régénère le client Prisma                                  |
| `pnpm db:studio`  | Interface Prisma Studio pour parcourir la base             |

## Base de données

Le schéma (`packages/database/prisma/schema.prisma`) contient :

- `NewsArticle` : actualités (texte)
- `Tournament` / `TournamentParticipant` : participants et points par édition de tournoi

Aucune image n'est stockée en base. Après une modification du schéma : `pnpm db:migrate`.
