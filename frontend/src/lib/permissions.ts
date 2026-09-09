import type { Tournament, User } from "./types";

export function canManage(user: User | null): boolean {
  return user?.role === "ORGANIZER" || user?.role === "ADMIN";
}

export function canManageTournament(user: User | null, tournament: Tournament): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.id === tournament.createdById;
}
