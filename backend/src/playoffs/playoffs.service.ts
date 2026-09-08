import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus, PlayoffSeriesStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafeUser } from '../users/users.service';
import { CreatePlayoffRoundDto } from './dto/create-playoff-round.dto';
import { UpdatePlayoffRoundDto } from './dto/update-playoff-round.dto';
import { CreatePlayoffSeriesDto } from './dto/create-playoff-series.dto';
import { CreateSeriesGameDto } from './dto/create-series-game.dto';

@Injectable()
export class PlayoffsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRound(tournamentId: string, dto: CreatePlayoffRoundDto, requester: SafeUser) {
    await this.assertOwnsTournament(tournamentId, requester);
    const [round] = await this.prisma.$transaction([
      this.prisma.playoffRound.create({ data: { tournamentId, ...dto } }),
      this.prisma.tournament.update({ where: { id: tournamentId }, data: { hasPlayoffs: true } }),
    ]);
    return round;
  }

  listRoundsForTournament(tournamentId: string) {
    return this.prisma.playoffRound.findMany({
      where: { tournamentId },
      include: {
        series: { include: { teamA: true, teamB: true, winnerTeam: true, games: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async updateRound(id: string, dto: UpdatePlayoffRoundDto, requester: SafeUser) {
    const round = await this.getRoundOrThrow(id);
    await this.assertOwnsTournament(round.tournamentId, requester);
    return this.prisma.playoffRound.update({ where: { id }, data: dto });
  }

  async removeRound(id: string, requester: SafeUser) {
    const round = await this.getRoundOrThrow(id);
    await this.assertOwnsTournament(round.tournamentId, requester);
    await this.prisma.playoffRound.delete({ where: { id } });
  }

  async createSeries(roundId: string, dto: CreatePlayoffSeriesDto, requester: SafeUser) {
    const round = await this.getRoundOrThrow(roundId);
    await this.assertOwnsTournament(round.tournamentId, requester);

    if (dto.teamAId === dto.teamBId) {
      throw new ConflictException('A series needs two different teams');
    }
    const registered = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId: round.tournamentId, teamId: { in: [dto.teamAId, dto.teamBId] } },
      select: { teamId: true },
    });
    if (registered.length !== 2) {
      throw new ConflictException('Both teams must be registered in this tournament first');
    }

    return this.prisma.playoffSeries.create({
      data: { playoffRoundId: roundId, teamAId: dto.teamAId, teamBId: dto.teamBId },
      include: { teamA: true, teamB: true },
    });
  }

  async findSeries(id: string) {
    const series = await this.prisma.playoffSeries.findUnique({
      where: { id },
      include: { teamA: true, teamB: true, winnerTeam: true, games: true, playoffRound: true },
    });
    if (!series) {
      throw new NotFoundException('Playoff series not found');
    }
    return series;
  }

  async createGame(seriesId: string, dto: CreateSeriesGameDto, requester: SafeUser) {
    const series = await this.getSeriesOrThrow(seriesId);
    await this.assertOwnsTournament(series.playoffRound.tournamentId, requester);

    if (series.status === PlayoffSeriesStatus.COMPLETED) {
      throw new ConflictException('This series is already decided');
    }
    if (dto.homeTeamId !== series.teamAId && dto.homeTeamId !== series.teamBId) {
      throw new BadRequestException('homeTeamId must be one of the two teams in this series');
    }
    const awayTeamId = dto.homeTeamId === series.teamAId ? series.teamBId : series.teamAId;

    const gameNumberInSeries = (await this.prisma.match.count({ where: { playoffSeriesId: seriesId } })) + 1;

    const [game] = await this.prisma.$transaction([
      this.prisma.match.create({
        data: {
          tournamentId: series.playoffRound.tournamentId,
          homeTeamId: dto.homeTeamId,
          awayTeamId,
          playoffSeriesId: seriesId,
          gameNumberInSeries,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          venue: dto.venue,
        },
      }),
      this.prisma.playoffSeries.update({
        where: { id: seriesId },
        data: { status: PlayoffSeriesStatus.IN_PROGRESS },
      }),
    ]);
    return game;
  }

  // Called by MatchesModule after a game (Match) tied to a playoff
  // series finishes or is corrected — a no-op for regular matches.
  // Always a full recompute from every FINISHED game in the series,
  // for the same reason statistics/standings are full recomputes:
  // corrections must never leave stale state behind.
  async recalculateSeriesForMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match?.playoffSeriesId) {
      return;
    }

    const series = await this.prisma.playoffSeries.findUniqueOrThrow({
      where: { id: match.playoffSeriesId },
      include: { playoffRound: true },
    });
    const finishedGames = await this.prisma.match.findMany({
      where: { playoffSeriesId: series.id, status: MatchStatus.FINISHED },
    });

    let teamAWins = 0;
    let teamBWins = 0;
    for (const game of finishedGames) {
      const winnerTeamId = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
      if (winnerTeamId === series.teamAId) teamAWins += 1;
      else if (winnerTeamId === series.teamBId) teamBWins += 1;
    }

    const majorityNeeded = Math.ceil(series.playoffRound.bestOf / 2);
    const winnerTeamId =
      teamAWins >= majorityNeeded ? series.teamAId : teamBWins >= majorityNeeded ? series.teamBId : null;

    await this.prisma.playoffSeries.update({
      where: { id: series.id },
      data: {
        teamAWins,
        teamBWins,
        winnerTeamId,
        status: winnerTeamId
          ? PlayoffSeriesStatus.COMPLETED
          : finishedGames.length > 0
            ? PlayoffSeriesStatus.IN_PROGRESS
            : PlayoffSeriesStatus.SCHEDULED,
      },
    });
  }

  private async getRoundOrThrow(id: string) {
    const round = await this.prisma.playoffRound.findUnique({ where: { id } });
    if (!round) {
      throw new NotFoundException('Playoff round not found');
    }
    return round;
  }

  private async getSeriesOrThrow(id: string) {
    const series = await this.prisma.playoffSeries.findUnique({
      where: { id },
      include: { playoffRound: true },
    });
    if (!series) {
      throw new NotFoundException('Playoff series not found');
    }
    return series;
  }

  private async assertOwnsTournament(tournamentId: string, requester: SafeUser) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    if (requester.role !== 'ADMIN' && tournament.createdById !== requester.id) {
      throw new ForbiddenException('Only the tournament organizer or an admin can do this');
    }
  }
}
