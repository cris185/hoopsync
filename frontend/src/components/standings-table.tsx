import { getTeamColor } from "@/lib/team-color";
import type { Standing } from "@/lib/types";

export function StandingsTable({ standings }: { standings: Standing[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-text-tertiary">No standings yet — register teams to get started.</p>;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-surface-border">
      <div className="grid grid-cols-[30px_1fr_36px_36px_52px] gap-2 bg-surface-tint px-3.5 py-2.5">
        {["POS", "TEAM", "W", "L", "PCT"].map((h) => (
          <span key={h} className="text-[10px] font-bold tracking-wide text-text-tertiary">
            {h}
          </span>
        ))}
      </div>
      {standings.map((row, i) => {
        const pct = row.gamesPlayed > 0 ? (row.wins / row.gamesPlayed).toFixed(3).replace(/^0/, "") : ".000";
        return (
          <div
            key={row.id}
            className="grid grid-cols-[30px_1fr_36px_36px_52px] items-center gap-2 px-3.5 py-2.5"
            style={i % 2 === 0 ? { background: "oklch(1 0 0 / 2%)" } : undefined}
          >
            <span
              className={
                "flex h-5 w-5 items-center justify-center rounded-xs font-display text-[11px] font-extrabold " +
                (i === 0 ? "bg-accent text-accent-ink" : "bg-surface-tint-strong text-text-secondary")
              }
            >
              {i + 1}
            </span>
            <span className="flex items-center gap-2 truncate text-sm font-semibold">
              <span
                className="h-3.5 w-1 shrink-0 rounded-xs"
                style={{ background: getTeamColor(row.teamId) }}
              />
              <span className="truncate">{row.team.name}</span>
            </span>
            <span className="tabular-nums text-right text-sm text-text-secondary">{row.wins}</span>
            <span className="tabular-nums text-right text-sm text-text-secondary">{row.losses}</span>
            <span className="tabular-nums text-right text-sm font-bold">{pct}</span>
          </div>
        );
      })}
    </div>
  );
}
