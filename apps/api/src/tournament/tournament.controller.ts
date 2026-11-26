import { runInBackground } from "../common/background";
import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query, Res, StreamableFile, UseGuards, type PipeTransform } from "@nestjs/common";
import { PlayerAdminService, type RegisteredPlayer } from "./player-admin.service";
import type { Response } from "express";
import { RegistrationExportService } from "./registration-export.service";
import { RegistrationFileService } from "./registration-file.service";
import { RegistrationMailService } from "./registration-mail.service";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { NewsArticle } from "@prtt/database";
import { SessionGuard } from "../auth/session.guard";
import { HexIdPipe } from "../common/hex-id";
import { CreateRegistrationDto } from "./dto/create-registration.dto";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { RegistrationOpenGuard } from "./registration-open.guard";
import { RegistrationService, type RegistrationResult } from "./registration.service";
import { TournamentService, type TournamentWithTables } from "./tournament.service";

const TOURNAMENT_ID = new HexIdPipe("Tournoi introuvable");
const TABLE_ID = new HexIdPipe("Tableau introuvable");

/** Numéro de licence dans l'URL : même format qu'à l'inscription (404 sinon). */
const LICENCE: PipeTransform<string, string> = {
  transform(value: string) {
    if (!/^[A-Za-z0-9]{1,20}$/.test(value)) throw new NotFoundException("Joueur introuvable");
    return value;
  },
};

@Controller("tournaments")
export class TournamentController {
  constructor(
    private readonly tournaments: TournamentService,
    private readonly registrations: RegistrationService,
    private readonly exports: RegistrationExportService,
    private readonly registrationFiles: RegistrationFileService,
    private readonly registrationMail: RegistrationMailService,
    private readonly players: PlayerAdminService,
  ) {}

  /**
   * Public : tournoi en cours (ou à venir) avec ses tableaux et son article de présentation.
   * `tournament` et `article` valent null s'ils n'existent pas.
   */
  @Get("current")
  async findCurrent(): Promise<{ tournament: TournamentWithTables | null; article: NewsArticle | null }> {
    const tournament = await this.tournaments.findCurrent();
    const article = tournament ? await this.tournaments.findArticle(tournament) : null;
    return { tournament, article };
  }

  /** Admin : création d'un tournoi et de ses tableaux (409 si un tournoi est déjà en cours). */
  @Post()
  @UseGuards(SessionGuard)
  create(@Body() dto: CreateTournamentDto): Promise<TournamentWithTables> {
    return this.tournaments.create(dto);
  }

  /** Admin : modification d'un tournoi et de ses tableaux. */
  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(@Param("id", TOURNAMENT_ID) id: string, @Body() dto: UpdateTournamentDto): Promise<TournamentWithTables> {
    const tournament = await this.tournaments.update(id, dto);
    // Les tableaux (et donc les inscrits) ont pu changer : on régénère le fichier Excel
    runInBackground(this.registrationFiles.sync(id));
    return tournament;
  }

  /** Admin : suppression d'un tournoi (tableaux, inscriptions et article compris). */
  @Delete(":id")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  remove(@Param("id", TOURNAMENT_ID) id: string): Promise<void> {
    return this.tournaments.remove(id);
  }

  /** Admin : export Excel des inscrits (une ligne par joueur, tableaux par jour, prix total). */
  @Get(":id/registrations/export")
  @UseGuards(SessionGuard)
  async exportRegistrations(@Param("id", TOURNAMENT_ID) id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { filename, buffer } = await this.exports.export(id);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    });
    return new StreamableFile(buffer);
  }

  /** Admin : inscrits du tournoi, filtrés par nom, prénom, licence ou club (`?q=…`) ; sans `q`, tous les inscrits. */
  @Get(":id/players")
  @UseGuards(SessionGuard)
  searchPlayers(@Param("id", TOURNAMENT_ID) id: string, @Query("q") q?: string): Promise<RegisteredPlayer[]> {
    return this.players.search(id, typeof q === "string" ? q.slice(0, 100) : "");
  }

  /** Admin : supprime un joueur du tournoi (désinscrit de tous ses tableaux). */
  @Delete(":id/players/:licence")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  removePlayer(@Param("id", TOURNAMENT_ID) id: string, @Param("licence", LICENCE) licence: string): Promise<void> {
    return this.players.removeFromTournament(id, licence);
  }

  /** Admin : désinscrit un joueur d'un seul tableau. */
  @Delete(":id/players/:licence/tables/:tableId")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  unregisterPlayer(
    @Param("id", TOURNAMENT_ID) id: string,
    @Param("licence", LICENCE) licence: string,
    @Param("tableId", TABLE_ID) tableId: string,
  ): Promise<void> {
    return this.players.unregisterFromTable(id, licence, tableId);
  }

  /**
   * Public : inscription d'un joueur aux tableaux choisis (10 envois par minute et par IP au maximum).
   * Après la clôture des inscriptions, toute requête est refusée avant même la lecture du formulaire.
   */
  @Post(":id/registrations")
  @UseGuards(ThrottlerGuard, RegistrationOpenGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(@Param("id", TOURNAMENT_ID) id: string, @Body() dto: CreateRegistrationDto): Promise<RegistrationResult> {
    const result = await this.registrations.register(id, dto);
    // Met à jour le fichier Excel des inscrits (en arrière-plan : la réponse n'attend pas l'écriture)
    runInBackground(this.registrationFiles.sync(id));
    // Email de confirmation au joueur (en arrière-plan : un échec d'envoi n'annule pas l'inscription)
    runInBackground(this.registrationMail.sendConfirmation(id, dto));
    return result;
  }
}
