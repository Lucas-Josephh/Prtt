import { ConfigService } from "@nestjs/config";
import { createApp } from "./app.setup";

/** Serveur local (développement, ou hébergeur Node classique). Sur Vercel, c'est serverless.ts qui est utilisé. */
async function bootstrap() {
  const app = await createApp();
  await app.listen(Number(app.get(ConfigService).get("API_PORT", 3001)));
}

void bootstrap();
