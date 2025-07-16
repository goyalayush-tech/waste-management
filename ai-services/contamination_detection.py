"""
Advanced Contamination Detection System for Waste Management
Detects contamination in recyclable streams using computer vision and spectral analysis
"""

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
import logging
from typing import Dict, List, Tuple, Optional, Any
import asyncio
import json
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import pickle

# Import multi-modal fusion components
from .multi_modal_sensor_fusion import SpectralData, ChemicalData, SensorType

class ContaminationType(Enum):
    ORGANIC_IN_PLASTIC = "organic_in_plastic"
    METAL_IN_PLASTIC = "metal_in_plastic"
    GLASS_IN_PLASTIC = "glass_in_plastic"
    PAPER_IN_PLASTIC = "paper_in_plastic"
    PLASTIC_IN_ORGANIC = "plastic_in_organic"
    METAL_IN_ORGANIC = "metal_in_organic"
    GLASS_IN_ORGANIC = "glass_in_organic"
    HAZARDOUS_IN_GENERAL = "hazardous_in_general"
    LIQUID_CONTAMINATION = "liquid_contamination"
    CHEMICAL_CONTAMINATION = "chemical_contamination"
    BIOLOGICAL_CONTAMINATION = "biological_contamination"
    CROSS_CONTAMINATION = "cross_contamination"

