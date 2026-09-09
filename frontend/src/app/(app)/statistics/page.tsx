"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTeamColor } from "@/lib/team-color";
import type { Match, MatchStatistics, Tournament, TournamentDetail } from "@/lib/types";
import { Select } from "@/components/ui/select";

interface PlayerAgg {
  playerId: string;
  name: string;
  jerseyNumber: number;
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
}

type StatKey = "points" | "rebounds" | "assists" | "steals" | "blocks";

const LEADER_CATEGORIES: { key: StatKey; label: string }[] = [
  { key: "points", label: "Points" },
  { key: "rebounds", label: "Rebounds" },
  { key: "assists", label: "Assists" },
  { key: "steals", label: "Steals" },
  { key: "blocks", label: "Blocks" },
];

function average(total: number, games: number): string {
  return games > 0 ? (total / games).toFixed(1) : "0.0";
}

export default function StatisticsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [players, setPlayers] = useState<PlayerAgg[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Tournament[]>("/tournaments")
      .then((data) => {
        if (cancelled) return;
        setTournaments(data);
        if (data.length > 0) setTournamentId(data[0].id);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Could not load tournaments"))
      .finally(() => !cancelled && setIsLoadingTournaments(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setPlayers([]);
      return;
    }
    let cancelled = false;
    setIsLoadingStats(true);
    setError(null);

    async function load() {
      try {
        const [tournament, matches] = await Promise.all([
          apiFetch<TournamentDetail>(`/tournaments/${tournamentId}`),
          apiFetch<Match[]>(`/tournaments/${tournamentId}/matches`),
        ]);
        const teamNameById = new Map(tournament.tournamentTeams.map((tt) => [tt.teamId, tt.team.name]));

        const statsPerMatch = await Promise.all(
          matches.map((m) => apiFetch<MatchStatistics>(`/matches/${m.id}/statistics`).catch(() => null)),
        );
        if (cancelled) return;

        const agg = new Map<string, PlayerAgg>();
        for (const stats of statsPerMatch) {
          if (!stats) continue;
          for (const row of stats.players) {
            const existing = agg.get(row.playerId);
            const reboundsThisGame = row.reboundsOffensive + row.reboundsDefensive;
            if (existing) {
              existing.gamesPlayed += 1;
              existing.points += row.points;
              existing.rebounds += reboundsThisGame;
              existing.assists += row.assists;
              existing.steals += row.steals;
              existing.blocks += row.blocks;
              existing.fouls += row.fouls;
            } else {
              agg.set(row.playerId, {
                playerId: row.playerId,
                name: row.player.name,
                jerseyNumber: row.player.jerseyNumber,
                teamId: row.teamId,
                teamName: teamNameById.get(row.teamId) ?? "—",
                gamesPlayed: 1,
                points: row.points,
                rebounds: reboundsThisGame,
                assists: row.assists,
                steals: row.steals,
                blocks: row.blocks,
                fouls: row.fouls,
              });
            }
          }
        }
        setPlayers(Array.from(agg.values()));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load statistics");
      } finally {
        if (!cancelled) setIsLoadingStats(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const leadersFor = (key: StatKey) =>
    [...players]
      .sort((a, b) => Number(average(b[key], b.gamesPlayed)) - Number(average(a[key], a.gamesPlayed)))
      .slice(0, 5);

  const tableRows = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">Statistics</h1>
          <p className="text-sm text-text-secondary">League leaders, aggregated from every recorded match event.</p>
        </div>
        {tournaments.length > 0 && (
          <Select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="w-64">
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {error && <p className="text-sm text-status-live">{error}</p>}

      {isLoadingTournaments ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-bg-elevated p-8">
          <BarChart3 size={28} className="text-accent-400" />
          <h2 className="font-display text-lg font-bold">No tournaments yet</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Create a tournament and score a few matches to see league leaders here.
          </p>
        </div>
      ) : isLoadingStats ? (
        <p className="text-sm text-text-tertiary">Loading…</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-text-tertiary">No stats recorded yet for this tournament.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LEADER_CATEGORIES.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-2.5 rounded-lg border border-surface-border bg-bg-elevated p-4">
                <span className="text-[11px] font-bold tracking-wide text-text-tertiary uppercase">{label} / Game</span>
                <div className="flex flex-col gap-2">
                  {leadersFor(key).map((p, i) => (
                    <div key={p.playerId} className="flex items-center gap-2">
                      <span
                        className={
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-xs font-display text-[10px] font-extrabold " +
                          (i === 0 ? "bg-accent text-accent-ink" : "bg-surface-tint-strong text-text-secondary")
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="h-3 w-1 shrink-0 rounded-xs" style={{ background: getTeamColor(p.teamId) }} />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{p.name}</span>
                      <span className="tabular-nums font-display text-xs font-extrabold">
                        {average(p[key], p.gamesPlayed)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold">All Players</h2>
            <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
              <div className="overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-[1fr_120px_60px_70px_70px_70px_70px_70px_60px] gap-2 bg-surface-tint px-3.5 py-2.5">
                  {["PLAYER", "TEAM", "GP", "PTS", "REB", "AST", "STL", "BLK", "PF"].map((h) => (
                    <span key={h} className="text-[10px] font-bold tracking-wide text-text-tertiary">
                      {h}
                    </span>
                  ))}
                </div>
                {tableRows.map((p, i) => (
                  <div
                    key={p.playerId}
                    className="grid min-w-[720px] grid-cols-[1fr_120px_60px_70px_70px_70px_70px_70px_60px] items-center gap-2 px-3.5 py-2.5"
                    style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
                  >
                    <span className="flex items-center gap-2 truncate text-sm">
                      <span className="tabular-nums text-text-tertiary">#{p.jerseyNumber}</span>
                      <span className="truncate font-semibold">{p.name}</span>
                    </span>
                    <span className="truncate text-xs text-text-secondary">{p.teamName}</span>
                    <span className="tabular-nums text-sm">{p.gamesPlayed}</span>
                    <span className="tabular-nums text-sm font-bold">{p.points}</span>
                    <span className="tabular-nums text-sm">{p.rebounds}</span>
                    <span className="tabular-nums text-sm">{p.assists}</span>
                    <span className="tabular-nums text-sm">{p.steals}</span>
                    <span className="tabular-nums text-sm">{p.blocks}</span>
                    <span className="tabular-nums text-sm">{p.fouls}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
