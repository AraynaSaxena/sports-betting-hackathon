# cv_system/api/main.py
# FastAPI app exposing:
# - /health, /stats
# - /detect/frame (HTTP)
# - /predict_regions (HTTP helper for UI overlays)
# - /ws/cv (WebSocket real-time stream)
from __future__ import annotations

import base64
import json
from typing import List, Dict, Any

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cv_system.api.football_yolo_detector import get_detector

# -----------------------------------------------------------------------------
# App + CORS
# -----------------------------------------------------------------------------
app = FastAPI(title="CV System", version="1.0.0")

# Allow React dev server to call HTTP endpoints (CORS doesn't apply to WS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton detector (constructed once)
detector = get_detector()

# -----------------------------------------------------------------------------
# Health & Stats
# -----------------------------------------------------------------------------
@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.get("/stats")
def stats() -> Dict[str, Any]:
    try:
        return detector.get_stats()
    except Exception:
        return {"fps": None, "avg_latency_ms": None}

# -----------------------------------------------------------------------------
# HTTP: single-frame detect (fallback / easy testing)
# -----------------------------------------------------------------------------
class FrameReq(BaseModel):
    frame_data_url: str  # "data:image/jpeg;base64,..."

@app.post("/detect/frame")
def detect_frame(req: FrameReq) -> Dict[str, Any]:
    b64 = req.frame_data_url.split(",")[1] if "," in req.frame_data_url else req.frame_data_url
    img = cv2.imdecode(np.frombuffer(base64.b64decode(b64), np.uint8), cv2.IMREAD_COLOR)
    detections = detector.detect_and_track(img)
    return {
        "type": "detections",
        "detections": detections,
        "stats": detector.get_stats(),
    }

# -----------------------------------------------------------------------------
# HTTP: overlay helper (returns simple {box, position, conf} list)
# -----------------------------------------------------------------------------
class RegionsReq(BaseModel):
    frame_data_url: str
    regions: List[Any] = []  # kept for signature compatibility; unused

@app.post("/predict_regions")
def predict_regions(req: RegionsReq) -> Dict[str, Any]:
    b64 = req.frame_data_url.split(",")[1] if "," in req.frame_data_url else req.frame_data_url
    img = cv2.imdecode(np.frombuffer(base64.b64decode(b64), np.uint8), cv2.IMREAD_COLOR)
    dets = detector.detect_and_track(img)
    results = []
    for d in dets:
        x, y, w, h = d["bbox"]
        pos = d.get("position") or {}
        label = pos.get("label", "PLAYER")
        conf = float(pos.get("confidence", d.get("confidence", 0.0)))
        results.append({"box": [x, y, w, h], "position": label, "conf": conf})
    return {"results": results}

# -----------------------------------------------------------------------------
# WebSocket: real-time CV stream
#   Client sends: {"type":"frame","frame_data_url":"data:image/jpeg;base64,..."}
#   Server sends: {"type":"detections","detections":[...],"stats":{...}}
# -----------------------------------------------------------------------------
@app.websocket("/ws/cv")
async def ws_cv(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            msg = await websocket.receive_text()
            try:
                data = json.loads(msg)
            except Exception:
                # Ignore malformed packets
                continue

            if data.get("type") != "frame":
                # Only handle frame messages
                continue

            frame_url = data.get("frame_data_url")
            if not frame_url:
                continue

            try:
                b64 = frame_url.split(",")[1] if "," in frame_url else frame_url
                img = cv2.imdecode(np.frombuffer(base64.b64decode(b64), np.uint8), cv2.IMREAD_COLOR)

                detections = detector.detect_and_track(img)
                payload = {
                    "type": "detections",
                    "detections": detections,
                    "stats": detector.get_stats(),
                }
                await websocket.send_text(json.dumps(payload))
            except Exception:
                # Do not kill the socket on single-frame errors
                continue
    except WebSocketDisconnect:
        # client disconnected
        pass

# -----------------------------------------------------------------------------
# (Optional) Local run: uvicorn cv_system.api.main:app --reload --port 8001
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("cv_system.api.main:app", host="0.0.0.0", port=8001, reload=True)
