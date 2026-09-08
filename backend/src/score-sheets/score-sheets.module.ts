import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { ScoreSheetsService } from './score-sheets.service';
import { ScoreSheetsController } from './score-sheets.controller';

@Module({
  imports: [MatchesModule],
  providers: [ScoreSheetsService],
  controllers: [ScoreSheetsController],
})
export class ScoreSheetsModule {}
