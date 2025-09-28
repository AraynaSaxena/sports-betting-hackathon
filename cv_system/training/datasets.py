# cv_system/training/datasets.py
import os
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split

# --- top-level constants ---
IMG_SIZE = (256, 256)     # was (224,224)
NUM_CLASSES = 99
BATCH = 24                # reduce a bit since images got bigger

def build_dataframe(csv_path, images_from_processed=False):
    """
    csv_path:
      - processed mode: 'cv_system/data/processed/jersey_crops_index.csv' (has columns img_path, player)
      - raw mode: 'cv_system/data/raw/train_player_numbers.csv' (will build img_path using filepath)
    images_from_processed:
      - True  -> CSV already has absolute img paths in 'img_path'
      - False -> build from cv_system/data/raw + CSV 'filepath'
    """
    df = pd.read_csv(csv_path)

    if images_from_processed:
        assert 'img_path' in df.columns, "Processed CSV must include 'img_path'."
    else:
        assert 'filepath' in df.columns, "Raw CSV must include 'filepath'."
        df['img_path'] = "cv_system/data/raw/" + df['filepath'].astype(str)

    # keep rows whose files exist
    df = df[df['img_path'].apply(os.path.exists)].copy()

    # parse jersey numbers from 'player' like V84/H12
    ex = df['player'].astype(str).str.extract(r'^([VH])(\d{1,2})$')
    df['jersey_num'] = pd.to_numeric(ex[1], errors='coerce')
    df = df[df['jersey_num'].between(1, 99)].copy()
    df['y'] = df['jersey_num'].astype(int) - 1

    # drop path duplicates
    df = df.drop_duplicates(subset=['img_path']).reset_index(drop=True)
    return df

def make_ds(paths, labels, training):
    def load(p, y):
        img = tf.io.read_file(p)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, IMG_SIZE, antialias=True)
        img = tf.image.convert_image_dtype(img, tf.float32)  # [0,1]

        # slight zoom-in (center crop) 30% of the time to focus digits
        if training:
            do_zoom = tf.random.uniform(()) < 0.30

            def zoom(img):
                h = tf.shape(img)[0]; w = tf.shape(img)[1]
                zh = tf.cast(tf.round(0.92 * tf.cast(h, tf.float32)), tf.int32)  # up to ~8% zoom
                zw = tf.cast(tf.round(0.92 * tf.cast(w, tf.float32)), tf.int32)
                y0 = (h - zh) // 2; x0 = (w - zw) // 2
                img = img[y0:y0+zh, x0:x0+zw]
                return tf.image.resize(img, IMG_SIZE, antialias=True)

            img = tf.cond(do_zoom, lambda: zoom(img), lambda: img)

        if training:
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_brightness(img, 0.08)
            img = tf.image.random_contrast(img, 0.9, 1.1)
        return img, tf.one_hot(y, NUM_CLASSES)

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(len(paths), seed=42)
    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(BATCH).prefetch(tf.data.AUTOTUNE)

def stratified_split(df, test_size=0.15):
    tr, va = train_test_split(df, test_size=test_size, stratify=df['y'], random_state=42)
    return tr, va
