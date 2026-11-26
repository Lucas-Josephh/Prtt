import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { HexIdPipe } from "../common/hex-id";
import { CreateDeskDto } from "./dto/create-desk.dto";
import { UpdateDeskDto } from "./dto/update-desk.dto";
import { DeskService, type PublicDeskMember } from "./desk.service";

const DESK_ID = new HexIdPipe("Membre introuvable");

@Controller("desk")
export class DeskController {
  constructor(private readonly desk: DeskService) {}

  /** Public : membres du bureau. */
  @Get()
  findAll(): Promise<PublicDeskMember[]> {
    return this.desk.findAll();
  }

  /** Admin : ajout d'un membre (placé en fin de liste). */
  @Post()
  @UseGuards(SessionGuard)
  create(@Body() dto: CreateDeskDto): Promise<PublicDeskMember> {
    return this.desk.create(dto);
  }

  /** Admin : modification d'un membre (l'ordre d'affichage ne change pas). */
  @Patch(":id")
  @UseGuards(SessionGuard)
  update(@Param("id", DESK_ID) id: string, @Body() dto: UpdateDeskDto): Promise<PublicDeskMember> {
    return this.desk.update(id, dto);
  }

  /** Admin : suppression d'un membre. */
  @Delete(":id")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  remove(@Param("id", DESK_ID) id: string): Promise<void> {
    return this.desk.remove(id);
  }
}
