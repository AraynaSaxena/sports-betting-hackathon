#!/usr/bin/env python3
"""
Demo Video Processor
This script processes a sample video file to demonstrate the AI model capabilities
"""

import cv2
import numpy as np
import argparse
import time
import os
from pathlib import Path
from player_detector import PlayerDetector
from stats_service import StatsService
from video_processor import VideoProcessor

def create_demo_video(output_path="demo_video.mp4", duration=10):
    """Create a demo video with mock NFL players"""
    print("🎬 Creating demo video...")
    
    # Video properties
    width, height = 1280, 720
    fps = 30
    total_frames = duration * fps
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Player data for animation
    players = [
        {"name": "Brady", "number": 12, "color": (0, 0, 255), "start_pos": (200, 300)},
        {"name": "Evans", "number": 13, "color": (255, 0, 0), "start_pos": (400, 250)},
        {"name": "Gronk", "number": 87, "color": (255, 255, 255), "start_pos": (600, 350)},
        {"name": "Godwin", "number": 14, "color": (0, 255, 0), "start_pos": (800, 280)},
    ]
    
    for frame_num in range(total_frames):
        # Create green field background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:] = (34, 139, 34)  # Forest green
        
        # Add field lines
        cv2.line(frame, (0, height//2), (width, height//2), (255, 255, 255), 3)
        for x in range(0, width, 100):
            cv2.line(frame, (x, 0), (x, height), (255, 255, 255), 1)
        
        # Animate players
        for i, player in enumerate(players):
            # Calculate animated position
            progress = frame_num / total_frames
            x_offset = int(100 * np.sin(progress * 2 * np.pi + i))
            y_offset = int(20 * np.cos(progress * 4 * np.pi + i))
            
            x = player["start_pos"][0] + x_offset
            y = player["start_pos"][1] + y_offset
            
            # Draw player (rectangle representing person)
            player_width, player_height = 60, 120
            cv2.rectangle(frame, 
                         (x - player_width//2, y - player_height//2),
                         (x + player_width//2, y + player_height//2),
                         player["color"], -1)
            
            # Add jersey number
            font = cv2.FONT_HERSHEY_SIMPLEX
            text = str(player["number"])
            text_size = cv2.getTextSize(text, font, 2, 3)[0]
            text_x = x - text_size[0] // 2
            text_y = y + text_size[1] // 2
            
            # Add black outline for better visibility
            cv2.putText(frame, text, (text_x, text_y), font, 2, (0, 0, 0), 5)
            cv2.putText(frame, text, (text_x, text_y), font, 2, (255, 255, 255), 3)
            
            # Add player name
            name_size = cv2.getTextSize(player["name"], font, 0.8, 2)[0]
            name_x = x - name_size[0] // 2
            name_y = y + player_height//2 + 30
            cv2.putText(frame, player["name"], (name_x, name_y), font, 0.8, (255, 255, 255), 2)
        
        # Add frame counter
        cv2.putText(frame, f"Frame: {frame_num}/{total_frames}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Add demo watermark
        cv2.putText(frame, "AI NFL Detection Demo", (width - 300, height - 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        out.write(frame)
        
        # Progress indicator
        if frame_num % 30 == 0:
            progress = (frame_num / total_frames) * 100
            print(f"   Progress: {progress:.1f}%")
    
    out.release()
    print(f"✅ Demo video created: {output_path}")
    return output_path

def process_demo_video(video_path, output_path=None):
    """Process the demo video with AI detection"""
    print(f"🤖 Processing video with AI: {video_path}")
    
    # Initialize components
    processor = VideoProcessor()
    
    # Process the video
    result = processor.process_video_file(video_path, output_path)
    
    if result['success']:
        print("✅ Video processing completed successfully!")
        print(f"   📊 Frames processed: {result['frames_processed']}")
        print(f"   👥 Total detections: {result['total_detections']}")
        if output_path:
            print(f"   🎬 Output video: {output_path}")
    else:
        print(f"❌ Video processing failed: {result.get('error', 'Unknown error')}")
    
    return result

def run_live_demo():
    """Run a live demo using webcam"""
    print("📹 Starting live demo with webcam...")
    print("Press 'q' to quit, 's' to save frame")
    
    # Initialize components
    detector = PlayerDetector()
    stats_service = StatsService()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Could not open webcam")
        return
    
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Process every 5th frame for performance
            if frame_count % 5 == 0:
                # Detect players
                detections = detector.detect_players_and_numbers(frame)
                
                # Enhance with stats
                for detection in detections:
                    if detection.get('jersey_number'):
                        stats = stats_service.get_player_stats(detection['jersey_number'])
                        if stats:
                            detection['stats'] = stats
                
                # Visualize
                frame = detector.visualize_detections(frame, detections)
                
                # Add info overlay
                info_text = f"Frame: {frame_count} | Players: {len(detections)}"
                cv2.putText(frame, info_text, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Display frame
            cv2.imshow('AI NFL Detection - Live Demo', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                filename = f"demo_frame_{frame_count}.jpg"
                cv2.imwrite(filename, frame)
                print(f"💾 Saved frame: {filename}")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("📹 Live demo ended")

def main():
    parser = argparse.ArgumentParser(description="AI NFL Player Detection Demo")
    parser.add_argument('--mode', choices=['create', 'process', 'live'], default='create',
                       help='Demo mode: create demo video, process existing video, or live webcam')
    parser.add_argument('--input', help='Input video file path')
    parser.add_argument('--output', help='Output video file path')
    parser.add_argument('--duration', type=int, default=10, help='Demo video duration in seconds')
    
    args = parser.parse_args()
    
    print("🏈 AI NFL Player Detection Demo")
    print("=" * 40)
    
    if args.mode == 'create':
        # Create demo video
        output_path = args.output or "demo_video.mp4"
        video_path = create_demo_video(output_path, args.duration)
        
        # Ask if user wants to process it
        response = input("\n🤖 Process the demo video with AI? (y/n): ")
        if response.lower() == 'y':
            processed_output = output_path.replace('.mp4', '_processed.mp4')
            process_demo_video(video_path, processed_output)
    
    elif args.mode == 'process':
        if not args.input:
            print("❌ Please specify input video with --input")
            return
        
        if not os.path.exists(args.input):
            print(f"❌ Input video not found: {args.input}")
            return
        
        output_path = args.output or args.input.replace('.mp4', '_processed.mp4')
        process_demo_video(args.input, output_path)
    
    elif args.mode == 'live':
        run_live_demo()
    
    print("\n🎉 Demo completed!")
    print("\n💡 Next steps:")
    print("   1. Start the full system: ./start_ai_system.sh")
    print("   2. Open http://localhost:3000")
    print("   3. Toggle to 'AI MODE' and click 'AI ON'")

if __name__ == "__main__":
    main()
