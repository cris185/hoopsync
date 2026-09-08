import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { isPrismaNotFound, isPrismaUniqueConflict } from '../common/prisma.utils';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async createForTeam(teamId: string, dto: CreatePlayerDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    try {
      return await this.prisma.player.create({ data: { ...dto, teamId } });
    } catch (error) {
      if (isPrismaUniqueConflict(error)) {
        throw new ConflictException('This jersey number is already taken on this team');
      }
      throw error;
    }
  }

  async findAllForTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return this.prisma.player.findMany({ where: { teamId }, orderBy: { jerseyNumber: 'asc' } });
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException('Player not found');
    }
    return player;
  }

  async update(id: string, dto: UpdatePlayerDto) {
    try {
      return await this.prisma.player.update({ where: { id }, data: dto });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('Player not found');
      }
      if (isPrismaUniqueConflict(error)) {
        throw new ConflictException('This jersey number is already taken on this team');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.player.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('Player not found');
      }
      throw error;
    }
  }
}
