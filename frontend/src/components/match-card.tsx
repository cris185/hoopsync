import { StatusTag } from "@/components/ui/status-tag";
import { formatClock } from "@/lib/format";
import { getTeamColor } from "@/lib/team-color";
import type { Match } from "@/lib/types";

export function MatchCard({ match, eyebrow }: { match: Match; eyebrow?: string }) {
  const isLive = match.status === "LIVE" || match.status === "PAUSED";
  return (
    <div className="relative overflow-hidden rounded-lg bg-bg-elevated">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(115deg, color-mix(in oklch, ${getTeamColor(match.homeTeamId)} 20%, transparent) 0%, transparent 45%, color-mix(in oklch, ${getTeamColor(match.awayTeamId)} 18%, transparent) 100%)`,
        }}
      />
      <div className="relative flex flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold tracking-wide text-text-tertiary uppercase">
            {eyebrow ?? "Match"}
          </span>
          <StatusTag status={match.status} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-display text-[15px] font-bold tracking-wide uppercase">
            {match.homeTeam.name}
          </span>
          <span className="tabular-nums font-display text-2xl font-extrabold">{match.homeScore}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-display text-[15px] font-bold tracking-wide uppercase">
            {match.awayTeam.name}
          </span>
          <span className="tabular-nums font-display text-2xl font-extrabold">{match.awayScore}</span>
        </div>
        <span className="mt-1 text-[11px] text-text-tertiary">
          {isLive
            ? `Q${match.currentPeriod} · ${formatClock(match.clockSeconds)}`
            : match.scheduledAt
              ? new Date(match.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
              : "Date TBD"}
        </span>
      </div>
    </div>
  );
}
