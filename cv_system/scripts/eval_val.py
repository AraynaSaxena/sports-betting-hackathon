# cv_system/scripts/eval_val.py
import os, sys
from pathlib import Path

# --- make imports work even if run directly: python cv_system/scripts/eval_val.py
THIS = Path(__file__).resolve()
REPO = THIS.parents[2]  # sports-betting-demo/
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

# try processed first; fall back to raw if missing
CSV_PROCESSED = REPO / "cv_system/data/processed/jersey_crops_index.csv"
CSV_RAW       = REPO / "cv_system/data/raw/train_player_numbers.csv"

USE_PROCESSED = CSV_PROCESSED.exists()
CSV = str(CSV_PROCESSED if USE_PROCESSED else CSV_RAW)

from cv_system.training.datasets import build_dataframe, make_ds  # now works
from sklearn.model_selection import train_test_split

print(f"[EVAL] Using CSV: {CSV} (processed={USE_PROCESSED})")
df = build_dataframe(CSV, images_from_processed=USE_PROCESSED)

# same split as training (15% val, seed=42)
_, val_df = train_test_split(df, test_size=0.15, stratify=df['y'], random_state=42)

val_ds = make_ds(val_df['img_path'].tolist(),
                 val_df['y'].astype(int).tolist(),
                 training=False)

MODEL_PATH = REPO / "cv_system/data/models/jersey_efficientnet.keras"
print(f"[EVAL] Loading model: {MODEL_PATH}")
model = tf.keras.models.load_model(str(MODEL_PATH))

print("[EVAL] Predicting on validation set…")
y_true, y_pred = [], []
for imgs, labels in val_ds:
    logits = model.predict(imgs, verbose=0)
    y_pred.extend(np.argmax(logits, -1))
    y_true.extend(np.argmax(labels.numpy(), -1))

print("\n=== Classification Report ===")
print(classification_report(y_true, y_pred, digits=3))
cm = confusion_matrix(y_true, y_pred)
print("Confusion matrix shape:", cm.shape)
print("Sample of first 10 rows of confusion matrix:\n", cm[:10, :10])

