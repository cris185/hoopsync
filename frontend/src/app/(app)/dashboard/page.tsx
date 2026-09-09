"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, Radio, Trophy, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TOURNAMENT_FORMAT_LABEL } from "@/lib/format";
import type { Match, Standing, Tournament, TournamentDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { TournamentStatusTag } from "@/components/ui/status-tag";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";

export default function DashboardPage() {
  const { user } = useAuth();
  const [myTournaments, setMyTournaments] = useState<TournamentDetail[]>([]);
  const [matchesByTournament, setMatchesByTournament] = useState<Record<string, Match[]>>({});
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsTournament, setStandingsTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const allTournaments = await apiFetch<Tournament[]>("/tournaments");
        const mine = allTournaments.filter((t) => t.createdById === user!.id);

        const [details, matchLists] = await Promise.all([
          Promise.all(mine.map((t) => apiFetch<TournamentDetail>(`/tournaments/${t.id}`))),
          Promise.all(mine.map((t) => apiFetch<Match[]>(`/tournaments/${t.id}/matches`))),
        ]);
        if (cancelled) return;

        setMyTournaments(details);
        const matchMap: Record<string, Match[]> = {};
        mine.forEach((t, i) => {
          matchMap[t.id] = matchLists[i];
        });
        setMatchesByTournament(matchMap);

        const primary = mine.find((t) => t.status === "ACTIVE") ?? mine[0] ?? null;
        setStandingsTournament(primary);
        if (primary) {
          const s = await apiFetch<Standing[]>(`/tournaments/${primary.id}/standings`);
          if (!cancelled) setStandings(s);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const allMatches = Object.values(matchesByTournament).flat();
  const liveMatches = allMatches.filter((m) => m.status === "LIVE");
  const today = new Date().toDateString();
  const matchesToday = allMatches.filter(
    (m) => m.scheduledAt && new Date(m.scheduledAt).toDateString() === today,
  );
  const activeTournaments = myTournaments.filter((t) => t.status === "ACTIVE");
  const totalTeams = new Set(myTournaments.flatMap((t) => t.tournamentTeams.map((tt) => tt.teamId))).size;

  const matchesFor = (tournamentId: string) => matchesByTournament[tournamentId] ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Welcome back, {user?.name} — here&apos;s what&apos;s happening across your tournaments.
          </p>
        </div>
        <Link href="/tournaments/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Tournament
          </Button>
        </Link>
      </div>

      {error && (
        <p className="rounded-md border border-status-live/30 bg-status-live-bg px-4 py-3 text-sm text-status-live">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : myTournaments.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-bg-elevated p-8">
          <Trophy size={28} className="text-accent-400" />
          <h2 className="font-display text-lg font-bold">No tournaments yet</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Create your first tournament to register teams, generate a schedule and start tracking games.
          </p>
          <Link href="/tournaments/new">
            <Button className="mt-1 gap-2">
              <Plus size={16} />
              New Tournament
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={<Trophy size={17} />} value={activeTournaments.length} label="Active tournaments" />
            <StatTile icon={<Radio size={17} />} value={liveMatches.length} label="Live now" />
            <StatTile icon={<Users size={17} />} value={totalTeams} label="Teams registered" />
            <StatTile icon={<BarChart3 size={17} />} value={matchesToday.length} label="Matches today" />
          </div>

          {liveMatches.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Live Now</h2>
                <Link href="/matches" className="text-xs font-bold text-accent-400 hover:text-accent-300">
                  View All Matches
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {liveMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    eyebrow={myTournaments.find((t) => t.id === match.tournamentId)?.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">My Tournaments</h2>
                <Link href="/tournaments" className="text-xs font-bold text-accent-400 hover:text-accent-300">
                  View All
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {myTournaments.map((t) => {
                  const matches = matchesFor(t.id);
                  const finished = matches.filter((m) => m.status === "FINISHED").length;
                  return (
                    <Link
                      key={t.id}
                      href={`/tournaments/${t.id}`}
                      className="flex items-center gap-3.5 rounded-md border border-surface-border bg-bg-elevated p-3.5 transition hover:border-accent-400"
                    >
                      <span className="h-9 w-1 shrink-0 rounded-xs bg-accent" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-display text-base font-bold">{t.name}</span>
                        <span className="truncate text-xs text-text-tertiary">
                          {TOURNAMENT_FORMAT_LABEL[t.format]} · {t.tournamentTeams.length} teams
                          {matches.length > 0 ? ` · ${finished}/${matches.length} matches played` : ""}
                        </span>
                      </div>
                      <TournamentStatusTag status={t.status} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Standings</h2>
                {standingsTournament && (
                  <Link
                    href={`/tournaments/${standingsTournament.id}`}
                    className="text-xs font-bold text-accent-400 hover:text-accent-300"
                  >
                    Full Table
                  </Link>
                )}
              </div>
              {standingsTournament ? (
                <StandingsTable standings={standings} />
              ) : (
                <p className="text-sm text-text-tertiary">No tournament to show standings for yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
