import json
from pathlib import Path

import cv2
import numpy as np

ROI_CONFIG_PATH = Path(__file__).resolve().parent.parent / "roi_config.json"


def load_roi_config() -> dict:
    with open(ROI_CONFIG_PATH) as f:
        return json.load(f)


def crop_roi(image: np.ndarray, roi: dict) -> np.ndarray:
    """Crops a normalized (0-1, resolution-independent) region. The
    mechanism is real and tested; the coordinates in roi_config.json are
    placeholders until they're measured against the actual printed
    HoopSync scoresheet template (see that file's _comment)."""
    height, width = image.shape[:2]
    x1 = int(roi["x"] * width)
    y1 = int(roi["y"] * height)
    x2 = int((roi["x"] + roi["w"]) * width)
    y2 = int((roi["y"] + roi["h"]) * height)
    return image[y1:y2, x1:x2]


def detect_mark(gray_crop: np.ndarray, ink_threshold: float = 0.15) -> bool:
    """Presence-of-mark detection for pre-printed cells (team fouls boxes,
    timeout checkboxes) — an ink-density threshold, not character
    recognition, per the spec's mark-vs-handwriting distinction."""
    if gray_crop.size == 0:
        return False
    _, binary = cv2.threshold(gray_crop, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink_ratio = float(np.count_nonzero(binary)) / binary.size
    return ink_ratio >= ink_threshold
