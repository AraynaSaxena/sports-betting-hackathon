#!/usr/bin/env python3
"""
Create a test video with people that YOLO can detect
"""

import cv2
import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFont
import io

def create_nfl_test_video():
    """Create a test video with people-like figures that YOLO can detect"""
    print("🎬 Creating NFL test video with detectable players...")
    
    # Video properties
    width, height = 1280, 720
    fps = 30
    duration = 10  # seconds
    total_frames = duration * fps
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    output_path = 'public/game-video.mp4'
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Download a sample image with people (or create realistic figures)
    try:
        # Try to get a sample image with people
        print("📥 Downloading sample NFL image...")
        response = requests.get('https://via.placeholder.com/1280x720/228B22/FFFFFF?text=NFL+FIELD', timeout=10)
        if response.status_code == 200:
            # Create base field image
            field_img = Image.open(io.BytesIO(response.content))
        else:
            raise Exception("Download failed")
    except:
        print("⚠️ Using generated field background")
        field_img = Image.new('RGB', (width, height), (34, 139, 34))  # Green field
    
    # Add field markings
    draw = ImageDraw.Draw(field_img)
    
    # Draw field lines
    for y in range(0, height, 60):
        draw.line([(0, y), (width, y)], fill='white', width=2)
    
    # Draw yard lines
    for x in range(0, width, 100):
        draw.line([(x, 0), (x, height)], fill='white', width=3)
    
    # Convert to OpenCV format
    field_frame = cv2.cvtColor(np.array(field_img), cv2.COLOR_RGB2BGR)
    
    print(f"🎥 Generating {total_frames} frames...")
    
    for frame_num in range(total_frames):
        # Create frame
        frame = field_frame.copy()
        
        # Calculate animation progress
        progress = frame_num / total_frames
        
        # Add moving "players" (realistic human-like figures)
        players = [
            {"name": "Brady", "number": 12, "color": (255, 255, 255), "start_x": 200, "start_y": 300},
            {"name": "Evans", "number": 13, "color": (0, 0, 255), "start_x": 400, "start_y": 250},
            {"name": "Gronk", "number": 87, "color": (255, 255, 255), "start_x": 600, "start_y": 350},
            {"name": "Godwin", "number": 14, "color": (0, 255, 0), "start_x": 800, "start_y": 280},
            {"name": "Fournette", "number": 28, "color": (255, 255, 255), "start_x": 300, "start_y": 400},
        ]
        
        for i, player in enumerate(players):
            # Animate player movement
            x_offset = int(150 * np.sin(progress * 2 * np.pi + i * 0.5))
            y_offset = int(30 * np.cos(progress * 4 * np.pi + i * 0.3))
            
            x = player["start_x"] + x_offset
            y = player["start_y"] + y_offset
            
            # Draw realistic player figure (more human-like)
            # Head
            cv2.circle(frame, (x, y - 60), 15, player["color"], -1)
            cv2.circle(frame, (x, y - 60), 15, (0, 0, 0), 2)
            
            # Body (jersey)
            body_points = np.array([
                [x - 25, y - 45],  # shoulders
                [x + 25, y - 45],
                [x + 30, y + 10],  # torso
                [x - 30, y + 10]
            ], np.int32)
            cv2.fillPoly(frame, [body_points], player["color"])
            cv2.polylines(frame, [body_points], True, (0, 0, 0), 2)
            
            # Arms
            cv2.line(frame, (x - 25, y - 30), (x - 40, y - 10), (222, 184, 135), 8)  # skin color
            cv2.line(frame, (x + 25, y - 30), (x + 40, y - 10), (222, 184, 135), 8)
            
            # Legs
            cv2.line(frame, (x - 15, y + 10), (x - 20, y + 60), player["color"], 12)
            cv2.line(frame, (x + 15, y + 10), (x + 20, y + 60), player["color"], 12)
            
            # Feet
            cv2.ellipse(frame, (x - 20, y + 65), (8, 4), 0, 0, 360, (0, 0, 0), -1)
            cv2.ellipse(frame, (x + 20, y + 65), (8, 4), 0, 0, 360, (0, 0, 0), -1)
            
            # Jersey number (large and clear)
            font = cv2.FONT_HERSHEY_SIMPLEX
            text = str(player["number"])
            text_size = cv2.getTextSize(text, font, 1.5, 3)[0]
            text_x = x - text_size[0] // 2
            text_y = y - 10
            
            # Number background
            cv2.rectangle(frame, (text_x - 5, text_y - 25), (text_x + text_size[0] + 5, text_y + 5), (0, 0, 0), -1)
            # Number text
            cv2.putText(frame, text, (text_x, text_y), font, 1.5, (255, 255, 255), 3)
            
            # Player name below
            name_size = cv2.getTextSize(player["name"], font, 0.6, 2)[0]
            name_x = x - name_size[0] // 2
            name_y = y + 80
            cv2.putText(frame, player["name"], (name_x, name_y), font, 0.6, (255, 255, 255), 2)
        
        # Add frame info
        cv2.putText(frame, f"Frame: {frame_num}/{total_frames}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        cv2.putText(frame, "AI NFL Detection Test Video", (10, height - 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Write frame
        out.write(frame)
        
        # Progress indicator
        if frame_num % 30 == 0:
            progress_pct = (frame_num / total_frames) * 100
            print(f"   Progress: {progress_pct:.1f}%")
    
    out.release()
    print(f"✅ Test video created: {output_path}")
    print("💡 This video contains realistic human figures that YOLO should detect")
    return output_path

if __name__ == "__main__":
    video_path = create_nfl_test_video()
    print(f"\n🎉 Success! Your test video is ready at: {video_path}")
    print("\n🎮 Next steps:")
    print("   1. Refresh your React app")
    print("   2. The new video should load automatically")
    print("   3. You should see YOLO detecting the human figures")
    print("   4. Jersey numbers should appear when you hover over detected players")
