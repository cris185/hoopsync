import { Module } from '@nestjs/common';
import { PlayoffsService } from './playoffs.service';
import { PlayoffsController } from './playoffs.controller';

@Module({
  providers: [PlayoffsService],
  controllers: [PlayoffsController],
  exports: [PlayoffsService],
})
export class PlayoffsModule {}
