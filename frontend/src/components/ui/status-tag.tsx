import { cn } from "@/lib/utils";

export type MatchStatus = "LIVE" | "SCHEDULED" | "FINISHED" | "PAUSED" | "CANCELLED";

const STATUS_STYLES: Record<MatchStatus, { bg: string; text: string; dot: string; pulse?: boolean }> = {
  LIVE: { bg: "bg-status-live-bg", text: "text-status-live", dot: "bg-status-live", pulse: true },
  SCHEDULED: { bg: "bg-status-scheduled-bg", text: "text-status-scheduled", dot: "bg-status-scheduled" },
  FINISHED: { bg: "bg-status-finished-bg", text: "text-status-finished", dot: "bg-status-finished" },
  PAUSED: { bg: "bg-status-paused-bg", text: "text-status-paused", dot: "bg-status-paused" },
  CANCELLED: { bg: "bg-status-cancelled-bg", text: "text-status-cancelled", dot: "bg-status-cancelled" },
};

export function StatusTag({ status, className }: { status: MatchStatus; className?: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "corner-cut-sm inline-flex w-fit items-center gap-[7px] py-1.5 pr-3.5 pl-2.5",
        style.bg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot, style.pulse && "animate-pulse-live")} />
      <span className={cn("font-display text-xs font-bold tracking-wide uppercase", style.text)}>
        {status}
      </span>
    </span>
  );
}
