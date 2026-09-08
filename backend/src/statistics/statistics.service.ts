import { Injectable } from '@nestjs/common';
import { MatchEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface PlayerAgg {
  teamId: string;
  points: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  freeThrowMade: number;
  freeThrowAttempted: number;
  twoPointMade: number;
  twoPointAttempted: number;
  threePointMade: number;
  threePointAttempted: number;
}

function emptyPlayerAgg(teamId: string): PlayerAgg {
  return {
    teamId,
    points: 0,
    reboundsOffensive: 0,
    reboundsDefensive: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    fouls: 0,
    freeThrowMade: 0,
    freeThrowAttempted: 0,
    twoPointMade: 0,
    twoPointAttempted: 0,
    threePointMade: 0,
    threePointAttempted: 0,
  };
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  getForMatch(matchId: string) {
    return Promise.all([
      this.prisma.playerMatchStatistics.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: { points: 'desc' },
      }),
      this.prisma.teamMatchStatistics.findMany({ where: { matchId }, include: { team: true } }),
    ]).then(([players, teams]) => ({ players, teams }));
  }

  // The only place player/team match statistics and the match's score
  // are written. Called after every event create/edit/soft-delete —
  // always a full recompute from the current non-deleted events, never
  // an incremental patch, so a correction can never leave stale numbers
  // behind regardless of edit order.
  async recalculateForMatch(matchId: string) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    });

    const events = await this.prisma.matchEvent.findMany({
      where: { matchId, isDeleted: false },
    });

    const playerAgg = new Map<string, PlayerAgg>();
    const teamPoints = new Map<string, number>([
      [match.homeTeamId, 0],
      [match.awayTeamId, 0],
    ]);
    const teamFouls = new Map<string, number>([
      [match.homeTeamId, 0],
      [match.awayTeamId, 0],
    ]);

    for (const event of events) {
      const agg = event.playerId
        ? (playerAgg.get(event.playerId) ?? playerAgg.set(event.playerId, emptyPlayerAgg(event.teamId)).get(event.playerId)!)
        : null;

      switch (event.eventType) {
        case MatchEventType.FREE_THROW_MADE:
          teamPoints.set(event.teamId, (teamPoints.get(event.teamId) ?? 0) + 1);
          if (agg) {
            agg.points += 1;
            agg.freeThrowMade += 1;
            agg.freeThrowAttempted += 1;
          }
          break;
        case MatchEventType.FREE_THROW_MISSED:
          if (agg) agg.freeThrowAttempted += 1;
          break;
        case MatchEventType.TWO_POINT_MADE:
          teamPoints.set(event.teamId, (teamPoints.get(event.teamId) ?? 0) + 2);
          if (agg) {
            agg.points += 2;
            agg.twoPointMade += 1;
            agg.twoPointAttempted += 1;
          }
          break;
        case MatchEventType.TWO_POINT_MISSED:
          if (agg) agg.twoPointAttempted += 1;
          break;
        case MatchEventType.THREE_POINT_MADE:
          teamPoints.set(event.teamId, (teamPoints.get(event.teamId) ?? 0) + 3);
          if (agg) {
            agg.points += 3;
            agg.threePointMade += 1;
            agg.threePointAttempted += 1;
          }
          break;
        case MatchEventType.THREE_POINT_MISSED:
          if (agg) agg.threePointAttempted += 1;
          break;
        case MatchEventType.REBOUND_OFFENSIVE:
          if (agg) agg.reboundsOffensive += 1;
          break;
        case MatchEventType.REBOUND_DEFENSIVE:
          if (agg) agg.reboundsDefensive += 1;
          break;
        case MatchEventType.ASSIST:
          if (agg) agg.assists += 1;
          break;
        case MatchEventType.STEAL:
          if (agg) agg.steals += 1;
          break;
        case MatchEventType.BLOCK:
          if (agg) agg.blocks += 1;
          break;
        case MatchEventType.FOUL:
          teamFouls.set(event.teamId, (teamFouls.get(event.teamId) ?? 0) + 1);
          if (agg) agg.fouls += 1;
          break;
        case MatchEventType.SUBSTITUTION:
          // No statistic to update — substitutions only affect the
          // event timeline / on-court lineup, not the box score.
          break;
      }
    }

    const homePoints = teamPoints.get(match.homeTeamId) ?? 0;
    const awayPoints = teamPoints.get(match.awayTeamId) ?? 0;

    await this.prisma.$transaction([
      this.prisma.playerMatchStatistics.deleteMany({ where: { matchId } }),
      this.prisma.teamMatchStatistics.deleteMany({ where: { matchId } }),
      ...(playerAgg.size
        ? [
            this.prisma.playerMatchStatistics.createMany({
              data: Array.from(playerAgg.entries()).map(([playerId, agg]) => ({
                matchId,
                playerId,
                ...agg,
              })),
            }),
          ]
        : []),
      this.prisma.teamMatchStatistics.createMany({
        data: [
          {
            matchId,
            teamId: match.homeTeamId,
            points: homePoints,
            pointsConceded: awayPoints,
            fouls: teamFouls.get(match.homeTeamId) ?? 0,
          },
          {
            matchId,
            teamId: match.awayTeamId,
            points: awayPoints,
            pointsConceded: homePoints,
            fouls: teamFouls.get(match.awayTeamId) ?? 0,
          },
        ],
      }),
      this.prisma.match.update({
        where: { id: matchId },
        data: { homeScore: homePoints, awayScore: awayPoints },
      }),
    ]);
  }
}
