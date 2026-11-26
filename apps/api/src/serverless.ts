import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app.setup";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Point d'entrée Vercel : l'application Nest est créée au premier appel puis réutilisée
 * tant que l'instance reste active (pas de `listen`, Vercel transmet directement les requêtes).
 */
let handler: Promise<Handler> | null = null;

async function init(): Promise<Handler> {
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as Handler;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // En cas d'échec du démarrage (ex. base injoignable), on réessaiera à la requête suivante
  handler ??= init().catch((error: unknown) => {
    handler = null;
    throw error;
  });
  const express = await handler;
  express(req, res);
}
