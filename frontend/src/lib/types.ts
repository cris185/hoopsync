export type UserRole = "ADMIN" | "ORGANIZER" | "SCOREKEEPER" | "SPECTATOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type TournamentFormat = "ROUND_ROBIN" | "HOME_AWAY" | "SINGLE_ELIMINATION";
export type TournamentStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  hasPlayoffs: boolean;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  coachName: string | null;
  coachPhotoUrl: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PlayerPosition = "POINT_GUARD" | "SHOOTING_GUARD" | "SMALL_FORWARD" | "POWER_FORWARD" | "CENTER";

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: PlayerPosition | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDetail extends Team {
  players: Player[];
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamId: string;
  seed: number | null;
  registeredAt: string;
  team: Team;
}

export interface TournamentDetail extends Tournament {
  tournamentTeams: TournamentTeam[];
}

export type MatchStatus = "SCHEDULED" | "LIVE" | "PAUSED" | "FINISHED" | "CANCELLED";

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  scheduledAt: string | null;
  venue: string | null;
  matchday: number | null;
  playoffSeriesId: string | null;
  gameNumberInSeries: number | null;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  clockSeconds: number | null;
  createdAt: string;
  updatedAt: string;
  homeTeam: Team;
  awayTeam: Team;
}

export type MatchEventType =
  | "FREE_THROW_MADE"
  | "FREE_THROW_MISSED"
  | "TWO_POINT_MADE"
  | "TWO_POINT_MISSED"
  | "THREE_POINT_MADE"
  | "THREE_POINT_MISSED"
  | "REBOUND_OFFENSIVE"
  | "REBOUND_DEFENSIVE"
  | "ASSIST"
  | "STEAL"
  | "BLOCK"
  | "FOUL"
  | "SUBSTITUTION";

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  relatedPlayerId: string | null;
  eventType: MatchEventType;
  value: number | null;
  period: number;
  clockSeconds: number;
  isDeleted: boolean;
  createdById: string | null;
  createdAt: string;
  player?: Player | null;
  relatedPlayer?: Player | null;
}

export interface PlayerMatchStatistics {
  id: string;
  matchId: string;
  playerId: string;
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
  player: Player;
}

export interface TeamMatchStatistics {
  id: string;
  matchId: string;
  teamId: string;
  points: number;
  pointsConceded: number;
  fouls: number;
  team: Team;
}

export interface MatchStatistics {
  players: PlayerMatchStatistics[];
  teams: TeamMatchStatistics[];
}

export type ScoreSheetStatus = "PENDING" | "PROCESSING" | "PROCESSED" | "VALIDATED" | "REJECTED";
export type OCRResolutionMethod = "EXACT_ROSTER_MATCH" | "FUZZY_ROSTER_MATCH" | "MARK_DETECTED" | "NEEDS_REVIEW";

export interface OCRFieldResult {
  id: string;
  ocrProcessingResultId: string;
  fieldName: string;
  rawText: string | null;
  confidence: number;
  resolutionMethod: OCRResolutionMethod;
  matchedPlayerId: string | null;
  matchedPlayer?: Player | null;
  wasManuallyCorrected: boolean;
}

export interface OCRProcessingResult {
  id: string;
  scoreSheetId: string;
  overallConfidence: number;
  processedAt: string;
  fields: OCRFieldResult[];
}

export interface ScoreSheet {
  id: string;
  matchId: string;
  imageUrl: string;
  uploadedById: string;
  status: ScoreSheetStatus;
  uploadedAt: string;
  processingResult: OCRProcessingResult | null;
}

export type PlayoffSeriesStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface PlayoffGame {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  scheduledAt: string | null;
  venue: string | null;
  homeScore: number;
  awayScore: number;
  gameNumberInSeries: number | null;
}

export interface PlayoffSeries {
  id: string;
  playoffRoundId: string;
  teamAId: string;
  teamBId: string;
  teamAWins: number;
  teamBWins: number;
  winnerTeamId: string | null;
  status: PlayoffSeriesStatus;
  teamA: Team;
  teamB: Team;
  winnerTeam: Team | null;
  games: PlayoffGame[];
}

export interface PlayoffRound {
  id: string;
  tournamentId: string;
  name: string;
  order: number;
  bestOf: number;
  series: PlayoffSeries[];
}

export interface Standing {
  id: string;
  tournamentId: string;
  teamId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  tournamentPoints: number;
  updatedAt: string;
  team: Team;
}
