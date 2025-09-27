import cv2, json, math, os, sys
import numpy as np
from collections import defaultdict, Counter
from ultralytics import YOLO
import supervision as sv
from paddleocr import PaddleOCR
from roster import ROSTER
from config import *

# Ensure output directories exist
os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_MP4), exist_ok=True)

def digits_only(s: str) -> str:
    return "".join(ch for ch in s if ch.isdigit())

def enhance_variants(torso_bgr):
    """Generate 3 variants for OCR: raw-upscaled, Otsu-binarized, inverted-binarized."""
    # upscale for better OCR
    if UPSCALE_FOR_OCR != 1.0:
        torso_bgr = cv2.resize(torso_bgr, None, fx=UPSCALE_FOR_OCR, fy=UPSCALE_FOR_OCR, interpolation=cv2.INTER_CUBIC)
    g = cv2.cvtColor(torso_bgr, cv2.COLOR_BGR2GRAY)
    # CLAHE improves contrast under stadium lighting
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(g)
    # Otsu binary (dark digits on light jersey OR light digits on dark jersey)
    _, bw = cv2.threshold(clahe, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    inv = 255 - bw
    return [torso_bgr, bw, inv]

def best_ocr_number(ocr, imgs):
    """
    Run OCR on multiple preprocessed variants.
    Return (number:int or None, conf:float or 0.0)
    Strategy: collect all candidate digit strings (len 1-2), pick highest conf,
    prefer 2-digit if available.
    """
    best = (None, 0.0)
    two_digit_best = (None, 0.0)

    for img in imgs:
        res = ocr.ocr(img, cls=False)
        if not res or not isinstance(res, list):
            continue
        for block in res:
            if not isinstance(block, list):
                continue
            for line in block:
                if len(line) < 2 or not isinstance(line[1], tuple):
                    continue
                text = line[1][0]
                conf = float(line[1][1]) if isinstance(line[1][1], (float, int, np.floating)) else 0.0
                if conf < MIN_DIGIT_CONF:
                    continue
                digits = digits_only(text)
                if len(digits) in ALLOWED_LENGTHS and digits != "":
                    num = int(digits)
                    if len(digits) == 2:
                        if conf > two_digit_best[1]:
                            two_digit_best = (num, conf)
                    if conf > best[1]:
                        best = (num, conf)

    # prefer 2-digit if it exists
    return two_digit_best if two_digit_best[0] is not None else best

class JerseyMemory:
    """Temporal smoothing of jersey numbers per track ID via majority voting."""
    def __init__(self, window=MAJORITY_WINDOW):
        self.window = window
        self.buf = defaultdict(list)  # track_id -> list[(num, conf)]

    def update(self, track_id, num, conf):
        if track_id is None or num is None:
            return
        L = self.buf[track_id]
        L.append((num, conf))
        if len(L) > self.window:
            L.pop(0)

    def get(self, track_id):
        """Return (stable_num or None, avg_conf)."""
        L = self.buf.get(track_id, [])
        if not L:
            return (None, 0.0)
        # weighted vote by confidence
        scores = defaultdict(float)
        for n, c in L:
            scores[n] += float(c)
        stable_num = max(scores.items(), key=lambda kv: kv[1])[0]
        avg_conf = scores[stable_num] / sum(scores.values())
        return (stable_num, avg_conf)

def crop_torso(frame, box):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    cx1 = int(x1 + LEFT_FRAC * w)
    cx2 = int(x1 + RIGHT_FRAC * w)
    cy1 = int(y1 + TOP_FRAC * h)
    cy2 = int(y1 + BOTTOM_FRAC * h)
    return frame[max(0,cy1):max(0,min(cy2, frame.shape[0]-1)),
                 max(0,cx1):max(0,min(cx2, frame.shape[1]-1))]

def lookup_player(team_abbr, number):
    team = team_abbr.upper()
    return ROSTER.get(team, {}).get(number)

def main():
    print("=== NFL Player Overlay Generator ===")
    print_config()
    
    # Check if video file exists
    if not os.path.exists(VIDEO_IN):
        print(f"❌ Error: Video file not found: {VIDEO_IN}")
        print("Please add your video file or update the VIDEO_IN path in config.py")
        return False
    
    print(f"📹 Opening video: {VIDEO_IN}")
    cap0 = cv2.VideoCapture(VIDEO_IN)
    if not cap0.isOpened():
        print(f"❌ Error: Cannot open video: {VIDEO_IN}")
        return False
        
    width  = int(cap0.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap0.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap0.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap0.get(cv2.CAP_PROP_FRAME_COUNT))
    cap0.release()
    
    print(f"📊 Video info: {width}x{height} @ {fps:.1f}fps, {total_frames} frames")
    print(f"🏈 Team: {TEAM_ABBR}")
    print(f"🤖 Loading YOLO model: {MODEL}")
    
    try:
        # Detector + tracker
        model = YOLO(MODEL)
        print("✅ YOLO model loaded successfully")
        
        # OCR (English; we only keep digits post-process)
        print("🔤 Loading PaddleOCR...")
        ocr = PaddleOCR(lang='en', rec=True, det=True, show_log=False)
        print("✅ OCR loaded successfully")
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        print("Make sure you have installed all requirements: pip install -r requirements.txt")
        return False

    # Writers / data
    overlay = {"video": {"path": VIDEO_IN, "fps": fps, "width": width, "height": height}, "frames": []}
    jersey_mem = JerseyMemory(window=MAJORITY_WINDOW)

    # Annotated output
    sink = sv.VideoSink(OUTPUT_MP4, fps=fps, resolution_wh=(width, height))
    box_anno   = sv.BoxAnnotator(thickness=2)
    label_anno = sv.LabelAnnotator(text_scale=0.6, text_thickness=1, text_color=sv.Color.from_hex("#ffffff"),
                                   text_background=sv.Color.from_hex("#000000").with_alpha(180))

    # Track stream
    gen = model.track(
        source=VIDEO_IN, stream=True,
        tracker="bytetrack.yaml",
        conf=CONF, iou=IOU, classes=[PERSON_CLASS_ID], verbose=False
    )

    frame_idx = 0
    processed_frames = 0
    print(f"🎬 Processing video frames...")
    
    for r in gen:
        frame = r.orig_img
        if frame is None:
            break
        if frame_idx % FRAME_STRIDE != 0:
            frame_idx += 1
            continue
            
        # Progress indicator
        if processed_frames % 30 == 0:  # Every 30 processed frames
            progress = (frame_idx / total_frames) * 100 if total_frames > 0 else 0
            print(f"⏳ Progress: {progress:.1f}% (frame {frame_idx}/{total_frames})")
        
        processed_frames += 1

        dets = sv.Detections.from_ultralytics(r)
        # keep only persons
        if dets.class_id is not None:
            mask = dets.class_id == PERSON_CLASS_ID
            dets = dets[mask]

        boxes_out = []
        labels = []

        for i in range(len(dets)):
            x1, y1, x2, y2 = dets.xyxy[i].astype(int)
            track_id = None if dets.tracker_id is None else int(dets.tracker_id[i])

            # Torso crop -> OCR on multiple variants -> best candidate
            torso = crop_torso(frame, (x1, y1, x2, y2))
            jersey_num, conf = (None, 0.0)
            if torso.size > 0:
                variants = enhance_variants(torso)
                jersey_num, conf = best_ocr_number(ocr, variants)

            # Update temporal memory and get stable reading
            jersey_mem.update(track_id, jersey_num, conf)
            stable_num, stable_weight = jersey_mem.get(track_id)

            # Choose the stable number if we have one with decent weight
            number_to_show = None
            final_conf = 0.0
            if stable_num is not None and stable_weight >= 0.5:
                number_to_show = stable_num
                final_conf = stable_weight
            elif jersey_num is not None:
                number_to_show = jersey_num
                final_conf = conf

            player = lookup_player(TEAM_ABBR, number_to_show) if number_to_show is not None else None

            # Assemble overlay entry
            boxes_out.append({
                "x": int(x1), "y": int(y1), "w": int(x2-x1), "h": int(y2-y1),
                "id": track_id,
                "number": int(number_to_show) if number_to_show is not None else None,
                "conf": round(float(final_conf), 3),
                "player": player
            })

            # Annotation label
            if player:
                lab = f"{player['name']}  #{player['number']}  {player['position']}"
            elif number_to_show is not None:
                lab = f"#{number_to_show} ({final_conf:.2f})"
            else:
                lab = "Detecting…"
            labels.append(lab)

        # Write overlay frame
        overlay["frames"].append({"t": round(frame_idx / fps, 3), "boxes": boxes_out})

        # Draw boxes/labels for quick inspection
        frame = box_anno.annotate(scene=frame, detections=dets)
        frame = label_anno.annotate(scene=frame, detections=dets, labels=labels)
        sink.write_frame(frame)

        frame_idx += 1

    sink.close()

    with open(OUTPUT_JSON, "w") as f:
        json.dump(overlay, f, indent=2)
    
    print(f"\n✅ Processing complete!")
    print(f"📄 JSON overlay: {OUTPUT_JSON}")
    print(f"🎥 Annotated video: {OUTPUT_MP4}")
    print(f"📊 Processed {processed_frames} frames with {len(overlay['frames'])} frame entries")
    
    # Count detected players
    total_detections = sum(len(frame['boxes']) for frame in overlay['frames'])
    print(f"👥 Total player detections: {total_detections}")
    
    print("\n💡 Tips:")
    print("- If jersey numbers are noisy, raise MIN_DIGIT_CONF in config.py")
    print("- Adjust crop fractions (TOP_FRAC, BOTTOM_FRAC, etc.) for better OCR")
    print("- Use yolov8s.pt for better accuracy (already set)")
    print("- Add more players to roster.py for better identification")
    
    return True

if __name__ == "__main__":
    main()