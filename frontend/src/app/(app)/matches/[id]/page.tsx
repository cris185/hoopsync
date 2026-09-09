"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Undo2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManageTournament } from "@/lib/permissions";
import { formatClock } from "@/lib/format";
import { getTeamColor } from "@/lib/team-color";
import type {
  Match,
  MatchEvent,
  MatchEventType,
  MatchStatistics,
  MatchStatus,
  TeamDetail,
  Tournament,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { ScoreSheetPanel } from "@/components/score-sheet-panel";

const EVENT_TILES: { type: MatchEventType; label: string }[] = [
  { type: "THREE_POINT_MADE", label: "3PT Made" },
  { type: "THREE_POINT_MISSED", label: "3PT Miss" },
  { type: "TWO_POINT_MADE", label: "2PT Made" },
  { type: "TWO_POINT_MISSED", label: "2PT Miss" },
  { type: "FREE_THROW_MADE", label: "FT Made" },
  { type: "FREE_THROW_MISSED", label: "FT Miss" },
  { type: "REBOUND_OFFENSIVE", label: "Off. Rebound" },
  { type: "REBOUND_DEFENSIVE", label: "Def. Rebound" },
  { type: "ASSIST", label: "Assist" },
  { type: "STEAL", label: "Steal" },
  { type: "BLOCK", label: "Block" },
  { type: "FOUL", label: "Foul" },
];

const EVENT_LABEL: Record<MatchEventType, string> = Object.fromEntries(
  EVENT_TILES.map((t) => [t.type, t.label]),
) as Record<MatchEventType, string>;
EVENT_LABEL.SUBSTITUTION = "Substitution";

const BOX_SCORE_COLUMNS = [
  { key: "points", label: "PTS" },
  { key: "reboundsTotal", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "steals", label: "STL" },
  { key: "blocks", label: "BLK" },
  { key: "fouls", label: "PF" },
] as const;

export default function MatchCenterPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: match, isLoading: matchLoading, error: matchError, refetch: refetchMatch } = useApi<Match>(
    `/matches/${id}`,
  );
  const { data: tournament } = useApi<Tournament>(match ? `/tournaments/${match.tournamentId}` : null);
  const { data: homeRoster } = useApi<TeamDetail>(match ? `/teams/${match.homeTeamId}` : null);
  const { data: awayRoster } = useApi<TeamDetail>(match ? `/teams/${match.awayTeamId}` : null);
  const { data: events, refetch: refetchEvents } = useApi<MatchEvent[]>(`/matches/${id}/events`);
  const { data: stats, refetch: refetchStats } = useApi<MatchStatistics>(`/matches/${id}/statistics`);

  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [period, setPeriod] = useState(1);
  const [clockSeconds, setClockSeconds] = useState(600);
  const [subOutgoingId, setSubOutgoingId] = useState("");
  const [subIncomingId, setSubIncomingId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setPeriod(match.currentPeriod || 1);
      setClockSeconds(match.clockSeconds ?? 600);
    }
  }, [match?.id]);

  if (matchLoading) return <p className="text-sm text-text-tertiary">Loading…</p>;
  if (matchError || !match) return <p className="text-sm text-status-live">{matchError ?? "Match not found"}</p>;

  const canScore = tournament ? canManageTournament(user, tournament) : false;
  const activeTeamId = activeTeam === "home" ? match.homeTeamId : match.awayTeamId;
  const activeRoster = (activeTeam === "home" ? homeRoster : awayRoster)?.players ?? [];

  async function refreshAll() {
    await Promise.all([refetchMatch(), refetchEvents(), refetchStats()]);
  }

  async function recordEvent(eventType: MatchEventType, opts?: { playerId?: string; relatedPlayerId?: string }) {
    setActionError(null);
    setIsRecording(true);
    try {
      await apiFetch(`/matches/${id}/events`, {
        method: "POST",
        body: JSON.stringify({
          teamId: activeTeamId,
          playerId: opts?.playerId ?? selectedPlayerId ?? undefined,
          relatedPlayerId: opts?.relatedPlayerId,
          eventType,
          period,
          clockSeconds,
        }),
      });
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not record that event");
    } finally {
      setIsRecording(false);
    }
  }

  async function handleSubstitution() {
    if (!subIncomingId || !subOutgoingId || subIncomingId === subOutgoingId) return;
    await recordEvent("SUBSTITUTION", { playerId: subIncomingId, relatedPlayerId: subOutgoingId });
    setSubIncomingId("");
    setSubOutgoingId("");
  }

  async function handleDeleteEvent(eventId: string) {
    setActionError(null);
    try {
      await apiFetch(`/matches/${id}/events/${eventId}`, { method: "DELETE" });
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not undo that event");
    }
  }

  async function handleStatusChange(status: MatchStatus) {
    setActionError(null);
    setIsChangingStatus(true);
    try {
      await apiFetch(`/matches/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refetchMatch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update the match status");
    } finally {
      setIsChangingStatus(false);
    }
  }

  const homeStats = stats?.players.filter((p) => p.teamId === match.homeTeamId) ?? [];
  const awayStats = stats?.players.filter((p) => p.teamId === match.awayTeamId) ?? [];
  // Sorted by actual creation time (not game clock order) so "undo"
  // always targets the scorekeeper's last action, even when events
  // were logged out of period/clock order (e.g. a late correction).
  const timeline = events
    ? [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Scoreboard header */}
      <div className="relative overflow-hidden rounded-lg bg-bg-elevated">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(100deg, color-mix(in oklch, ${getTeamColor(match.homeTeamId)} 22%, transparent) 0%, transparent 50%, color-mix(in oklch, ${getTeamColor(match.awayTeamId)} 20%, transparent) 100%)`,
          }}
        />
        <div className="relative flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-text-tertiary uppercase">
              {tournament?.name ?? "Match"}
            </span>
            <StatusTag status={match.status} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <TeamScoreBlock name={match.homeTeam.name} score={match.homeScore} color={getTeamColor(match.homeTeamId)} />
            <div className="flex flex-col items-center gap-1 px-4">
              <span className="font-display text-xl font-extrabold text-text-tertiary">Q{period}</span>
              <span className="tabular-nums font-display text-2xl font-extrabold">{formatClock(clockSeconds)}</span>
            </div>
            <TeamScoreBlock
              name={match.awayTeam.name}
              score={match.awayScore}
              color={getTeamColor(match.awayTeamId)}
              align="right"
            />
          </div>

          {canScore && (
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4">
              {match.status === "SCHEDULED" && (
                <Button onClick={() => handleStatusChange("LIVE")} disabled={isChangingStatus} className="h-9 px-4 text-xs">
                  Start Match
                </Button>
              )}
              {match.status === "LIVE" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange("PAUSED")}
                    disabled={isChangingStatus}
                    className="h-9 px-4 text-xs"
                  >
                    Pause
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusChange("FINISHED")}
                    disabled={isChangingStatus}
                    className="h-9 px-4 text-xs"
                  >
                    Finish Match
                  </Button>
                </>
              )}
              {match.status === "PAUSED" && (
                <>
                  <Button onClick={() => handleStatusChange("LIVE")} disabled={isChangingStatus} className="h-9 px-4 text-xs">
                    Resume
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusChange("FINISHED")}
                    disabled={isChangingStatus}
                    className="h-9 px-4 text-xs"
                  >
                    Finish Match
                  </Button>
                </>
              )}

              <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  Period
                  <input
                    type="number"
                    min={1}
                    value={period}
                    onChange={(e) => setPeriod(Math.max(1, Number(e.target.value) || 1))}
                    className="h-8 w-14 rounded-sm border border-surface-border bg-bg-sunken px-2 text-center text-sm tabular-nums"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                  Clock (sec)
                  <input
                    type="number"
                    min={0}
                    value={clockSeconds}
                    onChange={(e) => setClockSeconds(Math.max(0, Number(e.target.value) || 0))}
                    className="h-8 w-20 rounded-sm border border-surface-border bg-bg-sunken px-2 text-center text-sm tabular-nums"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded-md border border-status-live/30 bg-status-live-bg px-4 py-3 text-sm text-status-live">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Scoring panel */}
        <div className="flex flex-col gap-4">
          {canScore && (match.status === "LIVE" || match.status === "PAUSED") ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTeam("home");
                    setSelectedPlayerId(null);
                  }}
                  className={`corner-cut-sm flex-1 py-2.5 text-center font-display text-xs font-bold tracking-wide uppercase transition ${
                    activeTeam === "home" ? "bg-accent text-accent-ink" : "bg-surface-tint-strong text-text-secondary"
                  }`}
                >
                  {match.homeTeam.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTeam("away");
                    setSelectedPlayerId(null);
                  }}
                  className={`corner-cut-sm flex-1 py-2.5 text-center font-display text-xs font-bold tracking-wide uppercase transition ${
                    activeTeam === "away" ? "bg-accent text-accent-ink" : "bg-surface-tint-strong text-text-secondary"
                  }`}
                >
                  {match.awayTeam.name}
                </button>
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-surface-border p-3.5">
                <span className="text-[11px] font-bold tracking-wide text-text-tertiary uppercase">
                  Select player on the ball
                </span>
                {activeRoster.length === 0 ? (
                  <p className="text-sm text-text-tertiary">This team has no players on its roster yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeRoster.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(p.id === selectedPlayerId ? null : p.id)}
                        className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition ${
                          selectedPlayerId === p.id
                            ? "border-accent-400 bg-accent/15 text-accent-400"
                            : "border-surface-border bg-bg-elevated text-text-secondary hover:border-accent-400/50"
                        }`}
                      >
                        <span className="tabular-nums font-display font-extrabold">#{p.jerseyNumber}</span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {EVENT_TILES.map((tile) => (
                  <button
                    key={tile.type}
                    type="button"
                    disabled={isRecording || !selectedPlayerId}
                    onClick={() => recordEvent(tile.type)}
                    className="corner-cut-sm bg-surface-tint-strong py-3.5 text-center font-display text-xs font-bold tracking-wide uppercase text-text-primary transition hover:bg-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-30"
                  >
                    {tile.label}
                  </button>
                ))}
              </div>
              {!selectedPlayerId && (
                <p className="text-xs text-text-tertiary">Select a player above to record a stat for them.</p>
              )}

              {activeRoster.length >= 2 && (
                <div className="flex flex-wrap items-end gap-2 rounded-md border border-surface-border p-3.5">
                  <span className="w-full text-[11px] font-bold tracking-wide text-text-tertiary uppercase">
                    Substitution
                  </span>
                  <select
                    value={subOutgoingId}
                    onChange={(e) => setSubOutgoingId(e.target.value)}
                    className="h-9 flex-1 rounded-sm border border-surface-border bg-bg-sunken px-2 text-xs"
                  >
                    <option value="">Coming out…</option>
                    {activeRoster.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber} {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={subIncomingId}
                    onChange={(e) => setSubIncomingId(e.target.value)}
                    className="h-9 flex-1 rounded-sm border border-surface-border bg-bg-sunken px-2 text-xs"
                  >
                    <option value="">Coming in…</option>
                    {activeRoster.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber} {p.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    disabled={isRecording || !subIncomingId || !subOutgoingId || subIncomingId === subOutgoingId}
                    onClick={handleSubstitution}
                  >
                    Sub
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="rounded-md border border-surface-border p-4 text-sm text-text-tertiary">
              {canScore
                ? "Start the match to begin recording events."
                : "You don't have permission to score this match."}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold">Box Score</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BoxScoreTable title={match.homeTeam.name} rows={homeStats} />
              <BoxScoreTable title={match.awayTeam.name} rows={awayStats} />
            </div>
          </div>
        </div>

        {/* Event timeline */}
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Event Timeline ({timeline.length})</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-text-tertiary">No events recorded yet.</p>
          ) : (
            <div className="flex max-h-[720px] flex-col gap-1.5 overflow-y-auto pr-1">
              {timeline.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-2.5 rounded-sm border border-surface-border bg-bg-elevated px-3 py-2.5"
                >
                  <span
                    className="h-6 w-1 shrink-0 rounded-xs"
                    style={{ background: getTeamColor(ev.teamId) }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{EVENT_LABEL[ev.eventType]}</span>
                    <span className="truncate text-xs text-text-tertiary">
                      {ev.eventType === "SUBSTITUTION"
                        ? `${ev.player?.name ?? "?"} in, ${ev.relatedPlayer?.name ?? "?"} out`
                        : ev.player
                          ? `#${ev.player.jerseyNumber} ${ev.player.name}`
                          : "Team event"}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-text-tertiary">
                    Q{ev.period} {formatClock(ev.clockSeconds)}
                  </span>
                  {canScore && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      title="Undo this event"
                      className="shrink-0 cursor-pointer text-text-tertiary transition hover:text-status-live"
                    >
                      <Undo2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {canScore && (
        <ScoreSheetPanel matchId={match.id} roster={[...(homeRoster?.players ?? []), ...(awayRoster?.players ?? [])]} />
      )}
    </div>
  );
}

