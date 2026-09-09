import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { MediaModule } from '../media/media.module';
import { ScoreSheetsService } from './score-sheets.service';
import { ScoreSheetsController } from './score-sheets.controller';

@Module({
  imports: [MatchesModule, MediaModule],
  providers: [ScoreSheetsService],
  controllers: [ScoreSheetsController],
})
export class ScoreSheetsModule {}
