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
        
        # Movement tracking for dynamic confidence
        self.previous_detections = []
        self.movement_history = {}  # Track movement over time
        self.frame_count = 0
        
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
            # Increment frame counter for movement tracking
            self.frame_count += 1
            
            # Step 1: Detect persons using YOLO (restrict to person class 0)
            results = self.yolo_model(frame, conf=self.confidence_threshold, classes=[0])
            
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
                                # Get bounding box coordinates
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                
                                # Extract player region
                                player_region = frame[y1:y2, x1:x2]
                                
                                # Detect jersey number
                                jersey_number = self._detect_jersey_number(player_region)
                                
                                # Detect team color
                                team_color = self._detect_team_color(player_region)
                                
                                # FILTER: Only keep people wearing NFL team colors
                                if not self._is_nfl_player(player_region):
                                    continue  # Skip non-players (coaches, refs, crowd)
                                
                                # Calculate movement-based dynamic confidence
                                center = [(x1 + x2) // 2, (y1 + y2) // 2]
                                movement_confidence = self._calculate_movement_confidence(center, x1, y1, x2, y2)
                                
                                # Create detection object
                                detection = {
                                    'bbox': [x1, y1, x2, y2],
                                    'confidence': confidence,  # Original YOLO confidence
                                    'movement_confidence': movement_confidence,  # Movement-based confidence
                                    'intensity_level': self._get_intensity_level(movement_confidence),
                                    'jersey_number': jersey_number,
                                    'team_color': team_color,
                                    'center': center,
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
            
            # Step 4: Update movement tracking for next frame
            self._update_movement_tracking(detections)
            
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
    
    def _detect_eagles_jerseys(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect Philadelphia Eagles players using green jerseys AND helmets
        """
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Eagles green color ranges (jerseys and helmets) - Balanced
        # Dark green (midnight green)
        green_lower1 = np.array([35, 40, 20])   # Eagles midnight green
        green_upper1 = np.array([75, 255, 150])
        
        # Lighter green variations
        green_lower2 = np.array([30, 30, 30])   
        green_upper2 = np.array([80, 255, 180])
        
        # Create masks for green detection
        mask1 = cv2.inRange(hsv, green_lower1, green_upper1)
        mask2 = cv2.inRange(hsv, green_lower2, green_upper2)
        green_mask = cv2.bitwise_or(mask1, mask2)
        
        # Clean up the mask with larger kernel for better connectivity
        kernel = np.ones((5,5), np.uint8)
        green_mask = cv2.morphologyEx(green_mask, cv2.MORPH_CLOSE, kernel)
        green_mask = cv2.morphologyEx(green_mask, cv2.MORPH_OPEN, kernel)
        
        # Dilate to connect jersey and helmet regions
        green_mask = cv2.dilate(green_mask, kernel, iterations=2)
        
        # Find contours of green regions
        contours, _ = cv2.findContours(green_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Reasonable minimum area for actual players
                x, y, w, h = cv2.boundingRect(contour)
                
                # Add modest padding to capture full player
                padding_x = int(w * 0.2)   # 20% padding on sides
                padding_y = int(h * 0.25)  # 25% padding top/bottom
                
                x = max(0, x - padding_x)
                y = max(0, y - padding_y)
                w = min(frame.shape[1] - x, w + 2 * padding_x)
                h = min(frame.shape[0] - y, h + 2 * padding_y)
                
                # Filter by aspect ratio (human-like proportions)
                aspect_ratio = h / w if w > 0 else 0
                if 1.2 <= aspect_ratio <= 3.0:  # Strict human proportions
                    
                    # Verify this is actually a player
                    if self._verify_eagles_player(frame[y:y+h, x:x+w]):
                        regions.append({
                            'bbox': [x, y, x + w, y + h],
                            'area': area,
                            'confidence': min(0.9, area / 2000)
                        })
        
        return regions
    
    def _detect_cowboys_jerseys(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect Dallas Cowboys players using white/silver jerseys AND helmets
        """
        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # White/silver color ranges (jerseys and helmets) - Balanced
        # Pure white
        white_lower1 = np.array([0, 0, 160])
        white_upper1 = np.array([180, 30, 255])
        
        # Silver/light gray
        silver_lower = np.array([0, 0, 120])
        silver_upper = np.array([180, 40, 220])
        
        # Create masks
        mask1 = cv2.inRange(hsv, white_lower1, white_upper1)
        mask2 = cv2.inRange(hsv, silver_lower, silver_upper)
        white_mask = cv2.bitwise_or(mask1, mask2)
        
        # Clean up the mask with larger kernel
        kernel = np.ones((5,5), np.uint8)
        white_mask = cv2.morphologyEx(white_mask, cv2.MORPH_CLOSE, kernel)
        white_mask = cv2.morphologyEx(white_mask, cv2.MORPH_OPEN, kernel)
        
        # Dilate to connect jersey and helmet regions
        white_mask = cv2.dilate(white_mask, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Reasonable minimum area for actual players
                x, y, w, h = cv2.boundingRect(contour)
                
                # Add modest padding to capture full player
                padding_x = int(w * 0.2)   # 20% padding on sides
                padding_y = int(h * 0.25)  # 25% padding top/bottom
                
                x = max(0, x - padding_x)
                y = max(0, y - padding_y)
                w = min(frame.shape[1] - x, w + 2 * padding_x)
                h = min(frame.shape[0] - y, h + 2 * padding_y)
                
                # Filter by aspect ratio
                aspect_ratio = h / w if w > 0 else 0
                if 1.2 <= aspect_ratio <= 3.0:  # Strict human proportions
                    
                    # Verify this is actually a player
                    if self._verify_cowboys_player(frame[y:y+h, x:x+w]):
                        regions.append({
                            'bbox': [x, y, x + w, y + h],
                            'area': area,
                            'confidence': min(0.9, area / 2000)
                        })
        
        return regions
    
    def _create_player_detection(self, frame: np.ndarray, region: Dict, team: str, start_time: float) -> Optional[Dict]:
        """
        Create a player detection from a color region
        """
        try:
            x1, y1, x2, y2 = region['bbox']
            
            # Extract player region for jersey number detection
            player_region = frame[y1:y2, x1:x2]
            
            # Try to detect jersey number
            jersey_number = self._detect_jersey_number(player_region)
            
            # Create detection object
            detection = {
                'bbox': [x1, y1, x2, y2],
                'confidence': region['confidence'],
                'jersey_number': jersey_number,
                'team_color': 'green' if team == 'eagles' else 'white',
                'team': team,
                'center': [(x1 + x2) // 2, (y1 + y2) // 2],
                'area': region['area'],
                'screen_position': {
                    'x': ((x1 + x2) / 2) / frame.shape[1] * 100,
                    'y': ((y1 + y2) / 2) / frame.shape[0] * 100,
                    'width': (x2 - x1) / frame.shape[1] * 100,
                    'height': (y2 - y1) / frame.shape[0] * 100
                },
                'processing_time': time.time() - start_time,
                'timestamp': time.time()
            }
            
            return detection
            
        except Exception as e:
            print(f"Error creating player detection: {e}")
            return None
    
    def _verify_eagles_player(self, player_region: np.ndarray) -> bool:
        """
        Verify that a region contains an Eagles player (green helmet + jersey)
        """
        try:
            if player_region.size == 0:
                return False
            
            hsv = cv2.cvtColor(player_region, cv2.COLOR_BGR2HSV)
            h, w = player_region.shape[:2]
            
            # Check top 30% for green helmet
            helmet_region = hsv[:int(h*0.3), :]
            green_lower = np.array([30, 20, 15])
            green_upper = np.array([90, 255, 160])
            helmet_mask = cv2.inRange(helmet_region, green_lower, green_upper)
            helmet_green_pixels = cv2.countNonZero(helmet_mask)
            
            # Check middle 40% for jersey (green or white)
            jersey_region = hsv[int(h*0.2):int(h*0.6), :]
            jersey_mask = cv2.inRange(jersey_region, green_lower, green_upper)
            jersey_green_pixels = cv2.countNonZero(jersey_mask)
            
            # Must have some green in helmet area OR jersey area
            total_pixels = helmet_region.size // 3  # Divide by 3 for HSV channels
            helmet_ratio = helmet_green_pixels / max(total_pixels, 1)
            jersey_ratio = jersey_green_pixels / max(jersey_region.size // 3, 1)
            
            return helmet_ratio > 0.1 or jersey_ratio > 0.15  # At least 10% helmet or 15% jersey green
            
        except Exception as e:
            print(f"Error verifying Eagles player: {e}")
            return False
    
    def _verify_cowboys_player(self, player_region: np.ndarray) -> bool:
        """
        Verify that a region contains a Cowboys player (silver helmet + white jersey)
        """
        try:
            if player_region.size == 0:
                return False
            
            hsv = cv2.cvtColor(player_region, cv2.COLOR_BGR2HSV)
            h, w = player_region.shape[:2]
            
            # Check top 30% for silver/white helmet
            helmet_region = hsv[:int(h*0.3), :]
            white_lower = np.array([0, 0, 100])
            white_upper = np.array([180, 50, 255])
            helmet_mask = cv2.inRange(helmet_region, white_lower, white_upper)
            helmet_white_pixels = cv2.countNonZero(helmet_mask)
            
            # Check middle 40% for white jersey
            jersey_region = hsv[int(h*0.2):int(h*0.6), :]
            jersey_mask = cv2.inRange(jersey_region, white_lower, white_upper)
            jersey_white_pixels = cv2.countNonZero(jersey_mask)
            
            # Must have white/silver in helmet OR jersey area
            total_pixels = helmet_region.size // 3
            helmet_ratio = helmet_white_pixels / max(total_pixels, 1)
            jersey_ratio = jersey_white_pixels / max(jersey_region.size // 3, 1)
            
            return helmet_ratio > 0.15 or jersey_ratio > 0.2  # At least 15% helmet or 20% jersey white
            
        except Exception as e:
            print(f"Error verifying Cowboys player: {e}")
            return False
    
    def _is_nfl_player(self, player_region: np.ndarray) -> bool:
        """
        Check if detected person is wearing NFL team colors (Eagles green or Cowboys white/silver)
        Filters out coaches, referees, and crowd members
        """
        try:
            if player_region.size == 0:
                return False
            
            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(player_region, cv2.COLOR_BGR2HSV)
            h, w = player_region.shape[:2]
            
            # Focus on torso area (where jerseys are most visible)
            torso_region = hsv[int(h*0.2):int(h*0.7), :]
            
            # Eagles green detection
            eagles_lower1 = np.array([35, 40, 20])
            eagles_upper1 = np.array([75, 255, 150])
            eagles_lower2 = np.array([30, 30, 30])
            eagles_upper2 = np.array([80, 255, 180])
            
            eagles_mask1 = cv2.inRange(torso_region, eagles_lower1, eagles_upper1)
            eagles_mask2 = cv2.inRange(torso_region, eagles_lower2, eagles_upper2)
            eagles_mask = cv2.bitwise_or(eagles_mask1, eagles_mask2)
            eagles_pixels = cv2.countNonZero(eagles_mask)
            
            # Cowboys white/silver detection
            cowboys_lower1 = np.array([0, 0, 160])  # White
            cowboys_upper1 = np.array([180, 30, 255])
            cowboys_lower2 = np.array([0, 0, 120])  # Silver
            cowboys_upper2 = np.array([180, 40, 220])
            
            cowboys_mask1 = cv2.inRange(torso_region, cowboys_lower1, cowboys_upper1)
            cowboys_mask2 = cv2.inRange(torso_region, cowboys_lower2, cowboys_upper2)
            cowboys_mask = cv2.bitwise_or(cowboys_mask1, cowboys_mask2)
            cowboys_pixels = cv2.countNonZero(cowboys_mask)
            
            # Calculate ratios
            total_torso_pixels = torso_region.size // 3  # Divide by 3 for HSV channels
            eagles_ratio = eagles_pixels / max(total_torso_pixels, 1)
            cowboys_ratio = cowboys_pixels / max(total_torso_pixels, 1)
            
            # Must have significant team colors in torso area
            is_eagles = eagles_ratio > 0.15  # At least 15% Eagles green
            is_cowboys = cowboys_ratio > 0.20  # At least 20% Cowboys white/silver
            
            # Additional check: Exclude referee stripes (alternating black/white pattern)
            if self._is_referee(player_region):
                return False
            
            result = is_eagles or is_cowboys
            if result:
                team = "Eagles" if is_eagles else "Cowboys"
                print(f"[Filter] ✅ NFL Player detected: {team} (green: {eagles_ratio:.2f}, white: {cowboys_ratio:.2f})")
            else:
                print(f"[Filter] ❌ Non-player filtered out (green: {eagles_ratio:.2f}, white: {cowboys_ratio:.2f})")
            
            return result
            
        except Exception as e:
            print(f"Error checking NFL player: {e}")
            return False
    
    def _is_referee(self, player_region: np.ndarray) -> bool:
        """
        Detect referee striped shirts (black and white stripes)
        """
        try:
            if player_region.size == 0:
                return False
            
            # Convert to grayscale for stripe detection
            gray = cv2.cvtColor(player_region, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape
            
            # Focus on torso area
            torso = gray[int(h*0.2):int(h*0.6), :]
            
            # Count transitions between dark and light (stripe pattern)
            if torso.size == 0:
                return False
            
            # Calculate horizontal line profiles to detect stripes
            horizontal_profile = np.mean(torso, axis=1)
            
            # Count significant transitions (dark to light, light to dark)
            transitions = 0
            threshold = 30  # Minimum difference to count as transition
            
            for i in range(1, len(horizontal_profile)):
                diff = abs(horizontal_profile[i] - horizontal_profile[i-1])
                if diff > threshold:
                    transitions += 1
            
            # Referees have many horizontal transitions due to stripes
            stripe_ratio = transitions / max(len(horizontal_profile), 1)
            is_ref = stripe_ratio > 0.3  # High transition ratio indicates stripes
            
            if is_ref:
                print(f"[Filter] 🦓 Referee detected and filtered out (stripe ratio: {stripe_ratio:.2f})")
            
            return is_ref
            
        except Exception as e:
            print(f"Error detecting referee: {e}")
            return False
    
    def _calculate_movement_confidence(self, center, x1, y1, x2, y2):
        """
        Calculate movement-based confidence based on player speed and motion
        """
        try:
            # Find closest previous detection (simple distance matching)
            closest_prev = None
            min_distance = float('inf')
            
            for prev_detection in self.previous_detections:
                prev_center = prev_detection['center']
                distance = ((center[0] - prev_center[0])**2 + (center[1] - prev_center[1])**2)**0.5
                if distance < min_distance and distance < 100:  # Max 100 pixels movement between frames
                    min_distance = distance
                    closest_prev = prev_detection
            
            if closest_prev is None:
                return 0.3  # Base confidence for new detections
            
            # Calculate movement speed (pixels per frame)
            movement_speed = min_distance
            
            # Calculate bounding box size change (indicates acceleration/deceleration)
            prev_area = closest_prev['area']
            current_area = (x2 - x1) * (y2 - y1)
            size_change = abs(current_area - prev_area) / max(prev_area, 1)
            
            # Movement confidence calculation
            # Fast movement = higher confidence (running, sprinting)
            # Size changes = higher confidence (acceleration, direction changes)
            speed_factor = min(movement_speed / 50.0, 1.0)  # Normalize to 0-1
            size_factor = min(size_change * 10, 0.5)  # Size changes contribute less
            
            movement_confidence = 0.2 + (speed_factor * 0.6) + (size_factor * 0.2)
            movement_confidence = max(0.0, min(1.0, movement_confidence))  # Clamp 0-1
            
            # Debug logging
            if movement_speed > 10:  # Only log significant movement
                print(f"[Movement] Speed: {movement_speed:.1f}px, Size change: {size_change:.2f}, Confidence: {movement_confidence:.2f}")
            
            return movement_confidence
            
        except Exception as e:
            print(f"Error calculating movement confidence: {e}")
            return 0.3
    
    def _get_intensity_level(self, movement_confidence):
        """
        Convert movement confidence to intensity level (green/yellow/red)
        """
        if movement_confidence >= 0.7:
            return 'red'    # High intensity - sprinting, fast movement
        elif movement_confidence >= 0.4:
            return 'yellow' # Medium intensity - jogging, moderate movement  
        else:
            return 'green'  # Low intensity - walking, stationary
    
    def _update_movement_tracking(self, current_detections):
        """
        Update movement tracking history for next frame
        """
        try:
            # Store current detections for next frame comparison
            self.previous_detections = []
            for detection in current_detections:
                self.previous_detections.append({
                    'center': detection['center'],
                    'area': detection['area'],
                    'bbox': detection['bbox']
                })
            
            # Clean up old movement history (keep last 10 frames)
            if len(self.movement_history) > 10:
                oldest_frame = min(self.movement_history.keys())
                del self.movement_history[oldest_frame]
            
            # Store current frame data
            self.movement_history[self.frame_count] = current_detections
            
        except Exception as e:
            print(f"Error updating movement tracking: {e}")
    
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
