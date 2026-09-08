import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Simple win/loss points rule for the MVP (2 for a win, 1 for a loss).
// The spec flags tie-break/points rules as "configurable in the
// future" — this is the placeholder default until that exists.
const POINTS_PER_WIN = 2;
const POINTS_PER_LOSS = 1;

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  getForTournament(tournamentId: string) {
    return this.prisma.standing.findMany({
      where: { tournamentId },
      include: { team: true },
      orderBy: [{ tournamentPoints: 'desc' }, { wins: 'desc' }, { pointsFor: 'desc' }],
    });
  }

  // Full recompute from every FINISHED match in the tournament — run
  // whenever a match transitions to FINISHED or a finished match's
  // events are corrected. Every registered team gets a row, including
  // teams that haven't played yet (0-0-0), so the table is complete
  // from the moment teams are registered.
  async recalculateForTournament(tournamentId: string) {
    const [tournamentTeams, finishedMatches] = await Promise.all([
      this.prisma.tournamentTeam.findMany({ where: { tournamentId }, select: { teamId: true } }),
      this.prisma.match.findMany({
        where: { tournamentId, status: MatchStatus.FINISHED },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
      }),
    ]);

    const records = new Map(
      tournamentTeams.map(({ teamId }) => [
        teamId,
        { gamesPlayed: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
      ]),
    );

    for (const match of finishedMatches) {
      const home = records.get(match.homeTeamId);
      const away = records.get(match.awayTeamId);
      if (home) {
        home.gamesPlayed += 1;
        home.pointsFor += match.homeScore;
        home.pointsAgainst += match.awayScore;
        if (match.homeScore > match.awayScore) home.wins += 1;
        else if (match.homeScore < match.awayScore) home.losses += 1;
      }
      if (away) {
        away.gamesPlayed += 1;
        away.pointsFor += match.awayScore;
        away.pointsAgainst += match.homeScore;
        if (match.awayScore > match.homeScore) away.wins += 1;
        else if (match.awayScore < match.homeScore) away.losses += 1;
      }
    }

    await this.prisma.$transaction(
      Array.from(records.entries()).map(([teamId, record]) =>
        this.prisma.standing.upsert({
          where: { tournamentId_teamId: { tournamentId, teamId } },
          create: {
            tournamentId,
            teamId,
            ...record,
            tournamentPoints: record.wins * POINTS_PER_WIN + record.losses * POINTS_PER_LOSS,
          },
          update: {
            ...record,
            tournamentPoints: record.wins * POINTS_PER_WIN + record.losses * POINTS_PER_LOSS,
          },
        }),
      ),
    );
  }
}
