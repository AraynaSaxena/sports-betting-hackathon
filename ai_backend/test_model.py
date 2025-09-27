#!/usr/bin/env python3
"""
Test script for the AI model
This script tests the player detection and stats integration
"""

import cv2
import numpy as np
import json
import time
from player_detector import PlayerDetector
from stats_service import StatsService
from video_processor import VideoProcessor

def create_test_image():
    """Create a test image with mock players"""
    # Create a green field background
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (34, 139, 34)  # Forest green
    
    # Add some "players" (rectangles)
    # Player 1 - Red jersey
    cv2.rectangle(img, (100, 200), (150, 350), (0, 0, 255), -1)
    cv2.putText(img, "12", (115, 250), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
    
    # Player 2 - Blue jersey
    cv2.rectangle(img, (300, 180), (350, 330), (255, 0, 0), -1)
    cv2.putText(img, "87", (315, 230), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
    
    # Player 3 - White jersey
    cv2.rectangle(img, (500, 220), (550, 370), (255, 255, 255), -1)
    cv2.putText(img, "13", (515, 270), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    
    return img

def test_player_detector():
    """Test the player detector"""
    print("🧪 Testing Player Detector...")
    
    try:
        detector = PlayerDetector()
        
        # Create test image
        test_img = create_test_image()
        
        # Save test image for debugging
        cv2.imwrite("test_image.jpg", test_img)
        print("   💾 Test image saved as test_image.jpg")
        
        # Run detection
        start_time = time.time()
        detections = detector.detect_players_and_numbers(test_img)
        processing_time = time.time() - start_time
        
        print(f"   ⏱️ Processing time: {processing_time:.3f} seconds")
        print(f"   👥 Detected {len(detections)} players")
        
        for i, detection in enumerate(detections):
            print(f"   Player {i+1}:")
            print(f"      📍 Position: {detection['bbox']}")
            print(f"      🎯 Confidence: {detection['confidence']:.3f}")
            print(f"      🔢 Jersey: {detection.get('jersey_number', 'Not detected')}")
            print(f"      🎨 Team Color: {detection.get('team_color', 'Unknown')}")
        
        # Create visualization
        viz_img = detector.visualize_detections(test_img, detections)
        cv2.imwrite("test_detections.jpg", viz_img)
        print("   🖼️ Visualization saved as test_detections.jpg")
        
        return len(detections) > 0
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_stats_service():
    """Test the stats service"""
    print("\n📊 Testing Stats Service...")
    
    try:
        stats_service = StatsService()
        
        # Test jersey numbers
        test_jerseys = [12, 87, 13, 9, 1]
        
        for jersey in test_jerseys:
            stats = stats_service.get_player_stats(jersey)
            
            if stats:
                print(f"   #{jersey}: {stats['name']} ({stats['position']}, {stats['team']})")
                
                # Print some key stats
                player_stats = stats.get('stats', {})
                if 'passing_yards' in player_stats:
                    print(f"      🏈 Passing: {player_stats['passing_yards']} yards, {player_stats.get('passing_tds', 0)} TDs")
                if 'receiving_yards' in player_stats:
                    print(f"      🤲 Receiving: {player_stats['receiving_yards']} yards, {player_stats.get('receiving_tds', 0)} TDs")
                if 'rushing_yards' in player_stats:
                    print(f"      🏃 Rushing: {player_stats['rushing_yards']} yards, {player_stats.get('rushing_tds', 0)} TDs")
            else:
                print(f"   #{jersey}: No data found")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_video_processor():
    """Test the video processor"""
    print("\n🎥 Testing Video Processor...")
    
    try:
        processor = VideoProcessor()
        
        # Create test image
        test_img = create_test_image()
        
        # Process frame
        start_time = time.time()
        result = processor.process_frame(test_img)
        processing_time = time.time() - start_time
        
        print(f"   ⏱️ Processing time: {processing_time:.3f} seconds")
        print(f"   ✅ Success: {result['success']}")
        
        if result['success']:
            detections = result['detections']
            print(f"   👥 Detected {len(detections)} players")
            
            for i, detection in enumerate(detections):
                if detection.get('stats'):
                    stats = detection['stats']
                    print(f"   Player {i+1}: {stats['name']} (#{detection.get('jersey_number')})")
        
        # Test processing stats
        stats = processor.get_processing_stats()
        print(f"   📈 Processing Stats: {json.dumps(stats, indent=2)}")
        
        return result['success']
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_integration():
    """Test full integration"""
    print("\n🔗 Testing Full Integration...")
    
    try:
        # Create components
        detector = PlayerDetector()
        stats_service = StatsService()
        processor = VideoProcessor()
        
        # Create test image
        test_img = create_test_image()
        
        # Full pipeline test
        start_time = time.time()
        
        # Step 1: Detect players
        detections = detector.detect_players_and_numbers(test_img)
        
        # Step 2: Enhance with stats
        enhanced_detections = []
        for detection in detections:
            if detection.get('jersey_number'):
                stats = stats_service.get_player_stats(detection['jersey_number'])
                if stats:
                    detection['stats'] = stats
                    detection['betting_context'] = stats_service.get_betting_context(stats.get('stats', {}))
            enhanced_detections.append(detection)
        
        # Step 3: Create visualization
        viz_img = processor.create_annotated_frame(test_img, enhanced_detections)
        cv2.imwrite("test_integration.jpg", viz_img)
        
        total_time = time.time() - start_time
        
        print(f"   ⏱️ Total processing time: {total_time:.3f} seconds")
        print(f"   👥 Enhanced detections: {len(enhanced_detections)}")
        print(f"   🖼️ Annotated image saved as test_integration.jpg")
        
        # Print detailed results
        for i, detection in enumerate(enhanced_detections):
            print(f"\n   Player {i+1} Details:")
            print(f"      🔢 Jersey: #{detection.get('jersey_number', 'Unknown')}")
            print(f"      📍 Position: {detection['bbox']}")
            print(f"      🎯 Confidence: {detection['confidence']:.3f}")
            
            if detection.get('stats'):
                stats = detection['stats']
                print(f"      👤 Name: {stats['name']}")
                print(f"      🏈 Position: {stats['position']}")
                print(f"      🏟️ Team: {stats['team']}")
                print(f"      📊 Context: {stats.get('context', 'N/A')}")
        
        return len(enhanced_detections) > 0
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 AI Model Testing Suite")
    print("=" * 50)
    
    tests = [
        ("Player Detector", test_player_detector),
        ("Stats Service", test_stats_service),
        ("Video Processor", test_video_processor),
        ("Full Integration", test_integration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔬 Running {test_name} Test...")
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                print(f"✅ {test_name} test passed")
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"💥 {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your AI model is ready!")
        print("\n💡 Next steps:")
        print("   1. Run 'python app.py' to start the backend")
        print("   2. Test with real video frames")
        print("   3. Integrate with your React frontend")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure all dependencies are installed")
        print("   2. Check if YOLO model downloaded correctly")
        print("   3. Verify OCR is working properly")

if __name__ == "__main__":
    main()
