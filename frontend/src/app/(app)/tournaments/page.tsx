"use client";

import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManage } from "@/lib/permissions";
import { TOURNAMENT_FORMAT_LABEL } from "@/lib/format";
import type { Tournament } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TournamentStatusTag } from "@/components/ui/status-tag";

export default function TournamentsPage() {
  const { user } = useAuth();
  const { data: tournaments, isLoading, error } = useApi<Tournament[]>("/tournaments");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">Tournaments</h1>
          <p className="text-sm text-text-secondary">Every tournament running on HoopSync.</p>
        </div>
        {canManage(user) && (
          <Link href="/tournaments/new">
            <Button className="gap-2">
              <Plus size={16} />
              New Tournament
            </Button>
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-status-live">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="flex items-center gap-3.5 rounded-md border border-surface-border bg-bg-elevated p-4 transition hover:border-accent-400"
            >
              <span className="h-9 w-1 shrink-0 rounded-xs bg-accent" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-display text-base font-bold">{t.name}</span>
                <span className="truncate text-xs text-text-tertiary">
                  {TOURNAMENT_FORMAT_LABEL[t.format]}
                  {t.location ? ` · ${t.location}` : ""}
                </span>
              </div>
              <TournamentStatusTag status={t.status} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-bg-elevated p-8">
          <Trophy size={28} className="text-accent-400" />
          <h2 className="font-display text-lg font-bold">No tournaments yet</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Create a tournament to start registering teams and scheduling matches.
          </p>
          {canManage(user) && (
            <Link href="/tournaments/new">
              <Button className="mt-1 gap-2">
                <Plus size={16} />
                New Tournament
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
