import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./database/prisma.service";

@Controller("health")
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    let database: "ok" | "error" = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }
    return { status: "ok", database };
  }
}
