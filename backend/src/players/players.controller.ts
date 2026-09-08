import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Deliberately not scoped under a single @Controller prefix: creating
// and listing a roster needs the team in context (teams/:teamId/players),
// while reading/editing/removing one player is addressed by its own id.
@Controller()
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('teams/:teamId/players')
  createForTeam(@Param('teamId') teamId: string, @Body() dto: CreatePlayerDto) {
    return this.playersService.createForTeam(teamId, dto);
  }

  @Get('teams/:teamId/players')
  findAllForTeam(@Param('teamId') teamId: string) {
    return this.playersService.findAllForTeam(teamId);
  }

  @Get('players/:id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Patch('players/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Delete('players/:id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
