"use client";

import { useAuth } from "@/lib/auth-context";

// Placeholder for this step (Auth) — the real dashboard (KPI tiles,
// live matches, tournaments list, standings snapshot) is the next
// piece of work. This just proves the login -> protected route ->
// logout loop actually works end to end.
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Dashboard</h1>
      <p className="text-sm text-text-secondary">
        Welcome back, {user?.name} — signed in as {user?.role.toLowerCase()}.
      </p>
    </div>
  );
}
