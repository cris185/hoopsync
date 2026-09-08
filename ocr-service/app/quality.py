import cv2
import numpy as np

# Laplacian variance below this is treated as too blurry to bother
# running OCR on — cheap to compute, avoids wasting a PaddleOCR pass
# (and the scorekeeper's time) on an unusable photo. Calibrated
# empirically against typical phone-camera document shots; revisit
# once real scoresheet photos are available.
BLUR_THRESHOLD = 60.0


def compute_blur_score(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def check_quality(gray: np.ndarray) -> tuple[bool, float, str | None]:
    score = compute_blur_score(gray)
    if score < BLUR_THRESHOLD:
        return False, score, f"Image too blurry (score {score:.1f}, need >= {BLUR_THRESHOLD})"
    return True, score, None
