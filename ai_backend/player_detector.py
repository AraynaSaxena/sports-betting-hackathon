import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
import time
import re
from typing import List, Dict, Tuple, Optional

class PlayerDetector:
    def __init__(self):
        """Initialize the player detection system"""
        print("🤖 Initializing Player Detector...")
        
        # Load YOLO model for person detection
        try:
            self.yolo_model = YOLO('yolov8n.pt')  # Nano model for speed
            print("✅ YOLO model loaded successfully")
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            self.yolo_model = None
        
        # Initialize OCR reader
        try:
            self.ocr_reader = easyocr.Reader(['en'], gpu=True)
            print("✅ OCR reader initialized successfully")
        except Exception as e:
            print(f"⚠️ OCR GPU failed, falling back to CPU: {e}")
            try:
                self.ocr_reader = easyocr.Reader(['en'], gpu=False)
                print("✅ OCR reader initialized (CPU mode)")
            except Exception as e2:
                print(f"❌ Error initializing OCR: {e2}")
                self.ocr_reader = None
        
        # Jersey number detection parameters
        self.jersey_roi_expansion = 0.3  # Expand bounding box by 30% to find jersey
        # Very low threshold to catch all possible persons
        self.confidence_threshold = 0.1
        self.nms_threshold = 0.4
        
        # Team color detection (simplified)
        self.team_colors = {
            'red': ([0, 50, 50], [10, 255, 255]),
            'blue': ([100, 50, 50], [130, 255, 255]),
            'green': ([40, 50, 50], [80, 255, 255]),
            'yellow': ([20, 50, 50], [40, 255, 255]),
            'white': ([0, 0, 200], [180, 30, 255]),
            'black': ([0, 0, 0], [180, 255, 50])
        }
        
    def detect_players_and_numbers(self, frame: np.ndarray) -> List[Dict]:
        """
        Main function to detect players and their jersey numbers
        """
        start_time = time.time()
        detections = []
        
        if self.yolo_model is None:
            print("[Detector] YOLO model not loaded")
            return []
        
        try:
            # Step 1: Preprocess frame for better detection
            processed_frame = self._preprocess_frame_for_yolo(frame)
            
            # Step 2: Detect persons using YOLO (restrict to person class 0)
            results = self.yolo_model(processed_frame, conf=self.confidence_threshold, classes=[0])
            
            # Calculate scale factor if frame was resized
            scale_x = frame.shape[1] / processed_frame.shape[1]
            scale_y = frame.shape[0] / processed_frame.shape[0]
            
            # Step 2: Process each detected person
            person_candidates = 0
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Only process 'person' class (class 0 in COCO)
                        if int(box.cls[0]) == 0:  # person class
                            person_candidates += 1
                            confidence = float(box.conf[0])
                            if confidence > self.confidence_threshold:
                                # Get bounding box coordinates and scale back to original frame
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                x1, x2 = int(x1 * scale_x), int(x2 * scale_x)
                                y1, y2 = int(y1 * scale_y), int(y2 * scale_y)
                                
                                # Extract player region from original frame
                                player_region = frame[y1:y2, x1:x2]
                                
                                # Detect jersey number
                                jersey_number = self._detect_jersey_number(player_region)
                                
                                # Detect team color
                                team_color = self._detect_team_color(player_region)
                                
                                # Create detection object
                                detection = {
                                    'bbox': [x1, y1, x2, y2],
                                    'confidence': confidence,
                                    'jersey_number': jersey_number,
                                    'team_color': team_color,
                                    'center': [(x1 + x2) // 2, (y1 + y2) // 2],
                                    'area': (x2 - x1) * (y2 - y1),
                                    'screen_position': {
                                        'x': ((x1 + x2) / 2) / frame.shape[1] * 100,
                                        'y': ((y1 + y2) / 2) / frame.shape[0] * 100,
                                        'width': (x2 - x1) / frame.shape[1] * 100,
                                        'height': (y2 - y1) / frame.shape[0] * 100
                                    }
                                }
                                
                                detections.append(detection)
            
            # Debug: log candidate and pre/post processing counts
            print(f"[Detector] YOLO person candidates: {person_candidates}, kept before post: {len(detections)}")

            # Step 3: Post-process detections
            detections = self._post_process_detections(detections)

            print(f"[Detector] Final detections after post-process: {len(detections)}")
            
            # No fallback - return actual YOLO detections only
            if len(detections) == 0:
                print("[Detector] No YOLO detections found")
            
            processing_time = time.time() - start_time
            
            # Add processing metadata
            for detection in detections:
                detection['processing_time'] = processing_time
                detection['timestamp'] = time.time()
            
            return detections
            
        except Exception as e:
            print(f"Error in player detection: {e}")
            return []
    
    def _detect_jersey_number(self, player_region: np.ndarray) -> Optional[int]:
        """
        Detect jersey number from player region using OCR
        """
        if self.ocr_reader is None or player_region.size == 0:
            return None
        
        try:
            # Focus on upper torso area (where jersey numbers typically are)
            height, width = player_region.shape[:2]
            
            # Define ROI for jersey number (upper chest area)
            roi_y1 = int(height * 0.2)
            roi_y2 = int(height * 0.6)
            roi_x1 = int(width * 0.2)
            roi_x2 = int(width * 0.8)
            
            jersey_roi = player_region[roi_y1:roi_y2, roi_x1:roi_x2]
            
            if jersey_roi.size == 0:
                return None
            
            # Preprocess for better OCR
            jersey_roi = self._preprocess_for_ocr(jersey_roi)
            
            # Run OCR
            results = self.ocr_reader.readtext(jersey_roi)
            
            # Extract numbers from OCR results
            for (bbox, text, confidence) in results:
                if confidence > 0.5:  # OCR confidence threshold
                    # Extract numbers from text
                    numbers = re.findall(r'\d+', text)
                    for num_str in numbers:
                        num = int(num_str)
                        # NFL jersey numbers are typically 0-99
                        if 0 <= num <= 99:
                            return num
            
            return None
            
        except Exception as e:
            print(f"Error in jersey number detection: {e}")
            return None
    
    def _preprocess_for_ocr(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Apply morphological operations to clean up
            kernel = np.ones((2, 2), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Resize for better OCR (OCR works better on larger images)
            height, width = cleaned.shape
            if height < 50 or width < 50:
                scale_factor = max(50 / height, 50 / width)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                cleaned = cv2.resize(cleaned, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            return cleaned
            
        except Exception as e:
            print(f"Error in OCR preprocessing: {e}")
            return image
    
    def _detect_team_color(self, player_region: np.ndarray) -> str:
        """
        Detect dominant team color from player region
        """
        try:
            if player_region.size == 0:
                return 'unknown'
            
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(player_region, cv2.COLOR_BGR2HSV)
            
            # Count pixels for each team color
            color_counts = {}
            
            for color_name, (lower, upper) in self.team_colors.items():
                lower = np.array(lower)
                upper = np.array(upper)
                
                # Create mask for this color
                mask = cv2.inRange(hsv, lower, upper)
                count = cv2.countNonZero(mask)
                color_counts[color_name] = count
            
            # Return the dominant color
            if color_counts:
                dominant_color = max(color_counts, key=color_counts.get)
                if color_counts[dominant_color] > 100:  # Minimum pixel threshold
                    return dominant_color
            
            return 'unknown'
            
        except Exception as e:
            print(f"Error in team color detection: {e}")
            return 'unknown'
    
    def _post_process_detections(self, detections: List[Dict]) -> List[Dict]:
        """
        Post-process detections to remove duplicates and improve accuracy
        """
        if not detections:
            return detections
        
        # Remove detections that are too small (likely false positives)
        min_area = 100  # Very low minimum area to catch small players
        filtered_detections = [d for d in detections if d['area'] > min_area]
        
        # Sort by confidence
        filtered_detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Remove overlapping detections (Non-Maximum Suppression)
        final_detections = []
        
        for detection in filtered_detections:
            is_duplicate = False
            
            for existing in final_detections:
                # Calculate IoU (Intersection over Union)
                iou = self._calculate_iou(detection['bbox'], existing['bbox'])
                
                if iou > 0.5:  # 50% overlap threshold
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                final_detections.append(detection)
        
        return final_detections
    
    def _calculate_iou(self, box1: List[int], box2: List[int]) -> float:
        """
        Calculate Intersection over Union (IoU) of two bounding boxes
        """
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # Calculate intersection area
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i <= x1_i or y2_i <= y1_i:
            return 0.0
        
        intersection_area = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate union area
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union_area = area1 + area2 - intersection_area
        
        return intersection_area / union_area if union_area > 0 else 0.0
    
    def visualize_detections(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw bounding boxes and labels on the frame for visualization
        """
        result_frame = frame.copy()
        
        for detection in detections:
            x1, y1, x2, y2 = detection['bbox']
            confidence = detection['confidence']
            jersey_number = detection.get('jersey_number')
            team_color = detection.get('team_color', 'unknown')
            
            # Draw bounding box
            color = (0, 255, 0)  # Green for detected players
            cv2.rectangle(result_frame, (x1, y1), (x2, y2), color, 2)
            
            # Create label
            label_parts = []
            if jersey_number is not None:
                label_parts.append(f"#{jersey_number}")
            label_parts.append(f"{confidence:.2f}")
            if team_color != 'unknown':
                label_parts.append(team_color)
            
            label = " | ".join(label_parts)
            
            # Draw label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(result_frame, (x1, y1 - 25), (x1 + label_size[0], y1), color, -1)
            
            # Draw label text
            cv2.putText(result_frame, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return result_frame
    
    def _get_fallback_detections(self, frame: np.ndarray) -> List[Dict]:
        """
        Return hardcoded demo player detections when YOLO fails
        """
        height, width = frame.shape[:2]
        processing_time = 0.05  # Simulate fast processing
        timestamp = time.time()
        
        # Demo players positioned across the frame
        demo_players = [
            {
                'bbox': [int(width * 0.15), int(height * 0.25), int(width * 0.25), int(height * 0.75)],
                'confidence': 0.95,
                'jersey_number': 12,
                'team_color': 'red',
                'center': [int(width * 0.20), int(height * 0.50)],
                'area': int(width * 0.10) * int(height * 0.50),
                'screen_position': {
                    'x': 20.0,
                    'y': 50.0,
                    'width': 10.0,
                    'height': 50.0
                },
                'processing_time': processing_time,
                'timestamp': timestamp
            },
            {
                'bbox': [int(width * 0.35), int(height * 0.20), int(width * 0.45), int(height * 0.70)],
                'confidence': 0.88,
                'jersey_number': 87,
                'team_color': 'blue',
                'center': [int(width * 0.40), int(height * 0.45)],
                'area': int(width * 0.10) * int(height * 0.50),
                'screen_position': {
                    'x': 40.0,
                    'y': 45.0,
                    'width': 10.0,
                    'height': 50.0
                },
                'processing_time': processing_time,
                'timestamp': timestamp
            },
            {
                'bbox': [int(width * 0.65), int(height * 0.30), int(width * 0.75), int(height * 0.80)],
                'confidence': 0.92,
                'jersey_number': 13,
                'team_color': 'green',
                'center': [int(width * 0.70), int(height * 0.55)],
                'area': int(width * 0.10) * int(height * 0.50),
                'screen_position': {
                    'x': 70.0,
                    'y': 55.0,
                    'width': 10.0,
                    'height': 50.0
                },
                'processing_time': processing_time,
                'timestamp': timestamp
            }
        ]
        
        print(f"[Detector] Returning {len(demo_players)} fallback demo players")
        return demo_players
    
    def _preprocess_frame_for_yolo(self, frame: np.ndarray) -> np.ndarray:
        """
        Preprocess frame to improve YOLO detection
        """
        try:
            height, width = frame.shape[:2]
            
            # If frame is too small, upscale it for better detection
            min_size = 640
            if width < min_size or height < min_size:
                if width < height:
                    new_width = min_size
                    new_height = int(height * (min_size / width))
                else:
                    new_height = min_size
                    new_width = int(width * (min_size / height))
                
                frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                print(f"[Detector] Upscaled frame from {width}x{height} to {new_width}x{new_height}")
            
            # Enhance contrast and brightness for better detection
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            
            enhanced_frame = cv2.merge([l, a, b])
            enhanced_frame = cv2.cvtColor(enhanced_frame, cv2.COLOR_LAB2BGR)
            
            return enhanced_frame
            
        except Exception as e:
            print(f"Error in frame preprocessing: {e}")
            return frame
