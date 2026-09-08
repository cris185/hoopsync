import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchEventsService } from './match-events.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { AssignOfficialDto } from './dto/assign-official.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchEventDto } from './dto/update-match-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { SafeUser } from '../users/users.service';

// Reads (match, events, officials list excepted — see below) are
// public. Every write needs a real identity, so JwtAuthGuard runs
// everywhere; the finer-grained "organizer vs. assigned official"
// checks happen inside the services since they need the resource
// loaded anyway.
@Controller()
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchEventsService: MatchEventsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('tournaments/:tournamentId/matches')
  create(@Param('tournamentId') tournamentId: string, @Body() dto: CreateMatchDto, @CurrentUser() user: SafeUser) {
    return this.matchesService.create(tournamentId, dto, user);
  }

  @Get('tournaments/:tournamentId/matches')
  findAllForTournament(@Param('tournamentId') tournamentId: string) {
    return this.matchesService.findAllForTournament(tournamentId);
  }

  @Get('matches/:id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Patch('matches/:id')
  update(@Param('id') id: string, @Body() dto: UpdateMatchDto, @CurrentUser() user: SafeUser) {
    return this.matchesService.update(id, dto, user);
  }

  // Not role-restricted at the decorator level: an assigned
  // scorekeeper (whatever their global role) must be able to start,
  // pause and finish the match they were assigned — MatchesService
  // enforces the real rule (owner, admin, or assigned official).
  @UseGuards(JwtAuthGuard)
  @Patch('matches/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMatchStatusDto, @CurrentUser() user: SafeUser) {
    return this.matchesService.updateStatus(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post('matches/:id/officials')
  assignOfficial(@Param('id') id: string, @Body() dto: AssignOfficialDto, @CurrentUser() user: SafeUser) {
    return this.matchesService.assignOfficial(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Get('matches/:id/officials')
  listOfficials(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.matchesService.listOfficials(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Delete('matches/:id/officials/:userId')
  removeOfficial(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: SafeUser) {
    return this.matchesService.removeOfficial(id, userId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('matches/:id/events')
  createEvent(@Param('id') id: string, @Body() dto: CreateMatchEventDto, @CurrentUser() user: SafeUser) {
    return this.matchEventsService.create(id, dto, user);
  }

  @Get('matches/:id/events')
  findAllEvents(@Param('id') id: string) {
    return this.matchEventsService.findAllForMatch(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('matches/:id/events/:eventId')
  updateEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateMatchEventDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.matchEventsService.update(id, eventId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('matches/:id/events/:eventId')
  removeEvent(@Param('id') id: string, @Param('eventId') eventId: string, @CurrentUser() user: SafeUser) {
    return this.matchEventsService.remove(id, eventId, user);
  }
}
