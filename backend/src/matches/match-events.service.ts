import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafeUser } from '../users/users.service';
import { StatisticsService } from '../statistics/statistics.service';
import { StandingsService } from '../standings/standings.service';
import { MatchesService } from './matches.service';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchEventDto } from './dto/update-match-event.dto';

@Injectable()
export class MatchEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesService: MatchesService,
    private readonly statisticsService: StatisticsService,
    private readonly standingsService: StandingsService,
  ) {}

  async create(matchId: string, dto: CreateMatchEventDto, requester: SafeUser) {
    await this.matchesService.assertCanScore(matchId, requester);
    const event = await this.prisma.matchEvent.create({
      data: { matchId, createdById: requester.id, ...dto },
    });
    await this.afterMutation(matchId);
    return event;
  }

  findAllForMatch(matchId: string) {
    return this.prisma.matchEvent.findMany({
      where: { matchId, isDeleted: false },
      include: { player: true, relatedPlayer: true },
      orderBy: [{ period: 'asc' }, { clockSeconds: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async update(matchId: string, eventId: string, dto: UpdateMatchEventDto, requester: SafeUser) {
    await this.matchesService.assertCanScore(matchId, requester);
    await this.getEventOnMatchOrThrow(matchId, eventId);
    const event = await this.prisma.matchEvent.update({ where: { id: eventId }, data: dto });
    await this.afterMutation(matchId);
    return event;
  }

  // Corrections soft-delete — the event stays in the table with
  // isDeleted: true (audit trail), it is just excluded from the
  // timeline and from statistics from this point on.
  async remove(matchId: string, eventId: string, requester: SafeUser) {
    await this.matchesService.assertCanScore(matchId, requester);
    await this.getEventOnMatchOrThrow(matchId, eventId);
    const event = await this.prisma.matchEvent.update({
      where: { id: eventId },
      data: { isDeleted: true },
    });
    await this.afterMutation(matchId);
    return event;
  }

  private async getEventOnMatchOrThrow(matchId: string, eventId: string) {
    const event = await this.prisma.matchEvent.findUnique({ where: { id: eventId } });
    if (!event || event.matchId !== matchId) {
      throw new NotFoundException('Event not found on this match');
    }
    return event;
  }

  // Every create/edit/soft-delete recalculates statistics for the
  // match, and — if the match was already FINISHED (a correction made
  // after the fact) — the tournament's standings too, since the final
  // score may have just changed.
  private async afterMutation(matchId: string) {
    await this.statisticsService.recalculateForMatch(matchId);
    const match = await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });
    if (match.status === MatchStatus.FINISHED) {
      await this.standingsService.recalculateForTournament(match.tournamentId);
    }
    return match;
  }
}
