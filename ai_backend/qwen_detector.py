#!/usr/bin/env python3
"""
Qwen 2.5 Vision-Language Model for Jersey Number Detection
Uses Hugging Face Inference API for better performance
"""

import cv2
import numpy as np
import requests
import base64
import io
from PIL import Image
import json
import re
from typing import Optional

class QwenJerseyDetector:
    def __init__(self, hf_token: str = None):
        """Initialize Qwen 2.5 jersey detector with Hugging Face API"""
        self.hf_token = hf_token
        self.api_url = "https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-2B-Instruct"
        self.headers = {}
        
        if hf_token:
            self.headers["Authorization"] = f"Bearer {hf_token}"
        
        print("🧠 Qwen 2.5 Jersey Detector initialized")
        print("💡 Using Hugging Face Inference API")
    
    def detect_jersey_number(self, player_region: np.ndarray) -> Optional[int]:
        """
        Detect jersey number using Qwen 2.5 Vision-Language Model
        """
        if player_region.size == 0:
            return None
            
        try:
            # Convert OpenCV image to PIL Image
            if len(player_region.shape) == 3:
                rgb_image = cv2.cvtColor(player_region, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = player_region
                
            pil_image = Image.fromarray(rgb_image)
            
            # Resize for better processing
            width, height = pil_image.size
            if width < 224 or height < 224:
                scale_factor = max(224 / width, 224 / height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                pil_image = pil_image.resize((new_width, new_height), Image.LANCZOS)
            
            # Convert to base64 for API
            buffer = io.BytesIO()
            pil_image.save(buffer, format='JPEG', quality=95)
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Prepare the request
            payload = {
                "inputs": {
                    "image": f"data:image/jpeg;base64,{img_base64}",
                    "text": "Look at this image of a football player. What jersey number do you see? The number could be on the front or back of the jersey. Please respond with just the number, nothing else. If you can't see a clear number, respond with 'none'."
                },
                "parameters": {
                    "max_new_tokens": 10,
                    "temperature": 0.1
                }
            }
            
            # Make API request
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if isinstance(result, list) and len(result) > 0:
                    output_text = result[0].get('generated_text', '').strip().lower()
                elif isinstance(result, dict):
                    output_text = result.get('generated_text', '').strip().lower()
                else:
                    return None
                
                # Extract number from response
                if output_text == 'none' or 'none' in output_text:
                    return None
                    
                # Extract numbers from the response
                numbers = re.findall(r'\d+', output_text)
                for num_str in numbers:
                    num = int(num_str)
                    # NFL jersey numbers are typically 0-99
                    if 0 <= num <= 99:
                        print(f"🧠 Qwen 2.5 detected jersey number: {num}")
                        return num
                
                return None
                
            else:
                print(f"⚠️ Qwen API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error in Qwen jersey detection: {e}")
            return None
    
    def is_available(self) -> bool:
        """Check if Qwen API is available"""
        try:
            # Create a small test image
            test_img = np.zeros((100, 100, 3), dtype=np.uint8)
            test_img[:] = (128, 128, 128)  # Gray image
            
            # Test the API with a simple request
            pil_image = Image.fromarray(test_img)
            buffer = io.BytesIO()
            pil_image.save(buffer, format='JPEG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            payload = {
                "inputs": {
                    "image": f"data:image/jpeg;base64,{img_base64}",
                    "text": "What do you see?"
                },
                "parameters": {"max_new_tokens": 5}
            }
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=5
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Qwen availability check failed: {e}")
            return False

# Alternative: Local Qwen implementation (requires more resources)
class QwenLocalDetector:
    def __init__(self):
        """Initialize local Qwen 2.5 model"""
        try:
            from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
            import torch
            
            print("🧠 Loading Qwen 2.5 model locally...")
            
            # Load model with optimizations
            self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                "Qwen/Qwen2-VL-2B-Instruct",
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True
            )
            
            self.processor = AutoProcessor.from_pretrained(
                "Qwen/Qwen2-VL-2B-Instruct",
                trust_remote_code=True
            )
            
            self.available = True
            print("✅ Qwen 2.5 model loaded successfully")
            
        except Exception as e:
            print(f"❌ Failed to load local Qwen model: {e}")
            self.available = False
    
    def detect_jersey_number(self, player_region: np.ndarray) -> Optional[int]:
        """Detect jersey number using local Qwen model"""
        if not self.available or player_region.size == 0:
            return None
            
        try:
            # Convert to PIL Image
            if len(player_region.shape) == 3:
                rgb_image = cv2.cvtColor(player_region, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = player_region
                
            pil_image = Image.fromarray(rgb_image)
            
            # Prepare conversation
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": pil_image},
                        {
                            "type": "text", 
                            "text": "Look at this football player. What jersey number do you see? The number could be on the front or back. Respond with just the number or 'none'."
                        }
                    ]
                }
            ]
            
            # Process with model
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            
            inputs = self.processor(
                text=[text], images=[pil_image], return_tensors="pt"
            )
            
            # Generate response
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs, max_new_tokens=10, temperature=0.1
                )
            
            generated_ids_trimmed = [
                out_ids[len(in_ids):] 
                for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            
            output_text = self.processor.batch_decode(
                generated_ids_trimmed, 
                skip_special_tokens=True, 
                clean_up_tokenization_spaces=False
            )[0].strip().lower()
            
            # Extract number
            if 'none' in output_text:
                return None
                
            numbers = re.findall(r'\d+', output_text)
            for num_str in numbers:
                num = int(num_str)
                if 0 <= num <= 99:
                    print(f"🧠 Local Qwen detected: {num}")
                    return num
            
            return None
            
        except Exception as e:
            print(f"Error in local Qwen detection: {e}")
            return None
