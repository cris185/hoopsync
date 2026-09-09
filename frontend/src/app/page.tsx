import Link from "next/link";
import { Camera, Code2, Radio, Server, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getTeamColor } from "@/lib/team-color";

const REPO_URL = "https://github.com/cris185/hoopsync";

const FEATURES = [
  {
    icon: Trophy,
    title: "Every tournament format",
    body: "Round robin, home & away, single elimination, and Bo3/Bo5/Bo7 playoff series — schedules and brackets generated automatically.",
  },
  {
    icon: Radio,
    title: "Live Match Center",
    body: "Every made shot, rebound and foul is recorded as an event. Stats are derived, not typed in — and mistakes recalculate cleanly.",
  },
  {
    icon: Camera,
    title: "Digitize paper scoresheets",
    body: "Photograph a physical scoresheet and let OpenCV + PaddleOCR extract it — always reviewed by a human before it becomes official data.",
  },
  {
    icon: Server,
    title: "Self-hosted, forever free",
    body: "Ships as Docker services. Runs on the VPS you already pay for. No OpenAI, no Claude, no Vision API — zero per-request AI costs.",
  },
];

const STANDINGS = [
  { pos: 1, team: "Lakers", w: 18, l: 4, pct: ".818" },
  { pos: 2, team: "Bulls", w: 15, l: 7, pct: ".682" },
  { pos: 3, team: "Celtics", w: 13, l: 9, pct: ".591" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-24 px-6 pb-24 md:px-12">
      {/* Nav */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-2.5">
          <Logo size={26} />
          <span className="font-display text-lg font-extrabold tracking-wide uppercase">HoopSync</span>
        </div>
        <div className="hidden items-center gap-8 sm:flex">
          <a href="#features" className="text-sm font-semibold text-text-secondary hover:text-text-primary">
            Features
          </a>
          <a href="#ocr" className="text-sm font-semibold text-text-secondary hover:text-text-primary">
            OCR Pipeline
          </a>
          <a href={REPO_URL} className="text-sm font-semibold text-text-secondary hover:text-text-primary">
            Self-Hosted
          </a>
        </div>
        <Link href="/register">
          <Button className="h-9.5 px-4 text-xs">Get Started</Button>
        </Link>
      </div>

      {/* Hero */}
      <div className="relative grid grid-cols-1 items-center gap-12 overflow-visible md:grid-cols-2">
        <div
          className="pointer-events-none absolute -top-40 -left-20 h-[560px] w-[560px] rounded-full opacity-15 blur-md"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 68%)" }}
        />
        <div className="relative flex flex-col gap-6">
          <span className="corner-cut-sm inline-flex w-fit items-center gap-[7px] bg-status-live-bg py-1.5 pr-3.5 pl-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-status-live" />
            <span className="font-display text-[11px] font-bold tracking-wide text-status-live uppercase">
              Free &amp; Open Source
            </span>
          </span>
          <h1 className="font-display text-[42px] leading-[1.03] font-black tracking-wide uppercase sm:text-[50px]">
            Run the whole season. Own the whole stack.
          </h1>
          <p className="max-w-[480px] text-base leading-relaxed text-text-secondary">
            HoopSync manages tournaments end-to-end — scheduling, live scoring, standings, and playoffs —
            plus a self-hosted OCR pipeline that digitizes paper scoresheets. No subscriptions. No paid AI
            APIs. Just Docker and your own server.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3.5">
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="gap-2">
                <Code2 size={15} />
                View Source
              </Button>
            </a>
          </div>
          <span className="text-xs text-text-tertiary">{REPO_URL.replace("https://", "")} · MIT licensed</span>
        </div>

        <div className="relative flex justify-center">
          <div className="flex w-[340px] -rotate-2 flex-col gap-3.5">
            <div className="flex h-8 overflow-hidden rounded-md bg-bg-elevated shadow-2xl">
              <div className="corner-cut-sm flex items-center bg-accent pr-4.5 pl-3">
                <span className="font-display text-[11px] font-extrabold tracking-wide text-accent-ink uppercase">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2 px-3.5 text-xs">
                <span className="font-display font-bold tracking-wide uppercase">Lakers @ Bulls</span>
                <span className="h-3 w-px bg-white/15" />
                <span className="tabular-nums text-text-secondary">Q4 · 03:24</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg bg-bg-elevated shadow-2xl">
              <div
                className="absolute inset-0 opacity-100"
                style={{
                  background: `linear-gradient(115deg, color-mix(in oklch, ${getTeamColor("lakers")} 22%, transparent) 0%, transparent 42%, color-mix(in oklch, ${getTeamColor("bulls")} 20%, transparent) 100%)`,
                }}
              />
              <div className="relative flex flex-col gap-1.5 p-5">
                <div className="flex items-center justify-between py-1.5">
                  <span
                    className="mr-2.5 h-8 w-1 rounded-sm"
                    style={{ background: getTeamColor("lakers") }}
                  />
                  <span className="flex-1 font-display text-base font-extrabold tracking-wide uppercase">
                    Lakers
                  </span>
                  <span className="tabular-nums font-display text-3xl font-extrabold">54</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="mr-2.5 h-8 w-1 rounded-sm" style={{ background: getTeamColor("bulls") }} />
                  <span className="flex-1 font-display text-base font-extrabold tracking-wide uppercase">
                    Bulls
                  </span>
                  <span className="tabular-nums font-display text-3xl font-extrabold">48</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-surface-border bg-bg-elevated p-3.5 shadow-2xl">
                <div className="tabular-nums font-display text-2xl font-extrabold">24.5</div>
                <div className="text-[11px] text-text-tertiary">Points / game</div>
              </div>
              <div className="rounded-md border border-surface-border bg-bg-elevated p-3.5 shadow-2xl">
                <div className="tabular-nums font-display text-2xl font-extrabold">8.2</div>
                <div className="text-[11px] text-text-tertiary">Rebounds / game</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="flex flex-col gap-8">
        <div className="flex max-w-[560px] flex-col gap-2">
          <span className="font-display text-xs font-bold tracking-wide text-accent-400 uppercase">
            Why HoopSync
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-wide uppercase">
            Everything a real competition needs
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3.5 rounded-lg border border-surface-border bg-bg-elevated p-[22px] transition hover:border-accent-400"
            >
              <span className="flex h-9.5 w-9.5 items-center justify-center rounded-md bg-surface-tint-strong text-accent-400">
                <Icon size={19} />
              </span>
              <h4 className="font-display text-[17px] font-bold">{title}</h4>
              <p className="text-[13px] leading-relaxed text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Showcase */}
      <div id="ocr" className="relative overflow-hidden rounded-lg border border-surface-border bg-bg-elevated p-11">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(120deg, color-mix(in oklch, var(--accent) 10%, transparent) 0%, transparent 55%)" }}
        />
        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col gap-4">
            <span className="font-display text-xs font-bold tracking-wide text-accent-400 uppercase">
              Built like a real ops platform
            </span>
            <h2 className="font-display text-[28px] leading-[1.15] font-extrabold tracking-wide uppercase">
              Standings, brackets and box scores — not a spreadsheet with a login page.
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Dense, tabular standings. Role-based access for organizers, scorekeepers and spectators.
              Everything an actual league needs to run a season, self-hosted on infrastructure you control.
            </p>
          </div>
          <div className="flex flex-col overflow-hidden rounded-md border border-surface-border bg-bg-base">
            <div className="grid grid-cols-[30px_1fr_36px_36px_52px] gap-2 bg-surface-tint px-4 py-2.5">
              {["POS", "TEAM", "W", "L", "PCT"].map((h) => (
                <span key={h} className="text-[10px] font-bold tracking-wide text-text-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {STANDINGS.map((row, i) => (
              <div
                key={row.team}
                className="grid grid-cols-[30px_1fr_36px_36px_52px] items-center gap-2 px-4 py-3"
                style={i % 2 === 0 ? undefined : { background: "oklch(1 0 0 / 2%)" }}
              >
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-xs font-display text-[11px] font-extrabold " +
                    (row.pos === 1 ? "bg-accent text-accent-ink" : "bg-surface-tint-strong text-text-secondary")
                  }
                >
                  {row.pos}
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-3.5 w-1 rounded-xs" style={{ background: getTeamColor(row.team) }} />
                  {row.team}
                </span>
                <span className="tabular-nums text-right text-sm text-text-secondary">{row.w}</span>
                <span className="tabular-nums text-right text-sm text-text-secondary">{row.l}</span>
                <span className="tabular-nums text-right text-sm font-bold">{row.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="font-display text-xs font-bold tracking-wide text-text-tertiary uppercase">
          Built with
        </span>
        <div className="flex flex-wrap justify-center gap-7">
          {["Next.js", "NestJS", "PostgreSQL", "Python", "PaddleOCR", "Docker"].map((tech) => (
            <span key={tech} className="font-display text-[15px] font-bold text-text-secondary">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="flex flex-col items-center gap-5 border-y border-surface-border py-12 text-center">
        <h2 className="max-w-[620px] font-display text-[34px] font-extrabold tracking-wide uppercase">
          Your league. Your server. Your rules.
        </h2>
        <p className="max-w-[480px] text-sm text-text-secondary">
          Deploy HoopSync with Docker Compose and run your first tournament today.
        </p>
        <Link href="/register">
          <Button>Get Started</Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo size={18} />
          <span className="text-xs text-text-tertiary">HoopSync — an open-source project</span>
        </div>
        <a href={REPO_URL} className="text-xs text-text-tertiary hover:text-accent-400">
          {REPO_URL.replace("https://", "")} · MIT License
        </a>
      </div>
    </div>
  );
}
