// Team is not assigned a stored brand color in the schema — teams are
// shared across tournaments and a color field wasn't part of the
// original data model. This deterministically derives one from the
// team's id instead, so the same team always renders the same color
// without a backend change (same accent-family chroma/lightness as
// the rest of the palette, hue varied per team — see the design
// system's "Team Colors" token category).
const TEAM_COLOR_PALETTE = [
  "oklch(0.55 0.19 25)",
  "oklch(0.6 0.15 260)",
  "oklch(0.55 0.14 150)",
  "oklch(0.6 0.15 300)",
  "oklch(0.7 0.16 85)",
  "oklch(0.6 0.17 200)",
  "oklch(0.6 0.18 340)",
  "oklch(0.55 0.13 60)",
];

export function getTeamColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return TEAM_COLOR_PALETTE[Math.abs(hash) % TEAM_COLOR_PALETTE.length];
}
