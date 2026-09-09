import type { PlayerPosition, TournamentFormat, UserRole } from "./types";

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrator",
  ORGANIZER: "Tournament Organizer",
  SCOREKEEPER: "Scorekeeper",
  SPECTATOR: "Spectator",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
  return (initials ?? "").toUpperCase();
}

export function formatClock(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPct(wins: number, gamesPlayed: number): string {
  if (gamesPlayed === 0) return ".000";
  return (wins / gamesPlayed).toFixed(3).replace(/^0/, "");
}

export const TOURNAMENT_FORMAT_LABEL: Record<TournamentFormat, string> = {
  ROUND_ROBIN: "Round Robin",
  HOME_AWAY: "Home & Away",
  SINGLE_ELIMINATION: "Single Elimination",
};

export const POSITION_LABEL: Record<PlayerPosition, string> = {
  POINT_GUARD: "Point Guard",
  SHOOTING_GUARD: "Shooting Guard",
  SMALL_FORWARD: "Small Forward",
  POWER_FORWARD: "Power Forward",
  CENTER: "Center",
};

export const POSITION_SHORT_LABEL: Record<PlayerPosition, string> = {
  POINT_GUARD: "PG",
  SHOOTING_GUARD: "SG",
  SMALL_FORWARD: "SF",
  POWER_FORWARD: "PF",
  CENTER: "C",
};
