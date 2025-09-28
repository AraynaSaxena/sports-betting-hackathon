# cv_system/scripts/precrop_jerseys.py
# Tighten crops around the jersey digits & letterbox to 224x224.

import os
import cv2
import numpy as np
import pandas as pd
from pathlib import Path

CSV_PATH = Path("cv_system/data/raw/train_player_numbers.csv")
RAW_ROOT = Path("cv_system/data/raw")
OUT_DIR  = Path("cv_system/data/processed/jersey_crops")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET = 224  # change to 256 if you want larger inputs

def clamp(v, lo, hi):
    return max(lo, min(int(v), hi))

def has_all_boxes(row):
    # robust check for box columns AND non-nan values
    need = ['left', 'top', 'right', 'bottom']
    if not all(k in row for k in need):
        return False
    vals = [row['left'], row['top'], row['right'], row['bottom']]
    return all(pd.notna(v) for v in vals)

# (optional) makes numbers a tad crisper on broadcast footage
def apply_clahe(img_bgr):
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge([l2, a, b])
    return cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)

def letterbox_square(img, size=TARGET, pad_color=128):
    h, w = img.shape[:2]
    scale = min(size / w, size / h)
    nh, nw = int(h * scale), int(w * scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.full((size, size, 3), pad_color, dtype=np.uint8)  # << neutral gray padding
    y0 = (size - nh) // 2
    x0 = (size - nw) // 2
    canvas[y0:y0 + nh, x0:x0 + nw] = resized
    return canvas

def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    assert 'filepath' in df.columns, "CSV must have a 'filepath' column"
    df['img_path'] = (RAW_ROOT / df['filepath'].astype(str)).astype(str)

    # keep rows whose files exist
    df = df[df['img_path'].apply(os.path.exists)].copy()

    processed = 0
    rows = []

    for _, r in df.iterrows():
        p = r['img_path']
        img = cv2.imread(p)
        if img is None:
            continue
        h, w = img.shape[:2]

        # use boxes if present; otherwise keep original
        if has_all_boxes(r):
            L, T, R, B = r['left'], r['top'], r['right'], r['bottom']
            # light padding to avoid cutting digits
            L = clamp(L - 4, 0, w - 1)
            T = clamp(T - 4, 0, h - 1)
            R = clamp(R + 4, 0, w - 1)
            B = clamp(B + 4, 0, h - 1)
            crop = img[T:B, L:R]
            # guard against invalid rects
            if crop.size == 0 or (B - T) < 12 or (R - L) < 12:
                crop = img
        else:
            crop = img

        # optional: enhance local contrast a bit (helps white digits on dark jerseys)
        crop = apply_clahe(crop)

        # letterbox to square
        out_img = letterbox_square(crop, size=TARGET, pad_color=128)

        out_path = OUT_DIR / Path(p).name  # keep original filename
        cv2.imwrite(str(out_path), out_img)

        rows.append((str(out_path), r.get('player', '')))
        processed += 1
        if processed % 1000 == 0:
            print(f"Processed {processed} images…")

    # write the new index CSV
    out_index = Path("cv_system/data/processed/jersey_crops_index.csv")
    pd.DataFrame(rows, columns=['img_path', 'player']).to_csv(out_index, index=False)
    print(f"Processed total: {processed}")
    print(f"Wrote index: {out_index}")

if __name__ == "__main__":
    main()


