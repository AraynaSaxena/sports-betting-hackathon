#!/usr/bin/env python3
"""
Quick test to verify YOLO is working with real player detection
"""

import sys
import os
sys.path.append('ai_backend')

from player_detector import PlayerDetector
import cv2
import numpy as np

def test_yolo_detection():
    print("🧪 Testing YOLO Player Detection...")
    
    # Initialize detector
    detector = PlayerDetector()
    
    # Create a test image with people-like shapes
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (34, 139, 34)  # Green field
    
    # Add some "people" shapes
    # Person 1
    cv2.rectangle(img, (100, 200), (150, 350), (255, 255, 255), -1)  # White jersey
    cv2.putText(img, "12", (115, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    
    # Person 2  
    cv2.rectangle(img, (300, 180), (350, 330), (0, 0, 255), -1)  # Red jersey
    cv2.putText(img, "87", (315, 230), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
    
    # Person 3
    cv2.rectangle(img, (500, 220), (550, 370), (0, 255, 0), -1)  # Green jersey  
    cv2.putText(img, "13", (515, 270), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    
    print("📸 Created test image with 3 mock players")
    
    # Run YOLO detection
    detections = detector.detect_players_and_numbers(img)
    
    print(f"🎯 YOLO detected {len(detections)} objects")
    
    for i, detection in enumerate(detections):
        print(f"   Detection {i+1}:")
        print(f"      📍 Bbox: {detection.get('bbox', 'None')}")
        print(f"      🎯 Confidence: {detection.get('confidence', 0):.3f}")
        print(f"      🔢 Jersey: {detection.get('jersey_number', 'None')}")
        print(f"      🎨 Color: {detection.get('team_color', 'None')}")
    
    # Save visualization
    if detections:
        viz_img = detector.visualize_detections(img, detections)
        cv2.imwrite('yolo_test_result.jpg', viz_img)
        print("💾 Saved visualization as yolo_test_result.jpg")
    
    return len(detections) > 0

if __name__ == "__main__":
    success = test_yolo_detection()
    
    if success:
        print("✅ YOLO is working! Players detected successfully.")
    else:
        print("❌ YOLO detection failed. Check model installation.")
        print("💡 Try running: cd ai_backend && python3 setup.py")
