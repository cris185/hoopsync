import type { UserRole } from "./types";

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
