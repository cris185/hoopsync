import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('matches/:matchId/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getForMatch(@Param('matchId') matchId: string) {
    return this.statisticsService.getForMatch(matchId);
  }
}