class ContaminationSeverity(Enum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class ContaminationResult:
    contamination_detected: bool
    contamination_types: List[ContaminationType]
    severity_level: ContaminationSeverity
    confidence: float
    affected_area_percentage: float
    contamination_locations: List[Tuple[int, int, int, int]]  # Bounding boxes
    remediation_suggestions: List[str]
    processing_impact: Dict[str, Any]
    quality_degradation: float
    economic_impact: float

@dataclass
class RemediationAction:
    action_type: str
    description: str
    estimated_cost: float
    estimated_time: float
    success_probability: float
    equipment_required: List[str]
    safety_requirements: List[str]

class ContaminationDetector:
    """Advanced contamination detection using multi-modal analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Detection models
        self.visual_contamination_model = None
        self.spectral_contamination_model = None
        self.chemical_contamination_model = None
        
        # Contamination thresholds
        self.contamination_thresholds = {
            ContaminationType.ORGANIC_IN_PLASTIC: 0.05,  # 5% organic matter
            ContaminationType.METAL_IN_PLASTIC: 0.02,    # 2% metal content
            ContaminationType.GLASS_IN_PLASTIC: 0.03,    # 3% glass content
            ContaminationType.PAPER_IN_PLASTIC: 0.10,    # 10% paper content
            ContaminationType.PLASTIC_IN_ORGANIC: 0.01,  # 1% plastic in organic
            ContaminationType.HAZARDOUS_IN_GENERAL: 0.001, # 0.1% hazardous materials
            ContaminationType.LIQUID_CONTAMINATION: 0.15,  # 15% liquid content
            ContaminationType.CHEMICAL_CONTAMINATION: 0.005, # 0.5% chemical contamination
            ContaminationType.BIOLOGICAL_CONTAMINATION: 0.02, # 2% biological contamination
        }
        
        # Load or create models
        self._load_contamination_models()
    
    def _load_contamination_models(self):
        """Load or create contamination detection models"""
        try:
            # Load visual contamination model
            self.visual_contamination_model = tf.keras.models.load_model(
                'models/visual_contamination_model.h5'
            )
            self.logger.info("Loaded visual contamination model")
        except:
            self.visual_contamination_model = self._create_visual_contamination_model()
            self.logger.info("Created new visual contamination model")
        
        try:
            # Load spectral contamination model
            self.spectral_contamination_model = tf.keras.models.load_model(
                'models/spectral_contamination_model.h5'
            )
            self.logger.info("Loaded spectral contamination model")
        except:
            self.spectral_contamination_model = self._create_spectral_contamination_model()
            self.logger.info("Created new spectral contamination model")
        
        try:
            # Load chemical contamination model
            self.chemical_contamination_model = tf.keras.models.load_model(
                'models/chemical_contamination_model.h5'
            )
            self.logger.info("Loaded chemical contamination model")
        except:
            self.chemical_contamination_model = self._create_chemical_contamination_model()
            self.logger.info("Created new chemical contamination model")
    
    def _create_visual_contamination_model(self) -> Model:
        """Create CNN model for visual contamination detection"""
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(64, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(128, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(256, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Flatten(),
            Dense(512, activation='relu'),
            Dropout(0.5),
            Dense(256, activation='relu'),
            Dropout(0.3),
            
            # Multiple outputs for different contamination types
            Dense(len(ContaminationType), activation='sigmoid', name='contamination_types'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _create_spectral_contamination_model(self) -> Model:
        """Create model for spectral contamination detection"""
        model = Sequential([
            Dense(512, activation='relu', input_shape=(1000,)),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(256, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(128, activation='relu'),
            BatchNormalization(),
            
            Dense(64, activation='relu'),
            
            # Output contamination probabilities
            Dense(len(ContaminationType), activation='sigmoid', name='spectral_contamination'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _create_chemical_contamination_model(self) -> Model:
        """Create model for chemical contamination detection"""
        model = Sequential([
            Dense(128, activation='relu', input_shape=(50,)),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(64, activation='relu'),
            BatchNormalization(),
            
            Dense(32, activation='relu'),
            
            # Output contamination probabilities
            Dense(len(ContaminationType), activation='sigmoid', name='chemical_contamination'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    async def detect_contamination(
        self,
        image_data: bytes,
        spectral_data: Optional[SpectralData] = None,
        chemical_data: Optional[ChemicalData] = None,
        expected_material_type: str = "mixed"
    ) -> ContaminationResult:
        """Detect contamination using multi-modal analysis"""
        try:
            # Analyze each data type
            visual_contamination = await self._detect_visual_contamination(image_data)
            
            spectral_contamination = {}
            if spectral_data:
                spectral_contamination = await self._detect_spectral_contamination(spectral_data)
            
            chemical_contamination = {}
            if chemical_data:
                chemical_contamination = await self._detect_chemical_contamination(chemical_data)
            
            # Combine results
            combined_result = await self._combine_contamination_results(
                visual_contamination,
                spectral_contamination,
                chemical_contamination,
                expected_material_type
            )
            
            return combined_result
            
        except Exception as e:
            self.logger.error(f"Contamination detection failed: {e}")
            return ContaminationResult(
                contamination_detected=False,
                contamination_types=[],
                severity_level=ContaminationSeverity.NONE,
                confidence=0.0,
                affected_area_percentage=0.0,
                contamination_locations=[],
                remediation_suggestions=[],
                processing_impact={},
                quality_degradation=0.0,
                economic_impact=0.0
            )
    
    async def _detect_visual_contamination(self, image_data: bytes) -> Dict:
        """Detect contamination using computer vision"""
        try:
            # Convert image data
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Preprocess image
            image_resized = cv2.resize(image, (224, 224))
            image_normalized = image_resized.astype(np.float32) / 255.0
            image_batch = np.expand_dims(image_normalized, axis=0)
            
            # Run contamination detection
            contamination_probs = self.visual_contamination_model.predict(image_batch)[0]
            
            # Detect contamination locations using image segmentation
            contamination_locations = await self._detect_contamination_locations(image)
            
            # Calculate affected area percentage
            affected_area_percentage = await self._calculate_affected_area(image, contamination_locations)
            
            return {
                'contamination_probabilities': contamination_probs,
                'contamination_locations': contamination_locations,
                'affected_area_percentage': affected_area_percentage,
                'confidence': float(np.max(contamination_probs))
            }
            
        except Exception as e:
            self.logger.error(f"Visual contamination detection failed: {e}")
            return {
                'contamination_probabilities': np.zeros(len(ContaminationType)),
                'contamination_locations': [],
                'affected_area_percentage': 0.0,
                'confidence': 0.0
            }
    
    async def _detect_spectral_contamination(self, spectral_data: SpectralData) -> Dict:
        """Detect contamination using spectral analysis"""
        try:
            # Process spectral data
            intensities = np.array(spectral_data.intensities)
            
            # Normalize intensities
            intensities_normalized = (intensities - np.min(intensities)) / (np.max(intensities) - np.min(intensities) + 1e-8)
            
            # Extract spectral features
            spectral_features = await self._extract_spectral_contamination_features(spectral_data)
            
            # Pad or truncate to expected size
            if len(spectral_features) > 1000:
                spectral_features = spectral_features[:1000]
            else:
                spectral_features.extend([0.0] * (1000 - len(spectral_features)))
            
            # Run contamination detection
            features_batch = np.expand_dims(np.array(spectral_features), axis=0)
            contamination_probs = self.spectral_contamination_model.predict(features_batch)[0]
            
            return {
                'contamination_probabilities': contamination_probs,
                'confidence': float(np.max(contamination_probs)),
                'spectral_anomalies': await self._detect_spectral_anomalies(spectral_data)
            }
            
        except Exception as e:
            self.logger.error(f"Spectral contamination detection failed: {e}")
            return {
                'contamination_probabilities': np.zeros(len(ContaminationType)),
                'confidence': 0.0,
                'spectral_anomalies': []
            }
    
    async def _detect_chemical_contamination(self, chemical_data: ChemicalData) -> Dict:
        """Detect contamination using chemical analysis"""
        try:
            # Extract chemical features
            chemical_features = await self._extract_chemical_contamination_features(chemical_data)
            
            # Run contamination detection
            features_batch = np.expand_dims(np.array(chemical_features), axis=0)
            contamination_probs = self.chemical_contamination_model.predict(features_batch)[0]
            
            # Detect specific chemical contaminants
            chemical_contaminants = await self._identify_chemical_contaminants(chemical_data)
            
            return {
                'contamination_probabilities': contamination_probs,
                'confidence': float(np.max(contamination_probs)),
                'chemical_contaminants': chemical_contaminants
            }
            
        except Exception as e:
            self.logger.error(f"Chemical contamination detection failed: {e}")
            return {
                'contamination_probabilities': np.zeros(len(ContaminationType)),
                'confidence': 0.0,
                'chemical_contaminants': []
            }
    
    async def _detect_contamination_locations(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect locations of contamination in image using segmentation"""
        try:
            # Convert to HSV for better color segmentation
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Define color ranges for different contaminants
            contaminant_ranges = {
                'organic': [(20, 50, 50), (80, 255, 255)],    # Green/brown range
                'metal': [(0, 0, 150), (180, 30, 255)],       # Metallic/gray range
                'liquid': [(100, 100, 50), (130, 255, 255)],  # Blue range for liquids
            }
            
            contamination_locations = []
            
            for contaminant_type, (lower, upper) in contaminant_ranges.items():
                # Create mask for this contaminant type
                mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
                
                # Find contours
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                # Convert contours to bounding boxes
                for contour in contours:
                    if cv2.contourArea(contour) > 100:  # Filter small areas
                        x, y, w, h = cv2.boundingRect(contour)
                        contamination_locations.append((x, y, w, h))
            
            return contamination_locations
            
        except Exception as e:
            self.logger.error(f"Contamination location detection failed: {e}")
            return []
    
    async def _calculate_affected_area(
        self,
        image: np.ndarray,
        contamination_locations: List[Tuple[int, int, int, int]]
    ) -> float:
        """Calculate percentage of image affected by contamination"""
        try:
            total_image_area = image.shape[0] * image.shape[1]
            contaminated_area = 0
            
            for x, y, w, h in contamination_locations:
                contaminated_area += w * h
            
            return min(100.0, (contaminated_area / total_image_area) * 100.0)
            
        except Exception as e:
            self.logger.error(f"Affected area calculation failed: {e}")
            return 0.0
    
    async def _extract_spectral_contamination_features(self, spectral_data: SpectralData) -> List[float]:
        """Extract features from spectral data for contamination detection"""
        features = []
        
        intensities = np.array(spectral_data.intensities)
        wavelengths = np.array(spectral_data.wavelengths)
        
        # Basic statistical features
        features.extend([
            float(np.mean(intensities)),
            float(np.std(intensities)),
            float(np.min(intensities)),
            float(np.max(intensities)),
            float(np.median(intensities))
        ])
        
        # Peak analysis
        peaks = []
        for i in range(1, len(intensities) - 1):
            if intensities[i] > intensities[i-1] and intensities[i] > intensities[i+1]:
                peaks.append(intensities[i])
        
        if peaks:
            features.extend([
                float(np.mean(peaks)),
                float(len(peaks)),
                float(np.max(peaks))
            ])
        else:
            features.extend([0.0, 0.0, 0.0])
        
        # Spectral bands analysis for contamination signatures
        contamination_bands = [
            (400, 500),   # Organic compounds
            (1000, 1200), # Plastic signatures
            (1400, 1600), # Water/moisture
            (2800, 3000), # Organic C-H bonds
        ]
        
        for start, end in contamination_bands:
            band_indices = [i for i, w in enumerate(wavelengths) if start <= w <= end]
            if band_indices:
                band_intensities = intensities[band_indices]
                features.extend([
                    float(np.mean(band_intensities)),
                    float(np.max(band_intensities)),
                    float(np.std(band_intensities))
                ])
            else:
                features.extend([0.0, 0.0, 0.0])
        
        return features
    
    async def _extract_chemical_contamination_features(self, chemical_data: ChemicalData) -> List[float]:
        """Extract features from chemical data for contamination detection"""
        features = []
        
        # Element composition features
        common_elements = ['C', 'H', 'O', 'N', 'S', 'P', 'Ca', 'Mg', 'K', 'Na', 'Fe', 'Al', 'Si', 'Cl']
        for element in common_elements:
            features.append(chemical_data.elements.get(element, 0.0))
        
        # Compound features
        common_compounds = ['cellulose', 'lignin', 'protein', 'lipid', 'starch', 'PET', 'PE', 'PP', 'PS', 'PVC']
        for compound in common_compounds:
            features.append(chemical_data.compounds.get(compound, 0.0))
        
        # Chemical properties
        features.extend([
            chemical_data.ph_level or 7.0,
            chemical_data.moisture_content or 0.0,
            chemical_data.organic_content or 0.0
        ])
        
        # Contamination indicators
        heavy_metals = ['Pb', 'Hg', 'Cd', 'Cr', 'As']
        heavy_metal_content = sum(chemical_data.elements.get(metal, 0.0) for metal in heavy_metals)
        features.append(heavy_metal_content)
        
        # Organic contamination indicators
        total_carbon = chemical_data.elements.get('C', 0.0)
        total_nitrogen = chemical_data.elements.get('N', 0.0)
        c_n_ratio = total_carbon / (total_nitrogen + 1e-8)
        features.append(c_n_ratio)
        
        # Pad to expected size
        while len(features) < 50:
            features.append(0.0)
        
        return features[:50]
    
    async def _detect_spectral_anomalies(self, spectral_data: SpectralData) -> List[Dict]:
        """Detect spectral anomalies that indicate contamination"""
        anomalies = []
        
        intensities = np.array(spectral_data.intensities)
        wavelengths = np.array(spectral_data.wavelengths)
        
        # Detect unusual peaks
        mean_intensity = np.mean(intensities)
        std_intensity = np.std(intensities)
        threshold = mean_intensity + 3 * std_intensity
        
        for i, intensity in enumerate(intensities):
            if intensity > threshold:
                anomalies.append({
                    'type': 'unusual_peak',
                    'wavelength': wavelengths[i],
                    'intensity': float(intensity),
                    'deviation': float((intensity - mean_intensity) / std_intensity)
                })
        
        # Detect baseline shifts
        baseline_windows = 50
        for i in range(0, len(intensities) - baseline_windows, baseline_windows):
            window = intensities[i:i+baseline_windows]
            if np.std(window) > 2 * std_intensity:
                anomalies.append({
                    'type': 'baseline_shift',
                    'wavelength_range': [wavelengths[i], wavelengths[i+baseline_windows-1]],
                    'deviation': float(np.std(window) / std_intensity)
                })
        
        return anomalies
    
    async def _identify_chemical_contaminants(self, chemical_data: ChemicalData) -> List[Dict]:
        """Identify specific chemical contaminants"""
        contaminants = []
        
        # Heavy metals
        heavy_metals = {
            'Pb': 0.001,  # Lead threshold (0.1%)
            'Hg': 0.0001, # Mercury threshold (0.01%)
            'Cd': 0.0005, # Cadmium threshold (0.05%)
            'Cr': 0.001,  # Chromium threshold (0.1%)
            'As': 0.0005  # Arsenic threshold (0.05%)
        }
        
        for metal, threshold in heavy_metals.items():
            content = chemical_data.elements.get(metal, 0.0)
            if content > threshold:
                contaminants.append({
                    'type': 'heavy_metal',
                    'element': metal,
                    'content': content,
                    'threshold': threshold,
                    'severity': 'high' if content > threshold * 2 else 'medium'
                })
        
        # Organic contaminants
        if chemical_data.organic_content and chemical_data.organic_content > 90:
            # Check for plastic contamination in organic waste
            plastic_indicators = ['PET', 'PE', 'PP', 'PS', 'PVC']
            plastic_content = sum(chemical_data.compounds.get(plastic, 0.0) for plastic in plastic_indicators)
            
            if plastic_content > 1.0:  # 1% plastic in organic
                contaminants.append({
                    'type': 'plastic_in_organic',
                    'content': plastic_content,
                    'severity': 'high' if plastic_content > 5.0 else 'medium'
                })
        
        # pH contamination
        if chemical_data.ph_level:
            if chemical_data.ph_level < 4.0 or chemical_data.ph_level > 10.0:
                contaminants.append({
                    'type': 'ph_contamination',
                    'ph_level': chemical_data.ph_level,
                    'severity': 'high' if chemical_data.ph_level < 2.0 or chemical_data.ph_level > 12.0 else 'medium'
                })
        
        return contaminants
    
    async def _combine_contamination_results(
        self,
        visual_result: Dict,
        spectral_result: Dict,
        chemical_result: Dict,
        expected_material_type: str
    ) -> ContaminationResult:
        """Combine results from different detection methods"""
        try:
            # Combine contamination probabilities
            all_probs = []
            if visual_result.get('contamination_probabilities') is not None:
                all_probs.append(visual_result['contamination_probabilities'])
            if spectral_result.get('contamination_probabilities') is not None:
                all_probs.append(spectral_result['contamination_probabilities'])
            if chemical_result.get('contamination_probabilities') is not None:
                all_probs.append(chemical_result['contamination_probabilities'])
            
            if all_probs:
                # Weighted average of probabilities
                weights = [0.5, 0.3, 0.2][:len(all_probs)]
                combined_probs = np.average(all_probs, axis=0, weights=weights)
            else:
                combined_probs = np.zeros(len(ContaminationType))
            
            # Determine contamination types
            contamination_types = []
            contamination_type_list = list(ContaminationType)
            
            for i, prob in enumerate(combined_probs):
                contamination_type = contamination_type_list[i]
                threshold = self.contamination_thresholds.get(contamination_type, 0.1)
                
                if prob > threshold:
                    contamination_types.append(contamination_type)
            
            # Determine severity level
            max_prob = np.max(combined_probs) if len(combined_probs) > 0 else 0.0
            severity_level = self._determine_severity_level(max_prob, contamination_types)
            
            # Calculate overall confidence
            confidence = float(np.mean([
                visual_result.get('confidence', 0.0),
                spectral_result.get('confidence', 0.0),
                chemical_result.get('confidence', 0.0)
            ]))
            
            # Get contamination locations
            contamination_locations = visual_result.get('contamination_locations', [])
            
            # Calculate affected area percentage
            affected_area_percentage = visual_result.get('affected_area_percentage', 0.0)
            
            # Generate remediation suggestions
            remediation_suggestions = await self._generate_remediation_suggestions(
                contamination_types, severity_level, expected_material_type
            )
            
            # Calculate processing impact
            processing_impact = await self._calculate_processing_impact(
                contamination_types, severity_level, affected_area_percentage
            )
            
            # Calculate quality degradation
            quality_degradation = self._calculate_quality_degradation(
                contamination_types, severity_level, affected_area_percentage
            )
            
            # Calculate economic impact
            economic_impact = self._calculate_economic_impact(
                contamination_types, severity_level, quality_degradation
            )
            
            return ContaminationResult(
                contamination_detected=len(contamination_types) > 0,
                contamination_types=contamination_types,
                severity_level=severity_level,
                confidence=confidence,
                affected_area_percentage=affected_area_percentage,
                contamination_locations=contamination_locations,
                remediation_suggestions=remediation_suggestions,
                processing_impact=processing_impact,
                quality_degradation=quality_degradation,
                economic_impact=economic_impact
            )
            
        except Exception as e:
            self.logger.error(f"Failed to combine contamination results: {e}")
            return ContaminationResult(
                contamination_detected=False,
                contamination_types=[],
                severity_level=ContaminationSeverity.NONE,
                confidence=0.0,
                affected_area_percentage=0.0,
                contamination_locations=[],
                remediation_suggestions=[],
                processing_impact={},
                quality_degradation=0.0,
                economic_impact=0.0
            )
    
    def _determine_severity_level(self, max_prob: float, contamination_types: List[ContaminationType]) -> ContaminationSeverity:
        """Determine contamination severity level"""
        if not contamination_types:
            return ContaminationSeverity.NONE
        
        # Check for critical contamination types
        critical_types = [
            ContaminationType.HAZARDOUS_IN_GENERAL,
            ContaminationType.CHEMICAL_CONTAMINATION,
            ContaminationType.BIOLOGICAL_CONTAMINATION
        ]
        
        if any(ct in contamination_types for ct in critical_types):
            return ContaminationSeverity.CRITICAL
        
        # Determine severity based on probability
        if max_prob > 0.8:
            return ContaminationSeverity.HIGH
        elif max_prob > 0.5:
            return ContaminationSeverity.MEDIUM
        elif max_prob > 0.2:
            return ContaminationSeverity.LOW
        else:
            return ContaminationSeverity.NONE
    
    async def _generate_remediation_suggestions(
        self,
        contamination_types: List[ContaminationType],
        severity_level: ContaminationSeverity,
        expected_material_type: str
    ) -> List[str]:
        """Generate remediation suggestions based on contamination"""
        suggestions = []
        
        if not contamination_types:
            return suggestions
        
        # General suggestions based on severity
        if severity_level == ContaminationSeverity.CRITICAL:
            suggestions.append("IMMEDIATE ISOLATION REQUIRED - Do not process")
            suggestions.append("Contact hazardous waste specialists")
            suggestions.append("Implement emergency containment procedures")
        
        # Specific suggestions for contamination types
        for contamination_type in contamination_types:
            if contamination_type == ContaminationType.ORGANIC_IN_PLASTIC:
                suggestions.extend([
                    "Remove organic matter through washing",
                    "Apply hot water rinse at 60°C",
                    "Consider enzymatic cleaning for stubborn organic residues"
                ])
            
            elif contamination_type == ContaminationType.METAL_IN_PLASTIC:
                suggestions.extend([
                    "Use magnetic separation for ferrous metals",
                    "Apply eddy current separation for non-ferrous metals",
                    "Manual sorting may be required for small metal pieces"
                ])
            
            elif contamination_type == ContaminationType.GLASS_IN_PLASTIC:
                suggestions.extend([
                    "Use optical sorting to remove glass fragments",
                    "Apply density separation techniques",
                    "Implement quality control checks post-separation"
                ])
            
            elif contamination_type == ContaminationType.LIQUID_CONTAMINATION:
                suggestions.extend([
                    "Drain all liquid contents before processing",
                    "Allow materials to dry completely",
                    "Check for chemical residues in liquids"
                ])
            
            elif contamination_type == ContaminationType.HAZARDOUS_IN_GENERAL:
                suggestions.extend([
                    "Segregate immediately from general waste stream",
                    "Follow hazardous waste disposal protocols",
                    "Notify environmental compliance team"
                ])
        
        # Processing recommendations
        if severity_level in [ContaminationSeverity.MEDIUM, ContaminationSeverity.HIGH]:
            suggestions.append("Reduce processing speed to ensure thorough cleaning")
            suggestions.append("Increase quality control inspection frequency")
        
        return list(set(suggestions))  # Remove duplicates
    
    async def _calculate_processing_impact(
        self,
        contamination_types: List[ContaminationType],
        severity_level: ContaminationSeverity,
        affected_area_percentage: float
    ) -> Dict[str, Any]:
        """Calculate impact on processing operations"""
        impact = {
            'processing_speed_reduction': 0.0,
            'additional_cleaning_required': False,
            'quality_control_increase': 0.0,
            'equipment_wear_increase': 0.0,
            'energy_consumption_increase': 0.0,
            'water_usage_increase': 0.0,
            'chemical_usage_increase': 0.0
        }
        
        # Base impact from severity
        severity_multipliers = {
            ContaminationSeverity.NONE: 0.0,
            ContaminationSeverity.LOW: 0.1,
            ContaminationSeverity.MEDIUM: 0.3,
            ContaminationSeverity.HIGH: 0.6,
            ContaminationSeverity.CRITICAL: 1.0
        }
        
        base_multiplier = severity_multipliers[severity_level]
        area_multiplier = affected_area_percentage / 100.0
        
        # Calculate specific impacts
        impact['processing_speed_reduction'] = base_multiplier * 0.5 * (1 + area_multiplier)
        impact['additional_cleaning_required'] = severity_level != ContaminationSeverity.NONE
        impact['quality_control_increase'] = base_multiplier * 2.0
        impact['equipment_wear_increase'] = base_multiplier * 0.3
        impact['energy_consumption_increase'] = base_multiplier * 0.4
        impact['water_usage_increase'] = base_multiplier * 0.6 if impact['additional_cleaning_required'] else 0.0
        impact['chemical_usage_increase'] = base_multiplier * 0.3 if impact['additional_cleaning_required'] else 0.0
        
        return impact
    
    def _calculate_quality_degradation(
        self,
        contamination_types: List[ContaminationType],
        severity_level: ContaminationSeverity,
        affected_area_percentage: float
    ) -> float:
        """Calculate quality degradation percentage"""
        if not contamination_types:
            return 0.0
        
        # Base degradation from severity
        base_degradation = {
            ContaminationSeverity.NONE: 0.0,
            ContaminationSeverity.LOW: 0.05,
            ContaminationSeverity.MEDIUM: 0.15,
            ContaminationSeverity.HIGH: 0.35,
            ContaminationSeverity.CRITICAL: 0.80
        }[severity_level]
        
        # Additional degradation from affected area
        area_degradation = (affected_area_percentage / 100.0) * 0.2
        
        # Contamination type specific degradation
        type_degradation = 0.0
        for contamination_type in contamination_types:
            if contamination_type in [ContaminationType.HAZARDOUS_IN_GENERAL, ContaminationType.CHEMICAL_CONTAMINATION]:
                type_degradation += 0.3
            elif contamination_type in [ContaminationType.BIOLOGICAL_CONTAMINATION]:
                type_degradation += 0.25
            else:
                type_degradation += 0.1
        
        total_degradation = min(1.0, base_degradation + area_degradation + type_degradation)
        return total_degradation
    
    def _calculate_economic_impact(
        self,
        contamination_types: List[ContaminationType],
        severity_level: ContaminationSeverity,
        quality_degradation: float
    ) -> float:
        """Calculate economic impact in dollars per ton"""
        if not contamination_types:
            return 0.0
        
        # Base costs for remediation
        base_costs = {
            ContaminationSeverity.NONE: 0.0,
            ContaminationSeverity.LOW: 5.0,
            ContaminationSeverity.MEDIUM: 15.0,
            ContaminationSeverity.HIGH: 40.0,
            ContaminationSeverity.CRITICAL: 100.0
        }[severity_level]
        
        # Quality degradation cost (lost value)
        quality_cost = quality_degradation * 50.0  # $50/ton for full quality loss
        
        # Processing delay costs
        processing_delay_cost = len(contamination_types) * 2.0
        
        total_cost = base_costs + quality_cost + processing_delay_cost
        return total_cost

# Global instance
contamination_detector = ContaminationDetector()

# API functions
async def detect_waste_contamination(
    image_data: bytes,
    spectral_data: Optional[Dict] = None,
    chemical_data: Optional[Dict] = None,
    expected_material_type: str = "mixed"
) -> Dict:
    """API function for contamination detection"""
    try:
        # Convert dictionaries to dataclasses if provided
        spectral = SpectralData(**spectral_data) if spectral_data else None
        chemical = ChemicalData(**chemical_data) if chemical_data else None
        
        # Detect contamination
        result = await contamination_detector.detect_contamination(
            image_data, spectral, chemical, expected_material_type
        )
        
        # Convert result to dictionary
        return {
            'contamination_detected': result.contamination_detected,
            'contamination_types': [ct.value for ct in result.contamination_types],
            'severity_level': result.severity_level.name,
            'confidence': result.confidence,
            'affected_area_percentage': result.affected_area_percentage,
            'contamination_locations': result.contamination_locations,
            'remediation_suggestions': result.remediation_suggestions,
            'processing_impact': result.processing_impact,
            'quality_degradation': result.quality_degradation,
            'economic_impact': result.economic_impact,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

async def get_remediation_plan(contamination_result: Dict) -> Dict:
    """Generate detailed remediation plan"""
    try:
        # Create remediation actions based on contamination types
        remediation_actions = []
        
        contamination_types = [ContaminationType(ct) for ct in contamination_result.get('contamination_types', [])]
        severity = ContaminationSeverity[contamination_result.get('severity_level', 'NONE')]
        
        for contamination_type in contamination_types:
            if contamination_type == ContaminationType.ORGANIC_IN_PLASTIC:
                remediation_actions.append(RemediationAction(
                    action_type="washing",
                    description="Hot water washing to remove organic matter",
                    estimated_cost=5.0,
                    estimated_time=15.0,
                    success_probability=0.85,
                    equipment_required=["washing_system", "hot_water_heater"],
                    safety_requirements=["protective_gloves", "eye_protection"]
                ))
            
            elif contamination_type == ContaminationType.METAL_IN_PLASTIC:
                remediation_actions.append(RemediationAction(
                    action_type="magnetic_separation",
                    description="Magnetic and eddy current separation",
                    estimated_cost=8.0,
                    estimated_time=10.0,
                    success_probability=0.95,
                    equipment_required=["magnetic_separator", "eddy_current_separator"],
                    safety_requirements=["safety_barriers", "lockout_tagout"]
                ))
        
        return {
            'remediation_actions': [
                {
                    'action_type': action.action_type,
                    'description': action.description,
                    'estimated_cost': action.estimated_cost,
                    'estimated_time': action.estimated_time,
                    'success_probability': action.success_probability,
                    'equipment_required': action.equipment_required,
                    'safety_requirements': action.safety_requirements
                }
                for action in remediation_actions
            ],
            'total_estimated_cost': sum(action.estimated_cost for action in remediation_actions),
            'total_estimated_time': max(action.estimated_time for action in remediation_actions) if remediation_actions else 0,
            'overall_success_probability': np.mean([action.success_probability for action in remediation_actions]) if remediation_actions else 0,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Test contamination detection
    import asyncio
    
    async def test_contamination_detection():
        # Create test data
        image_data = b"test_image_data"
        spectral_data = {
            'wavelengths': list(range(400, 2000, 10)),
            'intensities': [0.5 + 0.1 * np.sin(i * 0.1) for i in range(160)],
            'spectrum_type': 'NIR',
            'resolution': 10.0,
            'integration_time': 1.0
        }
        chemical_data = {
            'elements': {'C': 45.0, 'H': 6.0, 'O': 44.0, 'N': 3.0, 'S': 2.0, 'Pb': 0.002},
            'compounds': {'cellulose': 60.0, 'lignin': 25.0, 'protein': 15.0},
            'ph_level': 6.5,
            'moisture_content': 12.0,
            'organic_content': 85.0
        }
        
        # Test contamination detection
        result = await detect_waste_contamination(
            image_data, spectral_data, chemical_data, "plastic"
        )
        print("Contamination Detection Result:")
        print(json.dumps(result, indent=2))
        
        # Test remediation plan
        if result.get('contamination_detected'):
            remediation = await get_remediation_plan(result)
            print("\nRemediation Plan:")
            print(json.dumps(remediation, indent=2))
    
    asyncio.run(test_contamination_detection())
c
lass ContaminationBatchProcessor:
    """Processes batches of waste items and flags contaminated batches"""
    
    def __init__(self, contamination_detector: ContaminationDetector):
        self.detector = contamination_detector
        self.flagged_batches = []
        self.processing_history = []
        self.logger = logging.getLogger(__name__)
    
    async def process_batch(self, batch_id: str, waste_items: List[Dict]) -> Dict:
        """Process a batch of waste items for contamination detection"""
        try:
            batch_results = {
                'batch_id': batch_id,
                'total_items': len(waste_items),
                'contaminated_items': [],
                'clean_items': [],
                'overall_contamination_level': 0.0,
                'flagged': False,
                'remediation_actions': [],
                'processing_timestamp': datetime.now().isoformat()
            }
            
            contamination_scores = []
            
            # Process each item in the batch
            for i, item in enumerate(waste_items):
                try:
                    item_id = item.get('id', f'item_{i}')
                    image_data = item.get('image_data')
                    spectral_data = item.get('spectral_data')
                    chemical_data = item.get('chemical_data')
                    expected_material_type = item.get('expected_material_type', 'mixed')
                    
                    if image_data:
                        # Detect contamination for this item
                        contamination_result = await self.detector.detect_contamination(
                            image_data=image_data,
                            spectral_data=spectral_data,
                            chemical_data=chemical_data,
                            expected_material_type=expected_material_type
                        )
                        
                        item_result = {
                            'item_id': item_id,
                            'contamination_result': contamination_result,
                            'flagged': contamination_result.severity_level.value >= ContaminationSeverity.MEDIUM.value
                        }
                        
                        if item_result['flagged']:
                            batch_results['contaminated_items'].append(item_result)
                        else:
                            batch_results['clean_items'].append(item_result)
                        
                        # Calculate contamination score for batch-level analysis
                        contamination_score = (
                            contamination_result.confidence * 
                            (contamination_result.affected_area_percentage / 100.0) *
                            (contamination_result.severity_level.value / 4.0)
                        )
                        contamination_scores.append(contamination_score)
                    
                except Exception as e:
                    self.logger.error(f"Error processing item {item_id} in batch {batch_id}: {str(e)}")
                    # Add to clean items with zero contamination to continue processing
                    contamination_scores.append(0.0)
            
            # Calculate overall batch contamination level
            if contamination_scores:
                batch_results['overall_contamination_level'] = float(np.mean(contamination_scores))
            
            # Determine if batch should be flagged
            contamination_threshold = 0.3  # 30% contamination threshold
            contaminated_item_ratio = len(batch_results['contaminated_items']) / len(waste_items)
            
            if (batch_results['overall_contamination_level'] > contamination_threshold or 
                contaminated_item_ratio > 0.2):  # 20% of items contaminated
                
                batch_results['flagged'] = True
                self.flagged_batches.append(batch_results)
                
                # Generate batch-level remediation actions
                batch_results['remediation_actions'] = await self._generate_batch_remediation_actions(batch_results)
            
            # Store in processing history
            self.processing_history.append(batch_results)
            
            self.logger.info(
                f"Batch {batch_id} processed: {len(batch_results['contaminated_items'])} contaminated items, "
                f"overall contamination level: {batch_results['overall_contamination_level']:.3f}, "
                f"flagged: {batch_results['flagged']}"
            )
            
            return batch_results
            
        except Exception as e:
            self.logger.error(f"Error processing batch {batch_id}: {str(e)}")
            return {
                'batch_id': batch_id,
                'total_items': len(waste_items),
                'contaminated_items': [],
                'clean_items': [],
                'overall_contamination_level': 0.0,
                'flagged': False,
                'remediation_actions': ['Manual inspection required due to processing error'],
                'processing_timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    async def _generate_batch_remediation_actions(self, batch_results: Dict) -> List[str]:
        """Generate remediation actions for contaminated batch"""
        actions = []
        
        contamination_level = batch_results['overall_contamination_level']
        contaminated_count = len(batch_results['contaminated_items'])
        total_count = batch_results['total_items']
        contaminated_ratio = contaminated_count / total_count
        
        # Severity-based actions
        if contamination_level > 0.7:
            actions.extend([
                "REJECT ENTIRE BATCH - Critical contamination level detected",
                "Quarantine batch immediately",
                "Investigate contamination source",
                "Implement enhanced pre-sorting procedures"
            ])
        elif contamination_level > 0.5:
            actions.extend([
                "Quarantine batch for manual sorting and decontamination",
                "Implement enhanced cleaning procedures",
                "Separate contaminated items for specialized processing"
            ])
        elif contaminated_ratio > 0.3:
            actions.extend([
                "Remove contaminated items and reprocess clean items separately",
                "Increase quality control inspection frequency",
                "Review upstream sorting procedures"
            ])
        else:
            actions.extend([
                "Monitor batch closely during processing",
                "Implement selective contamination removal",
                "Document contamination patterns for trend analysis"
            ])
        
        # Contamination type-specific actions
        contamination_types = set()
        critical_contamination = False
        
        for item in batch_results['contaminated_items']:
            contamination_result = item['contamination_result']
            contamination_types.update(contamination_result.contamination_types)
            
            if contamination_result.severity_level == ContaminationSeverity.CRITICAL:
                critical_contamination = True
        
        if critical_contamination:
            actions.insert(0, "EMERGENCY PROTOCOL - Critical contamination detected")
            actions.append("Contact environmental safety team immediately")
            actions.append("Follow hazardous waste disposal protocols")
        
        for contamination_type in contamination_types:
            if contamination_type == ContaminationType.HAZARDOUS_IN_GENERAL:
                actions.append("Implement hazardous material handling procedures")
            elif contamination_type == ContaminationType.CHEMICAL_CONTAMINATION:
                actions.append("Implement chemical decontamination procedures")
            elif contamination_type == ContaminationType.BIOLOGICAL_CONTAMINATION:
                actions.append("Implement biological decontamination procedures")
            elif contamination_type in [ContaminationType.ORGANIC_IN_PLASTIC, ContaminationType.PLASTIC_IN_ORGANIC]:
                actions.append("Implement enhanced material separation procedures")
        
        # Economic impact-based actions
        total_economic_impact = sum(
            item['contamination_result'].economic_impact 
            for item in batch_results['contaminated_items']
        )
        
        if total_economic_impact > 1000:  # High economic impact threshold
            actions.append("Consider alternative processing methods to minimize economic loss")
            actions.append("Evaluate cost-benefit of batch remediation vs. disposal")
        
        return actions
    
    def get_flagged_batches(self) -> List[Dict]:
        """Get all flagged batches"""
        return self.flagged_batches.copy()
    
    def get_contamination_statistics(self) -> Dict:
        """Get contamination statistics across all processed batches"""
        if not self.processing_history:
            return {
                'total_batches_processed': 0,
                'flagged_batches': 0,
                'flagged_percentage': 0.0,
                'average_contamination_level': 0.0,
                'max_contamination_level': 0.0,
                'contamination_trend': 'insufficient_data'
            }
        
        total_batches = len(self.processing_history)
        flagged_batches = len(self.flagged_batches)
        
        contamination_levels = [
            batch['overall_contamination_level'] 
            for batch in self.processing_history
        ]
        
        return {
            'total_batches_processed': total_batches,
            'flagged_batches': flagged_batches,
            'flagged_percentage': (flagged_batches / total_batches) * 100.0,
            'average_contamination_level': float(np.mean(contamination_levels)),
            'max_contamination_level': float(np.max(contamination_levels)),
            'min_contamination_level': float(np.min(contamination_levels)),
            'contamination_trend': self._calculate_contamination_trend(),
            'most_common_contamination_types': self._get_most_common_contamination_types(),
            'processing_efficiency': self._calculate_processing_efficiency()
        }
    
    def _calculate_contamination_trend(self) -> str:
        """Calculate contamination trend over recent batches"""
        if len(self.processing_history) < 5:
            return "insufficient_data"
        
        recent_levels = [
            batch['overall_contamination_level'] 
            for batch in self.processing_history[-5:]
        ]
        
        if len(self.processing_history) < 10:
            # Compare with earlier batches if we have fewer than 10 total
            older_levels = [
                batch['overall_contamination_level'] 
                for batch in self.processing_history[:-5]
            ]
        else:
            older_levels = [
                batch['overall_contamination_level'] 
                for batch in self.processing_history[-10:-5]
            ]
        
        if not older_levels:
            return "insufficient_data"
        
        recent_avg = np.mean(recent_levels)
        older_avg = np.mean(older_levels)
        
        if recent_avg > older_avg * 1.1:
            return "increasing"
        elif recent_avg < older_avg * 0.9:
            return "decreasing"
        else:
            return "stable"
    
    def _get_most_common_contamination_types(self) -> List[Dict]:
        """Get most common contamination types across all batches"""
        contamination_type_counts = {}
        
        for batch in self.processing_history:
            for item in batch['contaminated_items']:
                contamination_result = item['contamination_result']
                for contamination_type in contamination_result.contamination_types:
                    type_name = contamination_type.value
                    if type_name not in contamination_type_counts:
                        contamination_type_counts[type_name] = 0
                    contamination_type_counts[type_name] += 1
        
        # Sort by frequency and return top 5
        sorted_types = sorted(
            contamination_type_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [
            {'contamination_type': type_name, 'count': count}
            for type_name, count in sorted_types[:5]
        ]
    
    def _calculate_processing_efficiency(self) -> Dict:
        """Calculate processing efficiency metrics"""
        if not self.processing_history:
            return {}
        
        total_items = sum(batch['total_items'] for batch in self.processing_history)
        total_clean_items = sum(len(batch['clean_items']) for batch in self.processing_history)
        total_contaminated_items = sum(len(batch['contaminated_items']) for batch in self.processing_history)
        
        return {
            'total_items_processed': total_items,
            'clean_items_percentage': (total_clean_items / total_items) * 100.0 if total_items > 0 else 0.0,
            'contaminated_items_percentage': (total_contaminated_items / total_items) * 100.0 if total_items > 0 else 0.0,
            'average_batch_size': total_items / len(self.processing_history),
            'flagged_batch_percentage': (len(self.flagged_batches) / len(self.processing_history)) * 100.0
        }
    
    async def generate_contamination_report(self, batch_id: str = None) -> Dict:
        """Generate comprehensive contamination report"""
        try:
            if batch_id:
                # Generate report for specific batch
                batch = next((b for b in self.processing_history if b['batch_id'] == batch_id), None)
                if not batch:
                    raise ValueError(f"Batch {batch_id} not found")
                
                return await self._generate_batch_report(batch)
            else:
                # Generate overall system report
                return await self._generate_system_report()
                
        except Exception as e:
            self.logger.error(f"Error generating contamination report: {str(e)}")
            return {'error': str(e)}
    
    async def _generate_batch_report(self, batch: Dict) -> Dict:
        """Generate detailed report for a specific batch"""
        contaminated_items = batch['contaminated_items']
        
        # Analyze contamination patterns
        contamination_analysis = {
            'severity_distribution': {},
            'contamination_type_distribution': {},
            'affected_area_analysis': {},
            'economic_impact_analysis': {}
        }
        
        for item in contaminated_items:
            result = item['contamination_result']
            
            # Severity distribution
            severity = result.severity_level.name
            contamination_analysis['severity_distribution'][severity] = \
                contamination_analysis['severity_distribution'].get(severity, 0) + 1
            
            # Contamination type distribution
            for cont_type in result.contamination_types:
                type_name = cont_type.value
                contamination_analysis['contamination_type_distribution'][type_name] = \
                    contamination_analysis['contamination_type_distribution'].get(type_name, 0) + 1
        
        return {
            'batch_id': batch['batch_id'],
            'processing_timestamp': batch['processing_timestamp'],
            'summary': {
                'total_items': batch['total_items'],
                'contaminated_items': len(contaminated_items),
                'clean_items': len(batch['clean_items']),
                'overall_contamination_level': batch['overall_contamination_level'],
                'flagged': batch['flagged']
            },
            'contamination_analysis': contamination_analysis,
            'remediation_actions': batch['remediation_actions'],
            'recommendations': await self._generate_batch_recommendations(batch)
        }
    
    async def _generate_system_report(self) -> Dict:
        """Generate overall system contamination report"""
        stats = self.get_contamination_statistics()
        
        return {
            'report_timestamp': datetime.now().isoformat(),
            'system_statistics': stats,
            'flagged_batches_summary': [
                {
                    'batch_id': batch['batch_id'],
                    'contamination_level': batch['overall_contamination_level'],
                    'contaminated_items': len(batch['contaminated_items']),
                    'processing_timestamp': batch['processing_timestamp']
                }
                for batch in self.flagged_batches
            ],
            'system_recommendations': await self._generate_system_recommendations()
        }
    
    async def _generate_batch_recommendations(self, batch: Dict) -> List[str]:
        """Generate recommendations for improving batch processing"""
        recommendations = []
        
        contamination_level = batch['overall_contamination_level']
        contaminated_ratio = len(batch['contaminated_items']) / batch['total_items']
        
        if contamination_level > 0.5:
            recommendations.append("Implement enhanced pre-sorting procedures")
            recommendations.append("Review waste collection and transportation protocols")
        
        if contaminated_ratio > 0.3:
            recommendations.append("Increase frequency of quality control inspections")
            recommendations.append("Provide additional training for sorting personnel")
        
        # Analyze common contamination types in this batch
        contamination_types = set()
        for item in batch['contaminated_items']:
            contamination_types.update(item['contamination_result'].contamination_types)
        
        if ContaminationType.ORGANIC_IN_PLASTIC in contamination_types:
            recommendations.append("Implement better organic waste separation at source")
        
        if ContaminationType.CHEMICAL_CONTAMINATION in contamination_types:
            recommendations.append("Enhance chemical contamination detection at intake")
        
        return recommendations
    
    async def _generate_system_recommendations(self) -> List[str]:
        """Generate system-wide recommendations"""
        recommendations = []
        stats = self.get_contamination_statistics()
        
        if stats['flagged_percentage'] > 20:
            recommendations.append("System-wide contamination levels are high - review entire processing pipeline")
        
        if stats['contamination_trend'] == 'increasing':
            recommendations.append("Contamination trend is increasing - implement immediate corrective measures")
        
        # Analyze most common contamination types
        common_types = stats.get('most_common_contamination_types', [])
        if common_types:
            most_common = common_types[0]['contamination_type']
            recommendations.append(f"Focus on reducing {most_common} contamination - most frequent issue")
        
        return recommendations