"""
Advanced Video Analytics System for Waste Management
Real-time video processing, behavior analysis, and incident detection
"""

import cv2
import numpy as np
import tensorflow as tf
from typing import Dict, List, Tuple, Optional
import asyncio
import logging
from datetime import datetime
import json
import redis
from dataclasses import dataclass
from enum import Enum

class EventType(Enum):
    ILLEGAL_DUMPING = "illegal_dumping"
    OVERFLOW_DETECTED = "overflow_detected"
    VANDALISM = "vandalism"
    FIRE_HAZARD = "fire_hazard"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    COLLECTION_NEEDED = "collection_needed"
    MAINTENANCE_REQUIRED = "maintenance_required"

@dataclass
class VideoEvent:
    event_type: EventType
    timestamp: datetime
    location: Tuple[float, float]
    confidence: float
    description: str
    video_clip: Optional[str] = None
    metadata: Optional[Dict] = None

class VideoAnalyticsEngine:
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.redis_client = redis.Redis(
            host=config.get('redis_host', 'localhost'),
            port=config.get('redis_port', 6379),
            decode_responses=True
        )
        
        # Load AI models
        self.object_detector = self._load_object_detection_model()
        self.behavior_analyzer = self._load_behavior_model()
        self.anomaly_detector = self._load_anomaly_model()
        
        # Video processing parameters
        self.frame_buffer = []
        self.tracking_objects = {}
        self.event_history = []
        
    def _load_object_detection_model(self):
        """Load YOLO or similar object detection model"""
        try:
            model_path = self.config.get('object_model_path', 'models/yolo_waste.h5')
            return tf.keras.models.load_model(model_path)
        except Exception as e:
            self.logger.error(f"Failed to load object detection model: {e}")
            return None
    
    def _load_behavior_model(self):
        """Load behavior analysis model"""
        try:
            model_path = self.config.get('behavior_model_path', 'models/behavior_lstm.h5')
            return tf.keras.models.load_model(model_path)
        except Exception as e:
            self.logger.error(f"Failed to load behavior model: {e}")
            return None
    
    def _load_anomaly_model(self):
        """Load anomaly detection model"""
        try:
            model_path = self.config.get('anomaly_model_path', 'models/anomaly_autoencoder.h5')
            return tf.keras.models.load_model(model_path)
        except Exception as e:
            self.logger.error(f"Failed to load anomaly model: {e}")
            return None
    
    async def process_video_stream(self, stream_url: str, camera_id: str):
        """Process real-time video stream"""
        cap = cv2.VideoCapture(stream_url)
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame
                events = await self._analyze_frame(frame, camera_id)
                
                # Handle detected events
                for event in events:
                    await self._handle_event(event, camera_id)
                
                # Maintain frame buffer for temporal analysis
                self._update_frame_buffer(frame)
                
                await asyncio.sleep(0.1)  # Control processing rate
                
        finally:
            cap.release()
    
    async def _analyze_frame(self, frame: np.ndarray, camera_id: str) -> List[VideoEvent]:
        """Analyze single frame for events"""
        events = []
        
        # Object detection
        objects = await self._detect_objects(frame)
        
        # Behavior analysis
        behaviors = await self._analyze_behaviors(frame, objects)
        
        # Anomaly detection
        anomalies = await self._detect_anomalies(frame)
        
        # Combine results to generate events
        events.extend(await self._generate_events(objects, behaviors, anomalies, camera_id))
        
        return events
    
    async def _detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Detect objects in frame"""
        if self.object_detector is None:
            return []
        
        try:
            # Preprocess frame
            input_frame = cv2.resize(frame, (416, 416))
            input_frame = input_frame.astype(np.float32) / 255.0
            input_frame = np.expand_dims(input_frame, axis=0)
            
            # Run detection
            predictions = self.object_detector.predict(input_frame)
            
            # Post-process results
            objects = self._post_process_detections(predictions, frame.shape)
            
            return objects
            
        except Exception as e:
            self.logger.error(f"Object detection failed: {e}")
            return []
    
    async def _analyze_behaviors(self, frame: np.ndarray, objects: List[Dict]) -> List[Dict]:
        """Analyze human behaviors in the scene"""
        if self.behavior_analyzer is None:
            return []
        
        try:
            behaviors = []
            
            # Extract human objects
            humans = [obj for obj in objects if obj['class'] == 'person']
            
            for human in humans:
                # Extract features for behavior analysis
                features = self._extract_behavior_features(frame, human)
                
                # Predict behavior
                behavior_pred = self.behavior_analyzer.predict(features)
                
                behavior = {
                    'person_id': human.get('track_id'),
                    'behavior': self._decode_behavior(behavior_pred),
                    'confidence': float(np.max(behavior_pred)),
                    'bbox': human['bbox']
                }
                
                behaviors.append(behavior)
            
            return behaviors
            
        except Exception as e:
            self.logger.error(f"Behavior analysis failed: {e}")
            return []
    
    async def _detect_anomalies(self, frame: np.ndarray) -> List[Dict]:
        """Detect anomalous activities"""
        if self.anomaly_detector is None:
            return []
        
        try:
            # Preprocess frame for anomaly detection
            processed_frame = cv2.resize(frame, (128, 128))
            processed_frame = processed_frame.astype(np.float32) / 255.0
            processed_frame = np.expand_dims(processed_frame, axis=0)
            
            # Get reconstruction
            reconstruction = self.anomaly_detector.predict(processed_frame)
            
            # Calculate reconstruction error
            error = np.mean(np.square(processed_frame - reconstruction))
            
            anomalies = []
            if error > self.config.get('anomaly_threshold', 0.1):
                anomalies.append({
                    'type': 'anomaly',
                    'error': float(error),
                    'timestamp': datetime.now(),
                    'frame_data': processed_frame
                })
            
            return anomalies
            
        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {e}")
            return []
    
    async def _generate_events(self, objects: List[Dict], behaviors: List[Dict], 
                             anomalies: List[Dict], camera_id: str) -> List[VideoEvent]:
        """Generate events based on analysis results"""
        events = []
        
        # Check for illegal dumping
        dumping_event = self._check_illegal_dumping(objects, behaviors)
        if dumping_event:
            events.append(dumping_event)
        
        # Check for bin overflow
        overflow_event = self._check_bin_overflow(objects)
        if overflow_event:
            events.append(overflow_event)
        
        # Check for vandalism
        vandalism_event = self._check_vandalism(behaviors, anomalies)
        if vandalism_event:
            events.append(vandalism_event)
        
        # Check for fire hazards
        fire_event = self._check_fire_hazard(objects, anomalies)
        if fire_event:
            events.append(fire_event)
        
        return events
    
    def _check_illegal_dumping(self, objects: List[Dict], behaviors: List[Dict]) -> Optional[VideoEvent]:
        """Check for illegal dumping activities"""
        # Look for people carrying large objects near bins
        for behavior in behaviors:
            if behavior['behavior'] == 'carrying_large_object' and behavior['confidence'] > 0.7:
                # Check if near waste bin
                bin_objects = [obj for obj in objects if obj['class'] == 'waste_bin']
                if bin_objects:
                    return VideoEvent(
                        event_type=EventType.ILLEGAL_DUMPING,
                        timestamp=datetime.now(),
                        location=(0.0, 0.0),  # Would be filled with actual coordinates
                        confidence=behavior['confidence'],
                        description="Potential illegal dumping detected",
                        metadata={'behavior': behavior, 'objects': objects}
                    )
        return None
    
    def _check_bin_overflow(self, objects: List[Dict]) -> Optional[VideoEvent]:
        """Check for bin overflow conditions"""
        for obj in objects:
            if obj['class'] == 'waste_bin' and obj.get('fill_level', 0) > 0.9:
                return VideoEvent(
                    event_type=EventType.OVERFLOW_DETECTED,
                    timestamp=datetime.now(),
                    location=(0.0, 0.0),
                    confidence=obj.get('confidence', 0.8),
                    description="Waste bin overflow detected",
                    metadata={'bin_data': obj}
                )
        return None
    
    def _check_vandalism(self, behaviors: List[Dict], anomalies: List[Dict]) -> Optional[VideoEvent]:
        """Check for vandalism activities"""
        for behavior in behaviors:
            if behavior['behavior'] in ['aggressive_movement', 'destructive_action']:
                return VideoEvent(
                    event_type=EventType.VANDALISM,
                    timestamp=datetime.now(),
                    location=(0.0, 0.0),
                    confidence=behavior['confidence'],
                    description="Potential vandalism detected",
                    metadata={'behavior': behavior}
                )
        return None
    
    def _check_fire_hazard(self, objects: List[Dict], anomalies: List[Dict]) -> Optional[VideoEvent]:
        """Check for fire hazards"""
        for obj in objects:
            if obj['class'] in ['fire', 'smoke'] and obj['confidence'] > 0.6:
                return VideoEvent(
                    event_type=EventType.FIRE_HAZARD,
                    timestamp=datetime.now(),
                    location=(0.0, 0.0),
                    confidence=obj['confidence'],
                    description="Fire hazard detected",
                    metadata={'fire_data': obj}
                )
        return None
    
    async def _handle_event(self, event: VideoEvent, camera_id: str):
        """Handle detected event"""
        try:
            # Store event in database
            await self._store_event(event, camera_id)
            
            # Send real-time notification
            await self._send_notification(event, camera_id)
            
            # Update analytics
            await self._update_analytics(event, camera_id)
            
            self.logger.info(f"Event handled: {event.event_type} at camera {camera_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to handle event: {e}")
    
    async def _store_event(self, event: VideoEvent, camera_id: str):
        """Store event in database"""
        event_data = {
            'camera_id': camera_id,
            'event_type': event.event_type.value,
            'timestamp': event.timestamp.isoformat(),
            'location': event.location,
            'confidence': event.confidence,
            'description': event.description,
            'metadata': event.metadata or {}
        }
        
        # Store in Redis for real-time access
        self.redis_client.lpush('video_events', json.dumps(event_data))
        self.redis_client.expire('video_events', 86400)  # 24 hours
    
    async def _send_notification(self, event: VideoEvent, camera_id: str):
        """Send real-time notification"""
        notification = {
            'type': 'video_event',
            'camera_id': camera_id,
            'event': event.event_type.value,
            'timestamp': event.timestamp.isoformat(),
            'confidence': event.confidence,
            'description': event.description
        }
        
        # Publish to notification channel
        self.redis_client.publish('notifications', json.dumps(notification))
    
    async def _update_analytics(self, event: VideoEvent, camera_id: str):
        """Update analytics counters"""
        date_key = datetime.now().strftime('%Y-%m-%d')
        
        # Update event counters
        self.redis_client.hincrby(f'analytics:{date_key}', f'{event.event_type.value}:{camera_id}', 1)
        self.redis_client.hincrby(f'analytics:{date_key}', f'total_events:{camera_id}', 1)
        
        # Set expiration
        self.redis_client.expire(f'analytics:{date_key}', 86400 * 30)  # 30 days
    
    def _post_process_detections(self, predictions: np.ndarray, frame_shape: Tuple) -> List[Dict]:
        """Post-process object detection results"""
        objects = []
        
        # This would contain actual post-processing logic
        # for converting model predictions to object detections
        
        return objects
    
    def _extract_behavior_features(self, frame: np.ndarray, human: Dict) -> np.ndarray:
        """Extract features for behavior analysis"""
        # Extract region of interest
        bbox = human['bbox']
        roi = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        
        # Resize and normalize
        roi = cv2.resize(roi, (64, 64))
        roi = roi.astype(np.float32) / 255.0
        
        # Add temporal features if available
        features = np.expand_dims(roi, axis=0)
        
        return features
    
    def _decode_behavior(self, prediction: np.ndarray) -> str:
        """Decode behavior prediction"""
        behaviors = [
            'normal_walking',
            'carrying_large_object',
            'aggressive_movement',
            'destructive_action',
            'loitering',
            'running'
        ]
        
        return behaviors[np.argmax(prediction)]
    
    def _update_frame_buffer(self, frame: np.ndarray):
        """Update frame buffer for temporal analysis"""
        self.frame_buffer.append(frame)
        
        # Keep only last N frames
        max_buffer_size = self.config.get('frame_buffer_size', 30)
        if len(self.frame_buffer) > max_buffer_size:
            self.frame_buffer.pop(0)
    
    async def get_camera_analytics(self, camera_id: str, date: str = None) -> Dict:
        """Get analytics for specific camera"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        analytics_key = f'analytics:{date}'
        camera_data = {}
        
        # Get all analytics for the camera
        all_data = self.redis_client.hgetall(analytics_key)
        
        for key, value in all_data.items():
            if key.endswith(f':{camera_id}'):
                event_type = key.replace(f':{camera_id}', '')
                camera_data[event_type] = int(value)
        
        return camera_data
    
    async def get_recent_events(self, limit: int = 100) -> List[Dict]:
        """Get recent video events"""
        events = self.redis_client.lrange('video_events', 0, limit - 1)
        return [json.loads(event) for event in events]

