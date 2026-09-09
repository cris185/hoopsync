import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  icon,
  value,
  label,
  trend,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  trend?: { direction: "up" | "down"; value: string };
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-bg-elevated p-[22px]">
      <div className="flex items-center justify-between">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-surface-tint-strong text-accent-400">
          {icon}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-bold",
              trend.direction === "up" ? "text-status-finished" : "text-status-live",
            )}
          >
            {trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <div className="tabular-nums font-display text-[38px] leading-none font-extrabold">{value}</div>
        <div className="mt-1.5 text-[13px] text-text-secondary">{label}</div>
      </div>
    </div>
  );
}
