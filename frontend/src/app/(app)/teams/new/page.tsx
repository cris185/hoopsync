"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [coachName, setCoachName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const team = await apiFetch<Team>("/teams", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: category || undefined,
          coachName: coachName || undefined,
        }),
      });
      router.push(`/teams/${team.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">New Team</h1>
        <p className="text-sm text-text-secondary">Teams can be reused across multiple tournaments.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="name">
            Team Name
          </label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lakers" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="category">
            Category (optional)
          </label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Open, U18, ..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary" htmlFor="coach">
            Coach (optional)
          </label>
          <Input id="coach" value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Coach name" />
        </div>
        {error && <p className="text-xs text-status-live">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Creating…" : "Create Team"}
        </Button>
      </form>
    </div>
  );
}
