# cv_system/api/football_yolo_detector.py
# YOLOv8 + BYTETracker (config) + persistence + EMA smoothing + Playmakers labels + stats

from __future__ import annotations

import os
import time
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
from types import SimpleNamespace

import cv2
import numpy as np
from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker

# optional: load .env (non-fatal if missing)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    pass

# Playmakers positions classifier
from .playmakers_classifier import attach_positions_to_tracks

# ---------- Model + base params ----------
YOLO_WEIGHTS = "yolov8n.pt"
YOLO_CONF    = 0.30
YOLO_IMGSZ   = 960

# Filters
MIN_HW_RATIO = 0.35
MAX_HW_RATIO = 3.0
MIN_BOX_W    = 80
MIN_BOX_H    = 80
MIN_AREA     = MIN_BOX_W * MIN_BOX_H  # 6400

# Tracking params
TRACK_BUFFER            = 30
MATCH_THRESH            = 0.8
MIN_TRACK_BOX_AREA      = 6400
MIN_TRACK_PERSISTENCE   = 5

# EMA for on-screen bbox
EMA_ALPHA_CURR = 0.6
EMA_ALPHA_PREV = 0.4

# Position classifier schedule + debounce
RUN_CLASSIFIER_EVERY         = 3
POS_MIN_CONF                 = 0.35
LABEL_REQUIRED_CONSEC        = 2
LABEL_MIN_SECS_BETWEEN_FLIPS = 0.5

# Initialize YOLO once
yolo_model = YOLO(YOLO_WEIGHTS)

# ----- helpers -----
def _xyxy_to_xywh(b: List[int | float]) -> Tuple[int, int, int, int]:
    x1, y1, x2, y2 = b
    return int(x1), int(y1), int(x2 - x1), int(y2 - y1)

def _passes_geom_filters(x1: int, y1: int, x2: int, y2: int) -> bool:
    w, h = x2 - x1, y2 - y1
    if w < MIN_BOX_W or h < MIN_BOX_H:
        return False
    if (w * h) < MIN_AREA:
        return False
    hw_ratio = h / max(1, w)
    return (MIN_HW_RATIO <= hw_ratio <= MAX_HW_RATIO)

def _people_from_yolo_results(yolo_res) -> List[Dict[str, Any]]:
    people: List[Dict[str, Any]] = []
    for r in yolo_res:
        names = getattr(r, "names", {}) or {}
        if getattr(r, "boxes", None) is None or len(r.boxes) == 0:
            continue
        xyxy = r.boxes.xyxy.cpu().numpy().astype(int)
        cls  = r.boxes.cls.cpu().numpy().astype(int)
        conf = r.boxes.conf.cpu().numpy().astype(float)
        for box, cls_id, c in zip(xyxy, cls, conf):
            label_name = names.get(int(cls_id), "")
            # COCO "person" = 0
            if label_name not in ("person",) and int(cls_id) != 0:
                continue
            x1, y1, x2, y2 = map(int, box)
            if not _passes_geom_filters(x1, y1, x2, y2):
                continue
            people.append({"bbox_xyxy": [x1, y1, x2, y2], "conf": float(c)})
    return people

# ----- label cache / debounce -----
label_cache: Dict[int, Dict[str, Any]] = {}

def _update_label_with_debounce(tid: int, new_label: str, new_conf: float, now: float):
    state = label_cache.get(tid, {
        "last_label": None, "last_conf": 0.0, "stamp": 0.0,
        "pending_label": None, "pending_count": 0
    })
    if new_conf < POS_MIN_CONF:
        label_cache[tid] = state
        return state["last_label"], state["last_conf"]
    if new_label == state["last_label"]:
        state["pending_label"] = None
        state["pending_count"] = 0
        label_cache[tid] = state
        return state["last_label"], state["last_conf"]
    if (now - state["stamp"]) < LABEL_MIN_SECS_BETWEEN_FLIPS:
        if state["pending_label"] == new_label:
            state["pending_count"] += 1
        else:
            state["pending_label"] = new_label
            state["pending_count"] = 1
        label_cache[tid] = state
        return state["last_label"], state["last_conf"]
    if state["pending_label"] == new_label:
        state["pending_count"] += 1
    else:
        state["pending_label"] = new_label
        state["pending_count"] = 1
    if state["pending_count"] >= LABEL_REQUIRED_CONSEC:
        state["last_label"] = new_label
        state["last_conf"]  = new_conf
        state["stamp"]      = now
        state["pending_label"] = None
        state["pending_count"] = 0
    label_cache[tid] = state
    return state["last_label"], state["last_conf"]

