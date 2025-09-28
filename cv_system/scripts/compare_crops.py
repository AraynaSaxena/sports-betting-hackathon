# Saves a grid comparing RAW vs PROCESSED for the same filenames.
import os, random, csv
from pathlib import Path
import cv2
import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parents[2]
CSV_PROCESSED = REPO / "cv_system/data/processed/jersey_crops_index.csv"
CSV_RAW       = REPO / "cv_system/data/raw/train_player_numbers.csv"

OUT_IMG = REPO / "cv_system/data/processed/crop_check_grid.png"
N_COLS = 4     # number of samples per row
N_ROWS = 4     # number of rows

def read_processed_index():
    dfp = pd.read_csv(CSV_PROCESSED)
    # processed csv has columns: img_path, player
    dfp["fname"] = dfp["img_path"].apply(lambda p: Path(p).name)
    return dfp

def read_raw_index():
    dfr = pd.read_csv(CSV_RAW)
    # raw csv has 'filepath' like train_player_numbers/xxxx.png
    dfr["img_path"] = dfr["filepath"].apply(lambda p: str(REPO / "cv_system/data/raw" / p))
    dfr["fname"] = dfr["img_path"].apply(lambda p: Path(p).name)
    return dfr

def letterbox(img, size=224):
    h, w = img.shape[:2]
    scale = min(size/w, size/h)
    nh, nw = int(h*scale), int(w*scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.full((size, size, 3), 114, dtype=np.uint8)
    y0 = (size-nh)//2; x0 = (size-nw)//2
    canvas[y0:y0+nh, x0:x0+nw] = resized
    return canvas

def main():
    if not CSV_PROCESSED.exists():
        print("[!] Processed CSV not found. Run precrop_jerseys.py first.")
        return

    dfp = read_processed_index()
    dfr = read_raw_index()

    # join on filename so we can show the same example raw vs processed
    merged = pd.merge(dfp[["fname","img_path"]].rename(columns={"img_path":"proc_path"}),
                      dfr[["fname","img_path"]].rename(columns={"img_path":"raw_path"}),
                      on="fname", how="inner")
    if len(merged) == 0:
        print("[!] No filename overlap found. Check your folders.")
        return

    sample = merged.sample(n=min(N_COLS*N_ROWS, len(merged)), random_state=42)

    tiles = []
    for _, r in sample.iterrows():
        raw = cv2.imread(r["raw_path"])
        proc = cv2.imread(r["proc_path"])
        if raw is None or proc is None:
            continue
        raw = letterbox(raw, 224)
        proc = letterbox(proc, 224)

        # stack raw (left) and processed (right)
        pair = cv2.hconcat([raw, proc])
        tiles.append(pair)

    # build grid
    rows = []
    for i in range(0, len(tiles), N_COLS):
        row_tiles = tiles[i:i+N_COLS]
        if len(row_tiles) < N_COLS:
            # pad with gray panels if needed
            pad = np.full_like(tiles[0], 114)
            row_tiles += [pad]*(N_COLS - len(row_tiles))
        rows.append(cv2.hconcat(row_tiles) if len(row_tiles)==1 else cv2.hconcat(row_tiles))
    grid = cv2.vconcat(rows)

    cv2.imwrite(str(OUT_IMG), grid)
    print(f"[OK] Wrote comparison grid to: {OUT_IMG}")
    print("Left of each pair = RAW, Right = PROCESSED")

if __name__ == "__main__":
    main()
