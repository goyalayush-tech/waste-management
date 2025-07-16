"""
Rare Material Identification and Handling System
Detects valuable and rare materials in waste streams using advanced AI and spectral analysis
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten, Dropout, BatchNormalization, LSTM, Attention
from tensorflow.keras.optimizers import Adam
import cv2
import logging
from typing import Dict, List, Tuple, Optional, Any
import asyncio
import json
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import pickle
import requests

# Import multi-modal fusion components
from .multi_modal_sensor_fusion import SpectralData, ChemicalData, SensorType

class RareMaterialType(Enum):
    PRECIOUS_METALS = "precious_metals"
    RARE_EARTH_ELEMENTS = "rare_earth_elements"
    CRITICAL_MINERALS = "critical_minerals"
    VALUABLE_POLYMERS = "valuable_polymers"
    SPECIALTY_ALLOYS = "specialty_alloys"
    ELECTRONIC_COMPONENTS = "electronic_components"
    CATALYTIC_MATERIALS = "catalytic_materials"
    SUPERCONDUCTORS = "superconductors"
    ADVANCED_CERAMICS = "advanced_ceramics"
    CARBON_MATERIALS = "carbon_materials"

class MaterialValue(Enum):
    LOW = 1      # $1-10 per kg
    MEDIUM = 2   # $10-100 per kg
    HIGH = 3     # $100-1000 per kg
    VERY_HIGH = 4 # $1000-10000 per kg
    EXTREME = 5   # >$10000 per kg

@dataclass
class RareMaterial:
    material_name: str
    material_type: RareMaterialType
    chemical_formula: str
    market_value_per_kg: float
    purity_percentage: float
    quantity_detected: float
    confidence: float
    extraction_difficulty: str
    market_demand: str
    applications: List[str]
    handling_requirements: List[str]

@dataclass
class DetectionResult:
    materials_detected: List[RareMaterial]
    total_estimated_value: float
    highest_value_material: Optional[RareMaterial]
    detection_confidence: float
    recommended_actions: List[str]
    special_handling_required: bool
    stakeholder_notifications: List[str]
    extraction_feasibility: Dict[str, Any]
    market_analysis: Dict[str, Any]

@dataclass
class HandlingProtocol:
    protocol_id: str
    material_type: RareMaterialType
    safety_requirements: List[str]
    equipment_needed: List[str]
    extraction_steps: List[str]
    storage_conditions: Dict[str, Any]
    transportation_requirements: List[str]
    regulatory_compliance: List[str]

class RareMaterialDetector:
    """Advanced rare material detection and identification system"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Detection models
        self.visual_rare_material_model = None
        self.spectral_rare_material_model = None
        self.chemical_rare_material_model = None
        self.fusion_rare_material_model = None
        
        # Material databases
        self.rare_materials_database = {}
        self.market_prices_database = {}
        self.handling_protocols = {}
        
        # Detection thresholds
        self.detection_thresholds = {
            RareMaterialType.PRECIOUS_METALS: 0.001,      # 0.1% threshold
            RareMaterialType.RARE_EARTH_ELEMENTS: 0.0001, # 0.01% threshold
            RareMaterialType.CRITICAL_MINERALS: 0.005,    # 0.5% threshold
            RareMaterialType.VALUABLE_POLYMERS: 0.01,     # 1% threshold
            RareMaterialType.SPECIALTY_ALLOYS: 0.002,     # 0.2% threshold
            RareMaterialType.ELECTRONIC_COMPONENTS: 0.1,  # 10% threshold
            RareMaterialType.CATALYTIC_MATERIALS: 0.0005, # 0.05% threshold
            RareMaterialType.SUPERCONDUCTORS: 0.0001,     # 0.01% threshold
            RareMaterialType.ADVANCED_CERAMICS: 0.01,     # 1% threshold
            RareMaterialType.CARBON_MATERIALS: 0.005      # 0.5% threshold
        }
        
        # Initialize system
        self._initialize_databases()
        self._load_detection_models()
        self._setup_handling_protocols()
    
    def _initialize_databases(self):
        """Initialize rare materials and market price databases"""
        # Precious metals database
        self.rare_materials_database[RareMaterialType.PRECIOUS_METALS] = {
            'gold': {
                'formula': 'Au',
                'applications': ['electronics', 'jewelry', 'medical_devices'],
                'typical_sources': ['electronic_waste', 'jewelry', 'dental_materials'],
                'extraction_methods': ['chemical_leaching', 'electrowinning'],
                'purity_indicators': {'spectral_peaks': [2676, 2428], 'xrf_signature': 'Au_L'}
            },
            'silver': {
                'formula': 'Ag',
                'applications': ['electronics', 'photography', 'medical'],
                'typical_sources': ['electronic_waste', 'photographic_materials'],
                'extraction_methods': ['cyanide_leaching', 'flotation'],
                'purity_indicators': {'spectral_peaks': [3281, 3384], 'xrf_signature': 'Ag_L'}
            },
            'platinum': {
                'formula': 'Pt',
                'applications': ['catalysts', 'jewelry', 'medical_implants'],
                'typical_sources': ['catalytic_converters', 'jewelry'],
                'extraction_methods': ['aqua_regia_dissolution', 'electrorefining'],
                'purity_indicators': {'spectral_peaks': [2659, 2702], 'xrf_signature': 'Pt_L'}
            },
            'palladium': {
                'formula': 'Pd',
                'applications': ['catalysts', 'electronics', 'dentistry'],
                'typical_sources': ['catalytic_converters', 'electronic_components'],
                'extraction_methods': ['solvent_extraction', 'ion_exchange'],
                'purity_indicators': {'spectral_peaks': [2838, 2990], 'xrf_signature': 'Pd_L'}
            }
        }
        
        # Rare earth elements database
        self.rare_materials_database[RareMaterialType.RARE_EARTH_ELEMENTS] = {
            'neodymium': {
                'formula': 'Nd',
                'applications': ['permanent_magnets', 'lasers', 'glass_coloring'],
                'typical_sources': ['hard_drives', 'speakers', 'wind_turbines'],
                'extraction_methods': ['solvent_extraction', 'ion_exchange'],
                'purity_indicators': {'spectral_peaks': [4012, 4061], 'xrf_signature': 'Nd_L'}
            },
            'dysprosium': {
                'formula': 'Dy',
                'applications': ['permanent_magnets', 'nuclear_reactors'],
                'typical_sources': ['hard_drives', 'electric_motors'],
                'extraction_methods': ['liquid-liquid_extraction'],
                'purity_indicators': {'spectral_peaks': [4211, 4194], 'xrf_signature': 'Dy_L'}
            },
            'terbium': {
                'formula': 'Tb',
                'applications': ['phosphors', 'magnets', 'fuel_cells'],
                'typical_sources': ['fluorescent_lamps', 'displays'],
                'extraction_methods': ['ion_exchange', 'solvent_extraction'],
                'purity_indicators': {'spectral_peaks': [3874, 3901], 'xrf_signature': 'Tb_L'}
            }
        }
        
        # Critical minerals database
        self.rare_materials_database[RareMaterialType.CRITICAL_MINERALS] = {
            'lithium': {
                'formula': 'Li',
                'applications': ['batteries', 'ceramics', 'pharmaceuticals'],
                'typical_sources': ['batteries', 'electronic_devices'],
                'extraction_methods': ['brine_processing', 'hard_rock_mining'],
                'purity_indicators': {'spectral_peaks': [6708, 6103], 'xrf_signature': 'Li_K'}
            },
            'cobalt': {
                'formula': 'Co',
                'applications': ['batteries', 'superalloys', 'catalysts'],
                'typical_sources': ['batteries', 'superalloys'],
                'extraction_methods': ['hydrometallurgy', 'pyrometallurgy'],
                'purity_indicators': {'spectral_peaks': [7649, 7709], 'xrf_signature': 'Co_K'}
            },
            'tantalum': {
                'formula': 'Ta',
                'applications': ['capacitors', 'superalloys', 'medical_implants'],
                'typical_sources': ['electronic_capacitors', 'aerospace_components'],
                'extraction_methods': ['solvent_extraction', 'crystal_bar_process'],
                'purity_indicators': {'spectral_peaks': [8146, 9343], 'xrf_signature': 'Ta_L'}
            }
        }
        
        # Load current market prices (would be updated from real market data)
        self._update_market_prices()
    
    def _update_market_prices(self):
        """Update market prices from external sources"""
        # In production, this would fetch real-time prices from commodity exchanges
        self.market_prices_database = {
            'gold': 65000.0,      # USD per kg
            'silver': 800.0,      # USD per kg
            'platinum': 32000.0,  # USD per kg
            'palladium': 70000.0, # USD per kg
            'neodymium': 120.0,   # USD per kg
            'dysprosium': 400.0,  # USD per kg
            'terbium': 1200.0,    # USD per kg
            'lithium': 25.0,      # USD per kg
            'cobalt': 55.0,       # USD per kg
            'tantalum': 300.0     # USD per kg
        }
    
    def _load_detection_models(self):
        """Load or create rare material detection models"""
        try:
            # Load visual rare material model
            self.visual_rare_material_model = tf.keras.models.load_model(
                'models/visual_rare_material_model.h5'
            )
            self.logger.info("Loaded visual rare material model")
        except:
            self.visual_rare_material_model = self._create_visual_rare_material_model()
            self.logger.info("Created new visual rare material model")
        
        try:
            # Load spectral rare material model
            self.spectral_rare_material_model = tf.keras.models.load_model(
                'models/spectral_rare_material_model.h5'
            )
            self.logger.info("Loaded spectral rare material model")
        except:
            self.spectral_rare_material_model = self._create_spectral_rare_material_model()
            self.logger.info("Created new spectral rare material model")
        
        try:
            # Load chemical rare material model
            self.chemical_rare_material_model = tf.keras.models.load_model(
                'models/chemical_rare_material_model.h5'
            )
            self.logger.info("Loaded chemical rare material model")
        except:
            self.chemical_rare_material_model = self._create_chemical_rare_material_model()
            self.logger.info("Created new chemical rare material model")
        
        try:
            # Load fusion rare material model
            self.fusion_rare_material_model = tf.keras.models.load_model(
                'models/fusion_rare_material_model.h5'
            )
            self.logger.info("Loaded fusion rare material model")
        except:
            self.fusion_rare_material_model = self._create_fusion_rare_material_model()
            self.logger.info("Created new fusion rare material model")
    
    def _create_visual_rare_material_model(self) -> Model:
        """Create CNN model for visual rare material detection"""
        model = Sequential([
            Conv2D(64, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(128, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(256, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Conv2D(512, (3, 3), activation='relu'),
            BatchNormalization(),
            MaxPooling2D((2, 2)),
            
            Flatten(),
            Dense(1024, activation='relu'),
            Dropout(0.5),
            Dense(512, activation='relu'),
            Dropout(0.3),
            
            # Output for each rare material type
            Dense(len(RareMaterialType), activation='sigmoid', name='rare_material_types'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _create_spectral_rare_material_model(self) -> Model:
        """Create model for spectral rare material detection"""
        model = Sequential([
            Dense(1024, activation='relu', input_shape=(2000,)),  # Higher resolution spectral data
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(512, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(256, activation='relu'),
            BatchNormalization(),
            
            Dense(128, activation='relu'),
            
            # Output rare material probabilities
            Dense(len(RareMaterialType), activation='sigmoid', name='spectral_rare_materials'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _create_chemical_rare_material_model(self) -> Model:
        """Create model for chemical rare material detection"""
        model = Sequential([
            Dense(256, activation='relu', input_shape=(100,)),  # Extended chemical features
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(128, activation='relu'),
            BatchNormalization(),
            
            Dense(64, activation='relu'),
            
            # Output rare material probabilities
            Dense(len(RareMaterialType), activation='sigmoid', name='chemical_rare_materials'),
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _create_fusion_rare_material_model(self) -> Model:
        """Create fusion model combining all detection methods"""
        # Input layers
        visual_input = tf.keras.Input(shape=(len(RareMaterialType),), name='visual_input')
        spectral_input = tf.keras.Input(shape=(len(RareMaterialType),), name='spectral_input')
        chemical_input = tf.keras.Input(shape=(len(RareMaterialType),), name='chemical_input')
        
        # Fusion layer with attention mechanism
        concatenated = tf.keras.layers.Concatenate()([visual_input, spectral_input, chemical_input])
        
        # Attention weights
        attention_weights = Dense(3, activation='softmax', name='attention_weights')(concatenated)
        
        # Weighted fusion
        visual_weighted = tf.keras.layers.Multiply()([visual_input, tf.expand_dims(attention_weights[:, 0], -1)])
        spectral_weighted = tf.keras.layers.Multiply()([spectral_input, tf.expand_dims(attention_weights[:, 1], -1)])
        chemical_weighted = tf.keras.layers.Multiply()([chemical_input, tf.expand_dims(attention_weights[:, 2], -1)])
        
        # Final fusion
        fused = tf.keras.layers.Add()([visual_weighted, spectral_weighted, chemical_weighted])
        
        # Output layers
        dense1 = Dense(128, activation='relu')(fused)
        dense1 = BatchNormalization()(dense1)
        dense1 = Dropout(0.3)(dense1)
        
        dense2 = Dense(64, activation='relu')(dense1)
        dense2 = BatchNormalization()(dense2)
        
        # Final outputs
        material_detection = Dense(len(RareMaterialType), activation='sigmoid', name='material_detection')(dense2)
        confidence_scores = Dense(len(RareMaterialType), activation='sigmoid', name='confidence_scores')(dense2)
        purity_estimation = Dense(len(RareMaterialType), activation='sigmoid', name='purity_estimation')(dense2)
        
        model = Model(
            inputs=[visual_input, spectral_input, chemical_input],
            outputs=[material_detection, confidence_scores, purity_estimation]
        )
        
        model.compile(
            optimizer=Adam(learning_rate=0.0005),
            loss={
                'material_detection': 'binary_crossentropy',
                'confidence_scores': 'mse',
                'purity_estimation': 'mse'
            },
            loss_weights={
                'material_detection': 1.0,
                'confidence_scores': 0.5,
                'purity_estimation': 0.3
            },
            metrics=['accuracy']
        )
        
        return model
    
    def _setup_handling_protocols(self):
        """Setup handling protocols for different rare materials"""
        # Precious metals protocol
        self.handling_protocols[RareMaterialType.PRECIOUS_METALS] = HandlingProtocol(
            protocol_id="PM_001",
            material_type=RareMaterialType.PRECIOUS_METALS,
            safety_requirements=[
                "Use acid-resistant gloves and clothing",
                "Work in well-ventilated area",
                "Eye protection mandatory",
                "Emergency shower access required"
            ],
            equipment_needed=[
                "Acid-resistant containers",
                "Precision scales",
                "Fume hood",
                "pH meters",
                "Safety shower"
            ],
            extraction_steps=[
                "Isolate precious metal containing components",
                "Apply appropriate leaching solution",
                "Filter and concentrate solution",
                "Precipitate metals using reducing agents",
                "Refine through electrowinning"
            ],
            storage_conditions={
                "temperature": "room_temperature",
                "humidity": "low",
                "container": "acid_resistant",
                "security": "high"
            },
            transportation_requirements=[
                "Secure transport containers",
                "Chain of custody documentation",
                "Insurance coverage",
                "Authorized personnel only"
            ],
            regulatory_compliance=[
                "Precious metals handling license",
                "Environmental permits",
                "Waste disposal permits",
                "Security clearances"
            ]
        )
        
        # Rare earth elements protocol
        self.handling_protocols[RareMaterialType.RARE_EARTH_ELEMENTS] = HandlingProtocol(
            protocol_id="REE_001",
            material_type=RareMaterialType.RARE_EARTH_ELEMENTS,
            safety_requirements=[
                "Radiation monitoring equipment",
                "Specialized protective equipment",
                "Medical monitoring program",
                "Emergency response procedures"
            ],
            equipment_needed=[
                "Radiation detectors",
                "Ion exchange columns",
                "Solvent extraction equipment",
                "Specialized analytical instruments"
            ],
            extraction_steps=[
                "Radiation safety assessment",
                "Magnetic separation",
                "Acid leaching",
                "Solvent extraction separation",
                "Precipitation and purification"
            ],
            storage_conditions={
                "temperature": "controlled",
                "humidity": "very_low",
                "container": "radiation_shielded",
                "monitoring": "continuous"
            },
            transportation_requirements=[
                "Radiation transport permits",
                "Specialized transport containers",
                "Route approval",
                "Emergency response plans"
            ],
            regulatory_compliance=[
                "Nuclear regulatory permits",
                "Environmental impact assessments",
                "Worker safety certifications",
                "International transport agreements"
            ]
        )
    
    async def detect_rare_materials(
        self,
        image_data: bytes,
        spectral_data: Optional[SpectralData] = None,
        chemical_data: Optional[ChemicalData] = None
    ) -> DetectionResult:
        """Detect rare materials using multi-modal analysis"""
        try:
            # Run individual detection methods
            visual_detection = await self._detect_visual_rare_materials(image_data)
            
            spectral_detection = {}
            if spectral_data:
                spectral_detection = await self._detect_spectral_rare_materials(spectral_data)
            
            chemical_detection = {}
            if chemical_data:
                chemical_detection = await self._detect_chemical_rare_materials(chemical_data)
            
            # Fusion analysis
            fusion_result = await self._perform_rare_material_fusion(
                visual_detection, spectral_detection, chemical_detection
            )
            
            # Identify specific materials
            detected_materials = await self._identify_specific_materials(fusion_result)
            
            # Calculate market value
            total_value = self._calculate_total_value(detected_materials)
            
            # Generate recommendations
            recommendations = await self._generate_handling_recommendations(detected_materials)
            
            # Determine stakeholder notifications
            notifications = self._determine_stakeholder_notifications(detected_materials)
            
            # Assess extraction feasibility
            extraction_feasibility = await self._assess_extraction_feasibility(detected_materials)
            
            # Market analysis
            market_analysis = await self._perform_market_analysis(detected_materials)
            
            return DetectionResult(
                materials_detected=detected_materials,
                total_estimated_value=total_value,
                highest_value_material=max(detected_materials, key=lambda m: m.market_value_per_kg * m.quantity_detected) if detected_materials else None,
                detection_confidence=fusion_result.get('overall_confidence', 0.0),
                recommended_actions=recommendations,
                special_handling_required=any(m.material_type in [RareMaterialType.PRECIOUS_METALS, RareMaterialType.RARE_EARTH_ELEMENTS] for m in detected_materials),
                stakeholder_notifications=notifications,
                extraction_feasibility=extraction_feasibility,
                market_analysis=market_analysis
            )
            
        except Exception as e:
            self.logger.error(f"Rare material detection failed: {e}")
            return DetectionResult(
                materials_detected=[],
                total_estimated_value=0.0,
                highest_value_material=None,
                detection_confidence=0.0,
                recommended_actions=[],
                special_handling_required=False,
                stakeholder_notifications=[],
                extraction_feasibility={},
                market_analysis={}
            )
    
    async def _detect_visual_rare_materials(self, image_data: bytes) -> Dict:
        """Detect rare materials using computer vision"""
        try:
            # Convert image data
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Preprocess image
            image_resized = cv2.resize(image, (224, 224))
            image_normalized = image_resized.astype(np.float32) / 255.0
            image_batch = np.expand_dims(image_normalized, axis=0)
            
            # Run rare material detection
            material_probs = self.visual_rare_material_model.predict(image_batch)[0]
            
            # Analyze visual characteristics
            visual_characteristics = await self._analyze_visual_characteristics(image)
            
            return {
                'material_probabilities': material_probs,
                'visual_characteristics': visual_characteristics,
                'confidence': float(np.max(material_probs))
            }
            
        except Exception as e:
            self.logger.error(f"Visual rare material detection failed: {e}")
            return {
                'material_probabilities': np.zeros(len(RareMaterialType)),
                'visual_characteristics': {},
                'confidence': 0.0
            }
    
    async def _detect_spectral_rare_materials(self, spectral_data: SpectralData) -> Dict:
        """Detect rare materials using spectral analysis"""
        try:
            # Extract high-resolution spectral features
            spectral_features = await self._extract_rare_material_spectral_features(spectral_data)
            
            # Pad or truncate to expected size
            if len(spectral_features) > 2000:
                spectral_features = spectral_features[:2000]
            else:
                spectral_features.extend([0.0] * (2000 - len(spectral_features)))
            
            # Run spectral detection
            features_batch = np.expand_dims(np.array(spectral_features), axis=0)
            material_probs = self.spectral_rare_material_model.predict(features_batch)[0]
            
            # Identify specific spectral signatures
            spectral_signatures = await self._identify_spectral_signatures(spectral_data)
            
            return {
                'material_probabilities': material_probs,
                'spectral_signatures': spectral_signatures,
                'confidence': float(np.max(material_probs))
            }
            
        except Exception as e:
            self.logger.error(f"Spectral rare material detection failed: {e}")
            return {
                'material_probabilities': np.zeros(len(RareMaterialType)),
                'spectral_signatures': {},
                'confidence': 0.0
            }
    
    async def _detect_chemical_rare_materials(self, chemical_data: ChemicalData) -> Dict:
        """Detect rare materials using chemical analysis"""
        try:
            # Extract extended chemical features
            chemical_features = await self._extract_rare_material_chemical_features(chemical_data)
            
            # Run chemical detection
            features_batch = np.expand_dims(np.array(chemical_features), axis=0)
            material_probs = self.chemical_rare_material_model.predict(features_batch)[0]
            
            # Identify specific chemical indicators
            chemical_indicators = await self._identify_chemical_indicators(chemical_data)
            
            return {
                'material_probabilities': material_probs,
                'chemical_indicators': chemical_indicators,
                'confidence': float(np.max(material_probs))
            }
            
        except Exception as e:
            self.logger.error(f"Chemical rare material detection failed: {e}")
            return {
                'material_probabilities': np.zeros(len(RareMaterialType)),
                'chemical_indicators': {},
                'confidence': 0.0
            }
    
    async def _perform_rare_material_fusion(
        self,
        visual_result: Dict,
        spectral_result: Dict,
        chemical_result: Dict
    ) -> Dict:
        """Perform fusion analysis of all detection methods"""
        try:
            # Prepare inputs for fusion model
            visual_probs = visual_result.get('material_probabilities', np.zeros(len(RareMaterialType)))
            spectral_probs = spectral_result.get('material_probabilities', np.zeros(len(RareMaterialType)))
            chemical_probs = chemical_result.get('material_probabilities', np.zeros(len(RareMaterialType)))
            
            # Run fusion model
            inputs = [
                np.expand_dims(visual_probs, 0),
                np.expand_dims(spectral_probs, 0),
                np.expand_dims(chemical_probs, 0)
            ]
            
            predictions = self.fusion_rare_material_model.predict(inputs)
            
            material_detection = predictions[0][0]
            confidence_scores = predictions[1][0]
            purity_estimation = predictions[2][0]
            
            return {
                'material_detection': material_detection,
                'confidence_scores': confidence_scores,
                'purity_estimation': purity_estimation,
                'overall_confidence': float(np.mean(confidence_scores))
            }
            
        except Exception as e:
            self.logger.error(f"Rare material fusion failed: {e}")
            return {
                'material_detection': np.zeros(len(RareMaterialType)),
                'confidence_scores': np.zeros(len(RareMaterialType)),
                'purity_estimation': np.zeros(len(RareMaterialType)),
                'overall_confidence': 0.0
            }
    
    async def _identify_specific_materials(self, fusion_result: Dict) -> List[RareMaterial]:
        """Identify specific rare materials from fusion results"""
        detected_materials = []
        
        material_detection = fusion_result.get('material_detection', np.zeros(len(RareMaterialType)))
        confidence_scores = fusion_result.get('confidence_scores', np.zeros(len(RareMaterialType)))
        purity_estimation = fusion_result.get('purity_estimation', np.zeros(len(RareMaterialType)))
        
        material_types = list(RareMaterialType)
        
        for i, (detection_prob, confidence, purity) in enumerate(zip(material_detection, confidence_scores, purity_estimation)):
            material_type = material_types[i]
            threshold = self.detection_thresholds.get(material_type, 0.1)
            
            if detection_prob > threshold and confidence > 0.5:
                # Get specific materials for this type
                specific_materials = await self._get_specific_materials_for_type(
                    material_type, detection_prob, confidence, purity
                )
                detected_materials.extend(specific_materials)
        
        return detected_materials
    
    async def _get_specific_materials_for_type(
        self,
        material_type: RareMaterialType,
        detection_prob: float,
        confidence: float,
        purity: float
    ) -> List[RareMaterial]:
        """Get specific materials for a given material type"""
        materials = []
        
        if material_type in self.rare_materials_database:
            material_db = self.rare_materials_database[material_type]
            
            for material_name, material_info in material_db.items():
                # Estimate quantity (simplified calculation)
                estimated_quantity = detection_prob * 10.0  # kg, would be more sophisticated in practice
                
                # Get market price
                market_price = self.market_prices_database.get(material_name, 0.0)
                
                # Create rare material object
                rare_material = RareMaterial(
                    material_name=material_name,
                    material_type=material_type,
                    chemical_formula=material_info['formula'],
                    market_value_per_kg=market_price,
                    purity_percentage=purity * 100.0,
                    quantity_detected=estimated_quantity,
                    confidence=confidence,
                    extraction_difficulty=self._assess_extraction_difficulty(material_name, purity),
                    market_demand=self._assess_market_demand(material_name),
                    applications=material_info['applications'],
                    handling_requirements=self._get_handling_requirements(material_type)
                )
                
                materials.append(rare_material)
        
        return materials
    
    def _assess_extraction_difficulty(self, material_name: str, purity: float) -> str:
        """Assess extraction difficulty for a material"""
        if purity > 0.8:
            return "easy"
        elif purity > 0.5:
            return "moderate"
        elif purity > 0.2:
            return "difficult"
        else:
            return "very_difficult"
    
    def _assess_market_demand(self, material_name: str) -> str:
        """Assess market demand for a material"""
        high_demand_materials = ['lithium', 'cobalt', 'neodymium', 'dysprosium']
        medium_demand_materials = ['tantalum', 'terbium', 'palladium']
        
        if material_name in high_demand_materials:
            return "high"
        elif material_name in medium_demand_materials:
            return "medium"
        else:
            return "low"
    
    def _get_handling_requirements(self, material_type: RareMaterialType) -> List[str]:
        """Get handling requirements for a material type"""
        if material_type in self.handling_protocols:
            protocol = self.handling_protocols[material_type]
            return protocol.safety_requirements + protocol.equipment_needed
        else:
            return ["Standard safety procedures", "Appropriate containment"]
    
    def _calculate_total_value(self, detected_materials: List[RareMaterial]) -> float:
        """Calculate total estimated value of detected materials"""
        total_value = 0.0
        
        for material in detected_materials:
            material_value = material.market_value_per_kg * material.quantity_detected * (material.purity_percentage / 100.0)
            total_value += material_value
        
        return total_value
    
    async def _generate_handling_recommendations(self, detected_materials: List[RareMaterial]) -> List[str]:
        """Generate handling recommendations for detected materials"""
        recommendations = []
        
        if not detected_materials:
            return recommendations
        
        # Check for high-value materials
        high_value_materials = [m for m in detected_materials if m.market_value_per_kg > 1000.0]
        if high_value_materials:
            recommendations.append("IMMEDIATE SECURE ISOLATION - High-value materials detected")
            recommendations.append("Implement enhanced security protocols")
            recommendations.append("Contact specialized recovery services")
        
        # Check for hazardous materials
        hazardous_types = [RareMaterialType.RARE_EARTH_ELEMENTS, RareMaterialType.CATALYTIC_MATERIALS]
        if any(m.material_type in hazardous_types for m in detected_materials):
            recommendations.append("Implement radiation safety protocols")
            recommendations.append("Use specialized protective equipment")
            recommendations.append("Monitor worker exposure levels")
        
        # Extraction recommendations
        easy_extraction = [m for m in detected_materials if m.extraction_difficulty == "easy"]
        if easy_extraction:
            recommendations.append("Prioritize extraction of high-purity materials")
        
        difficult_extraction = [m for m in detected_materials if m.extraction_difficulty in ["difficult", "very_difficult"]]
        if difficult_extraction:
            recommendations.append("Consider outsourcing complex extractions to specialists")
        
        # Market timing recommendations
        high_demand = [m for m in detected_materials if m.market_demand == "high"]
        if high_demand:
            recommendations.append("Fast-track processing due to high market demand")
        
        return recommendations
    
    def _determine_stakeholder_notifications(self, detected_materials: List[RareMaterial]) -> List[str]:
        """Determine which stakeholders should be notified"""
        notifications = []
        
        if not detected_materials:
            return notifications
        
        # High-value materials
        total_value = sum(m.market_value_per_kg * m.quantity_detected for m in detected_materials)
        if total_value > 10000.0:  # $10,000 threshold
            notifications.extend([
                "Senior management",
                "Finance department",
                "Legal department",
                "Insurance provider"
            ])
        
        # Precious metals
        precious_metals = [m for m in detected_materials if m.material_type == RareMaterialType.PRECIOUS_METALS]
        if precious_metals:
            notifications.extend([
                "Precious metals specialist",
                "Security team",
                "Regulatory compliance officer"
            ])
        
        # Rare earth elements
        rare_earths = [m for m in detected_materials if m.material_type == RareMaterialType.RARE_EARTH_ELEMENTS]
        if rare_earths:
            notifications.extend([
                "Radiation safety officer",
                "Environmental compliance team",
                "Specialized recovery contractors"
            ])
        
        # Critical minerals
        critical_minerals = [m for m in detected_materials if m.material_type == RareMaterialType.CRITICAL_MINERALS]
        if critical_minerals:
            notifications.extend([
                "Strategic materials coordinator",
                "Government liaison",
                "Supply chain manager"
            ])
        
        return list(set(notifications))  # Remove duplicates
    
    async def _assess_extraction_feasibility(self, detected_materials: List[RareMaterial]) -> Dict[str, Any]:
        """Assess feasibility of extracting detected materials"""
        feasibility = {
            'overall_feasibility': 'unknown',
            'estimated_recovery_rate': 0.0,
            'estimated_cost': 0.0,
            'estimated_time': 0.0,
            'technical_challenges': [],
            'equipment_requirements': [],
            'regulatory_requirements': []
        }
        
        if not detected_materials:
            return feasibility
        
        # Calculate overall feasibility
        feasibility_scores = []
        total_cost = 0.0
        total_time = 0.0
        
        for material in detected_materials:
            # Feasibility based on purity and extraction difficulty
            if material.extraction_difficulty == "easy":
                score = 0.9
                cost_per_kg = 50.0
                time_hours = 4.0
            elif material.extraction_difficulty == "moderate":
                score = 0.7
                cost_per_kg = 150.0
                time_hours = 12.0
            elif material.extraction_difficulty == "difficult":
                score = 0.4
                cost_per_kg = 500.0
                time_hours = 24.0
            else:  # very_difficult
                score = 0.2
                cost_per_kg = 1500.0
                time_hours = 72.0
            
            feasibility_scores.append(score)
            total_cost += cost_per_kg * material.quantity_detected
            total_time = max(total_time, time_hours)
        
        # Overall feasibility
        avg_feasibility = np.mean(feasibility_scores)
        if avg_feasibility > 0.8:
            feasibility['overall_feasibility'] = 'high'
        elif avg_feasibility > 0.6:
            feasibility['overall_feasibility'] = 'medium'
        elif avg_feasibility > 0.3:
            feasibility['overall_feasibility'] = 'low'
        else:
            feasibility['overall_feasibility'] = 'very_low'
        
        feasibility['estimated_recovery_rate'] = avg_feasibility
        feasibility['estimated_cost'] = total_cost
        feasibility['estimated_time'] = total_time
        
        # Technical challenges
        if any(m.material_type == RareMaterialType.RARE_EARTH_ELEMENTS for m in detected_materials):
            feasibility['technical_challenges'].append("Radiation handling required")
        
        if any(m.purity_percentage < 20.0 for m in detected_materials):
            feasibility['technical_challenges'].append("Low purity materials require complex separation")
        
        # Equipment requirements
        material_types = set(m.material_type for m in detected_materials)
        for material_type in material_types:
            if material_type in self.handling_protocols:
                protocol = self.handling_protocols[material_type]
                feasibility['equipment_requirements'].extend(protocol.equipment_needed)
                feasibility['regulatory_requirements'].extend(protocol.regulatory_compliance)
        
        return feasibility
    
    async def _perform_market_analysis(self, detected_materials: List[RareMaterial]) -> Dict[str, Any]:
        """Perform market analysis for detected materials"""
        analysis = {
            'market_outlook': {},
            'price_trends': {},
            'demand_forecast': {},
            'supply_constraints': {},
            'recommended_timing': 'immediate'
        }
        
        if not detected_materials:
            return analysis
        
        for material in detected_materials:
            material_name = material.material_name
            
            # Market outlook (simplified - would use real market data)
            if material.market_demand == "high":
                analysis['market_outlook'][material_name] = "bullish"
                analysis['demand_forecast'][material_name] = "increasing"
            elif material.market_demand == "medium":
                analysis['market_outlook'][material_name] = "stable"
                analysis['demand_forecast'][material_name] = "stable"
            else:
                analysis['market_outlook'][material_name] = "bearish"
                analysis['demand_forecast'][material_name] = "decreasing"
            
            # Price trends (would be based on historical data)
            if material_name in ['lithium', 'cobalt', 'neodymium']:
                analysis['price_trends'][material_name] = "upward"
            else:
                analysis['price_trends'][material_name] = "stable"
            
            # Supply constraints
            if material.material_type == RareMaterialType.RARE_EARTH_ELEMENTS:
                analysis['supply_constraints'][material_name] = "high"
            elif material.material_type == RareMaterialType.CRITICAL_MINERALS:
                analysis['supply_constraints'][material_name] = "medium"
            else:
                analysis['supply_constraints'][material_name] = "low"
        
        # Recommended timing
        high_value_materials = [m for m in detected_materials if m.market_value_per_kg > 1000.0]
        if high_value_materials and any(analysis['price_trends'].get(m.material_name) == "upward" for m in high_value_materials):
            analysis['recommended_timing'] = "immediate"
        else:
            analysis['recommended_timing'] = "within_30_days"
        
        return analysis
    
    async def _analyze_visual_characteristics(self, image: np.ndarray) -> Dict:
        """Analyze visual characteristics that indicate rare materials"""
        characteristics = {}
        
        # Color analysis for metallic luster
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Detect metallic surfaces (high saturation, specific hue ranges)
        metallic_mask = cv2.inRange(hsv, (0, 50, 100), (30, 255, 255))
        metallic_percentage = np.sum(metallic_mask > 0) / (image.shape[0] * image.shape[1]) * 100
        characteristics['metallic_surface_percentage'] = metallic_percentage
        
        # Detect golden/yellow colors (precious metals)
        gold_mask = cv2.inRange(hsv, (15, 100, 100), (35, 255, 255))
        gold_percentage = np.sum(gold_mask > 0) / (image.shape[0] * image.shape[1]) * 100
        characteristics['gold_color_percentage'] = gold_percentage
        
        # Detect silvery colors
        silver_mask = cv2.inRange(hsv, (0, 0, 150), (180, 30, 255))
        silver_percentage = np.sum(silver_mask > 0) / (image.shape[0] * image.shape[1]) * 100
        characteristics['silver_color_percentage'] = silver_percentage
        
        return characteristics
    
    async def _extract_rare_material_spectral_features(self, spectral_data: SpectralData) -> List[float]:
        """Extract spectral features specific to rare materials"""
        features = []
        
        intensities = np.array(spectral_data.intensities)
        wavelengths = np.array(spectral_data.wavelengths)
        
        # Basic spectral statistics
        features.extend([
            float(np.mean(intensities)),
            float(np.std(intensities)),
            float(np.min(intensities)),
            float(np.max(intensities)),
            float(np.median(intensities))
        ])
        
        # Rare material specific spectral bands
        rare_material_bands = [
            (2400, 2800),   # Gold region
            (3200, 3400),   # Silver region
            (2600, 2750),   # Platinum region
            (4000, 4100),   # Neodymium region
            (4150, 4250),   # Dysprosium region
            (6000, 6200),   # Lithium region
            (7600, 7800),   # Cobalt region
        ]
        
        for start, end in rare_material_bands:
            band_indices = [i for i, w in enumerate(wavelengths) if start <= w <= end]
            if band_indices:
                band_intensities = intensities[band_indices]
                features.extend([
                    float(np.mean(band_intensities)),
                    float(np.max(band_intensities)),
                    float(np.std(band_intensities)),
                    float(len(band_indices))
                ])
            else:
                features.extend([0.0, 0.0, 0.0, 0.0])
        
        # Peak detection in rare material regions
        for start, end in rare_material_bands:
            band_indices = [i for i, w in enumerate(wavelengths) if start <= w <= end]
            if band_indices:
                band_intensities = intensities[band_indices]
                peaks = []
                for i in range(1, len(band_intensities) - 1):
                    if band_intensities[i] > band_intensities[i-1] and band_intensities[i] > band_intensities[i+1]:
                        peaks.append(band_intensities[i])
                
                if peaks:
                    features.extend([
                        float(np.max(peaks)),
                        float(len(peaks))
                    ])
                else:
                    features.extend([0.0, 0.0])
            else:
                features.extend([0.0, 0.0])
        
        return features
    
    async def _extract_rare_material_chemical_features(self, chemical_data: ChemicalData) -> List[float]:
        """Extract chemical features specific to rare materials"""
        features = []
        
        # Precious metals
        precious_metals = ['Au', 'Ag', 'Pt', 'Pd', 'Rh', 'Ir', 'Os', 'Ru']
        for metal in precious_metals:
            features.append(chemical_data.elements.get(metal, 0.0))
        
        # Rare earth elements
        rare_earths = ['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Y', 'Sc']
        for element in rare_earths:
            features.append(chemical_data.elements.get(element, 0.0))
        
        # Critical minerals
        critical_elements = ['Li', 'Co', 'Ni', 'Ta', 'Nb', 'W', 'Mo', 'V', 'Cr', 'Mn', 'Ga', 'Ge', 'In', 'Sn', 'Sb', 'Te']
        for element in critical_elements:
            features.append(chemical_data.elements.get(element, 0.0))
        
        # Other valuable elements
        other_elements = ['Ti', 'Zr', 'Hf', 'Re', 'Bi']
        for element in other_elements:
            features.append(chemical_data.elements.get(element, 0.0))
        
        # Chemical ratios that indicate rare materials
        total_precious = sum(chemical_data.elements.get(metal, 0.0) for metal in precious_metals)
        total_rare_earth = sum(chemical_data.elements.get(element, 0.0) for element in rare_earths)
        total_critical = sum(chemical_data.elements.get(element, 0.0) for element in critical_elements)
        
        features.extend([
            total_precious,
            total_rare_earth,
            total_critical,
            total_precious + total_rare_earth + total_critical
        ])
        
        # Pad to expected size
        while len(features) < 100:
            features.append(0.0)
        
        return features[:100]
    
    async def _identify_spectral_signatures(self, spectral_data: SpectralData) -> Dict:
        """Identify specific spectral signatures of rare materials"""
        signatures = {}
        
        intensities = np.array(spectral_data.intensities)
        wavelengths = np.array(spectral_data.wavelengths)
        
        # Check for known rare material spectral signatures
        for material_type, material_db in self.rare_materials_database.items():
            for material_name, material_info in material_db.items():
                if 'purity_indicators' in material_info and 'spectral_peaks' in material_info['purity_indicators']:
                    expected_peaks = material_info['purity_indicators']['spectral_peaks']
                    
                    signature_strength = 0.0
                    for peak_wavelength in expected_peaks:
                        # Find closest wavelength in data
                        closest_idx = np.argmin(np.abs(wavelengths - peak_wavelength))
                        if abs(wavelengths[closest_idx] - peak_wavelength) < 50:  # Within 50 nm
                            # Check if there's a peak at this location
                            if closest_idx > 0 and closest_idx < len(intensities) - 1:
                                if intensities[closest_idx] > intensities[closest_idx-1] and intensities[closest_idx] > intensities[closest_idx+1]:
                                    signature_strength += intensities[closest_idx]
                    
                    if signature_strength > 0:
                        signatures[material_name] = {
                            'signature_strength': float(signature_strength),
                            'expected_peaks': expected_peaks,
                            'material_type': material_type.value
                        }
        
        return signatures
    
    async def _identify_chemical_indicators(self, chemical_data: ChemicalData) -> Dict:
        """Identify chemical indicators of rare materials"""
        indicators = {}
        
        # Check for specific element combinations that indicate rare materials
        for material_type, material_db in self.rare_materials_database.items():
            for material_name, material_info in material_db.items():
                formula = material_info['formula']
                
                # Simple check for single element materials
                if len(formula) <= 2 and formula in chemical_data.elements:
                    content = chemical_data.elements[formula]
                    if content > 0.001:  # 0.1% threshold
                        indicators[material_name] = {
                            'element_content': content,
                            'formula': formula,
                            'material_type': material_type.value,
                            'indicator_strength': min(1.0, content / 0.01)  # Normalize to 1% = 1.0
                        }
        
        return indicators

# Global instance
rare_material_detector = RareMaterialDetector()

# API functions
async def detect_rare_materials_api(
    image_data: bytes,
    spectral_data: Optional[Dict] = None,
    chemical_data: Optional[Dict] = None
) -> Dict:
    """API function for rare material detection"""
    try:
        # Convert dictionaries to dataclasses if provided
        spectral = SpectralData(**spectral_data) if spectral_data else None
        chemical = ChemicalData(**chemical_data) if chemical_data else None
        
        # Detect rare materials
        result = await rare_material_detector.detect_rare_materials(
            image_data, spectral, chemical
        )
        
        # Convert result to dictionary
        return {
            'materials_detected': [
                {
                    'material_name': m.material_name,
                    'material_type': m.material_type.value,
                    'chemical_formula': m.chemical_formula,
                    'market_value_per_kg': m.market_value_per_kg,
                    'purity_percentage': m.purity_percentage,
                    'quantity_detected': m.quantity_detected,
                    'confidence': m.confidence,
                    'extraction_difficulty': m.extraction_difficulty,
                    'market_demand': m.market_demand,
                    'applications': m.applications,
                    'handling_requirements': m.handling_requirements
                }
                for m in result.materials_detected
            ],
            'total_estimated_value': result.total_estimated_value,
            'highest_value_material': {
                'material_name': result.highest_value_material.material_name,
                'estimated_value': result.highest_value_material.market_value_per_kg * result.highest_value_material.quantity_detected
            } if result.highest_value_material else None,
            'detection_confidence': result.detection_confidence,
            'recommended_actions': result.recommended_actions,
            'special_handling_required': result.special_handling_required,
            'stakeholder_notifications': result.stakeholder_notifications,
            'extraction_feasibility': result.extraction_feasibility,
            'market_analysis': result.market_analysis,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

async def get_handling_protocol(material_type: str) -> Dict:
    """Get handling protocol for a specific material type"""
    try:
        material_type_enum = RareMaterialType(material_type)
        
        if material_type_enum in rare_material_detector.handling_protocols:
            protocol = rare_material_detector.handling_protocols[material_type_enum]
            
            return {
                'protocol_id': protocol.protocol_id,
                'material_type': protocol.material_type.value,
                'safety_requirements': protocol.safety_requirements,
                'equipment_needed': protocol.equipment_needed,
                'extraction_steps': protocol.extraction_steps,
                'storage_conditions': protocol.storage_conditions,
                'transportation_requirements': protocol.transportation_requirements,
                'regulatory_compliance': protocol.regulatory_compliance,
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'error': f'No protocol found for material type: {material_type}',
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Test rare material detection
    import asyncio
    
    async def test_rare_material_detection():
        # Create test data
        image_data = b"test_image_data"
        spectral_data = {
            'wavelengths': list(range(400, 4000, 10)),
            'intensities': [0.5 + 0.1 * np.sin(i * 0.01) for i in range(360)],
            'spectrum_type': 'XRF',
            'resolution': 10.0,
            'integration_time': 5.0
        }
        chemical_data = {
            'elements': {
                'C': 20.0, 'H': 3.0, 'O': 15.0, 'N': 1.0, 'S': 0.5,
                'Au': 0.05, 'Ag': 0.02, 'Pt': 0.01, 'Nd': 0.003, 'Li': 0.1
            },
            'compounds': {'Au_metal': 0.05, 'Ag_metal': 0.02},
            'ph_level': 7.0,
            'moisture_content': 5.0,
            'organic_content': 40.0
        }
        
        # Test rare material detection
        result = await detect_rare_materials_api(
            image_data, spectral_data, chemical_data
        )
        print("Rare Material Detection Result:")
        print(json.dumps(result, indent=2))
        
        # Test handling protocol
        if result.get('materials_detected'):
            material_type = result['materials_detected'][0]['material_type']
            protocol = await get_handling_protocol(material_type)
            print(f"\nHandling Protocol for {material_type}:")
            print(json.dumps(protocol, indent=2))
    
    asyncio.run(test_rare_material_detection())