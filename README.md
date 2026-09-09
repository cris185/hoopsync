# HoopSync

A free, self-hosted basketball tournament management platform — built as a portfolio project to demonstrate full-stack architecture, event-sourced match tracking, and a completely free/self-hosted OCR pipeline for digitizing physical basketball score sheets.

No paid AI APIs anywhere in this stack. The only expected cost is the VPS it runs on.

## What it does

- Create tournaments (round robin, home & away, or single elimination), register teams and players.
- Schedule matches and score them live from a broadcast-style Match Center: point-by-point event recording (2PT/3PT/FT, rebounds, assists, steals, blocks, fouls, substitutions), with a full correction timeline (soft-delete, never destroys the audit trail).
- Standings and box scores are always a full recompute from the match-event log — never hand-edited, never left stale after a correction.
- Playoff brackets: rounds, best-of-N series, and games that link straight into the Match Center.
- Upload a photo (or PDF) of a physical paper score sheet and let a self-hosted OCR pipeline (OpenCV + PaddleOCR) read it — jersey number and fuzzy name matching against the actual team roster, never trusting raw OCR text as fact. A PDF's first page is rendered to an image before anything else touches it. Every result is reviewed and corrected by a human before it's validated; nothing is auto-applied to the official record.
- Optional team logo, coach photo and player photo uploads, backed by self-hosted MinIO — no third-party storage.

## Architecture

A monorepo with three independently-deployable services, orchestrated with Docker Compose:

```
hoopsync/
├── backend/       NestJS + Prisma + PostgreSQL — REST API, auth, tournaments/matches/statistics
├── ocr-service/    Python + FastAPI + OpenCV + PaddleOCR — score sheet digitization
├── frontend/       Next.js (App Router) + Tailwind — the web app
└── docker-compose.yml
```

**Backend** — NestJS modules per domain (auth, teams, players, tournaments, matches, statistics, standings, playoffs, score-sheets), Prisma/PostgreSQL. Match statistics, team statistics and standings are derived caches: every mutation (a new event, a correction, a match finishing) triggers a full recompute from the non-deleted event log, so corrections can never leave stale numbers behind. Role-based access (Admin/Organizer/Scorekeeper/Spectator) plus ownership checks (only a tournament's creator, an admin, or an assigned official can score its matches).

**OCR service** — a roster-matching strategy rather than a general handwriting reader: jersey number is the primary key (a misread digit is far less likely than a misread name), with fuzzy name matching as a fallback signal, and anything that can't be resolved with confidence is flagged `NEEDS_REVIEW` for a human. Runs entirely on CPU, no external API calls.

**Frontend** — Next.js App Router, client-side auth (JWT in localStorage), a design system built around a broadcast/sports-network look (Tailwind v4, oklch colors, a repeated diagonal "corner-cut" motif).

## Running it locally

Requires Docker and Docker Compose.

```bash
git clone https://github.com/cris185/hoopsync.git
cd hoopsync
docker compose up -d --build
```

| Service      | URL                             |
|--------------|----------------------------------|
| Frontend     | http://localhost:3010           |
| Backend API  | http://localhost:4000           |
| Postgres     | localhost:5433                  |
| MinIO console| http://localhost:9001 (hoopsync / hoopsync123) |

The OCR service isn't exposed on a host port on purpose — only the backend talks to it, over the internal Docker network.

First run: register an account (Organizer role) from the frontend, then create a tournament, register teams, add players, and schedule a match to get started.

## Deploying it for real

`docker compose up` works with zero configuration for local dev — every secret has a dev-only default baked in. A real deployment should override three variables in its environment (e.g. your platform's env var settings, or a `.env` file next to `docker-compose.yml`) rather than editing the compose file itself:

| Variable               | Purpose                                                         |
|-------------------------|------------------------------------------------------------------|
| `POSTGRES_PASSWORD`    | Real database password (never the `hoopsync` dev default).      |
| `JWT_SECRET`           | Real auth signing secret (never `dev-only-change-me`).          |
| `NEXT_PUBLIC_API_URL`  | The backend's public URL, baked into the frontend at build time.|
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Real MinIO credentials (never the dev defaults). |
| `MINIO_PUBLIC_URL`     | The URL browsers use to load uploaded photos — MinIO's own public URL, not `MINIO_ENDPOINT` (which is only the backend's internal route to it). |

Postgres is bound to `127.0.0.1` only in the compose file — it's never meant to be reachable from outside the host it runs on. MinIO's S3 API is published because uploaded photos need to be directly loadable by the browser; its admin console is bound to `127.0.0.1` only.

## Notable design decisions

- **Event sourcing for match state.** `MatchEvent` is the single source of truth; `PlayerMatchStatistics`, `TeamMatchStatistics` and `Standing` are always fully recomputed from it, never patched incrementally. A scorekeeper's mistake never corrupts the record — corrections soft-delete the bad event and everything downstream recalculates from the remaining ones.
- **OCR results are never authoritative.** Validating a score sheet locks in the reviewed fields as the confirmed record — it deliberately does not auto-generate match events or overwrite the score. The human-in-the-loop review is the point, not a fallback.
- **No paid APIs.** OCR runs on self-hosted PaddleOCR; everything else is plain application logic.

## Tech stack

Next.js 16 · TypeScript · Tailwind CSS v4 · NestJS · Prisma · PostgreSQL · Python · FastAPI · OpenCV · PaddleOCR · MinIO · Docker
