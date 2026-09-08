import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SafeUser } from '../users/users.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { RegisterTeamDto } from './dto/register-team.dto';
import { isPrismaNotFound, isPrismaUniqueConflict } from '../common/prisma.utils';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTournamentDto, owner: SafeUser) {
    return this.prisma.tournament.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: owner.id,
      },
    });
  }

  findAll() {
    return this.prisma.tournament.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { tournamentTeams: { include: { team: true } } },
    });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    return tournament;
  }

  async update(id: string, dto: UpdateTournamentDto, requester: SafeUser) {
    const tournament = await this.getOwnedOrThrow(id, requester);
    return this.prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string, requester: SafeUser) {
    const tournament = await this.getOwnedOrThrow(id, requester);
    await this.prisma.tournament.delete({ where: { id: tournament.id } });
  }

  async registerTeam(tournamentId: string, dto: RegisterTeamDto, requester: SafeUser) {
    await this.getOwnedOrThrow(tournamentId, requester);

    const team = await this.prisma.team.findUnique({ where: { id: dto.teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    try {
      return await this.prisma.tournamentTeam.create({
        data: { tournamentId, teamId: dto.teamId, seed: dto.seed },
        include: { team: true },
      });
    } catch (error) {
      if (isPrismaUniqueConflict(error)) {
        throw new ConflictException('This team is already registered in this tournament');
      }
      throw error;
    }
  }

  listTeams(tournamentId: string) {
    return this.prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: true },
      orderBy: { registeredAt: 'asc' },
    });
  }

  async withdrawTeam(tournamentId: string, teamId: string, requester: SafeUser) {
    await this.getOwnedOrThrow(tournamentId, requester);
    try {
      await this.prisma.tournamentTeam.delete({
        where: { tournamentId_teamId: { tournamentId, teamId } },
      });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('This team is not registered in this tournament');
      }
      throw error;
    }
  }

  // Loads the tournament and asserts the requester may modify it: its
  // creator, or an ADMIN. Centralized here because every mutating
  // method above needs the tournament loaded anyway.
  private async getOwnedOrThrow(id: string, requester: SafeUser) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
    if (requester.role !== 'ADMIN' && tournament.createdById !== requester.id) {
      throw new ForbiddenException('Only the tournament organizer or an admin can do this');
    }
    return tournament;
  }
}
