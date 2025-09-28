# cv_system/api/playmakers_classifier.py
# Minimal "Playmakers" position annotator with NO circular imports.

from __future__ import annotations
from typing import List, Dict, Any
import numpy as np

def attach_positions_to_tracks(
    frame_bgr: "np.ndarray",
    detections: List[Dict[str, Any]],
    iou_thr: float = 0.35,
) -> List[Dict[str, Any]]:
    """
    Attach a 'position' dict to each detection. This stub avoids any circular imports.

    Expected detection:
      {"track_id": int, "bbox": [x1,y1,x2,y2] or [x,y,w,h], "score"/"confidence": float, ...}

    Output: same list, but each item has:
      d["position"] = {"label": <str>, "confidence": <float>}
    """
    if frame_bgr is None or len(detections) == 0:
        return detections

    H, W = frame_bgr.shape[:2] if hasattr(frame_bgr, "shape") else (1080, 1920)

    def to_xyxy(b):
        # accept either xyxy or xywh
        if len(b) != 4:
            return None
        x1, y1, x2, y2 = b
        # if looks like xywh (w,h positive and small relative to frame), convert
        if x2 > 0 and y2 > 0 and (x2 < W * 0.8 and y2 < H * 0.8):
            # treat as xywh
            xx1, yy1 = int(x1), int(y1)
            xx2, yy2 = int(x1 + x2), int(y1 + y2)
            return [xx1, yy1, xx2, yy2]
        # else assume already xyxy
        return [int(x1), int(y1), int(x2), int(y2)]

    midpoint_x = W / 2.0

    for d in detections:
        bbox = d.get("bbox", [])
        xyxy = to_xyxy(bbox)
        if not xyxy:
            d["position"] = {}
            continue

        x1, y1, x2, y2 = xyxy
        cx = (x1 + x2) / 2.0
        w = max(1, x2 - x1)
        h = max(1, y2 - y1)
        aspect = h / w

        # Tiny heuristic just for demo labeling:
        # - center-ish tall box → "QB"
        # - left side → "WR-L"
        # - right side → "WR-R"
        # You can replace with a real classifier later.
        if abs(cx - midpoint_x) < W * 0.12 and aspect > 1.4:
            label, conf = "QB", 0.75
        elif cx < midpoint_x:
            label, conf = "WR-L", 0.60
        else:
            label, conf = "WR-R", 0.60

        d["position"] = {"label": label, "confidence": conf}

    return detections
