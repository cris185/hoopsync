"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManage } from "@/lib/permissions";
import { getTeamColor } from "@/lib/team-color";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function TeamsPage() {
  const { user } = useAuth();
  const { data: teams, isLoading, error } = useApi<Team[]>("/teams");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">Teams</h1>
          <p className="text-sm text-text-secondary">Every team registered on HoopSync.</p>
        </div>
        {canManage(user) && (
          <Link href="/teams/new">
            <Button className="gap-2">
              <Plus size={16} />
              New Team
            </Button>
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-status-live">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : teams && teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center gap-3.5 rounded-lg border border-surface-border bg-bg-elevated p-4.5 transition hover:border-accent-400"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-accent-ink"
                style={{ background: getTeamColor(team.id) }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-display text-base font-bold">{team.name}</span>
                <span className="truncate text-xs text-text-tertiary">{team.category ?? "No category"}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-bg-elevated p-8">
          <Users size={28} className="text-accent-400" />
          <h2 className="font-display text-lg font-bold">No teams yet</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Create a team to start registering players and entering tournaments.
          </p>
          {canManage(user) && (
            <Link href="/teams/new">
              <Button className="mt-1 gap-2">
                <Plus size={16} />
                New Team
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
