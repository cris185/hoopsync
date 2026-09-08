import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from pydantic import ValidationError

from app.ocr_engine import run_ocr
from app.perspective import correct_perspective
from app.quality import check_quality
from app.roi import crop_roi, load_roi_config
from app.roster_matching import extract_roster_candidates, match_player
from app.schemas import RosterTeam

app = FastAPI(title="HoopSync OCR Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process-score-sheet")
async def process_score_sheet(
    image: UploadFile = File(...),
    home_team: str = Form(...),
    away_team: str = Form(...),
):
    # The OCR service never touches the database (spec: kept independent
    # from the NestJS backend) — the backend, which already knows both
    # rosters, sends them along with the photo so matching can run here
    # as a pure function.
    try:
        home = RosterTeam.model_validate_json(home_team)
        away = RosterTeam.model_validate_json(away_team)
    except ValidationError as exc:
        return {"success": False, "error": "invalid_roster", "detail": exc.errors()}

    raw_bytes = await image.read()
    decoded = cv2.imdecode(np.frombuffer(raw_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if decoded is None:
        return {"success": False, "error": "invalid_image"}

    gray = cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)
    passed, blur_score, reason = check_quality(gray)
    if not passed:
        return {
            "success": False,
            "qualityCheck": {"passed": False, "blurScore": blur_score, "reason": reason},
            "preprocessing": {},
            "rawTextRegions": [],
            "rosterMatches": [],
            "note": "Image rejected before OCR — retake the photo.",
        }

    corrected, deskewed = correct_perspective(decoded, gray)
    regions = run_ocr(corrected)

    all_players = [
        {**player.model_dump(), "teamId": home.id} for player in home.players
    ] + [{**player.model_dump(), "teamId": away.id} for player in away.players]

    roster_matches = []
    for candidate in extract_roster_candidates(regions):
        result = match_player(candidate["rawJerseyText"], candidate["rawNameText"], all_players)
        roster_matches.append({**candidate, **result})

    # ROI-based fields: the mechanism is real (crop the normalized region,
    # OCR just that crop), but roi_config.json's coordinates are unaudited
    # placeholders — see that file. Reported as low-confidence until
    # they're calibrated against the actual printed template.
    roi_config = load_roi_config()
    roi_extraction = {}
    for field_name, roi in roi_config.items():
        if field_name.startswith("_"):
            continue
        crop = crop_roi(corrected, roi)
        crop_regions = run_ocr(crop) if crop.size else []
        roi_extraction[field_name] = {
            "text": crop_regions[0]["text"] if crop_regions else None,
            "confidence": crop_regions[0]["confidence"] if crop_regions else 0.0,
        }

    return {
        "success": True,
        "qualityCheck": {"passed": True, "blurScore": blur_score, "reason": None},
        "preprocessing": {"deskewed": deskewed},
        "rawTextRegions": regions,
        "rosterMatches": roster_matches,
        "roiExtraction": roi_extraction,
        "note": (
            "roiExtraction uses unaudited placeholder coordinates (see "
            "roi_config.json) — treat it as low-confidence until "
            "recalibrated against the real printed HoopSync scoresheet "
            "template, which doesn't exist as an image asset yet. "
            "rosterMatches works on any legible photo already, independent "
            "of that template."
        ),
    }
