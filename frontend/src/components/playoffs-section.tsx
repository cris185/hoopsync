"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Trash2, Trophy } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { getTeamColor } from "@/lib/team-color";
import { cn } from "@/lib/utils";
import type { PlayoffRound, PlayoffSeries, TournamentTeam } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusTag } from "@/components/ui/status-tag";

const BEST_OF_OPTIONS = [1, 3, 5, 7];

const SERIES_STATUS_STYLES: Record<PlayoffSeries["status"], { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: "bg-status-scheduled-bg", text: "text-status-scheduled", label: "Scheduled" },
  IN_PROGRESS: { bg: "bg-status-live-bg", text: "text-status-live", label: "In Progress" },
  COMPLETED: { bg: "bg-status-finished-bg", text: "text-status-finished", label: "Completed" },
};

function SeriesStatusTag({ status }: { status: PlayoffSeries["status"] }) {
  const style = SERIES_STATUS_STYLES[status];
  return (
    <span className={cn("corner-cut-sm inline-flex w-fit items-center py-1 px-3", style.bg)}>
      <span className={cn("font-display text-[11px] font-bold tracking-wide uppercase", style.text)}>
        {style.label}
      </span>
    </span>
  );
}

export function PlayoffsSection({
  tournamentId,
  registeredTeams,
  canManage,
}: {
  tournamentId: string;
  registeredTeams: TournamentTeam[];
  canManage: boolean;
}) {
  const { data: rounds, refetch } = useApi<PlayoffRound[]>(`/tournaments/${tournamentId}/playoff-rounds`);

  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("1");
  const [roundBestOf, setRoundBestOf] = useState("3");
  const [roundError, setRoundError] = useState<string | null>(null);
  const [isCreatingRound, setIsCreatingRound] = useState(false);

  const [seriesFormRoundId, setSeriesFormRoundId] = useState<string | null>(null);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);

  const [gameFormSeriesId, setGameFormSeriesId] = useState<string | null>(null);
  const [gameHomeTeamId, setGameHomeTeamId] = useState("");
  const [gameScheduledAt, setGameScheduledAt] = useState("");
  const [gameVenue, setGameVenue] = useState("");
  const [gameError, setGameError] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  async function handleCreateRound(event: FormEvent) {
    event.preventDefault();
    if (!roundName.trim()) return;
    setRoundError(null);
    setIsCreatingRound(true);
    try {
      await apiFetch(`/tournaments/${tournamentId}/playoff-rounds`, {
        method: "POST",
        body: JSON.stringify({ name: roundName, order: Number(roundOrder), bestOf: Number(roundBestOf) }),
      });
      setRoundName("");
      setRoundOrder("1");
      setRoundBestOf("3");
      refetch();
    } catch (err) {
      setRoundError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsCreatingRound(false);
    }
  }

  async function handleRemoveRound(roundId: string) {
    await apiFetch(`/playoff-rounds/${roundId}`, { method: "DELETE" });
    refetch();
  }

  async function handleCreateSeries(event: FormEvent, roundId: string) {
    event.preventDefault();
    if (!teamAId || !teamBId || teamAId === teamBId) return;
    setSeriesError(null);
    setIsCreatingSeries(true);
    try {
      await apiFetch(`/playoff-rounds/${roundId}/series`, {
        method: "POST",
        body: JSON.stringify({ teamAId, teamBId }),
      });
      setSeriesFormRoundId(null);
      setTeamAId("");
      setTeamBId("");
      refetch();
    } catch (err) {
      setSeriesError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsCreatingSeries(false);
    }
  }

  async function handleCreateGame(event: FormEvent, seriesId: string) {
    event.preventDefault();
    if (!gameHomeTeamId) return;
    setGameError(null);
    setIsCreatingGame(true);
    try {
      await apiFetch(`/playoff-series/${seriesId}/games`, {
        method: "POST",
        body: JSON.stringify({
          homeTeamId: gameHomeTeamId,
          scheduledAt: gameScheduledAt ? new Date(gameScheduledAt).toISOString() : undefined,
          venue: gameVenue || undefined,
        }),
      });
      setGameFormSeriesId(null);
      setGameHomeTeamId("");
      setGameScheduledAt("");
      setGameVenue("");
      refetch();
    } catch (err) {
      setGameError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsCreatingGame(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold">Playoffs</h2>

      {(!rounds || rounds.length === 0) && !canManage && (
        <p className="text-sm text-text-tertiary">No playoff bracket has been set up for this tournament.</p>
      )}

      <div className="flex flex-col gap-4">
        {rounds?.map((round) => (
          <div key={round.id} className="flex flex-col gap-3 rounded-md border border-surface-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Trophy size={16} className="text-accent-400" />
                <span className="font-display text-base font-bold tracking-wide uppercase">{round.name}</span>
                <span className="text-xs text-text-tertiary">Best of {round.bestOf}</span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveRound(round.id)}
                  className="cursor-pointer text-text-tertiary transition hover:text-status-live"
                  title="Remove round"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {round.series.length === 0 ? (
                <p className="text-sm text-text-tertiary">No series scheduled in this round yet.</p>
              ) : (
                round.series.map((series) => (
                  <div key={series.id} className="flex flex-col gap-2.5 rounded-sm bg-surface-tint p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className="h-3.5 w-1 shrink-0 rounded-xs"
                          style={{ background: getTeamColor(series.teamAId) }}
                        />
                        <span
                          className={cn(
                            "font-semibold",
                            series.winnerTeamId === series.teamAId && "text-accent-400",
                          )}
                        >
                          {series.teamA.name}
                        </span>
                        <span className="tabular-nums font-display font-extrabold">{series.teamAWins}</span>
                        <span className="text-text-tertiary">–</span>
                        <span className="tabular-nums font-display font-extrabold">{series.teamBWins}</span>
                        <span
                          className={cn(
                            "font-semibold",
                            series.winnerTeamId === series.teamBId && "text-accent-400",
                          )}
                        >
                          {series.teamB.name}
                        </span>
                        <span
                          className="h-3.5 w-1 shrink-0 rounded-xs"
                          style={{ background: getTeamColor(series.teamBId) }}
                        />
                      </div>
                      <SeriesStatusTag status={series.status} />
                    </div>

                    {series.games.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {series.games.map((game) => (
                          <Link
                            key={game.id}
                            href={`/matches/${game.id}`}
                            className="flex items-center gap-3 rounded-xs px-2.5 py-1.5 text-xs transition hover:bg-white/5"
                          >
                            <span className="text-text-tertiary">Game {game.gameNumberInSeries}</span>
                            <span className="flex-1 truncate">
                              {series.teamA.name} {game.homeTeamId === series.teamAId ? game.homeScore : game.awayScore}
                              {" – "}
                              {game.homeTeamId === series.teamBId ? game.homeScore : game.awayScore}{" "}
                              {series.teamB.name}
                            </span>
                            <StatusTag status={game.status} />
                          </Link>
                        ))}
                      </div>
                    )}

                    {canManage && series.status !== "COMPLETED" && (
                      <>
                        {gameFormSeriesId === series.id ? (
                          <form
                            onSubmit={(e) => handleCreateGame(e, series.id)}
                            className="flex flex-wrap items-end gap-2"
                          >
                            <Select
                              value={gameHomeTeamId}
                              onChange={(e) => setGameHomeTeamId(e.target.value)}
                              className="h-9 min-w-32 flex-1 text-xs"
                            >
                              <option value="">Home team…</option>
                              <option value={series.teamAId}>{series.teamA.name}</option>
                              <option value={series.teamBId}>{series.teamB.name}</option>
                            </Select>
                            <Input
                              type="datetime-local"
                              value={gameScheduledAt}
                              onChange={(e) => setGameScheduledAt(e.target.value)}
                              className="h-9 min-w-40 flex-1 text-xs"
                            />
                            <Input
                              value={gameVenue}
                              onChange={(e) => setGameVenue(e.target.value)}
                              placeholder="Venue (optional)"
                              className="h-9 min-w-32 flex-1 text-xs"
                            />
                            <Button
                              type="submit"
                              variant="secondary"
                              disabled={isCreatingGame || !gameHomeTeamId}
                              className="h-9 px-3 text-xs"
                            >
                              {isCreatingGame ? "Adding…" : "Add Game"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-9 px-2 text-xs"
                              onClick={() => setGameFormSeriesId(null)}
                            >
                              Cancel
                            </Button>
                            {gameError && <p className="w-full text-xs text-status-live">{gameError}</p>}
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setGameFormSeriesId(series.id)}
                            className="w-fit cursor-pointer text-xs font-bold text-accent-400 hover:text-accent-300"
                          >
                            + Schedule Game
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {canManage && (
              <>
                {seriesFormRoundId === round.id ? (
                  <form onSubmit={(e) => handleCreateSeries(e, round.id)} className="flex flex-wrap items-end gap-2">
                    <Select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="h-9 min-w-32 flex-1 text-xs">
                      <option value="">Team A…</option>
                      {registeredTeams.map((tt) => (
                        <option key={tt.teamId} value={tt.teamId}>
                          {tt.team.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={teamBId}
                      onChange={(e) => setTeamBId(e.target.value)}
                      className="h-9 min-w-32 flex-1 text-xs"
                    >
                      <option value="">Team B…</option>
                      {registeredTeams
                        .filter((tt) => tt.teamId !== teamAId)
                        .map((tt) => (
                          <option key={tt.teamId} value={tt.teamId}>
                            {tt.team.name}
                          </option>
                        ))}
                    </Select>
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isCreatingSeries || !teamAId || !teamBId || teamAId === teamBId}
                      className="h-9 px-3 text-xs"
                    >
                      {isCreatingSeries ? "Adding…" : "Add Series"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-2 text-xs"
                      onClick={() => setSeriesFormRoundId(null)}
                    >
                      Cancel
                    </Button>
                    {seriesError && <p className="w-full text-xs text-status-live">{seriesError}</p>}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSeriesFormRoundId(round.id)}
                    className="w-fit cursor-pointer text-xs font-bold text-accent-400 hover:text-accent-300"
                  >
                    + Add Series
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={handleCreateRound} className="flex flex-wrap items-end gap-2 rounded-md border border-surface-border p-3.5">
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Round Name</label>
            <Input value={roundName} onChange={(e) => setRoundName(e.target.value)} placeholder="Semifinals" />
          </div>
          <div className="flex w-24 flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Order</label>
            <Input type="number" min={1} value={roundOrder} onChange={(e) => setRoundOrder(e.target.value)} />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Best Of</label>
            <Select value={roundBestOf} onChange={(e) => setRoundBestOf(e.target.value)}>
              {BEST_OF_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary" disabled={isCreatingRound || !roundName.trim()} className="h-11">
            {isCreatingRound ? "Creating…" : "Add Round"}
          </Button>
          {roundError && <p className="w-full text-xs text-status-live">{roundError}</p>}
        </form>
      )}
    </div>
  );
}
