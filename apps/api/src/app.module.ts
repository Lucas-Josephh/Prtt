import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./database/prisma.module";
import { PrismaService } from "./database/prisma.service";
import { PrismaThrottlerStorage } from "./common/prisma-throttler.storage";
import { AuthModule } from "./auth/auth.module";
import { NewsModule } from "./news/news.module";
import { DeskModule } from "./desk/desk.module";
import { TournamentModule } from "./tournament/tournament.module";
import { UploadsModule } from "./uploads/uploads.module";
import { MailModule } from "./mail/mail.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../packages/database/.env",
    }),
    // Limite appliquée uniquement aux routes qui utilisent ThrottlerGuard (connexion, inscription, envoi d'images).
    // Compteurs en base (et non en mémoire) pour rester efficaces sur Vercel.
    ThrottlerModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        throttlers: [{ ttl: 60_000, limit: 5 }],
        storage: new PrismaThrottlerStorage(prisma),
      }),
    }),
    PrismaModule,
    AuthModule,
    NewsModule,
    DeskModule,
    TournamentModule,
    UploadsModule,
    MailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
