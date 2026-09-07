# 🏀 Basketball Tournament Management Platform

## Project Overview

This project is a **free and open-source basketball tournament management platform** being developed primarily as a **portfolio project**.

The goal is to build a realistic, production-oriented application capable of managing basketball tournaments, teams, players, matches, standings, statistics, playoffs, and eventually digitizing physical basketball score sheets using a completely self-hosted OCR pipeline.

The project should be designed with **clean architecture, scalability, maintainability, and portfolio value** in mind.

This is not intended to be a simple CRUD application. The objective is to demonstrate skills in:

- Full-stack development
- Backend architecture
- Complex database modeling
- Tournament scheduling algorithms
- Real-time systems
- Event-driven match tracking
- Image processing
- OCR pipelines
- Dockerized services
- API design
- Human-in-the-loop validation

---

# 🎯 Main Goals

The platform should allow tournament organizers to:

- Create and manage basketball tournaments
- Register teams
- Register players
- Configure different tournament formats
- Automatically generate match schedules
- Manage matches and results
- Track player and team statistics
- Generate league standings
- Manage playoff brackets and series
- Record basketball match events
- Display live match information
- Digitize physical score sheets using OCR
- Validate and correct OCR results before saving them

The platform should remain completely usable without paid AI services or paid APIs.

---

# 💰 Cost Philosophy

This project is intended to run without recurring AI/API costs.

The only expected infrastructure cost should be the VPS where the application is deployed.

Therefore:

❌ Do not depend on paid AI APIs.

❌ Do not require OpenAI API.

❌ Do not require Claude API.

❌ Do not require Google Vision API.

❌ Do not require AWS Textract.

The OCR system must be:

✅ Open source

✅ Self-hosted

✅ Docker-compatible

✅ Free to run

The initial OCR stack should use:

- Python
- FastAPI
- OpenCV
- PaddleOCR
- TrOCR (`microsoft/trocr-base-handwritten`, via HuggingFace `transformers`) for handwritten name recognition
- rapidfuzz for fuzzy name-to-roster matching

All of the above are open-source, self-hosted, and free to run under normal CPU inference (no GPU required). See **🔬 Refined OCR Strategy** below for why this stack was chosen.

---

# 🏗️ Proposed Architecture

The system should use a service-oriented architecture.

```text
                         ┌─────────────────┐
                         │                 │
                         │   Next.js App   │
                         │                 │
                         └────────┬────────┘
                                  │
                                  │ HTTP / WebSocket
                                  ▼
                         ┌─────────────────┐
                         │                 │
                         │   NestJS API    │
                         │                 │
                         └───────┬─────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
          ┌────────────┐   ┌────────────┐  ┌─────────────┐
          │ PostgreSQL │   │ OCR Service│  │ WebSockets  │
          │            │   │  FastAPI   │  │ / Socket.IO │
          └────────────┘   └──────┬─────┘  └─────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                     OpenCV           PaddleOCR
```

---

# 🧱 Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS

Recommended additional tools:

- TanStack Query
- Zustand or another lightweight state manager
- React Hook Form
- Zod

---

## Backend

- NestJS
- TypeScript
- REST API
- WebSockets / Socket.IO

The backend should follow a modular architecture.

Example:

```text
src/
├── auth/
├── users/
├── tournaments/
├── teams/
├── players/
├── matches/
├── statistics/
├── standings/
├── playoffs/
├── score-sheets/
└── common/
```

---

## Database

- PostgreSQL
- Prisma ORM

The database should be carefully designed because tournament logic and basketball statistics are core features of the application.

---

## OCR Service

The OCR service should be completely independent from the NestJS backend.

Technology:

```text
Python
FastAPI
OpenCV
PaddleOCR
```

The NestJS API should communicate with the OCR service through HTTP.

Example:

```text
Next.js
    ↓
NestJS API
    ↓
Upload Score Sheet
    ↓
OCR FastAPI Service
    ↓
OpenCV Processing
    ↓
PaddleOCR
    ↓
Structured OCR Result
    ↓
NestJS
    ↓
Validation Interface
```

---

# 👤 User Roles

