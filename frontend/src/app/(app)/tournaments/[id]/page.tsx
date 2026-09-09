"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManageTournament } from "@/lib/permissions";
import { TOURNAMENT_FORMAT_LABEL } from "@/lib/format";
import { getTeamColor } from "@/lib/team-color";
import type { Match, Standing, Team, TournamentDetail, TournamentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusTag, TournamentStatusTag } from "@/components/ui/status-tag";
import { StandingsTable } from "@/components/standings-table";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: tournament, isLoading, error, refetch } = useApi<TournamentDetail>(`/tournaments/${id}`);
  const { data: standings } = useApi<Standing[]>(`/tournaments/${id}/standings`);
  const { data: matches } = useApi<Match[]>(`/tournaments/${id}/matches`);
  const { data: allTeams } = useApi<Team[]>("/teams");

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [status, setStatus] = useState<TournamentStatus | "">("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  async function handleRegisterTeam(event: FormEvent) {
    event.preventDefault();
    if (!selectedTeamId) return;
    setRegisterError(null);
    setIsRegistering(true);
    try {
      await apiFetch(`/tournaments/${id}/teams`, {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      setSelectedTeamId("");
      refetch();
    } catch (err) {
      setRegisterError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleWithdrawTeam(teamId: string) {
    await apiFetch(`/tournaments/${id}/teams/${teamId}`, { method: "DELETE" });
    refetch();
  }

  async function handleUpdateStatus(event: FormEvent) {
    event.preventDefault();
    if (!status) return;
    setStatusError(null);
    setIsSavingStatus(true);
    try {
      await apiFetch(`/tournaments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      refetch();
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSavingStatus(false);
    }
  }

  if (isLoading) return <p className="text-sm text-text-tertiary">Loading…</p>;
  if (error || !tournament) return <p className="text-sm text-status-live">{error ?? "Tournament not found"}</p>;

  const canManage = canManageTournament(user, tournament);
  const availableTeams = (allTeams ?? []).filter(
    (team) => !tournament.tournamentTeams.some((tt) => tt.teamId === team.id),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-lg flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-extrabold tracking-wide uppercase">{tournament.name}</h1>
          <p className="text-sm text-text-secondary">
            {TOURNAMENT_FORMAT_LABEL[tournament.format]}
            {tournament.location ? ` · ${tournament.location}` : ""}
          </p>
          {tournament.description && <p className="text-sm text-text-secondary">{tournament.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <TournamentStatusTag status={tournament.status} />
          {canManage && (
            <form onSubmit={handleUpdateStatus} className="flex items-center gap-2">
              <Select
                value={status || tournament.status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                className="h-9 w-40 text-xs"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Button type="submit" variant="secondary" disabled={isSavingStatus} className="h-9 px-3 text-xs">
                {isSavingStatus ? "Saving…" : "Update"}
              </Button>
            </form>
          )}
          {statusError && <p className="text-xs text-status-live">{statusError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Registered Teams ({tournament.tournamentTeams.length})</h2>
          <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
            {tournament.tournamentTeams.length === 0 ? (
              <p className="p-4 text-sm text-text-tertiary">No teams registered yet.</p>
            ) : (
              tournament.tournamentTeams.map((tt, i) => (
                <div
                  key={tt.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
                >
                  <span className="h-6 w-1 shrink-0 rounded-xs" style={{ background: getTeamColor(tt.teamId) }} />
                  <span className="flex-1 truncate text-sm font-semibold">{tt.team.name}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleWithdrawTeam(tt.teamId)}
                      className="cursor-pointer text-text-tertiary transition hover:text-status-live"
                      title="Withdraw team"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {canManage && availableTeams.length > 0 && (
            <form onSubmit={handleRegisterTeam} className="flex items-center gap-2">
              <Select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="flex-1">
                <option value="">Select a team…</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" disabled={isRegistering || !selectedTeamId}>
                {isRegistering ? "Adding…" : "Register"}
              </Button>
            </form>
          )}
          {registerError && <p className="text-xs text-status-live">{registerError}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Standings</h2>
          <StandingsTable standings={standings ?? []} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Matches ({matches?.length ?? 0})</h2>
        {!matches || matches.length === 0 ? (
          <p className="text-sm text-text-tertiary">No matches scheduled yet.</p>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
            {matches.map((m, i) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3"
                style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
              >
                <span className="flex-1 truncate text-sm">
                  <span className="font-semibold">{m.homeTeam.name}</span>
                  <span className="tabular-nums mx-2 text-text-tertiary">
                    {m.homeScore} – {m.awayScore}
                  </span>
                  <span className="font-semibold">{m.awayTeam.name}</span>
                </span>
                <span className="text-xs text-text-tertiary">
                  {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "Date TBD"}
                </span>
                <StatusTag status={m.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
