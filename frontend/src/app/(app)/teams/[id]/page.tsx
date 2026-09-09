"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManage } from "@/lib/permissions";
import { getTeamColor } from "@/lib/team-color";
import type { Player, TeamDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: team, isLoading, error, refetch } = useApi<TeamDetail>(`/teams/${id}`);

  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddPlayer(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<Player>(`/teams/${id}/players`, {
        method: "POST",
        body: JSON.stringify({ name, jerseyNumber: Number(jersey), position: position || undefined }),
      });
      setName("");
      setJersey("");
      setPosition("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemovePlayer(playerId: string) {
    await apiFetch(`/players/${playerId}`, { method: "DELETE" });
    refetch();
  }

  if (isLoading) return <p className="text-sm text-text-tertiary">Loading…</p>;
  if (error || !team) return <p className="text-sm text-status-live">{error ?? "Team not found"}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-accent-ink"
          style={{ background: getTeamColor(team.id) }}
        >
          {team.name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">{team.name}</h1>
          <p className="text-sm text-text-secondary">
            {team.category ?? "No category"}
            {team.coachName ? ` · Coach ${team.coachName}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Roster ({team.players.length})</h2>
          <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
            {team.players.length === 0 ? (
              <p className="p-4 text-sm text-text-tertiary">No players yet.</p>
            ) : (
              team.players
                .slice()
                .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
                  >
                    <span className="tabular-nums w-7 font-display text-base font-extrabold text-text-tertiary">
                      {p.jerseyNumber}
                    </span>
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-xs text-text-tertiary">
                      {p.position ? p.position.charAt(0) + p.position.slice(1).toLowerCase() : ""}
                    </span>
                    {canManage(user) && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="cursor-pointer text-text-tertiary transition hover:text-status-live"
                        title="Remove player"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {canManage(user) && (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold">Add Player</h2>
            <form onSubmit={handleAddPlayer} className="flex flex-col gap-3 rounded-md border border-surface-border bg-bg-elevated p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary" htmlFor="playerName">
                  Name
                </label>
                <Input
                  id="playerName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Perez"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="jersey">
                    Jersey #
                  </label>
                  <Input
                    id="jersey"
                    type="number"
                    min={0}
                    max={99}
                    required
                    value={jersey}
                    onChange={(e) => setJersey(e.target.value)}
                    placeholder="23"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="position">
                    Position
                  </label>
                  <Select id="position" value={position} onChange={(e) => setPosition(e.target.value)}>
                    <option value="">—</option>
                    <option value="GUARD">Guard</option>
                    <option value="FORWARD">Forward</option>
                    <option value="CENTER">Center</option>
                  </Select>
                </div>
              </div>
              {formError && <p className="text-xs text-status-live">{formError}</p>}
              <Button type="submit" disabled={isSubmitting} className="justify-center">
                {isSubmitting ? "Adding…" : "Add Player"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
