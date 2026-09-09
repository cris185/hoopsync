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
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: "GUARD" | "FORWARD" | "CENTER" | null;
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