class CameraManager:
    def __init__(self, config: Dict):
        self.config = config
        self.analytics_engine = VideoAnalyticsEngine(config)
        self.active_streams = {}
        self.logger = logging.getLogger(__name__)
    
    async def add_camera(self, camera_id: str, stream_url: str, location: Tuple[float, float]):
        """Add new camera to monitoring system"""
        if camera_id in self.active_streams:
            self.logger.warning(f"Camera {camera_id} already exists")
            return
        
        # Start processing stream
        task = asyncio.create_task(
            self.analytics_engine.process_video_stream(stream_url, camera_id)
        )
        
        self.active_streams[camera_id] = {
            'task': task,
            'stream_url': stream_url,
            'location': location,
            'status': 'active'
        }
        
        self.logger.info(f"Added camera {camera_id} at {location}")
    
    async def remove_camera(self, camera_id: str):
        """Remove camera from monitoring system"""
        if camera_id not in self.active_streams:
            self.logger.warning(f"Camera {camera_id} not found")
            return
        
        # Cancel processing task
        self.active_streams[camera_id]['task'].cancel()
        del self.active_streams[camera_id]
        
        self.logger.info(f"Removed camera {camera_id}")
    
    async def get_camera_status(self) -> Dict:
        """Get status of all cameras"""
        status = {}
        
        for camera_id, camera_data in self.active_streams.items():
            status[camera_id] = {
                'location': camera_data['location'],
                'status': camera_data['status'],
                'stream_url': camera_data['stream_url']
            }
        
        return status
    
    async def get_system_analytics(self) -> Dict:
        """Get system-wide analytics"""
        analytics = {
            'total_cameras': len(self.active_streams),
            'active_cameras': sum(1 for cam in self.active_streams.values() if cam['status'] == 'active'),
            'daily_events': {},
            'event_types': {}
        }
        
        # Get analytics for all cameras
        for camera_id in self.active_streams.keys():
            camera_analytics = await self.analytics_engine.get_camera_analytics(camera_id)
            
            for event_type, count in camera_analytics.items():
                if event_type not in analytics['event_types']:
                    analytics['event_types'][event_type] = 0
                analytics['event_types'][event_type] += count
        
        return analytics

