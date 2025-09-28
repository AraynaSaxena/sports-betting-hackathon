from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import time
from player_detector import PlayerDetector
from stats_service import StatsService

app = Flask(__name__)
CORS(app)

# Initialize services
print("🚀 Starting Simple AI Backend...")
detector = PlayerDetector()
stats_service = StatsService()
print("✅ AI Backend Ready!")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "message": "AI Backend is running",
        "services": {
            "player_detection": "ready",
            "jersey_ocr": "ready", 
            "stats_service": "ready"
        }
    })

@app.route('/process_video_frame', methods=['POST'])
def process_video_frame():
    """Process a video frame and return player detections with bounding boxes"""
    try:
        data = request.json
        
        if 'frame' not in data:
            return jsonify({"success": False, "error": "No frame data provided"}), 400
        
        # Decode frame
        image_data = base64.b64decode(data['frame'].split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        start_time = time.time()
        
        # Process frame
        detections = detector.detect_players_and_numbers(frame)
        
        # Add stats and enhanced info
        enhanced_detections = []
        for detection in detections:
            if detection.get('jersey_number'):
                # Get player stats
                stats = stats_service.get_player_stats(detection['jersey_number'])
                if stats:
                    detection['stats'] = stats
                    # Add betting context
                    detection['betting_context'] = stats_service.get_betting_context(stats.get('stats', {}))
                
            enhanced_detections.append(detection)
        
        processing_time = time.time() - start_time
        
        return jsonify({
            "success": True,
            "detections": enhanced_detections,
            "timestamp": time.time(),
            "processing_time": processing_time,
            "frame_info": {
                "width": frame.shape[1],
                "height": frame.shape[0],
                "players_detected": len(enhanced_detections)
            }
        })
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/get_player_stats/<int:jersey_number>', methods=['GET'])
def get_player_stats(jersey_number):
    """Get detailed stats for a specific jersey number"""
    try:
        stats = stats_service.get_detailed_player_stats(jersey_number)
        return jsonify({
            "success": True,
            "jersey_number": jersey_number,
            "stats": stats
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🏈 Simple AI NFL Player Detection Backend")
    print("=" * 50)
    print("🌐 Starting on http://localhost:5002")
    print("📊 Player Detection: Ready")
    print("🔢 Jersey OCR: Ready") 
    print("📈 Stats Service: Ready")
    print("💡 Send video frames to /process_video_frame")
    print("🎯 Test health at /health")
    
    app.run(host='0.0.0.0', port=5002, debug=True, threaded=True)
