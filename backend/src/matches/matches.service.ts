import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafeUser } from '../users/users.service';
import { StandingsService } from '../standings/standings.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { AssignOfficialDto } from './dto/assign-official.dto';
import { isPrismaNotFound, isPrismaUniqueConflict } from '../common/prisma.utils';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly standingsService: StandingsService,
  ) {}

  async create(tournamentId: string, dto: CreateMatchDto, requester: SafeUser) {
    await this.assertOwnsTournament(tournamentId, requester);

    if (dto.homeTeamId === dto.awayTeamId) {
      throw new ConflictException('A team cannot play against itself');
    }
    await this.assertTeamsRegistered(tournamentId, [dto.homeTeamId, dto.awayTeamId]);

    return this.prisma.match.create({
      data: {
        tournamentId,
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        venue: dto.venue,
        matchday: dto.matchday,
      },
    });
  }

  findAllForTournament(tournamentId: string) {
    return this.prisma.match.findMany({
      where: { tournamentId },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true, tournament: true },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async update(id: string, dto: UpdateMatchDto, requester: SafeUser) {
    const match = await this.getOrThrow(id);
    await this.assertOwnsTournament(match.tournamentId, requester);
    return this.prisma.match.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateMatchStatusDto, requester: SafeUser) {
    const match = await this.getOrThrow(id);
    await this.assertCanScore(id, requester);

    const updated = await this.prisma.match.update({ where: { id }, data: { status: dto.status } });

    // Finishing a match (or re-finishing after a correction — see
    // MatchEventsService) is the trigger for standings: recompute the
    // whole tournament table from every FINISHED match.
    if (dto.status === MatchStatus.FINISHED) {
      await this.standingsService.recalculateForTournament(match.tournamentId);
    }
    return updated;
  }

  async assignOfficial(matchId: string, dto: AssignOfficialDto, requester: SafeUser) {
    const match = await this.getOrThrow(matchId);
    await this.assertOwnsTournament(match.tournamentId, requester);

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      return await this.prisma.matchOfficial.create({
        data: { matchId, userId: dto.userId },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
    } catch (error) {
      if (isPrismaUniqueConflict(error)) {
        throw new ConflictException('This user is already assigned to this match');
      }
      throw error;
    }
  }

  async listOfficials(matchId: string, requester: SafeUser) {
    const match = await this.getOrThrow(matchId);
    await this.assertOwnsTournament(match.tournamentId, requester);
    return this.prisma.matchOfficial.findMany({
      where: { matchId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  async removeOfficial(matchId: string, userId: string, requester: SafeUser) {
    const match = await this.getOrThrow(matchId);
    await this.assertOwnsTournament(match.tournamentId, requester);
    try {
      await this.prisma.matchOfficial.delete({ where: { matchId_userId: { matchId, userId } } });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('This user is not assigned to this match');
      }
      throw error;
    }
  }

  // ---- Shared permission checks, reused by MatchEventsService ----

  async getOrThrow(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  // Who may score a match: its assigned officials, the tournament's
  // owner, or an admin (spec: "Access assigned matches" — assignment
  // is the grant, independent of the user's global role label).
  async assertCanScore(matchId: string, requester: SafeUser) {
    if (requester.role === 'ADMIN') return;

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { createdById: true } } },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.tournament.createdById === requester.id) return;

    const official = await this.prisma.matchOfficial.findUnique({
      where: { matchId_userId: { matchId, userId: requester.id } },
    });
    if (!official) {
      throw new ForbiddenException('You are not assigned to score this match');
    }
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

  private async assertTeamsRegistered(tournamentId: string, teamIds: string[]) {
    const registered = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId, teamId: { in: teamIds } },
      select: { teamId: true },
    });
    if (registered.length !== teamIds.length) {
      throw new ConflictException('Both teams must be registered in this tournament first');
    }
  }
}
