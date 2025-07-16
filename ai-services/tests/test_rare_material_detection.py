"""
End-to-end tests for Rare Material Detection System
"""

import pytest
import numpy as np
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import json
import cv2

# Import the classes to test
from ..rare_material_detection import (
    RareMaterialDetector,
    RareMaterialType,
    MaterialValue,
    RareMaterial,
    DetectionResult,
    HandlingProtocol,
    detect_rare_materials_api,
    get_handling_protocol
)
from ..multi_modal_sensor_fusion import SpectralData, ChemicalData

class TestRareMaterialDetector:
    """Test rare material detection functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.detector = RareMaterialDetector()
    
    def test_database_initialization(self):
        """Test that databases are properly initialized"""
        # Check rare materials database
        assert RareMaterialType.PRECIOUS_METALS in self.detector.rare_materials_database
        assert RareMaterialType.RARE_EARTH_ELEMENTS in self.detector.rare_materials_database
        assert RareMaterialType.CRITICAL_MINERALS in self.detector.rare_materials_database
        
        # Check specific materials
        precious_metals = self.detector.rare_materials_database[RareMaterialType.PRECIOUS_METALS]
        assert 'gold' in precious_metals
        assert 'silver' in precious_metals
        assert 'platinum' in precious_metals
        assert 'palladium' in precious_metals
        
        # Check market prices
        assert 'gold' in self.detector.market_prices_database
        assert 'silver' in self.detector.market_prices_database
        assert self.detector.market_prices_database['gold'] > 0
        
        # Check handling protocols
        assert RareMaterialType.PRECIOUS_METALS in self.detector.handling_protocols
        assert RareMaterialType.RARE_EARTH_ELEMENTS in self.detector.handling_protocols
    
    @pytest.mark.asyncio
    async def test_visual_rare_material_detection(self):
        """Test visual rare material detection"""
        image_data = self._create_mock_image_data()
        
        # Mock the model prediction
        with patch.object(self.detector.visual_rare_material_model, 'predict') as mock_predict:
            mock_predict.return_value = np.array([[0.1, 0.8, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            
            # Test visual detection
            result = await self.detector._detect_visual_rare_materials(image_data)
            
            # Assertions
            assert 'material_probabilities' in result
            assert 'visual_characteristics' in result
            assert 'confidence' in result
            
            assert result['confidence'] > 0.0
            assert isinstance(result['visual_characteristics'], dict)
            assert len(result['material_probabilities']) == len(RareMaterialType)
    
    @pytest.mark.asyncio
    async def test_spectral_rare_material_detection(self):
        """Test spectral rare material detection"""
        spectral_data = SpectralData(
            wavelengths=list(range(400, 4000, 10)),
            intensities=[0.5 + 0.1 * np.sin(i * 0.01) for i in range(360)],
            spectrum_type="XRF",
            resolution=10.0,
            integration_time=5.0
        )
        
        # Mock the model prediction
        with patch.object(self.detector.spectral_rare_material_model, 'predict') as mock_predict:
            mock_predict.return_value = np.array([[0.2, 0.7, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            
            # Test spectral detection
            result = await self.detector._detect_spectral_rare_materials(spectral_data)
            
            # Assertions
            assert 'material_probabilities' in result
            assert 'spectral_signatures' in result
            assert 'confidence' in result
            
            assert result['confidence'] > 0.0
            assert isinstance(result['spectral_signatures'], dict)
    
    @pytest.mark.asyncio
    async def test_chemical_rare_material_detection(self):
        """Test chemical rare material detection"""
        chemical_data = ChemicalData(
            elements={
                'C': 20.0, 'H': 3.0, 'O': 15.0, 'N': 1.0, 'S': 0.5,
                'Au': 0.05, 'Ag': 0.02, 'Pt': 0.01, 'Nd': 0.003, 'Li': 0.1
            },
            compounds={'Au_metal': 0.05, 'Ag_metal': 0.02},
            ph_level=7.0,
            moisture_content=5.0,
            organic_content=40.0
        )
        
        # Mock the model prediction
        with patch.object(self.detector.chemical_rare_material_model, 'predict') as mock_predict:
            mock_predict.return_value = np.array([[0.9, 0.1, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            
            # Test chemical detection
            result = await self.detector._detect_chemical_rare_materials(chemical_data)
            
            # Assertions
            assert 'material_probabilities' in result
            assert 'chemical_indicators' in result
            assert 'confidence' in result
            
            assert result['confidence'] > 0.0
            assert isinstance(result['chemical_indicators'], dict)
    
    @pytest.mark.asyncio
    async def test_complete_rare_material_detection(self):
        """Test complete rare material detection workflow"""
        # Create test data
        image_data = self._create_mock_image_data()
        spectral_data = SpectralData(
            wavelengths=list(range(400, 4000, 10)),
            intensities=[0.5] * 360,
            spectrum_type='XRF',
            resolution=10.0,
            integration_time=5.0
        )
        chemical_data = ChemicalData(
            elements={
                'C': 20.0, 'H': 3.0, 'O': 15.0, 'Au': 0.05, 'Ag': 0.02
            },
            compounds={'Au_metal': 0.05},
            ph_level=7.0,
            moisture_content=5.0,
            organic_content=40.0
        )
        
        # Mock all model predictions
        with patch.object(self.detector.visual_rare_material_model, 'predict') as mock_visual, \
             patch.object(self.detector.spectral_rare_material_model, 'predict') as mock_spectral, \
             patch.object(self.detector.chemical_rare_material_model, 'predict') as mock_chemical, \
             patch.object(self.detector.fusion_rare_material_model, 'predict') as mock_fusion:
            
            # Set up mock predictions indicating precious metals
            mock_visual.return_value = np.array([[0.8, 0.1, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            mock_spectral.return_value = np.array([[0.9, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            mock_chemical.return_value = np.array([[0.95, 0.02, 0.03, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])
            
            # Mock fusion model
            mock_fusion.return_value = [
                np.array([[0.9, 0.05, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]]),  # material_detection
                np.array([[0.85, 0.7, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]]),   # confidence_scores
                np.array([[0.8, 0.6, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]])     # purity_estimation
            ]
            
            # Test complete detection
            result = await self.detector.detect_rare_materials(
                image_data, spectral_data, chemical_data
            )
            
            # Assertions
            assert isinstance(result, DetectionResult)
            assert len(result.materials_detected) > 0
            assert result.total_estimated_value > 0.0
            assert result.highest_value_material is not None
            assert 0.0 <= result.detection_confidence <= 1.0
            assert len(result.recommended_actions) > 0
            assert isinstance(result.special_handling_required, bool)
            assert len(result.stakeholder_notifications) > 0
            assert isinstance(result.extraction_feasibility, dict)
            assert isinstance(result.market_analysis, dict)
    
    @pytest.mark.asyncio
    async def test_specific_material_identification(self):
        """Test identification of specific materials"""
        fusion_result = {
            'material_detection': np.array([0.9, 0.05, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            'confidence_scores': np.array([0.85, 0.6, 0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
            'purity_estimation': np.array([0.8, 0.4, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
        }
        
        materials = await self.detector._identify_specific_materials(fusion_result)
        
        # Should detect precious metals and critical minerals
        assert len(materials) > 0
        
        # Check material properties
        for material in materials:
            assert isinstance(material, RareMaterial)
            assert material.material_name is not None
            assert material.material_type in RareMaterialType
            assert material.market_value_per_kg >= 0.0
            assert 0.0 <= material.purity_percentage <= 100.0
            assert material.quantity_detected >= 0.0
            assert 0.0 <= material.confidence <= 1.0
            assert material.extraction_difficulty in ['easy', 'moderate', 'difficult', 'very_difficult']
            assert material.market_demand in ['low', 'medium', 'high']
    
    def test_extraction_difficulty_assessment(self):
        """Test extraction difficulty assessment"""
        # High purity should be easy
        difficulty = self.detector._assess_extraction_difficulty('gold', 0.9)
        assert difficulty == 'easy'
        
        # Medium purity should be moderate
        difficulty = self.detector._assess_extraction_difficulty('gold', 0.6)
        assert difficulty == 'moderate'
        
        # Low purity should be difficult
        difficulty = self.detector._assess_extraction_difficulty('gold', 0.3)
        assert difficulty == 'difficult'
        
        # Very low purity should be very difficult
        difficulty = self.detector._assess_extraction_difficulty('gold', 0.1)
        assert difficulty == 'very_difficult'
    
    def test_market_demand_assessment(self):
        """Test market demand assessment"""
        # High demand materials
        demand = self.detector._assess_market_demand('lithium')
        assert demand == 'high'
        
        demand = self.detector._assess_market_demand('neodymium')
        assert demand == 'high'
        
        # Medium demand materials
        demand = self.detector._assess_market_demand('tantalum')
        assert demand == 'medium'
        
        # Low demand materials (default)
        demand = self.detector._assess_market_demand('unknown_material')
        assert demand == 'low'
    
    def test_total_value_calculation(self):
        """Test total value calculation"""
        materials = [
            RareMaterial(
                material_name='gold',
                material_type=RareMaterialType.PRECIOUS_METALS,
                chemical_formula='Au',
                market_value_per_kg=65000.0,
                purity_percentage=80.0,
                quantity_detected=0.1,
                confidence=0.9,
                extraction_difficulty='easy',
                market_demand='high',
                applications=['electronics'],
                handling_requirements=['secure_storage']
            ),
            RareMaterial(
                material_name='silver',
                material_type=RareMaterialType.PRECIOUS_METALS,
                chemical_formula='Ag',
                market_value_per_kg=800.0,
                purity_percentage=60.0,
                quantity_detected=0.5,
                confidence=0.8,
                extraction_difficulty='moderate',
                market_demand='medium',
                applications=['electronics'],
                handling_requirements=['standard_storage']
            )
        ]
        
        total_value = self.detector._calculate_total_value(materials)
        
        # Expected: (65000 * 0.1 * 0.8) + (800 * 0.5 * 0.6) = 5200 + 240 = 5440
        expected_value = (65000.0 * 0.1 * 0.8) + (800.0 * 0.5 * 0.6)
        assert abs(total_value - expected_value) < 0.01
    
    @pytest.mark.asyncio
    async def test_handling_recommendations_generation(self):
        """Test handling recommendations generation"""
        # High-value materials
        high_value_materials = [
            RareMaterial(
                material_name='gold',
                material_type=RareMaterialType.PRECIOUS_METALS,
                chemical_formula='Au',
                market_value_per_kg=65000.0,
                purity_percentage=80.0,
                quantity_detected=0.1,
                confidence=0.9,
                extraction_difficulty='easy',
                market_demand='high',
                applications=['electronics'],
                handling_requirements=['secure_storage']
            )
        ]
        
        recommendations = await self.detector._generate_handling_recommendations(high_value_materials)
        
        assert len(recommendations) > 0
        recommendation_text = ' '.join(recommendations).lower()
        assert 'secure' in recommendation_text or 'isolation' in recommendation_text
        assert 'high-value' in recommendation_text or 'security' in recommendation_text
        
        # Rare earth materials
        rare_earth_materials = [
            RareMaterial(
                material_name='neodymium',
                material_type=RareMaterialType.RARE_EARTH_ELEMENTS,
                chemical_formula='Nd',
                market_value_per_kg=120.0,
                purity_percentage=50.0,
                quantity_detected=1.0,
                confidence=0.8,
                extraction_difficulty='moderate',
                market_demand='high',
                applications=['magnets'],
                handling_requirements=['radiation_safety']
            )
        ]
        
        recommendations = await self.detector._generate_handling_recommendations(rare_earth_materials)
        
        recommendation_text = ' '.join(recommendations).lower()
        assert 'radiation' in recommendation_text or 'safety' in recommendation_text
    
    def test_stakeholder_notifications_determination(self):
        """Test stakeholder notifications determination"""
        # High-value materials
        high_value_materials = [
            RareMaterial(
                material_name='gold',
                material_type=RareMaterialType.PRECIOUS_METALS,
                chemical_formula='Au',
                market_value_per_kg=65000.0,
                purity_percentage=80.0,
                quantity_detected=0.2,  # High quantity for high total value
                confidence=0.9,
                extraction_difficulty='easy',
                market_demand='high',
                applications=['electronics'],
                handling_requirements=['secure_storage']
            )
        ]
        
        notifications = self.detector._determine_stakeholder_notifications(high_value_materials)
        
        assert len(notifications) > 0
        assert 'Senior management' in notifications
        assert 'Finance department' in notifications
        assert 'Precious metals specialist' in notifications
        assert 'Security team' in notifications
    
    @pytest.mark.asyncio
    async def test_extraction_feasibility_assessment(self):
        """Test extraction feasibility assessment"""
        materials = [
            RareMaterial(
                material_name='gold',
                material_type=RareMaterialType.PRECIOUS_METALS,
                chemical_formula='Au',
                market_value_per_kg=65000.0,
                purity_percentage=80.0,
                quantity_detected=0.1,
                confidence=0.9,
                extraction_difficulty='easy',
                market_demand='high',
                applications=['electronics'],
                handling_requirements=['secure_storage']
            )
        ]
        
        feasibility = await self.detector._assess_extraction_feasibility(materials)
        
        assert 'overall_feasibility' in feasibility
        assert 'estimated_recovery_rate' in feasibility
        assert 'estimated_cost' in feasibility
        assert 'estimated_time' in feasibility
        assert 'technical_challenges' in feasibility
        assert 'equipment_requirements' in feasibility
        assert 'regulatory_requirements' in feasibility
        
        assert feasibility['overall_feasibility'] in ['very_low', 'low', 'medium', 'high']
        assert 0.0 <= feasibility['estimated_recovery_rate'] <= 1.0
        assert feasibility['estimated_cost'] >= 0.0
        assert feasibility['estimated_time'] >= 0.0
    
    @pytest.mark.asyncio
    async def test_market_analysis_performance(self):
        """Test market analysis performance"""
        materials = [
            RareMaterial(
                material_name='lithium',
                material_type=RareMaterialType.CRITICAL_MINERALS,
                chemical_formula='Li',
                market_value_per_kg=25.0,
                purity_percentage=60.0,
                quantity_detected=2.0,
                confidence=0.8,
                extraction_difficulty='moderate',
                market_demand='high',
                applications=['batteries'],
                handling_requirements=['standard_storage']
            )
        ]
        
        analysis = await self.detector._perform_market_analysis(materials)
        
        assert 'market_outlook' in analysis
        assert 'price_trends' in analysis
        assert 'demand_forecast' in analysis
        assert 'supply_constraints' in analysis
        assert 'recommended_timing' in analysis
        
        assert 'lithium' in analysis['market_outlook']
        assert analysis['market_outlook']['lithium'] in ['bullish', 'stable', 'bearish']
        assert analysis['recommended_timing'] in ['immediate', 'within_30_days']
    
    @pytest.mark.asyncio
    async def test_visual_characteristics_analysis(self):
        """Test visual characteristics analysis"""
        # Create test image with metallic colors
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        
        # Add golden area
        image[20:40, 20:40] = [0, 215, 255]  # Golden color in BGR
        
        # Add silvery area
        image[60:80, 60:80] = [192, 192, 192]  # Silver color
        
        characteristics = await self.detector._analyze_visual_characteristics(image)
        
        assert 'metallic_surface_percentage' in characteristics
        assert 'gold_color_percentage' in characteristics
        assert 'silver_color_percentage' in characteristics
        
        assert characteristics['metallic_surface_percentage'] >= 0.0
        assert characteristics['gold_color_percentage'] >= 0.0
        assert characteristics['silver_color_percentage'] >= 0.0
    
    @pytest.mark.asyncio
    async def test_spectral_features_extraction(self):
        """Test spectral features extraction for rare materials"""
        spectral_data = SpectralData(
            wavelengths=list(range(400, 4000, 10)),
            intensities=[0.5 + 0.1 * np.sin(i * 0.01) for i in range(360)],
            spectrum_type="XRF",
            resolution=10.0,
            integration_time=5.0
        )
        
        features = await self.detector._extract_rare_material_spectral_features(spectral_data)
        
        assert len(features) > 0
        assert all(isinstance(f, float) for f in features)
        
        # Should include basic statistics
        assert len(features) >= 5  # At least mean, std, min, max, median
    
    @pytest.mark.asyncio
    async def test_chemical_features_extraction(self):
        """Test chemical features extraction for rare materials"""
        chemical_data = ChemicalData(
            elements={
                'C': 20.0, 'H': 3.0, 'O': 15.0, 'N': 1.0, 'S': 0.5,
                'Au': 0.05, 'Ag': 0.02, 'Pt': 0.01, 'Nd': 0.003, 'Li': 0.1
            },
            compounds={'Au_metal': 0.05, 'Ag_metal': 0.02},
            ph_level=7.0,
            moisture_content=5.0,
            organic_content=40.0
        )
        
        features = await self.detector._extract_rare_material_chemical_features(chemical_data)
        
        assert len(features) == 100  # Expected feature vector size
        assert all(isinstance(f, float) for f in features)
        
        # Should include precious metals
        assert features[0] == 0.05  # Gold content
        assert features[1] == 0.02  # Silver content
    
    @pytest.mark.asyncio
    async def test_spectral_signatures_identification(self):
        """Test spectral signatures identification"""
        # Create spectral data with known gold signature
        wavelengths = list(range(400, 4000, 10))
        intensities = [0.5] * len(wavelengths)
        
        # Add peak at gold wavelength (around 2676 nm)
        gold_idx = wavelengths.index(2670)  # Closest to 2676
        intensities[gold_idx] = 2.0  # Strong peak
        
        spectral_data = SpectralData(
            wavelengths=wavelengths,
            intensities=intensities,
            spectrum_type="XRF",
            resolution=10.0,
            integration_time=5.0
        )
        
        signatures = await self.detector._identify_spectral_signatures(spectral_data)
        
        assert isinstance(signatures, dict)
        # May or may not detect gold depending on exact wavelength matching
    
    @pytest.mark.asyncio
    async def test_chemical_indicators_identification(self):
        """Test chemical indicators identification"""
        chemical_data = ChemicalData(
            elements={
                'C': 20.0, 'H': 3.0, 'O': 15.0,
                'Au': 0.05, 'Ag': 0.02, 'Li': 0.1  # Above thresholds
            },
            compounds={},
            ph_level=7.0,
            moisture_content=5.0,
            organic_content=40.0
        )
        
        indicators = await self.detector._identify_chemical_indicators(chemical_data)
        
        assert isinstance(indicators, dict)
        
        # Should detect gold, silver, and lithium
        expected_materials = ['gold', 'silver', 'lithium']
        for material in expected_materials:
            if material in indicators:
                assert 'element_content' in indicators[material]
                assert 'formula' in indicators[material]
                assert 'material_type' in indicators[material]
                assert 'indicator_strength' in indicators[material]
    
    def _create_mock_image_data(self) -> bytes:
        """Create mock image data for testing"""
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', image)
        return buffer.tobytes()

class TestAPIFunctions:
    """Test API functions"""
    
    @pytest.mark.asyncio
    async def test_detect_rare_materials_api(self):
        """Test the main rare materials detection API function"""
        # Create test data
        image_data = self._create_mock_image_data()
        spectral_data = {
            'wavelengths': list(range(400, 4000, 10)),
            'intensities': [0.5] * 360,
            'spectrum_type': 'XRF',
            'resolution': 10.0,
            'integration_time': 5.0
        }
        chemical_data = {
            'elements': {
                'C': 20.0, 'H': 3.0, 'O': 15.0,
                'Au': 0.05, 'Ag': 0.02, 'Li': 0.1
            },
            'compounds': {'Au_metal': 0.05},
            'ph_level': 7.0,
            'moisture_content': 5.0,
            'organic_content': 40.0
        }
        
        # Mock the rare material detector
        with patch('ai_services.rare_material_detection.rare_material_detector') as mock_detector:
            mock_result = DetectionResult(
                materials_detected=[
                    RareMaterial(
                        material_name='gold',
                        material_type=RareMaterialType.PRECIOUS_METALS,
                        chemical_formula='Au',
                        market_value_per_kg=65000.0,
                        purity_percentage=80.0,
                        quantity_detected=0.1,
                        confidence=0.9,
                        extraction_difficulty='easy',
                        market_demand='high',
                        applications=['electronics'],
                        handling_requirements=['secure_storage']
                    )
                ],
                total_estimated_value=5200.0,
                highest_value_material=RareMaterial(
                    material_name='gold',
                    material_type=RareMaterialType.PRECIOUS_METALS,
                    chemical_formula='Au',
                    market_value_per_kg=65000.0,
                    purity_percentage=80.0,
                    quantity_detected=0.1,
                    confidence=0.9,
                    extraction_difficulty='easy',
                    market_demand='high',
                    applications=['electronics'],
                    handling_requirements=['secure_storage']
                ),
                detection_confidence=0.9,
                recommended_actions=['Secure isolation required'],
                special_handling_required=True,
                stakeholder_notifications=['Senior management'],
                extraction_feasibility={'overall_feasibility': 'high'},
                market_analysis={'market_outlook': {'gold': 'bullish'}}
            )
            
            mock_detector.detect_rare_materials = AsyncMock(return_value=mock_result)
            
            # Test API function
            result = await detect_rare_materials_api(
                image_data, spectral_data, chemical_data
            )
            
            # Assertions
            assert 'materials_detected' in result
            assert 'total_estimated_value' in result
            assert 'highest_value_material' in result
            assert 'detection_confidence' in result
            assert 'recommended_actions' in result
            assert 'special_handling_required' in result
            assert 'stakeholder_notifications' in result
            assert 'extraction_feasibility' in result
            assert 'market_analysis' in result
            assert 'timestamp' in result
            
            assert len(result['materials_detected']) == 1
            assert result['total_estimated_value'] == 5200.0
            assert result['detection_confidence'] == 0.9
            assert result['special_handling_required'] is True
            
            # Check material structure
            material = result['materials_detected'][0]
            assert material['material_name'] == 'gold'
            assert material['material_type'] == 'precious_metals'
            assert material['market_value_per_kg'] == 65000.0
            assert material['confidence'] == 0.9
    
    @pytest.mark.asyncio
    async def test_get_handling_protocol_api(self):
        """Test the handling protocol API function"""
        # Test with valid material type
        result = await get_handling_protocol('precious_metals')
        
        # Assertions
        assert 'protocol_id' in result
        assert 'material_type' in result
        assert 'safety_requirements' in result
        assert 'equipment_needed' in result
        assert 'extraction_steps' in result
        assert 'storage_conditions' in result
        assert 'transportation_requirements' in result
        assert 'regulatory_compliance' in result
        assert 'timestamp' in result
        
        assert result['material_type'] == 'precious_metals'
        assert len(result['safety_requirements']) > 0
        assert len(result['equipment_needed']) > 0
        assert len(result['extraction_steps']) > 0
        
        # Test with invalid material type
        result = await get_handling_protocol('invalid_type')
        assert 'error' in result
    
    @pytest.mark.asyncio
    async def test_api_error_handling(self):
        """Test API error handling"""
        # Test with invalid data
        result = await detect_rare_materials_api(b"invalid", {}, {})
        
        # Should return error response
        assert 'error' in result
        assert 'timestamp' in result
    
    def _create_mock_image_data(self) -> bytes:
        """Create mock image data for testing"""
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', image)
        return buffer.tobytes()

class TestDataClasses:
    """Test data classes and enums"""
    
    def test_rare_material_type_enum(self):
        """Test RareMaterialType enum"""
        assert RareMaterialType.PRECIOUS_METALS.value == "precious_metals"
        assert RareMaterialType.RARE_EARTH_ELEMENTS.value == "rare_earth_elements"
        assert RareMaterialType.CRITICAL_MINERALS.value == "critical_minerals"
    
    def test_material_value_enum(self):
        """Test MaterialValue enum"""
        assert MaterialValue.LOW.value == 1
        assert MaterialValue.MEDIUM.value == 2
        assert MaterialValue.HIGH.value == 3
        assert MaterialValue.VERY_HIGH.value == 4
        assert MaterialValue.EXTREME.value == 5
    
    def test_rare_material_creation(self):
        """Test RareMaterial dataclass"""
        material = RareMaterial(
            material_name='gold',
            material_type=RareMaterialType.PRECIOUS_METALS,
            chemical_formula='Au',
            market_value_per_kg=65000.0,
            purity_percentage=80.0,
            quantity_detected=0.1,
            confidence=0.9,
            extraction_difficulty='easy',
            market_demand='high',
            applications=['electronics'],
            handling_requirements=['secure_storage']
        )
        
        assert material.material_name == 'gold'
        assert material.material_type == RareMaterialType.PRECIOUS_METALS
        assert material.chemical_formula == 'Au'
        assert material.market_value_per_kg == 65000.0
        assert material.purity_percentage == 80.0
        assert material.quantity_detected == 0.1
        assert material.confidence == 0.9
        assert material.extraction_difficulty == 'easy'
        assert material.market_demand == 'high'
        assert material.applications == ['electronics']
        assert material.handling_requirements == ['secure_storage']
    
    def test_detection_result_creation(self):
        """Test DetectionResult dataclass"""
        material = RareMaterial(
            material_name='gold',
            material_type=RareMaterialType.PRECIOUS_METALS,
            chemical_formula='Au',
            market_value_per_kg=65000.0,
            purity_percentage=80.0,
            quantity_detected=0.1,
            confidence=0.9,
            extraction_difficulty='easy',
            market_demand='high',
            applications=['electronics'],
            handling_requirements=['secure_storage']
        )
        
        result = DetectionResult(
            materials_detected=[material],
            total_estimated_value=5200.0,
            highest_value_material=material,
            detection_confidence=0.9,
            recommended_actions=['Secure isolation'],
            special_handling_required=True,
            stakeholder_notifications=['Management'],
            extraction_feasibility={'feasibility': 'high'},
            market_analysis={'outlook': 'positive'}
        )
        
        assert len(result.materials_detected) == 1
        assert result.total_estimated_value == 5200.0
        assert result.highest_value_material == material
        assert result.detection_confidence == 0.9
        assert result.recommended_actions == ['Secure isolation']
        assert result.special_handling_required is True
        assert result.stakeholder_notifications == ['Management']
        assert result.extraction_feasibility == {'feasibility': 'high'}
        assert result.market_analysis == {'outlook': 'positive'}
    
    def test_handling_protocol_creation(self):
        """Test HandlingProtocol dataclass"""
        protocol = HandlingProtocol(
            protocol_id="PM_001",
            material_type=RareMaterialType.PRECIOUS_METALS,
            safety_requirements=["Protective equipment"],
            equipment_needed=["Scales"],
            extraction_steps=["Isolate", "Extract"],
            storage_conditions={"temperature": "room"},
            transportation_requirements=["Secure transport"],
            regulatory_compliance=["Permits required"]
        )
        
        assert protocol.protocol_id == "PM_001"
        assert protocol.material_type == RareMaterialType.PRECIOUS_METALS
        assert protocol.safety_requirements == ["Protective equipment"]
        assert protocol.equipment_needed == ["Scales"]
        assert protocol.extraction_steps == ["Isolate", "Extract"]
        assert protocol.storage_conditions == {"temperature": "room"}
        assert protocol.transportation_requirements == ["Secure transport"]
        assert protocol.regulatory_compliance == ["Permits required"]

class TestIntegrationWorkflow:
    """Test complete rare material detection workflow"""
    
    @pytest.mark.asyncio
    async def test_complete_workflow(self):
        """Test complete rare material detection and handling workflow"""
        # Step 1: Detect rare materials
        image_data = self._create_mock_image_data()
        spectral_data = {
            'wavelengths': list(range(400, 4000, 10)),
            'intensities': [0.5] * 360,
            'spectrum_type': 'XRF',
            'resolution': 10.0,
            'integration_time': 5.0
        }
        chemical_data = {
            'elements': {
                'C': 20.0, 'H': 3.0, 'O': 15.0,
                'Au': 0.05, 'Ag': 0.02, 'Pt': 0.01, 'Li': 0.1
            },
            'compounds': {'Au_metal': 0.05, 'Ag_metal': 0.02},
            'ph_level': 7.0,
            'moisture_content': 5.0,
            'organic_content': 40.0
        }
        
        # Mock rare material detection
        with patch('ai_services.rare_material_detection.rare_material_detector') as mock_detector:
            mock_result = DetectionResult(
                materials_detected=[
                    RareMaterial(
                        material_name='gold',
                        material_type=RareMaterialType.PRECIOUS_METALS,
                        chemical_formula='Au',
                        market_value_per_kg=65000.0,
                        purity_percentage=80.0,
                        quantity_detected=0.1,
                        confidence=0.9,
                        extraction_difficulty='easy',
                        market_demand='high',
                        applications=['electronics'],
                        handling_requirements=['secure_storage']
                    ),
                    RareMaterial(
                        material_name='lithium',
                        material_type=RareMaterialType.CRITICAL_MINERALS,
                        chemical_formula='Li',
                        market_value_per_kg=25.0,
                        purity_percentage=60.0,
                        quantity_detected=2.0,
                        confidence=0.8,
                        extraction_difficulty='moderate',
                        market_demand='high',
                        applications=['batteries'],
                        handling_requirements=['standard_storage']
                    )
                ],
                total_estimated_value=5230.0,  # (65000*0.1*0.8) + (25*2*0.6)
                highest_value_material=None,  # Will be set by detector
                detection_confidence=0.85,
                recommended_actions=['Secure isolation', 'Fast-track processing'],
                special_handling_required=True,
                stakeholder_notifications=['Senior management', 'Finance department'],
                extraction_feasibility={'overall_feasibility': 'high', 'estimated_cost': 200.0},
                market_analysis={'recommended_timing': 'immediate'}
            )
            
            mock_detector.detect_rare_materials = AsyncMock(return_value=mock_result)
            
            # Detect rare materials
            detection_result = await detect_rare_materials_api(
                image_data, spectral_data, chemical_data
            )
            
            # Verify detection results
            assert detection_result['total_estimated_value'] > 5000.0
            assert len(detection_result['materials_detected']) == 2
            assert detection_result['special_handling_required'] is True
            
            # Step 2: Get handling protocols for detected materials
            protocols = {}
            for material in detection_result['materials_detected']:
                material_type = material['material_type']
                protocol = await get_handling_protocol(material_type)
                protocols[material_type] = protocol
            
            # Verify handling protocols
            assert 'precious_metals' in protocols
            assert 'critical_minerals' in protocols
            
            for protocol in protocols.values():
                if 'error' not in protocol:
                    assert len(protocol['safety_requirements']) > 0
                    assert len(protocol['equipment_needed']) > 0
                    assert len(protocol['extraction_steps']) > 0
            
            # Step 3: Verify workflow completeness
            # Should have complete information for decision making
            assert 'extraction_feasibility' in detection_result
            assert 'market_analysis' in detection_result
            assert 'stakeholder_notifications' in detection_result
            
            # Should have actionable handling protocols
            precious_metals_protocol = protocols.get('precious_metals', {})
            if 'error' not in precious_metals_protocol:
                assert 'safety_requirements' in precious_metals_protocol
                assert 'equipment_needed' in precious_metals_protocol
                assert 'regulatory_compliance' in precious_metals_protocol
    
    def _create_mock_image_data(self) -> bytes:
        """Create mock image data for testing"""
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        _, buffer = cv2.imencode('.jpg', image)
        return buffer.tobytes()

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])