The application should initially support the following roles:

## Administrator

Can:

- Manage the entire platform
- Manage users
- Manage tournaments

---

## Tournament Organizer

Can:

- Create tournaments
- Configure tournament formats
- Register teams
- Manage schedules
- Manage matches
- View statistics

---

## Table Official / Scorekeeper

Can:

- Access assigned matches
- Register match events
- Update the scoreboard
- Manage match statistics
- Upload physical score sheets

---

## Spectator

Can:

- View tournaments
- View teams
- View standings
- View schedules
- View live matches
- View statistics

Spectators should not require access to administrative functionality.

---

# 🏆 Tournament Formats

The system should be designed to support multiple tournament formats.

The architecture should allow additional formats in the future.

---

## 1. League / Round Robin

Every team plays against every other team.

Example:

```text
Team A vs Team B
Team A vs Team C
Team B vs Team C
```

The system should automatically generate:

- Match schedule
- Matchdays
- Standings

Standings should calculate:

- Games played
- Wins
- Losses
- Points for
- Points against
- Point differential
- Tournament points

Tie-breaking rules should be configurable in the future.

---

## 2. Home and Away

Teams play against each other twice.

Example:

```text
Team A vs Team B
Team B vs Team A
```

The scheduling algorithm should automatically generate both matches.

---

## 3. Single Elimination

Example:

```text
Quarterfinals
       ↓
Semifinals
       ↓
Final
       ↓
Champion
```

The system should automatically advance winners.

---

## 4. Playoff Series

Support:

- Best of 3
- Best of 5
- Best of 7

Example:

```text
Lakers 3 - 2 Bulls

Lakers advance.
```

The system must automatically determine when a team has won the required number of games.

---

# 👥 Teams

Each team should contain:

```text
Team
├── Name
├── Logo
├── Coach
├── Category
└── Players
```

A team should be reusable across tournaments where appropriate.

---

# 🏀 Players

Each player should contain:

- Name
- Jersey number
- Position
- Optional profile image
- Team membership

Player statistics should be calculated from match data rather than manually maintained whenever possible.

---

# 📅 Match Management

Each match should contain:

```text
Match
├── Tournament
├── Home Team
├── Away Team
├── Date
├── Location
├── Status
├── Score
└── Match Events
```

Possible match statuses:

```text
SCHEDULED
LIVE
PAUSED
FINISHED
CANCELLED
```

---

# 🎮 Match Center

The Match Center is one of the most important features of the application.

It should allow a table official to record basketball events during a match.

Example interface:

```text
LAKERS 54 - 48 BULLS

4Q | 03:24
```

The user should be able to register:

- Free throws
- Two-point shots
- Three-point shots
- Rebounds
- Assists
- Steals
- Blocks
- Fouls
- Substitutions

---

# ⚡ Event-Based Architecture

Do not store only final statistics.

Instead, basketball actions should be represented as events.

Example:

```text
MatchEvent
```

Suggested fields:

```text
id
matchId
teamId
playerId
eventType
value
period
timestamp
createdAt
```

Possible event types:

```text
FREE_THROW_MADE
FREE_THROW_MISSED

TWO_POINT_MADE
TWO_POINT_MISSED

THREE_POINT_MADE
THREE_POINT_MISSED

REBOUND_OFFENSIVE
REBOUND_DEFENSIVE

ASSIST

STEAL

BLOCK

FOUL

SUBSTITUTION
```

Example:

```text
Player #23
THREE_POINT_MADE

Period: 4
Game Time: 03:24
```

The application should derive:

- Score
- Player statistics
- Team statistics

from recorded events.

---

# ↩️ Event History and Corrections

The Match Center should maintain an event timeline.

Example:

```text
4Q - 03:24
🏀 #23 made a three-point shot

4Q - 03:41
🤝 #7 recorded an assist

4Q - 04:02
✋ #12 committed a foul
```

The system should support correcting mistakes.

Possible approach:

- Delete an incorrect event
- Edit an incorrect event
- Recalculate affected statistics

The architecture should avoid permanently corrupting statistics when a scorekeeper makes a mistake.

---

