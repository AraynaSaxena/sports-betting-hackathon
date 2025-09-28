# cv_system/api/server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/predict")
async def predict(payload: dict):
    from cv_system.api import infer                 # lazy import (keeps /health instant)
    # expect payload like {"images": ["dataurl1", "dataurl2", ...]}
    images_b64 = payload.get("images", [])
    bgrs = [infer.b64_to_bgr(b) for b in images_b64]
    jerseys, confs = infer.predict_batch(bgrs)
    return {"jerseys": jerseys, "confidence": confs}
