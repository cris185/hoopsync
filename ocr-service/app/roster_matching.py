import re

from rapidfuzz import fuzz

# Matches "J. Perez" / "J Perez" — an initial plus a surname, the
# common abbreviated form on handwritten sheets.
INITIAL_SURNAME_RE = re.compile(r"^([A-Za-z])\.?\s+([A-Za-z\-']+)$")

FUZZY_MATCH_THRESHOLD = 70.0
ROW_Y_TOLERANCE = 15.0


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def name_similarity(raw_name: str, roster_name: str) -> float:
    """Compares OCR'd text against a roster player's full name. Handles the
    "J. Perez" abbreviation by comparing initial + surname rather than
    penalizing the missing first name in a plain string diff."""
    match = INITIAL_SURNAME_RE.match(raw_name.strip())
    if match:
        initial, surname = match.groups()
        roster_parts = roster_name.strip().split()
        if roster_parts and roster_parts[0][:1].lower() == initial.lower():
            return fuzz.ratio(surname.lower(), roster_parts[-1].lower())
    return fuzz.token_sort_ratio(_normalize(raw_name), _normalize(roster_name))


def match_player(jersey_text: str | None, name_text: str | None, players: list[dict]) -> dict:
    """The strategy from the spec: jersey number is the primary key (digits
    are far more OCR-reliable than handwritten names), the name is only a
    secondary confirmation signal. Only falls back to fuzzy name matching
    when the number didn't resolve to exactly one player."""
    jersey_number = None
    # isdigit() is too permissive here — it's true for glyphs like the
    # circled-digit "①" that int() then can't parse (a real crash seen
    # on a densely-printed official FIBA sheet). isdecimal() is the
    # check that actually matches what int() accepts; the try/except
    # is defense in depth against any other stray unicode int() rejects.
    if jersey_text and jersey_text.strip().isdecimal():
        try:
            jersey_number = int(jersey_text.strip())
        except ValueError:
            jersey_number = None

    if jersey_number is not None:
        candidates = [p for p in players if p["jerseyNumber"] == jersey_number]
        if len(candidates) == 1:
            player = candidates[0]
            similarity = name_similarity(name_text, player["name"]) if name_text else None
            return {
                "matchedPlayerId": player["id"],
                "matchedPlayerName": player["name"],
                "teamId": player["teamId"],
                "resolutionMethod": "EXACT_ROSTER_MATCH",
                # High confidence on the number alone; a bit higher still
                # if the (unreliable) name text also roughly agrees.
                "confidence": 0.9 if similarity is None or similarity >= 50 else 0.75,
            }

    if name_text:
        best_player, best_score = None, 0.0
        for player in players:
            score = name_similarity(name_text, player["name"])
            if score > best_score:
                best_player, best_score = player, score
        if best_player and best_score >= FUZZY_MATCH_THRESHOLD:
            return {
                "matchedPlayerId": best_player["id"],
                "matchedPlayerName": best_player["name"],
                "teamId": best_player["teamId"],
                "resolutionMethod": "FUZZY_ROSTER_MATCH",
                "confidence": round(best_score / 100, 2),
            }

    return {
        "matchedPlayerId": None,
        "matchedPlayerName": None,
        "teamId": None,
        "resolutionMethod": "NEEDS_REVIEW",
        "confidence": 0.0,
    }


def _region_center_y(region: dict) -> float:
    ys = [point[1] for point in region["box"]]
    return sum(ys) / len(ys)


def _region_left_x(region: dict) -> float:
    return min(point[0] for point in region["box"])


def group_into_rows(regions: list[dict], y_tolerance: float = ROW_Y_TOLERANCE) -> list[list[dict]]:
    """Groups OCR text regions into horizontal rows by vertical proximity —
    a rough stand-in for "these boxes are on the same line of the roster
    table". Works for a simple two-column (number, name) layout; a sheet
    with widely separated columns or multiple rows at the same height
    would need a smarter, template-aware grouping."""
    rows: list[list[dict]] = []
    current_row: list[dict] = []
    current_y: float | None = None
    for region in sorted(regions, key=_region_center_y):
        y = _region_center_y(region)
        if current_y is None or abs(y - current_y) <= y_tolerance:
            current_row.append(region)
            current_y = y if current_y is None else (current_y + y) / 2
        else:
            rows.append(current_row)
            current_row = [region]
            current_y = y
    if current_row:
        rows.append(current_row)
    return rows


def extract_roster_candidates(regions: list[dict]) -> list[dict]:
    """Heuristic pass turning raw OCR output into (jersey number, name)
    candidate pairs, without assuming a fixed template: within each
    detected row, the short numeric token is taken as the jersey number
    and the alphabetic token as the name."""
    candidates = []
    for row in group_into_rows(regions):
        row_sorted = sorted(row, key=_region_left_x)
        jersey_region = next(
            (r for r in row_sorted if r["text"].strip().isdecimal() and len(r["text"].strip()) <= 2),
            None,
        )
        name_region = next(
            (r for r in row_sorted if not r["text"].strip().isdecimal() and len(r["text"].strip()) >= 3),
            None,
        )
        if jersey_region or name_region:
            candidates.append(
                {
                    "rawJerseyText": jersey_region["text"] if jersey_region else None,
                    "rawNameText": name_region["text"] if name_region else None,
                }
            )
    return candidates