# 📊 Statistics

Statistics should be generated from match events.

## Player Statistics

Track:

- Games played
- Points
- Rebounds
- Offensive rebounds
- Defensive rebounds
- Assists
- Steals
- Blocks
- Fouls

Potential future statistics:

- Field goal percentage
- Three-point percentage
- Free throw percentage

---

## Team Statistics

Track:

- Games played
- Wins
- Losses
- Points scored
- Points conceded
- Point differential

---

# 🏅 Rankings

The platform can provide leaderboards.

Examples:

```text
🏀 Top Scorers

1. Player A — 24.5 PPG
2. Player B — 21.8 PPG
3. Player C — 19.4 PPG
```

Other leaderboards:

- Most rebounds
- Most assists
- Most steals
- Most blocks

---

# 🔴 Real-Time Matches

Real-time functionality should be implemented after the core Match Center works correctly.

Technology:

```text
NestJS WebSockets
Socket.IO
```

When the scorekeeper records an event:

```text
Scorekeeper
      ↓
Match Event Created
      ↓
NestJS
      ↓
WebSocket Broadcast
      ↓
Spectators receive update
```

Example spectator page:

```text
🔴 LIVE

LAKERS 54 - 48 BULLS

4Q | 03:24

Latest Event:

#23 — Three-point shot
```

---

# 📸 OCR Score Sheet Digitization

This is an advanced portfolio feature.

The objective is to allow users to upload or photograph a physical basketball score sheet.

The system should attempt to extract data automatically.

Important:

**OCR results must never be automatically considered official data.**

All extracted information must be reviewed by a human before being saved.

---

# 🔄 OCR Pipeline

The pipeline should work as follows:

```text
Physical Score Sheet
        ↓
Photo Upload
        ↓
Document Detection
        ↓
Perspective Correction
        ↓
Image Enhancement
        ↓
Region Extraction
        ↓
OCR
        ↓
Structured Data
        ↓
Human Validation
        ↓
Official Match Data
```

---

# 🖼️ Image Preprocessing

OpenCV should be responsible for improving the image before OCR.

Potential operations:

- Document detection
- Perspective correction
- Rotation correction
- Grayscale conversion
- Contrast enhancement
- Noise reduction
- Thresholding

Example:

```text
Original Image
        ↓
Detect Document Edges
        ↓
Perspective Transform
        ↓
Improve Image Quality
        ↓
OCR
```

---

# 📄 Structured Score Sheet Strategy

The OCR system should initially prioritize **structured score sheets**.

Instead of trying to understand every possible basketball score sheet in the world, the platform should eventually provide a compatible score sheet template.

Example concept:

```text
┌─────────────────────────────────────┐
│ BASKETBALL TOURNAMENT SCORE SHEET   │
├─────────────────────────────────────┤
│ Player │ Number │ Points │ Fouls    │
├─────────────────────────────────────┤
│        │        │        │          │
├─────────────────────────────────────┤
│        │        │        │          │
└─────────────────────────────────────┘
```

Because the template structure is known, the system can identify specific regions.

Example:

```text
ROI 1 → Player Name

ROI 2 → Jersey Number

ROI 3 → Points

ROI 4 → Fouls
```

This approach should significantly improve reliability.

> **Note:** the ROI list above is illustrative. The authoritative field list — based on the actual official FIBA scoresheet (`FIBA-Official-Basketball-Score-Sheet1.pdf`, included in this repo) — is defined in **🔬 Refined OCR Strategy** below.

---

# 🤖 OCR Service

The OCR service should be implemented using:

```text
Python
FastAPI
OpenCV
PaddleOCR
```

The OCR service should expose an API.

Example:

```text
POST /process-score-sheet
```

Input:

```text
multipart/form-data

image: score-sheet.jpg
```

Example response:

