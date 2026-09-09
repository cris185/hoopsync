"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { Tournament, TournamentFormat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("ROUND_ROBIN");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const tournament = await apiFetch<Tournament>("/tournaments", {
        method: "POST",
        body: JSON.stringify({
          name,
          format,
          location: location || undefined,
          description: description || undefined,
        }),
      });
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">New Tournament</h1>
        <p className="text-sm text-text-secondary">
          You can register teams and schedule matches once it&apos;s created.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="name">
            Name
          </label>
          <Input
            id="name"
            required
            minLength={3}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Regional Championship"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="format">
            Format
          </label>
          <Select id="format" value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)}>
            <option value="ROUND_ROBIN">Round Robin</option>
            <option value="HOME_AWAY">Home &amp; Away</option>
            <option value="SINGLE_ELIMINATION">Single Elimination</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="location">
            Location (optional)
          </label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Downtown Arena" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="description">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-surface-border bg-bg-sunken px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-400 focus:ring-3 focus:ring-accent/25 focus:outline-none"
            placeholder="A short summary of this competition"
          />
        </div>
        {error && <p className="text-xs text-status-live">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Creating…" : "Create Tournament"}
        </Button>
      </form>
    </div>
  );
}
