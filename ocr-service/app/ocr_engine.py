from paddleocr import PaddleOCR

_ocr_instance: PaddleOCR | None = None


def get_ocr() -> PaddleOCR:
    # Loaded lazily and cached — construction pulls in five model weights
    # (doc-orientation, unwarping, textline-orientation, detection,
    # recognition), too slow to redo per-request.
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(use_textline_orientation=True, lang="en")
    return _ocr_instance


def run_ocr(image) -> list[dict]:
    """Runs the PP-OCRv6 pipeline (accepts a BGR numpy array directly) and
    flattens its per-image result object into this service's
    {text, confidence, box} shape."""
    ocr = get_ocr()
    regions: list[dict] = []
    for page in ocr.predict(image):
        texts = page.get("rec_texts", [])
        scores = page.get("rec_scores", [])
        polys = page.get("rec_polys") or page.get("dt_polys") or []
        for text, score, poly in zip(texts, scores, polys):
            regions.append(
                {
                    "text": text,
                    "confidence": float(score),
                    "box": poly.tolist() if hasattr(poly, "tolist") else poly,
                }
            )
    return regions
