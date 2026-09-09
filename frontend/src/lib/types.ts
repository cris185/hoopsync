export type UserRole = "ADMIN" | "ORGANIZER" | "SCOREKEEPER" | "SPECTATOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
