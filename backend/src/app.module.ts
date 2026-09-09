import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { MatchesModule } from './matches/matches.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StandingsModule } from './standings/standings.module';
import { PlayoffsModule } from './playoffs/playoffs.module';
import { ScoreSheetsModule } from './score-sheets/score-sheets.module';
import { MediaModule } from './media/media.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TeamsModule,
    PlayersModule,
    TournamentsModule,
    MatchesModule,
    StatisticsModule,
    StandingsModule,
    PlayoffsModule,
    ScoreSheetsModule,
    MediaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
