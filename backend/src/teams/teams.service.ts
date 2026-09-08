import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { isPrismaNotFound } from '../common/prisma.utils';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  findAll() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { players: { orderBy: { jerseyNumber: 'asc' } } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async update(id: string, dto: UpdateTeamDto) {
    try {
      return await this.prisma.team.update({ where: { id }, data: dto });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('Team not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.team.delete({ where: { id } });
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new NotFoundException('Team not found');
      }
      throw error;
    }
  }
}
