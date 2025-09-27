# NFL Player Overlay Generator

This directory contains Python scripts to generate player overlays for NFL game videos using computer vision and OCR.

## 🚀 Quick Start

1. **Set up Python environment:**
   ```bash
   cd scripts
   python3 -m venv ../.venv
   source ../.venv/bin/activate  # On Windows: ..\.venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Add your video file:**
   - Place your NFL game video as `../public/game-video.mp4`
   - Or update the `VIDEO_IN` path in `config.py`

4. **Configure team and players:**
   - Edit `config.py` to set `TEAM_ABBR` (e.g., "PHI", "TEN", "TB")
   - Add players to `roster.py` for your team

5. **Run the overlay generator:**
   ```bash
   python run_overlay.py
   # OR
   python Prepare_overlay.py
   ```

## 📁 Files

- **`Prepare_overlay.py`** - Main script that processes video and generates overlays
- **`config.py`** - Configuration settings (paths, team, model parameters)
- **`roster.py`** - Player roster data for team identification
- **`requirements.txt`** - Python package dependencies
- **`run_overlay.py`** - Simple runner script with error checking
- **`README.md`** - This file

## ⚙️ Configuration

Edit `config.py` to customize:

- **Video paths**: Input video and output locations
- **Team**: Set `TEAM_ABBR` to match your video ("PHI", "TEN", "TB", etc.)
- **Model**: Choose YOLO model (`yolov8n.pt` for speed, `yolov8s.pt` for accuracy)
- **Detection**: Adjust confidence thresholds and processing settings
- **OCR**: Tune jersey number detection parameters

## 👥 Adding Players

Edit `roster.py` to add players for your team:

```python
ROSTER["PHI"][1] = {
    "name": "Jalen Hurts",
    "position": "QB", 
    "height": "6'1\"",
    "weight": "223",
    "college": "Alabama/Oklahoma",
    "number": 1
}
```

Or use the helper function:
```python
add_player("PHI", 20, "Reed Blankenship", "S", "6'1\"", "204", "Middle Tennessee")
```

## 📤 Output

The script generates:

1. **`../public/overlay.json`** - JSON file with player detection data for the React app
2. **`../public/overlay_annotated.mp4`** - Video with bounding boxes and player labels

## 🔧 Troubleshooting

**Video not found:**
- Check the video path in `config.py`
- Ensure your video file exists

**Poor jersey number detection:**
- Increase `MIN_DIGIT_CONF` in `config.py`
- Adjust crop fractions (`TOP_FRAC`, `BOTTOM_FRAC`, etc.)
- Try `yolov8s.pt` for better accuracy

**Missing players:**
- Add players to `roster.py` for your team
- Check that `TEAM_ABBR` matches your roster

**Installation issues:**
- Make sure you're in a virtual environment
- Try: `pip install --upgrade pip`
- Install packages individually if needed

## 🎯 Integration with React App

The generated `overlay.json` file is automatically used by the React component `OverlayPlayerVideo.jsx` to display interactive player overlays on the video.

## 📋 Requirements

- Python 3.8+
- OpenCV
- Ultralytics YOLO
- PaddleOCR
- Supervision
- NumPy

See `requirements.txt` for exact versions.
