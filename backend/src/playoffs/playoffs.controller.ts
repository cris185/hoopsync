import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlayoffsService } from './playoffs.service';
import { CreatePlayoffRoundDto } from './dto/create-playoff-round.dto';
import { UpdatePlayoffRoundDto } from './dto/update-playoff-round.dto';
import { CreatePlayoffSeriesDto } from './dto/create-playoff-series.dto';
import { CreateSeriesGameDto } from './dto/create-series-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { SafeUser } from '../users/users.service';

@Controller()
export class PlayoffsController {
  constructor(private readonly playoffsService: PlayoffsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('tournaments/:tournamentId/playoff-rounds')
  createRound(
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreatePlayoffRoundDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.playoffsService.createRound(tournamentId, dto, user);
  }

  @Get('tournaments/:tournamentId/playoff-rounds')
  listRounds(@Param('tournamentId') tournamentId: string) {
    return this.playoffsService.listRoundsForTournament(tournamentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Patch('playoff-rounds/:id')
  updateRound(@Param('id') id: string, @Body() dto: UpdatePlayoffRoundDto, @CurrentUser() user: SafeUser) {
    return this.playoffsService.updateRound(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Delete('playoff-rounds/:id')
  removeRound(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.playoffsService.removeRound(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('playoff-rounds/:roundId/series')
  createSeries(
    @Param('roundId') roundId: string,
    @Body() dto: CreatePlayoffSeriesDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.playoffsService.createSeries(roundId, dto, user);
  }

  @Get('playoff-series/:id')
  findSeries(@Param('id') id: string) {
    return this.playoffsService.findSeries(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('playoff-series/:seriesId/games')
  createGame(
    @Param('seriesId') seriesId: string,
    @Body() dto: CreateSeriesGameDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.playoffsService.createGame(seriesId, dto, user);
  }
}
