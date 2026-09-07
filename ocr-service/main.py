from fastapi import FastAPI, UploadFile, File

app = FastAPI(title="HoopSync OCR Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process-score-sheet")
async def process_score_sheet(image: UploadFile = File(...)):
    # Pipeline (OpenCV preprocessing -> PaddleOCR/TrOCR -> roster matching)
    # lands in a dedicated pass, not this scaffolding step. This stub only
    # proves the endpoint contract and the container are wired correctly.
    return {
        "success": False,
        "error": "not_implemented",
        "received_filename": image.filename,
    }
