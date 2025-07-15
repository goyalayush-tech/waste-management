"""
Advanced AI Waste Classification Service
Provides real-time waste classification using computer vision and deep learning
"""

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import torch
import torchvision.transforms as transforms
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional
import asyncio
import aiohttp
import json
from datetime import datetime
import base64
import io

class WasteClassificationAI:
    """Advanced AI system for waste classification"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.models = {}
        self.confidence_threshold = 0.85
        self.waste_categories = {
            'organic': ['food_waste', 'garden_waste', 'paper'],
            'recyclable': ['plastic', 'glass', 'metal', 'cardboard'],
            'hazardous': ['battery', 'electronics', 'chemicals'],
            'general': ['textile', 'rubber', 'mixed']
        }
        self.load_models()
    
    def load_models(self):
        """Load pre-trained AI models"""
        try:
            # Load TensorFlow model for general classification
            self.models['general'] = load_model('models/waste_classifier_v3.h5')
            
            # Load PyTorch model for detailed classification
            self.models['detailed'] = torch.load('models/detailed_classifier.pth')
            
            # Load YOLO model for object detection
            self.models['yolo'] = cv2.dnn.readNet('models/yolo_waste.weights', 'models/yolo_waste.cfg')
            
            # Load custom CNN for material identification
            self.models['material'] = load_model('models/material_classifier.h5')
            
            self.logger.info("All AI models loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading models: {e}")
    
    async def classify_image(self, image_data: bytes) -> Dict:
        """Classify waste from image data"""
        try:
            # Convert bytes to image
            image_pil = Image.open(io.BytesIO(image_data))
            image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
            
            # Run multiple classification models
            results = await asyncio.gather(
                self._general_classification(image_pil),
                self._detailed_classification(image_pil),
                self._object_detection(image_cv),
                self._material_identification(image_pil)
            )
            
            # Combine results
            classification_result = self._combine_results(results)
            
            return {
                'success': True,
                'classification': classification_result,
                'confidence': classification_result.get('confidence', 0),
                'category': classification_result.get('category'),
                'subcategory': classification_result.get('subcategory'),
                'material': classification_result.get('material'),
                'recyclable': classification_result.get('recyclable', False),
                'hazardous': classification_result.get('hazardous', False),
                'processing_time': classification_result.get('processing_time'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Classification error: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    async def _general_classification(self, image_pil: Image) -> Dict:
        """General waste classification using TensorFlow"""
        try:
            # Preprocess image
            img_array = image.img_to_array(image_pil.resize((224, 224)))
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0
            
            # Predict
            predictions = self.models['general'].predict(img_array)
            class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][class_idx])
            
            categories = ['organic', 'recyclable', 'hazardous', 'general']
            
            return {
                'model': 'general',
                'category': categories[class_idx],
                'confidence': confidence,
                'all_predictions': predictions[0].tolist()
            }
            
        except Exception as e:
            self.logger.error(f"General classification error: {e}")
            return {'model': 'general', 'error': str(e)}
    
    async def _detailed_classification(self, image_pil: Image) -> Dict:
        """Detailed classification using PyTorch"""
        try:
            # Preprocess for PyTorch
            transform = transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            input_tensor = transform(image_pil).unsqueeze(0)
            
            # Predict
            with torch.no_grad():
                outputs = self.models['detailed'](input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                
            # Get top predictions
            top5_prob, top5_catid = torch.topk(probabilities, 5)
            
            detailed_classes = [
                'plastic_bottle', 'glass_bottle', 'aluminum_can', 'paper_cup',
                'food_waste', 'cardboard', 'battery', 'electronics',
                'textile', 'rubber', 'metal_scrap', 'organic_waste'
            ]
            
            predictions = []
            for i in range(5):
                predictions.append({
                    'class': detailed_classes[top5_catid[i]],
                    'confidence': float(top5_prob[i])
                })
            
            return {
                'model': 'detailed',
                'top_prediction': predictions[0],
                'all_predictions': predictions
            }
            
        except Exception as e:
            self.logger.error(f"Detailed classification error: {e}")
            return {'model': 'detailed', 'error': str(e)}
    
    async def _object_detection(self, image_cv: np.ndarray) -> Dict:
        """Object detection using YOLO"""
        try:
            height, width = image_cv.shape[:2]
            
            # Create blob from image
            blob = cv2.dnn.blobFromImage(image_cv, 1/255.0, (416, 416), swapRB=True, crop=False)
            self.models['yolo'].setInput(blob)
            
            # Run detection
            layer_names = self.models['yolo'].getLayerNames()
            output_layers = [layer_names[i[0] - 1] for i in self.models['yolo'].getUnconnectedOutLayers()]
            outputs = self.models['yolo'].forward(output_layers)
            
            # Process detections
            boxes = []
            confidences = []
            class_ids = []
            
            for output in outputs:
                for detection in output:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    
                    if confidence > 0.5:
                        center_x = int(detection[0] * width)
                        center_y = int(detection[1] * height)
                        w = int(detection[2] * width)
                        h = int(detection[3] * height)
                        
                        x = int(center_x - w/2)
                        y = int(center_y - h/2)
                        
                        boxes.append([x, y, w, h])
                        confidences.append(float(confidence))
                        class_ids.append(class_id)
            
            # Apply non-maximum suppression
            indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
            
            detections = []
            if len(indices) > 0:
                for i in indices.flatten():
                    detections.append({
                        'class_id': class_ids[i],
                        'confidence': confidences[i],
                        'box': boxes[i]
                    })
            
            return {
                'model': 'yolo',
                'detections': detections,
                'object_count': len(detections)
            }
            
        except Exception as e:
            self.logger.error(f"Object detection error: {e}")
            return {'model': 'yolo', 'error': str(e)}
    
    async def _material_identification(self, image_pil: Image) -> Dict:
        """Identify material composition"""
        try:
            # Preprocess for material classification
            img_array = image.img_to_array(image_pil.resize((150, 150)))
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array / 255.0
            
            # Predict material
            predictions = self.models['material'].predict(img_array)
            
            materials = ['plastic', 'glass', 'metal', 'paper', 'organic', 'textile', 'rubber']
            material_probs = {materials[i]: float(predictions[0][i]) for i in range(len(materials))}
            
            # Get primary material
            primary_material = max(material_probs, key=material_probs.get)
            
            return {
                'model': 'material',
                'primary_material': primary_material,
                'material_probabilities': material_probs,
                'confidence': material_probs[primary_material]
            }
            
        except Exception as e:
            self.logger.error(f"Material identification error: {e}")
            return {'model': 'material', 'error': str(e)}
    
    def _combine_results(self, results: List[Dict]) -> Dict:
        """Combine results from multiple models"""
        start_time = datetime.utcnow()
        
        general_result, detailed_result, yolo_result, material_result = results
        
        # Determine final classification
        final_category = general_result.get('category', 'general')
        final_confidence = general_result.get('confidence', 0)
        
        # Get detailed subcategory
        subcategory = None
        if detailed_result.get('top_prediction'):
            subcategory = detailed_result['top_prediction']['class']
        
        # Get material information
        material = material_result.get('primary_material', 'unknown')
        
        # Determine if recyclable
        recyclable = self._is_recyclable(final_category, subcategory, material)
        
        # Determine if hazardous
        hazardous = self._is_hazardous(final_category, subcategory, material)
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        return {
            'category': final_category,
            'subcategory': subcategory,
            'material': material,
            'confidence': final_confidence,
            'recyclable': recyclable,
            'hazardous': hazardous,
            'processing_time': processing_time,
            'model_results': {
                'general': general_result,
                'detailed': detailed_result,
                'yolo': yolo_result,
                'material': material_result
            }
        }
    
    def _is_recyclable(self, category: str, subcategory: str, material: str) -> bool:
        """Determine if waste is recyclable"""
        recyclable_materials = ['plastic', 'glass', 'metal', 'paper']
        recyclable_categories = ['recyclable']
        
        return (category in recyclable_categories or 
                material in recyclable_materials or
                (subcategory and any(rec in subcategory for rec in recyclable_materials)))
    
    def _is_hazardous(self, category: str, subcategory: str, material: str) -> bool:
        """Determine if waste is hazardous"""
        hazardous_keywords = ['battery', 'electronics', 'chemical', 'toxic']
        
        return (category == 'hazardous' or
                (subcategory and any(haz in subcategory for haz in hazardous_keywords)))
    
    async def batch_classify(self, image_batch: List[bytes]) -> List[Dict]:
        """Classify multiple images in batch"""
        tasks = [self.classify_image(img_data) for img_data in image_batch]
        results = await asyncio.gather(*tasks)
        return results
    
    async def real_time_classification(self, video_stream_url: str) -> None:
        """Real-time classification from video stream"""
        cap = cv2.VideoCapture(video_stream_url)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert frame to bytes
            _, buffer = cv2.imencode('.jpg', frame)
            image_bytes = buffer.tobytes()
            
            # Classify frame
            result = await self.classify_image(image_bytes)
            
            # Process result (send to dashboard, trigger alerts, etc.)
            await self._process_real_time_result(result)
            
            # Add small delay to prevent overwhelming
            await asyncio.sleep(0.1)
        
        cap.release()
    
    async def _process_real_time_result(self, result: Dict) -> None:
        """Process real-time classification result"""
        # Send to dashboard via WebSocket
        # Trigger alerts for hazardous waste
        # Update statistics
        pass
    
    def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        return {
            'models_loaded': list(self.models.keys()),
            'confidence_threshold': self.confidence_threshold,
            'waste_categories': self.waste_categories,
            'supported_formats': ['jpg', 'jpeg', 'png', 'bmp'],
            'max_image_size': '10MB',
            'processing_speed': 'avg 0.5s per image'
        }

# Global instance
waste_classifier = WasteClassificationAI()

# API endpoints for integration
async def classify_waste_api(image_data: bytes) -> Dict:
    """API endpoint for waste classification"""
    return await waste_classifier.classify_image(image_data)

async def batch_classify_api(image_batch: List[bytes]) -> List[Dict]:
    """API endpoint for batch classification"""
    return await waste_classifier.batch_classify(image_batch)

if __name__ == "__main__":
    # Test the classification system
    import asyncio
    
    async def test_classification():
        # Test with sample image
        with open('test_images/sample_waste.jpg', 'rb') as f:
            image_data = f.read()
        
        result = await waste_classifier.classify_image(image_data)
        print(json.dumps(result, indent=2))
    
    asyncio.run(test_classification())