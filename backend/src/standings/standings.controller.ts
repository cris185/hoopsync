import { Controller, Get, Param } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('tournaments/:tournamentId/standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  getForTournament(@Param('tournamentId') tournamentId: string) {
    return this.standingsService.getForTournament(tournamentId);
  }
}
