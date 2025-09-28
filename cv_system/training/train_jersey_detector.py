# cv_system/training/train_jersey_detector.py
import os
import numpy as np
import pandas as pd
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# enable mixed precision if GPU present
if len(tf.config.list_physical_devices("GPU")) > 0:
    tf.keras.mixed_precision.set_global_policy("mixed_float16")
    print("[MP] Mixed precision ENABLED")
else:
    print("[MP] No GPU detected; running in float32")

# AdamW (fallback to Adam if not available)
try:
    from tensorflow.keras.optimizers import AdamW
    HAS_ADAMW = True
except Exception:
    from tensorflow.keras.optimizers import Adam as AdamW  # type: ignore
    HAS_ADAMW = False

from cv_system.training.datasets import build_dataframe, make_ds, stratified_split, IMG_SIZE, NUM_CLASSES, BATCH

EPOCHS_FROZEN = 8
EPOCHS_FT = 5
UNFREEZE_TAIL = 40

USE_PROCESSED = True  # <— keep True

CSV_PROCESSED = "cv_system/data/processed/jersey_crops_index.csv"
CSV_RAW = "cv_system/data/raw/train_player_numbers.csv"

OUT_MODEL = "cv_system/data/models/jersey_efficientnet.keras"
Path(Path(OUT_MODEL).parents[0]).mkdir(parents=True, exist_ok=True)

def build_model(backbone="v2"):
    # prefer EfficientNetV2B0 if available
    if hasattr(tf.keras.applications, "efficientnet_v2"):
        print("[MODEL] EfficientNetV2B0")
        base = tf.keras.applications.efficientnet_v2.EfficientNetV2B0(
            include_top=False, weights="imagenet",
            input_shape=(*IMG_SIZE, 3), pooling="avg"
        )
    else:
        print("[MODEL] EfficientNetB0 (fallback)")
        base = tf.keras.applications.EfficientNetB0(
            include_top=False, weights="imagenet",
            input_shape=(*IMG_SIZE, 3), pooling="avg"
        )
    base.trainable = False

    inp = layers.Input(shape=(*IMG_SIZE, 3))
    x = base(inp, training=False)
    x = layers.Dropout(0.30)(x)
    out = layers.Dense(NUM_CLASSES, activation="softmax", dtype="float32")(x)  # keep final in fp32
    model = models.Model(inp, out)
    return model, base

def compute_class_weights(train_df):
    # balanced class weights without sklearn
    counts = train_df["y"].value_counts().to_dict()
    total = len(train_df)
    weights = {c: total / (NUM_CLASSES * counts.get(c, 1)) for c in range(NUM_CLASSES)}

    # ---- boosts for harder classes ----
    hard = [19,20,22,23,24,25,26,28,29,31,32,34,37,41,43,46,49,
            50,51,52,53,54,57,58,61,64,67,68,69,70,71,72,74,76,77,
            78,81,82,84,89,90,92,93,95,96,97,98]
    very_hard = [54,57,90,93,96,97,50,52]
    for c in hard:
        if c in weights:
            weights[c] *= 1.25
    for c in very_hard:
        if c in weights:
            weights[c] *= 1.50
    # -----------------------------------
    return weights

def main():
    # choose which CSV to use
    csv_path = CSV_PROCESSED if USE_PROCESSED else CSV_RAW
    df = build_dataframe(csv_path, images_from_processed=USE_PROCESSED)
    print(f"[DATA] samples={len(df)} classes={df['y'].nunique()} using {csv_path}")

    # stratified split
    tr, va = stratified_split(df, 0.15)
    print(f"[SPLIT] train={len(tr)} val={len(va)}")

    # ---- cosine schedules (depends on len(tr)) ----
    steps_per_epoch = max(1, len(tr) // BATCH)
    cos1 = tf.keras.optimizers.schedules.CosineDecayRestarts(
        initial_learning_rate=1e-3,
        first_decay_steps=steps_per_epoch * max(1, EPOCHS_FROZEN // 2)
    )
    cos2 = tf.keras.optimizers.schedules.CosineDecay(
        initial_learning_rate=2e-4,
        decay_steps=steps_per_epoch * max(1, EPOCHS_FT)
    )
    # ------------------------------------------------

    train_ds = make_ds(tr['img_path'].tolist(), tr['y'].astype(int).tolist(), training=True)
    val_ds   = make_ds(va['img_path'].tolist(), va['y'].astype(int).tolist(), training=False)

    class_weights = compute_class_weights(tr)

    model, base = build_model()

    loss = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.10)

    # Stage 1 optimizer: cosine restarts
    opt1 = AdamW(learning_rate=cos1, weight_decay=1e-4) if HAS_ADAMW else AdamW(learning_rate=1e-3)
    model.compile(optimizer=opt1, loss=loss, metrics=["accuracy"])

    cbs = [
        EarlyStopping(monitor="val_accuracy", patience=2, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=1, min_lr=1e-5),
    ]

    print("[TRAIN] Stage 1 (frozen)")
    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FROZEN,
              callbacks=cbs, class_weight=class_weights, verbose=1)

    # unfreeze a small tail and finetune
    if EPOCHS_FT > 0 and UNFREEZE_TAIL > 0:
        print(f"[TRAIN] Stage 2 (finetune last {UNFREEZE_TAIL} layers)")
        unfrozen = 0
        for layer in reversed(base.layers):
            if unfrozen >= UNFREEZE_TAIL:
                break
            if isinstance(layer, layers.BatchNormalization):
                continue
            layer.trainable = True
            unfrozen += 1

        # Stage 2 optimizer: cosine decay
        opt2 = AdamW(learning_rate=cos2, weight_decay=1e-5) if HAS_ADAMW else AdamW(learning_rate=2e-4)
        model.compile(optimizer=opt2, loss=loss, metrics=["accuracy"])

        model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FT,
                  callbacks=cbs, class_weight=class_weights, verbose=1)

    model.save(OUT_MODEL)
    print(f"[SAVE] {OUT_MODEL}")

    # quick sanity check
    try:
        batch = next(iter(val_ds))
        logits = model.predict(batch[0][:8], verbose=0)
        preds = np.argmax(logits, axis=-1)
        truth = np.argmax(batch[1][:8].numpy(), axis=-1)
        print("[CHECK] preds+1:", preds + 1)
        print("[CHECK] truth+1:", truth + 1)
    except StopIteration:
        print("[CHECK] empty val_ds; skipping")

if __name__ == "__main__":
    main()
