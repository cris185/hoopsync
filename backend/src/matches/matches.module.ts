import { Module } from '@nestjs/common';
import { StatisticsModule } from '../statistics/statistics.module';
import { StandingsModule } from '../standings/standings.module';
import { PlayoffsModule } from '../playoffs/playoffs.module';
import { MatchesService } from './matches.service';
import { MatchEventsService } from './match-events.service';
import { MatchesController } from './matches.controller';

@Module({
  imports: [StatisticsModule, StandingsModule, PlayoffsModule],
  providers: [MatchesService, MatchEventsService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