```json
{
  "success": true,
  "data": {
    "homeTeam": { "name": "Lakers", "confidence": 0.91 },
    "awayTeam": { "name": "Bulls", "confidence": 0.88 },
    "quarterScores": [
      { "period": 1, "teamA": 22, "teamB": 18, "confidence": 0.94 },
      { "period": 2, "teamA": 19, "teamB": 25, "confidence": 0.90 }
    ],
    "finalScore": { "teamA": 54, "teamB": 48, "confidence": 0.95 },
    "players": [
      {
        "jerseyNumber": { "value": 23, "confidence": 0.97 },
        "rawName": "J. Perez",
        "matchedPlayerId": "player_abc123",
        "resolutionMethod": "FUZZY_ROSTER_MATCH",
        "nameConfidence": 0.61,
        "personalFoulsCount": 2,
        "needsReview": false
      }
    ],
    "teamFoulsByQuarter": [
      { "period": 1, "teamA": 3, "teamB": 2 }
    ],
    "timeoutsUsed": { "teamA": 1, "teamB": 2 }
  }
}
```

Note there is no `points`, `rebounds`, or `assists` field per player — the official FIBA scoresheet does not record those directly (see **🔬 Refined OCR Strategy** below for why). `resolutionMethod` and `matchedPlayerId` reflect that names are resolved against the team's registered roster rather than trusted as free OCR text.

The NestJS backend should store OCR results as pending data until human validation.

---

# ✏️ Human Validation Interface

After OCR processing, the frontend should display:

```text
OCR DETECTED DATA

Player: Juan Perez

Points:     [18]
Rebounds:   [7]
Assists:    [4]
Fouls:      [2]

[ Edit ]

[ Confirm and Save ]
```

The user must be able to:

- Correct player names
- Correct numbers
- Correct statistics
- Add missing data
- Remove incorrect data

Only after confirmation should the information be saved as official match data.

---

# 🧠 OCR Design Principles

The OCR system should follow this philosophy:

```text
OCR assists humans.

OCR does not replace humans.
```

The system should be designed for:

```text
Image
   ↓
Automated Extraction
   ↓
Confidence Evaluation
   ↓
Human Review
   ↓
Official Data
```

---

# 🔬 Refined OCR Strategy (Based on the Real FIBA Scoresheet)

This section refines the general OCR plan above using the actual **Official FIBA Basketball Scoresheet** (`FIBA-Official-Basketball-Score-Sheet1.pdf`, included in this repo) as the reference template, since the goal is for HoopSync's scoresheet to visually resemble a real official sheet rather than a custom-designed one.

## Key Finding: The Official Sheet Has No Points/Rebounds/Assists Columns

The real FIBA scoresheet only contains:

```text
Game metadata (teams, competition, date, referees, scorer, etc.)
Roster per team (License No. | Player Name | Jersey No. | substitution-in periods)
Personal fouls (5 boxes per player)
Team fouls per quarter (pre-printed boxes 1-4)
Timeouts used (checkboxes)
Score per quarter + Final Score (blank fields)
Running Score grid (pre-printed numbers 1-160, crossed off as the team scores,
                     with the scoring player's jersey number handwritten alongside)
```

Per-player **points** are not written anywhere directly — they only exist implicitly in the Running Score grid. Rebounds, assists, steals, and blocks do not exist on this sheet at all; those are tracked live through the event-based **Match Center**, not through paper digitization.

This directly shapes what OCR should promise to extract.

## Core Insight: Treat Name Recognition as Roster Matching, Not Free Handwriting OCR

Because players are already registered per team (with jersey numbers) before a tournament starts, the system already knows the closed set of possible names for any given row. This turns an open-vocabulary handwriting problem into a **closed-set matching problem**:

1. OCR reads the **jersey number** first — a single digit/two-digit value in a boxed cell, which is far more reliable than cursive names.
2. The number is looked up against that team's registered roster to identify the player directly.
3. The OCR'd name (e.g. `"J. Perez"`) is used only as a **secondary confirmation signal**, fuzzy-matched against the roster (via `rapidfuzz`) using an initial+surname pattern (`^[A-Z]\.?\s+(\w+)$` → compare surname) or `token_sort_ratio` for full names. This is what resolves abbreviated names like `"J. Perez"` → `Juan Perez` without needing the OCR itself to "understand" the abbreviation.
4. If the jersey number has low confidence **and** the name doesn't fuzzy-match anyone on the roster, the row is flagged `needsReview`. The validation UI must never ask the human to retype a name from scratch — it shows the cropped image plus a **dropdown of that team's actual registered players** to pick from (falling back to free text only for an unregistered walk-on/late addition).

