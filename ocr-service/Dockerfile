# Pinned to Debian bookworm explicitly (not just "slim", which floats to
# whatever Debian release is current) for reproducibility.
FROM python:3.11-slim-bookworm

WORKDIR /app

# paddleocr pulls in full (non-headless) opencv-python as its own
# transitive dependency regardless of the headless one we ask for, so
# libGL is required too, not just the headless-friendly libs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download PaddleOCR's model weights (doc orientation, unwarping,
# textline orientation, detection, recognition) at build time so the
# image doesn't need network access — or a slow first request — at
# runtime. Note: paddlepaddle==2.6.2 (the last 2.x release supporting
# Python 3.11) reliably crashes on init on this stack with a native
# zlib/heap-corruption abort; paddlepaddle 3.x + the paddleocr 3.x API
# (use_textline_orientation, no show_log) is what actually works — do
# not downgrade either without re-verifying end-to-end.
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_textline_orientation=True, lang='en')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
