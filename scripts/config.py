# Configuration for the overlay preparation script
import os

# File paths (adjust these for your setup)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Input/Output paths
VIDEO_IN = os.path.join(PROJECT_ROOT, "public", "game-video.mp4")
OUTPUT_JSON = os.path.join(PROJECT_ROOT, "public", "overlay.json") 
OUTPUT_MP4 = os.path.join(PROJECT_ROOT, "public", "overlay_annotated.mp4")

# Alternative: Use local files in scripts directory
# VIDEO_IN = os.path.join(SCRIPT_DIR, "game-video.mp4")
# OUTPUT_JSON = os.path.join(SCRIPT_DIR, "overlay.json")
# OUTPUT_MP4 = os.path.join(SCRIPT_DIR, "overlay_annotated.mp4")

# Team and model settings
TEAM_ABBR = "PHI"           # Choose the team in your clip (PHI, TEN, TB, etc.)
MODEL = "yolov8s.pt"        # 'yolov8s.pt' for accuracy; 'yolov8n.pt' for speed
CONF = 0.30                 # Detector confidence threshold
IOU = 0.50                  # Intersection over Union threshold
PERSON_CLASS_ID = 0         # YOLO class ID for person detection

# Processing settings
FRAME_STRIDE = 1            # Analyze every N frames (set 2-3 for speed)
UPSCALE_FOR_OCR = 1.8       # Upsize jersey crop before OCR (more readable digits)

# Jersey crop region as a fraction of bbox height/width (torso focus):
TOP_FRAC = 0.30             # Start crop at 30% from top of bounding box
BOTTOM_FRAC = 0.88          # End crop at 88% from top of bounding box  
LEFT_FRAC = 0.15            # Start crop at 15% from left of bounding box
RIGHT_FRAC = 0.85           # End crop at 85% from left of bounding box

# OCR acceptance rules
MIN_DIGIT_CONF = 0.60       # Only accept OCR lines >= this confidence
ALLOWED_LENGTHS = (1, 2)    # Jersey numbers are 1-2 digits
MAJORITY_WINDOW = 12        # Frames for per-track majority vote

def print_config():
    """Print current configuration"""
    print("=== Overlay Preparation Configuration ===")
    print(f"Video Input: {VIDEO_IN}")
    print(f"JSON Output: {OUTPUT_JSON}")
    print(f"MP4 Output: {OUTPUT_MP4}")
    print(f"Team: {TEAM_ABBR}")
    print(f"Model: {MODEL}")
    print(f"Confidence: {CONF}")
    print(f"Frame Stride: {FRAME_STRIDE}")
    print("=" * 40)

if __name__ == "__main__":
    print_config()