## Mark Detection vs. Handwriting OCR

Several fields on the real sheet are not handwriting at all — they're pre-printed marks that get crossed out, which is a much simpler and more reliable computer-vision problem (ink-density thresholding on a fixed ROI, not character recognition):

```text
Team fouls per quarter   → pre-printed "1 2 3 4", detect which is crossed
Timeouts used             → checkboxes, detect filled vs empty
```

These should be implemented as simple OpenCV mark/blob detection, not fed through PaddleOCR/TrOCR at all.

## Field Tiering (MVP vs. Future Work)

To follow the project's own rule of not over-engineering the MVP, OCR fields are tiered by reliability and effort:

**Tier 1 — MVP, high reliability:**

```text
Team A / Team B names
Competition, date, game number
Score per quarter (Team A / Team B)
Final score
Roster: player name (roster-matched) + jersey number
Team fouls per quarter (mark detection)
Timeouts used (mark detection)
```

**Tier 2 — MVP, medium difficulty, still valuable:**

```text
Personal fouls per player (count of marks in the 5 foul boxes; reading the
period number inside each box is a further refinement, not required at first)
```

**Tier 3 — explicitly out of MVP scope, documented as future work:**

```text
Running Score grid parsing (crossed pre-printed numbers + handwritten
scorer's jersey number alongside each) — this is the only way to derive
per-player points from a paper sheet, but is a materially harder and
lower-reliability CV problem (dense marks, tiny handwritten digits,
resolution-dependent). Per-player points remain available through the
live Match Center; this tier is a possible future enhancement, not a
blocker for a solid v1.
"Player in" substitution columns
License numbers
```

## Image Capture Quality Gate

Since even the Tier 1/2 fields depend on decent photo quality, the upload flow should reject unusable images before they ever reach the OCR service:

- Blur detection via Laplacian variance (OpenCV) — reject and prompt for a retake if below threshold.
- Minimum resolution check.
- A lightweight client-side edge-detection overlay (OpenCV.js) to help the user align the sheet, similar to check-deposit apps.

This is essentially free (no ML cost) and prevents wasted OCR cycles on unusable photos.

## Confidence & Resolution Metadata

Every extracted field should carry:

```text
rawText / rawValue
confidence
resolutionMethod: EXACT_ROSTER_MATCH | FUZZY_ROSTER_MATCH | MARK_DETECTED | NEEDS_REVIEW
matchedPlayerId (nullable)
```

The validation UI should color-code fields accordingly (green = auto-confident and roster-matched, yellow = fuzzy-matched, please confirm, red = unresolved, must pick from roster or enter manually). This feeds directly into the existing **Human Validation Interface** — nothing OCR-derived is ever saved as official data without confirmation.

---

# 🗂️ Suggested Database Entities

Initial database model should consider:

```text
User

Tournament
TournamentFormat

Team
Player

TournamentTeam

Match
MatchEvent

PlayerMatchStatistics
TeamMatchStatistics

Standing

PlayoffRound
PlayoffSeries

ScoreSheet
OCRProcessingResult
OCRFieldResult
```

`OCRFieldResult` stores one row per extracted field (jersey number, name, quarter score, foul count, etc.) with `rawText`, `confidence`, `resolutionMethod`, `matchedPlayerId`, and `wasManuallyCorrected` — see **🔬 Refined OCR Strategy** above.

The exact Prisma schema should be carefully designed before implementation.

---

# 🚀 Development Roadmap

The project should be developed incrementally.

Do not attempt to build every feature at the same time.

---

## Phase 1 — Core Tournament Management

Implement:

- Authentication
- User roles
- Tournament creation
- Team registration
- Player registration
- Tournament-team relationships

---

## Phase 2 — Tournament Formats

Implement:

- Round robin
- Home and away
- Single elimination

Generate schedules automatically.

---

## Phase 3 — Standings

Implement:

