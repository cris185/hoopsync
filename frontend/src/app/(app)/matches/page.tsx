"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatClock } from "@/lib/format";
import { getTeamColor } from "@/lib/team-color";
import type { Match, Tournament } from "@/lib/types";
import { StatusTag } from "@/components/ui/status-tag";

interface MatchRow extends Match {
  tournamentName: string;
}

const STATUS_RANK: Record<Match["status"], number> = {
  LIVE: 0,
  PAUSED: 1,
  SCHEDULED: 2,
  FINISHED: 3,
  CANCELLED: 4,
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const tournaments = await apiFetch<Tournament[]>("/tournaments");
        const lists = await Promise.all(
          tournaments.map((t) => apiFetch<Match[]>(`/tournaments/${t.id}/matches`)),
        );
        if (cancelled) return;

        const rows = tournaments
          .flatMap((t, i) => lists[i].map((m) => ({ ...m, tournamentName: t.name })))
          .sort((a, b) => {
            const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
            if (rankDiff !== 0) return rankDiff;
            const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
            return aTime - bTime;
          });
        setMatches(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load matches");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">Matches</h1>
        <p className="text-sm text-text-secondary">Every match across every tournament, live ones first.</p>
      </div>

      {error && <p className="text-sm text-status-live">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-bg-elevated p-8">
          <Calendar size={28} className="text-accent-400" />
          <h2 className="font-display text-lg font-bold">No matches yet</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Schedule a match from a tournament&apos;s detail page once teams are registered.
          </p>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
          {matches.map((m, i) => {
            const isLive = m.status === "LIVE" || m.status === "PAUSED";
            return (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex flex-wrap items-center gap-4 px-4 py-3.5 transition hover:bg-white/5"
                style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
              >
                <span className="w-36 shrink-0 truncate text-xs text-text-tertiary">{m.tournamentName}</span>
                <span className="flex flex-1 items-center gap-2 truncate text-sm">
                  <span className="h-3.5 w-1 shrink-0 rounded-xs" style={{ background: getTeamColor(m.homeTeamId) }} />
                  <span className="font-semibold">{m.homeTeam.name}</span>
                  <span className="tabular-nums mx-1 font-display font-extrabold">
                    {m.homeScore} – {m.awayScore}
                  </span>
                  <span className="font-semibold">{m.awayTeam.name}</span>
                  <span className="h-3.5 w-1 shrink-0 rounded-xs" style={{ background: getTeamColor(m.awayTeamId) }} />
                </span>
                <span className="w-32 shrink-0 text-right text-xs text-text-tertiary">
                  {isLive
                    ? `Q${m.currentPeriod} · ${formatClock(m.clockSeconds)}`
                    : m.scheduledAt
                      ? new Date(m.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                      : "Date TBD"}
                </span>
                <StatusTag status={m.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