# ----- detector -----
class FootballYOLODetector:
    def __init__(self) -> None:
        # Tracker with config object
        self.tracker = BYTETracker(SimpleNamespace(
            track_thresh=YOLO_CONF,           # 0.30
            match_thresh=MATCH_THRESH,        # 0.8
            track_buffer=TRACK_BUFFER,        # 30 frames
            min_box_area=MIN_TRACK_BOX_AREA,  # 6400
            mot20=False
        ))
        self.current_frame_idx = 0
        self._attach_iou = 0.35

        # per-track state for persistence/EMA
        self.track_prev_bbox: Dict[int, List[float]] = {}
        self.track_seen_frames = defaultdict(int)
        self.track_last_seen: Dict[int, int] = {}

        # -------- stats fields --------
        self._ema_alpha: float = 0.2
        self._fps_ema: Optional[float] = None
        self._lat_ema_ms: Optional[float] = None
        self._last_frame_end: Optional[float] = None

    def process_frame(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        # start timing with high-resolution clock
        t0 = time.perf_counter()

        self.current_frame_idx += 1

        # YOLO inference (BGR -> RGB)
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        yolo_res = yolo_model.predict(rgb, conf=YOLO_CONF, imgsz=YOLO_IMGSZ, verbose=False)

        # Filter to people with geometry constraints
        people = _people_from_yolo_results(yolo_res)

        # Build tracker inputs and update
        H, W = frame_bgr.shape[:2]
        if len(people) == 0:
            trk_inputs = np.empty((0, 6), dtype=float)  # safe empty input
        else:
            trk_inputs = []
            for p in people:
                x1, y1, x2, y2 = p["bbox_xyxy"]
                trk_inputs.append([float(x1), float(y1), float(x2), float(y2), float(p["conf"]), 0.0])

        tracks = self.tracker.update(trk_inputs, [H, W], (H, W))

        # Area filter + persistence gate
        results: List[Dict[str, Any]] = []
        for t in tracks:
            x1, y1, x2, y2 = map(int, t.tlbr)
            w, h = x2 - x1, y2 - y1
            area = w * h
            if area < MIN_TRACK_BOX_AREA:
                continue

            tid = int(t.track_id)
            if self.track_last_seen.get(tid, -999999) == self.current_frame_idx - 1:
                self.track_seen_frames[tid] = self.track_seen_frames.get(tid, 0) + 1
            else:
                self.track_seen_frames[tid] = 1
            self.track_last_seen[tid] = self.current_frame_idx

            if self.track_seen_frames[tid] < MIN_TRACK_PERSISTENCE:
                continue

            d = {
                "track_id": tid,
                "bbox": [x1, y1, w, h],                         # xywh for UI
                "confidence": float(getattr(t, "score", 1.0)),  # if present
            }

            # EMA smoothing on bbox
            if tid in self.track_prev_bbox:
                px, py, pw, ph = self.track_prev_bbox[tid]
                sx = EMA_ALPHA_CURR * x1 + EMA_ALPHA_PREV * px
                sy = EMA_ALPHA_CURR * y1 + EMA_ALPHA_PREV * py
                sw = EMA_ALPHA_CURR * w  + EMA_ALPHA_PREV * pw
                sh = EMA_ALPHA_CURR * h  + EMA_ALPHA_PREV * ph
                d["bbox"] = [int(sx), int(sy), int(sw), int(sh)]
                self.track_prev_bbox[tid] = [sx, sy, sw, sh]
            else:
                self.track_prev_bbox[tid] = [x1, y1, w, h]

            results.append(d)

        # prune stale tracks
        for tid in list(self.track_last_seen.keys()):
            if self.current_frame_idx - self.track_last_seen[tid] > TRACK_BUFFER:
                self.track_prev_bbox.pop(tid, None)
                self.track_seen_frames.pop(tid, None)
                self.track_last_seen.pop(tid, None)

        # Position classifier schedule + debounce
        now_mono = time.monotonic()
        if self.current_frame_idx % RUN_CLASSIFIER_EVERY == 0 and len(results) > 0:
            results = attach_positions_to_tracks(frame_bgr, results, iou_thr=self._attach_iou)

        for d in results:
            tid = d["track_id"]
            raw_pos = d.get("position") or {}
            raw_label = (raw_pos.get("label") or "").strip()
            raw_conf  = float(raw_pos.get("confidence") or d.get("confidence", 0.0))

            if self.current_frame_idx % RUN_CLASSIFIER_EVERY != 0:
                cached = label_cache.get(tid)
                if cached and cached.get("last_label"):
                    d["position"] = {"label": cached["last_label"], "confidence": cached.get("last_conf", 0.0)}
                else:
                    d["position"] = {}
                continue

            final_label, final_conf = _update_label_with_debounce(tid, raw_label, raw_conf, now_mono)
            if final_label and final_conf >= POS_MIN_CONF:
                d["position"] = {"label": final_label, "confidence": final_conf}
            else:
                d["position"] = {}

        # -------- stats update --------
        dt = time.perf_counter() - t0
        lat_ms = dt * 1000.0
        fps = (1.0 / dt) if dt > 0 else 0.0

        a = self._ema_alpha
        self._fps_ema = fps if self._fps_ema is None else (a * fps + (1 - a) * self._fps_ema)
        self._lat_ema_ms = lat_ms if self._lat_ema_ms is None else (a * lat_ms + (1 - a) * self._lat_ema_ms)
        self._last_frame_end = time.perf_counter()

        return {
            "fps": float(self._fps_ema) if self._fps_ema is not None else 0.0,
            "detections": results
        }

    def detect_and_track(self, frame_bgr: np.ndarray) -> List[Dict[str, Any]]:
        out = self.process_frame(frame_bgr)
        xywh_list: List[Dict[str, Any]] = []
        for d in out.get("detections", []):
            x, y, w, h = d["bbox"]
            xywh_list.append({
                "track_id": d.get("track_id"),           # expose IDs to frontend if desired
                "bbox": [x, y, w, h],
                "position": d.get("position", {}),
                "confidence": d.get("confidence", 0.0),
            })
        return xywh_list

    # -------- stats getter --------
    def get_stats(self):
        return {
            "fps": round(self._fps_ema, 1) if self._fps_ema is not None else None,
            "avg_latency_ms": round(self._lat_ema_ms, 1) if self._lat_ema_ms is not None else None,
        }

# ---------- module-level singleton accessor ----------
from typing import Optional as _Optional

__all__ = ["FootballYOLODetector", "get_detector"]

_detector_singleton: _Optional[FootballYOLODetector] = None

def get_detector() -> FootballYOLODetector:
    """
    Lazy-initialize and return a single shared detector instance.
    main.py imports this (from cv_system.api.football_yolo_detector import get_detector).
    """
    global _detector_singleton
    if _detector_singleton is None:
        _detector_singleton = FootballYOLODetector()
    return _detector_singleton
