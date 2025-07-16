"""
Advanced Object Detection System for Waste Management
Real-time detection and classification of waste objects using YOLO and computer vision
"""

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from ultralytics import YOLO
import tensorflow as tf
from PIL import Image
import logging
from typing import List, Dict, Tuple, Optional
import asyncio
import json
from datetime import datetime
import base64
import io

class WasteObjectDetector:
    """Advanced object detection for waste items"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.yolo_model = None
        self.tensorflow_model = None
        self.waste_classes = [
            'plastic_bottle', 'glass_bottle', 'aluminum_can', 'paper',
            'cardboard', 'organic_waste', 'electronic_waste', 'metal_scrap',
            'textile', 'hazardous_waste', 'battery', 'tire'
        ]
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
        self.load_models()
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            # Load YOLO model for real-time detection
            self.yolo_model = YOLO('c:/Users/Ayush/delhi-waste-management/ai-services/models/waste_model.pt')
            
            # Load custom waste detection model
            # self.tensorflow_model = tf.keras.models.load_model(
            #     'models/waste_detection_model.h5'
            # )
            
            self.logger.info("Object detection models loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading models: {e}")
    
    async def detect_objects(self, image_data: bytes) -> Dict:
        """Detect waste objects in image"""
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            image_array = np.array(image)
            
            # YOLO detection
            yolo_results = self.yolo_model(image_array)
            
            # Process results
            detections = []
            for result in yolo_results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_index = int(box.cls)
                        if class_index < len(self.yolo_model.names):
                            detection = {
                                'class': self.yolo_model.names[class_index],
                                'confidence': float(box.conf),
                                'bbox': box.xyxy.tolist()[0],
                                'area': self._calculate_area(box.xyxy.tolist()[0])
                            }
                            detections.append(detection)
            
            # Additional analysis
            analysis = await self._analyze_waste_composition(detections)
            
            return {
                'detections': detections,
                'total_objects': len(detections),
                'composition': analysis,
                'timestamp': datetime.now().isoformat(),
                'image_size': image.size
            }
            
        except Exception as e:
            self.logger.error(f"Error in object detection: {e}")
            return {'error': str(e)}
    
    def _calculate_area(self, bbox: List[float]) -> float:
        """Calculate bounding box area"""
        x1, y1, x2, y2 = bbox
        return (x2 - x1) * (y2 - y1)
    
    async def _analyze_waste_composition(self, detections: List[Dict]) -> Dict:
        """Analyze waste composition from detections"""
        composition = {}
        total_area = sum(det['area'] for det in detections)
        
        for detection in detections:
            waste_type = detection['class']
            area_percentage = (detection['area'] / total_area) * 100 if total_area > 0 else 0
            
            if waste_type not in composition:
                composition[waste_type] = {
                    'count': 0,
                    'total_area': 0,
                    'percentage': 0
                }
            
            composition[waste_type]['count'] += 1
            composition[waste_type]['total_area'] += detection['area']
            composition[waste_type]['percentage'] += area_percentage
        
        return composition

class RealTimeDetector:
    """Real-time object detection from video streams"""
    
    def __init__(self):
        self.detector = WasteObjectDetector()
        self.video_capture = None
        self.is_running = False
    
    async def start_video_detection(self, source: int = 0):
        """Start real-time detection from video source"""
        self.video_capture = cv2.VideoCapture(source)
        self.is_running = True
        
        while self.is_running:
            ret, frame = self.video_capture.read()
            if not ret:
                break
            
            # Convert frame to bytes
            _, buffer = cv2.imencode('.jpg', frame)
            image_bytes = buffer.tobytes()
            
            # Detect objects
            results = await self.detector.detect_objects(image_bytes)
            
            # Draw bounding boxes
            annotated_frame = self._draw_detections(frame, results.get('detections', []))
            
            # Display frame
            cv2.imshow('Waste Detection', annotated_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
            await asyncio.sleep(0.1)  # Control frame rate
        
        self.stop_detection()
    
    def _draw_detections(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """Draw bounding boxes on frame"""
        for detection in detections:
            bbox = detection['bbox']
            x1, y1, x2, y2 = map(int, bbox)
            
            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{detection['class']}: {detection['confidence']:.2f}"
            cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return frame
    
    def stop_detection(self):
        """Stop video detection"""
        self.is_running = False
        if self.video_capture:
            self.video_capture.release()
        cv2.destroyAllWindows()

class BatchProcessor:
    """Batch processing for multiple images"""
    
    def __init__(self):
        self.detector = WasteObjectDetector()
    
    async def process_batch(self, image_paths: List[str]) -> List[Dict]:
        """Process multiple images in batch"""
        results = []
        
        for image_path in image_paths:
            try:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                
                result = await self.detector.detect_objects(image_data)
                result['image_path'] = image_path
                results.append(result)
                
            except Exception as e:
                results.append({
                    'image_path': image_path,
                    'error': str(e)
                })
        
        return results


# Example usage
async def main():
    # This is an example and won't run without a sample image.
    # Create a dummy image file named 'sample_waste_image.jpg' to test.
    try:
        from PIL import Image
        dummy_image = Image.new('RGB', (600, 400), color = 'red')
        dummy_image.save('sample_waste_image.jpg')

        # Initialize detector
        detector = WasteObjectDetector()
        
        # Example image detection
        with open('sample_waste_image.jpg', 'rb') as f:
            image_data = f.read()
        
        results = await detector.detect_objects(image_data)
        print(json.dumps(results, indent=2))
    except FileNotFoundError:
        print("Please create a 'sample_waste_image.jpg' to run the example.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())