- Match results
- League table
- Wins
- Losses
- Points
- Point differential

---

## Phase 4 — Match Center

Implement:

- Match events
- Scoreboard
- Player selection
- Basketball actions
- Event history
- Event correction

Statistics should be generated from events.

---

## Phase 5 — Playoffs

Implement:

- Brackets
- Best of 3
- Best of 5
- Best of 7

Automatically advance winners.

---

## Phase 6 — Real-Time

Implement:

- WebSockets
- Live score updates
- Spectator match pages

---

## Phase 7 — OCR

Implement Tier 1 and Tier 2 fields only (see **🔬 Refined OCR Strategy**):

```text
Image Upload
      ↓
Image Quality Gate (blur/resolution check)
      ↓
OCR Service
      ↓
OpenCV (perspective correction, mark detection)
      ↓
PaddleOCR (digits) + TrOCR (handwritten names)
      ↓
Roster Matching (jersey number primary key + rapidfuzz name matching)
      ↓
Structured Data with per-field confidence
      ↓
Validation Interface
      ↓
Save Official Data
```

Running Score grid parsing (Tier 3) is future work, not required for this phase.

---

# 🐳 Docker Deployment

The entire project should be Dockerized.

Suggested services:

```text
docker-compose

├── frontend
├── backend
├── database
├── ocr-service
└── nginx
```

Potential architecture:

```text
Internet
    │
    ▼
Nginx
    │
    ├──── Frontend
    │
    ├──── NestJS API
    │
    └──── OCR Service (internal)
```

The OCR service should preferably not be publicly exposed directly.

Only the backend should communicate with it.

---

# 🔐 Security Considerations

Even though this is a portfolio project, basic security practices should be implemented.

Examples:

- Authentication
- Authorization
- Role-based access control
- DTO validation
- File validation
- File size limits
- Allowed image formats
- Rate limiting where appropriate

For image uploads:

```text
Allowed:

jpg
jpeg
png
webp
```

Avoid executing or processing arbitrary files.

---

# 📈 Portfolio Goals

This project should demonstrate the ability to build more than a standard CRUD application.

Important portfolio highlights:

### 🏗️ Architecture

Multi-service architecture:

```text
Next.js
NestJS
PostgreSQL
Python OCR Service
```

---

### 🏀 Complex Domain Logic

- Tournament scheduling
- Standings
- Playoffs
- Series logic

---

### ⚡ Real-Time Systems

- WebSockets
- Live score updates

---

### 📊 Event-Based Design

Match statistics generated from individual match events.

---

### 📸 Computer Vision / OCR

Self-hosted pipeline:

```text
OpenCV
+
PaddleOCR
```

---

### 💰 Cost-Efficient Architecture

No paid AI APIs.

No recurring per-request AI costs.

Everything should be self-hosted.

---

# ❗ Important Development Rules

When implementing this project:

1. Do not over-engineer the MVP.

2. Build features incrementally.

3. Keep the OCR service independent from the main backend.

4. Do not use paid AI APIs.

5. Do not automatically trust OCR results.

6. Use human validation before saving OCR data.

7. Prefer event-based match tracking over manually editing aggregated statistics.

8. Design the database before implementing complex tournament logic.

9. Keep modules independent and maintainable.

10. Use the project as an opportunity to demonstrate professional software engineering practices.

---

# 🎯 Final Vision

The final product should feel like a realistic sports management platform rather than a simple portfolio CRUD application.

The ultimate flow should allow an organizer to:

```text
Create Tournament
        ↓
Register Teams
        ↓
Register Players
        ↓
Configure Tournament Format
        ↓
Generate Schedule
        ↓
Play Matches
        ↓
Record Events
        ↓
Generate Statistics
        ↓
Update Standings
        ↓
Advance Playoff Winners
        ↓
Display Live Matches
        ↓
Digitize Physical Score Sheets
```

The project should prioritize:

> **Clean Architecture + Realistic Domain Logic + Strong Backend Design + Interesting Portfolio Features**

The most important objective is to build something technically interesting, demonstrable, and realistic enough to showcase professional full-stack and backend engineering skills.