# Usage example
async def main():
    config = {
        'redis_host': 'localhost',
        'redis_port': 6379,
        'object_model_path': 'models/yolo_waste.h5',
        'behavior_model_path': 'models/behavior_lstm.h5',
        'anomaly_model_path': 'models/anomaly_autoencoder.h5',
        'anomaly_threshold': 0.1,
        'frame_buffer_size': 30
    }
    
    camera_manager = CameraManager(config)
    
    # Add cameras
    await camera_manager.add_camera(
        'cam_001',
        'rtsp://camera1.example.com/stream',
        (28.6139, 77.2090)  # Delhi coordinates
    )
    
    await camera_manager.add_camera(
        'cam_002',
        'rtsp://camera2.example.com/stream',
        (28.6129, 77.2295)
    )
    
    # Monitor for events
    try:
        while True:
            # Get recent events
            events = await camera_manager.analytics_engine.get_recent_events(10)
            
            if events:
                print(f"Recent events: {len(events)}")
                for event in events[:3]:  # Show first 3
                    print(f"- {event['event']} at {event['timestamp']}")
            
            await asyncio.sleep(10)
            
    except KeyboardInterrupt:
        print("Shutting down video analytics system...")
        
        # Clean up cameras
        for camera_id in list(camera_manager.active_streams.keys()):
            await camera_manager.remove_camera(camera_id)

if __name__ == "__main__":
    asyncio.run(main())