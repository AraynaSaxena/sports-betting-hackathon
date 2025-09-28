import glob, random, cv2
from pathlib import Path

IMG_DIR = Path("cv_system/data/processed/jersey_crops")
paths = glob.glob(str(IMG_DIR / "*.png"))
sample = random.sample(paths, min(16, len(paths)))

rows, cols = 4, 4
thumbs = []
for p in sample:
    im = cv2.imread(p)
    im = cv2.resize(im, (224, 224))
    thumbs.append(im)

# build a 4x4 grid
grid = []
for r in range(rows):
    row = thumbs[r*cols:(r+1)*cols]
    grid.append(cv2.hconcat(row))
montage = cv2.vconcat(grid)

cv2.imshow("Jersey Crops Preview", montage)
cv2.waitKey(0)
