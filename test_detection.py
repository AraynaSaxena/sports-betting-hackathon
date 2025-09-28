#!/usr/bin/env python3
"""
Test script to debug jersey number detection
"""

import requests
import json
import cv2
import numpy as np
import base64
from PIL import Image
import io

def create_test_frame():
    """Create a test frame with mock players"""
    # Create a green field background
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:] = (34, 139, 34)  # Green field
    
    # Add mock players with jersey numbers
    # Player 1 - Tom Brady #12
    cv2.rectangle(frame, (100, 150), (180, 350), (255, 255, 255), -1)  # White jersey
    cv2.putText(frame, "12", (130, 220), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 0, 0), 8)
    
    # Player 2 - Mike Evans #13  
    cv2.rectangle(frame, (300, 140), (380, 340), (0, 0, 255), -1)  # Red jersey
    cv2.putText(frame, "13", (330, 210), cv2.FONT_HERSHEY_SIMPLEX, 3, (255, 255, 255), 8)
    
    # Player 3 - Rob Gronkowski #87
    cv2.rectangle(frame, (500, 160), (580, 360), (255, 255, 255), -1)  # White jersey
    cv2.putText(frame, "87", (520, 230), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 0, 0), 8)
    
    return frame

def test_ai_backend():
    """Test the AI backend with a mock frame"""
    print("🧪 Testing AI Backend Jersey Detection...")
    
    # Create test frame
    frame = create_test_frame()
    
    # Convert to base64
    _, buffer = cv2.imencode('.jpg', frame)
    frame_base64 = base64.b64encode(buffer).decode()
    
    # Send to backend
    url = "http://localhost:5002/process_video_frame"
    payload = {
        "frame": f"data:image/jpeg;base64,{frame_base64}",
        "timestamp": 1234567890
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend Response:")
            print(f"   Success: {result.get('success')}")
            print(f"   Processing Time: {result.get('processing_time', 0):.3f}s")
            print(f"   Detections: {len(result.get('detections', []))}")
            
            for i, detection in enumerate(result.get('detections', [])):
                print(f"\n   Detection {i+1}:")
                print(f"      📍 Bbox: {detection.get('bbox')}")
                print(f"      🎯 Confidence: {detection.get('confidence', 0):.3f}")
                print(f"      🔢 Jersey Number: {detection.get('jersey_number', 'None')}")
                print(f"      🎨 Team Color: {detection.get('team_color', 'None')}")
                print(f"      📊 Stats: {detection.get('stats', 'None')}")
            
            # Save test image for debugging
            cv2.imwrite('test_frame_with_players.jpg', frame)
            print(f"\n💾 Test frame saved as: test_frame_with_players.jpg")
            
            return result
            
        else:
            print(f"❌ Backend Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

if __name__ == "__main__":
    result = test_ai_backend()
    
    if result and result.get('success'):
        detections = result.get('detections', [])
        jersey_numbers = [d.get('jersey_number') for d in detections if d.get('jersey_number')]
        
        if jersey_numbers:
            print(f"\n🎉 SUCCESS: Detected jersey numbers: {jersey_numbers}")
        else:
            print(f"\n⚠️ ISSUE: No jersey numbers detected from {len(detections)} players")
            print("💡 This explains why frontend shows 'Unknown'")
    else:
        print("\n❌ Backend test failed")