function TeamScoreBlock({
  name,
  score,
  color,
  align = "left",
}: {
  name: string;
  score: number;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <span className="flex items-center gap-2 truncate font-display text-lg font-bold tracking-wide uppercase">
        {align === "left" && <span className="h-4 w-1.5 shrink-0 rounded-xs" style={{ background: color }} />}
        <span className="truncate">{name}</span>
        {align === "right" && <span className="h-4 w-1.5 shrink-0 rounded-xs" style={{ background: color }} />}
      </span>
      <span className="tabular-nums font-display text-5xl font-extrabold">{score}</span>
    </div>
  );
}

function BoxScoreTable({
  title,
  rows,
}: {
  title: string;
  rows: MatchStatistics["players"];
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
      <div className="bg-surface-tint px-3.5 py-2 text-xs font-bold tracking-wide uppercase">{title}</div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[1fr_repeat(6,32px)] gap-1 px-3.5 py-2">
          <span></span>
          {BOX_SCORE_COLUMNS.map((c) => (
            <span key={c.key} className="text-right text-[10px] font-bold text-text-tertiary">
              {c.label}
            </span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="px-3.5 pb-3 text-xs text-text-tertiary">No stats recorded yet.</p>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_repeat(6,32px)] items-center gap-1 px-3.5 py-1.5"
              style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
            >
              <span className="truncate text-xs">
                #{row.player.jerseyNumber} {row.player.name}
              </span>
              <span className="tabular-nums text-right text-xs font-semibold">{row.points}</span>
              <span className="tabular-nums text-right text-xs">{row.reboundsOffensive + row.reboundsDefensive}</span>
              <span className="tabular-nums text-right text-xs">{row.assists}</span>
              <span className="tabular-nums text-right text-xs">{row.steals}</span>
              <span className="tabular-nums text-right text-xs">{row.blocks}</span>
              <span className="tabular-nums text-right text-xs">{row.fouls}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
