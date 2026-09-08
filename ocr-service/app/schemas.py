from typing import Optional

from pydantic import BaseModel


class RosterPlayer(BaseModel):
    id: str
    name: str
    jerseyNumber: int


class RosterTeam(BaseModel):
    id: str
    name: str
    players: list[RosterPlayer]


class QualityCheck(BaseModel):
    passed: bool
    blurScore: float
    reason: Optional[str] = None


class TextRegion(BaseModel):
    text: str
    confidence: float
    box: list[list[float]]


class RosterMatch(BaseModel):
    rawJerseyText: Optional[str] = None
    rawNameText: Optional[str] = None
    matchedPlayerId: Optional[str] = None
    matchedPlayerName: Optional[str] = None
    teamId: Optional[str] = None
    resolutionMethod: str
    confidence: float


class ProcessScoreSheetResponse(BaseModel):
    success: bool
    qualityCheck: QualityCheck
    preprocessing: dict
    rawTextRegions: list[TextRegion]
    rosterMatches: list[RosterMatch]
    note: str
