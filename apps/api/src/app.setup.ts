import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { validationExceptionFactory } from "./common/validation-errors";
import { ImageStorageService } from "./uploads/image-storage.service";

/**
 * Crée et configure l'application Nest, sans la démarrer.
 * Partagé par le serveur local (main.ts) et la fonction Vercel (serverless.ts).
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const sessionSecret = config.get<string>("SESSION_SECRET");
  if (!sessionSecret || sessionSecret === "change-me" || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  }

  // Derrière le proxy de Vercel (ou d'un hébergeur), l'IP du visiteur est dans X-Forwarded-For :
  // nécessaire pour que la limite de tentatives compte par visiteur et non pour tout le monde
  app.set("trust proxy", 1);
  app.setGlobalPrefix("api");

  // Images sur le disque (développement, sans Vercel Blob), servies en lecture seule sur /api/uploads/<id>.webp.
  // Leur nom est aléatoire et ne change jamais : le navigateur peut les garder en cache un an.
  const images = app.get(ImageStorageService);
  if (!images.usesBlob) {
    app.useStaticAssets(images.directory, {
      prefix: "/api/uploads/",
      index: false,
      dotfiles: "deny",
      immutable: true,
      maxAge: "365d",
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        // Le front est sur une autre origine que l'API
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    });
  }

  // Cookies signés (HMAC-SHA256) avec SESSION_SECRET
  app.use(cookieParser(sessionSecret));
  // Deux fronts appellent l'API : le site du club (WEB_ORIGIN) et la page de connexion (LOGIN_ORIGIN, apps/login).
  // Chaque variable accepte plusieurs origines séparées par des virgules.
  const origins = [config.get<string>("WEB_ORIGIN", "http://localhost:3000"), config.get<string>("LOGIN_ORIGIN", "http://localhost:3002")]
    .flatMap((value) => value.split(","))
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    // Permet au front de lire le nom du fichier lors d'un téléchargement (export Excel)
    exposedHeaders: ["Content-Disposition"],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: validationExceptionFactory }));

  return app;
}
