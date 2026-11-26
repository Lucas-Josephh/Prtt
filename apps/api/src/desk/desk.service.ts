import { Injectable, NotFoundException } from "@nestjs/common";
import type { Desk, Prisma } from "@prtt/database";
import { PrismaService } from "../database/prisma.service";
import { isRecordNotFound } from "../common/hex-id";
import { randomBytes } from "node:crypto";
import { CreateDeskDto } from "./dto/create-desk.dto";
import { UpdateDeskDto } from "./dto/update-desk.dto";
import { ImageStorageService } from "../uploads/image-storage.service";

export type PublicDeskMember = Omit<Desk, "createdAt">;

@Injectable()
export class DeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: ImageStorageService,
  ) {}

  /** Membres du bureau dans l'ordre d'affichage (le premier est mis en avant). */
  findAll(): Promise<PublicDeskMember[]> {
    return this.prisma.desk.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      omit: { createdAt: true },
    });
  }

  /** Ajoute un membre en fin de liste (après le dernier), sans toucher l'ordre des autres. */
  async create(dto: CreateDeskDto): Promise<PublicDeskMember> {
    await this.images.assertExists(dto.imageUrl);
    const last = await this.prisma.desk.aggregate({ _max: { position: true } });
    return this.prisma.desk.create({
      data: {
        id: randomBytes(16).toString("hex"),
        name: dto.name,
        surname: dto.surname,
        role: dto.role,
        email: dto.email,
        phone: dto.phone ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        position: (last._max.position ?? -1) + 1,
      },
      omit: { createdAt: true },
    });
  }

  /** Modifie uniquement les champs envoyés. La position (ordre d'affichage) n'est jamais touchée. */
  async update(id: string, dto: UpdateDeskDto): Promise<PublicDeskMember> {
    const data: Prisma.DeskUpdateInput = {};
    // Champs obligatoires : null est ignoré ; champs facultatifs : null les vide
    if (dto.name != null) data.name = dto.name;
    if (dto.surname != null) data.surname = dto.surname;
    if (dto.role != null) data.role = dto.role;
    if (dto.email != null) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.description !== undefined) data.description = dto.description;

    // Photo : null la retire ; l'ancienne photo est supprimée du disque une fois remplacée
    let previousImage: string | null = null;
    if (dto.imageUrl !== undefined) {
      const current = await this.prisma.desk.findUnique({ where: { id }, select: { imageUrl: true } });
      if (!current) throw new NotFoundException("Membre introuvable");
      await this.images.assertExists(dto.imageUrl);
      previousImage = current.imageUrl;
      data.imageUrl = dto.imageUrl;
    }

    try {
      const member = await this.prisma.desk.update({ where: { id }, data, omit: { createdAt: true } });
      if (previousImage && previousImage !== member.imageUrl) await this.images.remove(previousImage);
      return member;
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundException("Membre introuvable");
      throw error;
    }
  }

  /** Supprime un membre ; l'ordre des autres membres est conservé. */
  async remove(id: string): Promise<void> {
    try {
      const member = await this.prisma.desk.delete({ where: { id } });
      await this.images.remove(member.imageUrl);
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundException("Membre introuvable");
      throw error;
    }
  }
}
