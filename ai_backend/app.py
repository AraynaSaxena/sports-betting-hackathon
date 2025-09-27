from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import json
import asyncio
import websockets
from threading import Thread
import time
from player_detector import PlayerDetector
from stats_service import StatsService

app = Flask(__name__)
CORS(app)

# Initialize services
detector = PlayerDetector()
stats_service = StatsService()

# Store current detections for WebSocket streaming
current_detections = []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "AI Backend is running"})

@app.route('/detect_players', methods=['POST'])
def detect_players():
    """Detect players in a single frame"""
    try:
        # Get image data from request
        data = request.json
        if 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'].split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Detect players and jersey numbers
        detections = detector.detect_players_and_numbers(frame)
        
        # Get stats for detected players
        enhanced_detections = []
        for detection in detections:
            if detection['jersey_number']:
                stats = stats_service.get_player_stats(detection['jersey_number'])
                detection['stats'] = stats
            enhanced_detections.append(detection)
        
        return jsonify({
            "success": True,
            "detections": enhanced_detections,
            "frame_info": {
                "width": frame.shape[1],
                "height": frame.shape[0],
                "players_detected": len(detections)
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process_video_frame', methods=['POST'])
def process_video_frame():
    """Process a video frame and return player detections with bounding boxes"""
    try:
        data = request.json
        
        # Decode frame
        image_data = base64.b64decode(data['frame'].split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Process frame
        detections = detector.detect_players_and_numbers(frame)
        
        # Add stats and enhanced info
        enhanced_detections = []
        for detection in detections:
            if detection['jersey_number']:
                # Get player stats
                stats = stats_service.get_player_stats(detection['jersey_number'])
                detection['stats'] = stats
                
                # Add betting context
                detection['betting_context'] = stats_service.get_betting_context(stats)
                
            enhanced_detections.append(detection)
        
        # Store for WebSocket streaming
        global current_detections
        current_detections = enhanced_detections
        
        return jsonify({
            "success": True,
            "detections": enhanced_detections,
            "timestamp": time.time(),
            "processing_time": detection.get('processing_time', 0)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        return jsonify({"error": str(e)}), 500

@app.route('/train_model', methods=['POST'])
def train_model():
    """Endpoint to retrain the model with new data"""
    try:
        # This would be used for continuous learning
        data = request.json
        training_images = data.get('training_images', [])
        
        # In a real implementation, you'd retrain your model here
        # For now, we'll simulate training
        
        return jsonify({
            "success": True,
            "message": f"Model training initiated with {len(training_images)} images",
            "status": "training_started"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# WebSocket server for real-time streaming
async def websocket_handler(websocket, path):
    """Handle WebSocket connections for real-time updates"""
    try:
        async for message in websocket:
            # Send current detections
            await websocket.send(json.dumps({
                "type": "detections",
                "data": current_detections,
                "timestamp": time.time()
            }))
    except websockets.exceptions.ConnectionClosed:
        pass

def start_websocket_server():
    """Start WebSocket server in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    start_server = websockets.serve(websocket_handler, "localhost", 8765)
    loop.run_until_complete(start_server)
    loop.run_forever()

if __name__ == '__main__':
    # Start WebSocket server in background
    websocket_thread = Thread(target=start_websocket_server, daemon=True)
    websocket_thread.start()
    
    print("🚀 AI Backend Starting...")
    print("📊 Player Detection: Ready")
    print("🔢 Jersey OCR: Ready")
    print("📈 Stats Service: Ready")
    print("🌐 WebSocket Server: Running on ws://localhost:8765")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
