"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { canManage } from "@/lib/permissions";
import { getTeamColor } from "@/lib/team-color";
import { POSITION_LABEL } from "@/lib/format";
import type { Player, PlayerPosition, TeamDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";

const POSITION_OPTIONS: PlayerPosition[] = [
  "POINT_GUARD",
  "SHOOTING_GUARD",
  "SMALL_FORWARD",
  "POWER_FORWARD",
  "CENTER",
];

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: team, isLoading, error, refetch } = useApi<TeamDetail>(`/teams/${id}`);

  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coachPhotoUrl, setCoachPhotoUrl] = useState<string | null>(null);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setLogoUrl(team.logoUrl);
      setCoachPhotoUrl(team.coachPhotoUrl);
    }
  }, [team?.id]);

  async function handleAddPlayer(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<Player>(`/teams/${id}/players`, {
        method: "POST",
        body: JSON.stringify({
          name,
          jerseyNumber: Number(jersey),
          position: position || undefined,
          photoUrl: photoUrl || undefined,
        }),
      });
      setName("");
      setJersey("");
      setPosition("");
      setPhotoUrl(null);
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

  async function handleSavePhotos(event: FormEvent) {
    event.preventDefault();
    setPhotosError(null);
    setIsSavingPhotos(true);
    try {
      await apiFetch(`/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ logoUrl, coachPhotoUrl }),
      });
      setIsEditingPhotos(false);
      refetch();
    } catch (err) {
      setPhotosError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSavingPhotos(false);
    }
  }

  if (isLoading) return <p className="text-sm text-text-tertiary">Loading…</p>;
  if (error || !team) return <p className="text-sm text-status-live">{error ?? "Team not found"}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-14 w-14 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-accent-ink"
              style={{ background: getTeamColor(team.id) }}
            >
              {team.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">{team.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-text-secondary">
              {team.category ?? "No category"}
              {team.coachName && (
                <span className="flex items-center gap-1.5">
                  · Coach {team.coachName}
                  {team.coachPhotoUrl && (
                    <img src={team.coachPhotoUrl} alt={team.coachName} className="h-5 w-5 rounded-full object-cover" />
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        {canManage(user) && !isEditingPhotos && (
          <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setIsEditingPhotos(true)}>
            Edit Photos
          </Button>
        )}
      </div>

      {isEditingPhotos && (
        <form
          onSubmit={handleSavePhotos}
          className="flex flex-wrap items-end gap-6 rounded-md border border-surface-border bg-bg-elevated p-4"
        >
          <PhotoUpload kind="team-logo" label="Team Logo" value={logoUrl} onChange={setLogoUrl} />
          <PhotoUpload kind="coach-photo" label="Coach Photo" value={coachPhotoUrl} onChange={setCoachPhotoUrl} shape="circle" />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" disabled={isSavingPhotos} className="h-9 px-3 text-xs">
              {isSavingPhotos ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 text-xs"
              onClick={() => {
                setIsEditingPhotos(false);
                setLogoUrl(team.logoUrl);
                setCoachPhotoUrl(team.coachPhotoUrl);
              }}
            >
              Cancel
            </Button>
          </div>
          {photosError && <p className="w-full text-xs text-status-live">{photosError}</p>}
        </form>
      )}

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
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="h-8 w-8 shrink-0 rounded-full bg-surface-tint-strong" />
                    )}
                    <span className="tabular-nums w-7 font-display text-base font-extrabold text-text-tertiary">
                      {p.jerseyNumber}
                    </span>
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-xs text-text-tertiary">{p.position ? POSITION_LABEL[p.position] : ""}</span>
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
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {POSITION_LABEL[pos]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <PhotoUpload kind="player-photo" label="Player Photo" value={photoUrl} onChange={setPhotoUrl} shape="circle" />
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
