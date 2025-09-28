import cv2
import numpy as np
import base64
import asyncio
import websockets
import json
import time
from threading import Thread, Lock
from queue import Queue
from player_detector import PlayerDetector
from stats_service import StatsService
from typing import Dict, List, Optional, Callable

class VideoProcessor:
    def __init__(self):
        """Initialize the video processor"""
        self.detector = PlayerDetector()
        self.stats_service = StatsService()
        
        # Processing parameters
        self.fps_target = 30  # Target FPS for processing
        self.frame_skip = 2   # Process every nth frame for performance
        self.frame_count = 0
        
        # Threading
        self.processing_lock = Lock()
        self.frame_queue = Queue(maxsize=10)
        self.result_queue = Queue(maxsize=10)
        
        # State
        self.is_processing = False
        self.current_detections = []
        self.processing_stats = {
            'frames_processed': 0,
            'avg_processing_time': 0,
            'fps': 0,
            'last_update': time.time()
        }
        
        # Callbacks
        self.detection_callback = None
        
    def start_processing(self, detection_callback: Optional[Callable] = None):
        """Start the video processing pipeline"""
        self.detection_callback = detection_callback
        self.is_processing = True
        
        # Start processing thread
        self.processing_thread = Thread(target=self._processing_loop, daemon=True)
        self.processing_thread.start()
        
        print("🎥 Video processing started")
    
    def stop_processing(self):
        """Stop the video processing pipeline"""
        self.is_processing = False
        print("⏹️ Video processing stopped")
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """Process a single frame and return detections"""
        try:
            start_time = time.time()
            
            # Skip frames for performance
            self.frame_count += 1
            if self.frame_count % self.frame_skip != 0:
                return {
                    'success': True,
                    'detections': self.current_detections,
                    'skipped': True,
                    'frame_count': self.frame_count
                }
            
            # Detect players
            detections = self.detector.detect_players_and_numbers(frame)
            
            # Enhance with stats
            enhanced_detections = []
            for detection in detections:
                if detection.get('jersey_number'):
                    stats = self.stats_service.get_player_stats(detection['jersey_number'])
                    if stats:
                        detection['stats'] = stats
                        detection['betting_context'] = self.stats_service.get_betting_context(stats.get('stats', {}))
                
                enhanced_detections.append(detection)
            
            # Update current detections
            with self.processing_lock:
                self.current_detections = enhanced_detections
            
            # Update processing stats
            processing_time = time.time() - start_time
            self._update_processing_stats(processing_time)
            
            # Call callback if provided
            if self.detection_callback:
                self.detection_callback(enhanced_detections)
            
            return {
                'success': True,
                'detections': enhanced_detections,
                'processing_time': processing_time,
                'frame_count': self.frame_count,
                'stats': self.processing_stats.copy()
            }
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return {
                'success': False,
                'error': str(e),
                'frame_count': self.frame_count
            }
    
    def process_frame_from_base64(self, base64_frame: str) -> Dict:
        """Process a frame from base64 encoded image"""
        try:
            # Decode base64 image
            image_data = base64.b64decode(base64_frame.split(',')[1])
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {'success': False, 'error': 'Invalid image data'}
            
            return self.process_frame(frame)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _processing_loop(self):
        """Main processing loop for threaded processing"""
        while self.is_processing:
            try:
                if not self.frame_queue.empty():
                    frame_data = self.frame_queue.get()
                    result = self.process_frame(frame_data['frame'])
                    
                    # Store result
                    if not self.result_queue.full():
                        self.result_queue.put({
                            'timestamp': frame_data['timestamp'],
                            'result': result
                        })
                
                time.sleep(1 / self.fps_target)  # Control processing rate
                
            except Exception as e:
                print(f"Error in processing loop: {e}")
                time.sleep(0.1)
    
    def add_frame_to_queue(self, frame: np.ndarray):
        """Add frame to processing queue"""
        if not self.frame_queue.full():
            self.frame_queue.put({
                'frame': frame,
                'timestamp': time.time()
            })
    
    def get_latest_result(self) -> Optional[Dict]:
        """Get the latest processing result"""
        if not self.result_queue.empty():
            return self.result_queue.get()
        return None
    
    def _update_processing_stats(self, processing_time: float):
        """Update processing statistics"""
        current_time = time.time()
        
        with self.processing_lock:
            self.processing_stats['frames_processed'] += 1
            
            # Update average processing time
            if self.processing_stats['avg_processing_time'] == 0:
                self.processing_stats['avg_processing_time'] = processing_time
            else:
                # Exponential moving average
                alpha = 0.1
                self.processing_stats['avg_processing_time'] = (
                    alpha * processing_time + 
                    (1 - alpha) * self.processing_stats['avg_processing_time']
                )
            
            # Calculate FPS
            time_diff = current_time - self.processing_stats['last_update']
            if time_diff > 1.0:  # Update FPS every second
                self.processing_stats['fps'] = self.processing_stats['frames_processed'] / time_diff
                self.processing_stats['frames_processed'] = 0
                self.processing_stats['last_update'] = current_time
    
    def get_processing_stats(self) -> Dict:
        """Get current processing statistics"""
        with self.processing_lock:
            return self.processing_stats.copy()
    
    def create_annotated_frame(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """Create an annotated frame with bounding boxes and labels"""
        annotated_frame = frame.copy()
        
        for detection in detections:
            # Get bounding box
            x1, y1, x2, y2 = detection['bbox']
            
            # Determine color based on jersey number detection
            if detection.get('jersey_number'):
                color = (0, 255, 0)  # Green for detected numbers
            else:
                color = (255, 255, 0)  # Yellow for players without numbers
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
            # Create label
            label_parts = []
            
            if detection.get('jersey_number'):
                label_parts.append(f"#{detection['jersey_number']}")
            
            if detection.get('stats') and detection['stats'].get('name'):
                label_parts.append(detection['stats']['name'].split()[-1])  # Last name
            
            if detection.get('team_color') and detection['team_color'] != 'unknown':
                label_parts.append(detection['team_color'])
            
            label_parts.append(f"{detection['confidence']:.2f}")
            
            label = " | ".join(label_parts)
            
            # Draw label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(annotated_frame, (x1, y1 - 30), (x1 + label_size[0] + 10, y1), color, -1)
            
            # Draw label text
            cv2.putText(annotated_frame, label, (x1 + 5, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Draw stats info if available
            if detection.get('stats'):
                stats = detection['stats'].get('stats', {})
                position = detection['stats'].get('position', '')
                
                stats_text = f"{position}"
                if position == 'QB' and 'passing_yards' in stats:
                    stats_text += f" | {stats['passing_yards']} yds"
                elif position in ['WR', 'TE'] and 'receiving_yards' in stats:
                    stats_text += f" | {stats['receiving_yards']} yds"
                elif position == 'RB' and 'rushing_yards' in stats:
                    stats_text += f" | {stats['rushing_yards']} yds"
                
                cv2.putText(annotated_frame, stats_text, (x1, y2 + 20), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw processing stats
        stats_text = f"FPS: {self.processing_stats['fps']:.1f} | " \
                    f"Avg Time: {self.processing_stats['avg_processing_time']*1000:.1f}ms | " \
                    f"Players: {len(detections)}"
        
        cv2.putText(annotated_frame, stats_text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return annotated_frame
    
    def process_video_file(self, video_path: str, output_path: Optional[str] = None) -> Dict:
        """Process an entire video file"""
        print(f"🎬 Processing video file: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return {'success': False, 'error': 'Could not open video file'}
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"📹 Video: {width}x{height} @ {fps}fps, {total_frames} frames")
        
        # Setup output video if requested
        out = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Process frames
        frame_results = []
        frame_num = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame
                result = self.process_frame(frame)
                frame_results.append(result)
                
                # Create annotated frame if output requested
                if out and result['success']:
                    annotated_frame = self.create_annotated_frame(frame, result['detections'])
                    out.write(annotated_frame)
                
                frame_num += 1
                if frame_num % 30 == 0:  # Progress update every 30 frames
                    progress = (frame_num / total_frames) * 100
                    print(f"📊 Progress: {progress:.1f}% ({frame_num}/{total_frames})")
        
        finally:
            cap.release()
            if out:
                out.release()
        
        print(f"✅ Video processing complete: {frame_num} frames processed")
        
        return {
            'success': True,
            'frames_processed': frame_num,
            'total_detections': sum(len(r.get('detections', [])) for r in frame_results if r.get('success')),
            'output_path': output_path,
            'processing_stats': self.get_processing_stats()
        }
