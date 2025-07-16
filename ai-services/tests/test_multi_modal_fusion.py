"""
Unit tests for Multi-Modal Sensor Fusion System
"""

import pytest
import numpy as np
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import json

# Import the classes to test
from ..multi_modal_sensor_fusion import (
    MultiModalSensorFusion,
    SensorCalibration,
    SensorType,
    SensorData,
    SpectralData,
    WeightData,
    ChemicalData,
    FusionResult,
    analyze_multi_modal_waste
)

class TestSensorCalibration:
    """Test sensor calibration functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.calibration = SensorCalibration()
    
    def test_visual_sensor_calibration(self):
        """Test visual sensor calibration"""
        # Create mock reference images
        reference_images = [np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) for _ in range(5)]
        
        # Test calibration
        result = self.calibration.calibrate_visual_sensor("camera_001", reference_images)
        
        # Assertions
        assert result['status'] == 'calibrated'
        assert 'color_standards' in result
        assert 'lighting_profile' in result
        assert 'distortion_matrix' in result
        assert 'timestamp' in result
        
        # Check if calibration data is stored
        assert 'visual_camera_001' in self.calibration.calibration_data
    
    def test_spectral_sensor_calibration(self):
        """Test spectral sensor calibration"""
        # Create mock reference spectra
        reference_spectra = [
            SpectralData(
                wavelengths=list(range(400, 2000, 10)),
                intensities=[0.5 + 0.1 * np.sin(i * 0.1) for i in range(160)],
                spectrum_type="NIR",
                resolution=10.0,
                integration_time=1.0
            ) for _ in range(3)
        ]
        
        # Test calibration
        result = self.calibration.calibrate_spectral_sensor("nir_001", reference_spectra)
        
        # Assertions
        assert result['status'] == 'calibrated'
        assert 'wavelength_correction' in result
        assert 'intensity_correction' in result
        assert 'baseline_profile' in result
        
        # Check if calibration data is stored
        assert 'spectral_nir_001' in self.calibration.calibration_data
    
    def test_weight_sensor_calibration(self):
        """Test weight sensor calibration"""
        reference_weights = [10.0, 50.0, 100.0, 250.0, 500.0]
        
        # Test calibration
        result = self.calibration.calibrate_weight_sensor("scale_001", reference_weights)
        
        # Assertions
        assert result['status'] == 'calibrated'
        assert 'coefficients' in result
        assert 'accuracy' in result
        
        # Check if calibration data is stored
        assert 'weight_scale_001' in self.calibration.calibration_data
    
    def test_chemical_sensor_calibration(self):
        """Test chemical sensor calibration"""
        reference_materials = [
            ChemicalData(
                elements={'C': 45.0, 'H': 6.0, 'O': 44.0, 'N': 3.0, 'S': 2.0},
                compounds={'cellulose': 60.0, 'lignin': 25.0, 'protein': 15.0},
                ph_level=6.5,
                moisture_content=12.0,
                organic_content=85.0
            )
        ]
        
        # Test calibration
        result = self.calibration.calibrate_chemical_sensor("xrf_001", reference_materials)
        
        # Assertions
        assert result['status'] == 'calibrated'
        assert 'element_calibration' in result
        assert 'compound_calibration' in result
        
        # Check if calibration data is stored
        assert 'chemical_xrf_001' in self.calibration.calibration_data

class TestMultiModalSensorFusion:
    """Test multi-modal sensor fusion functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.fusion = MultiModalSensorFusion()
    
    @pytest.mark.asyncio
    async def test_visual_data_processing(self):
        """Test visual data processing"""
        # Mock image data
        image_data = b"mock_image_data"
        
        # Mock the visual classifier response
        mock_result = {
            'success': True,
            'classification': {
                'model_results': {
                    'general': {'all_predictions': [0.8, 0.1, 0.05, 0.05]},
                    'detailed': {'all_predictions': [
                        {'class': 'plastic_bottle', 'confidence': 0.9},
                        {'class': 'glass_bottle', 'confidence': 0.05}
                    ]},
                    'material': {'material_probabilities': {
                        'plastic': 0.85, 'glass': 0.1, 'metal': 0.05
                    }}
                }
            }
        }
        
        with patch.object(self.fusion.visual_classifier, 'classify_image', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = mock_result
            
            # Test processing
            features = await self.fusion._process_visual_data(image_data)
            
            # Assertions
            assert isinstance(features, np.ndarray)
            assert features.shape == (512,)
            assert features.dtype == np.float32
            
            # Check that classifier was called
            mock_classify.assert_called_once_with(image_data)
    
    @pytest.mark.asyncio
    async def test_spectral_data_processing(self):
        """Test spectral data processing"""
        spectral_data = SpectralData(
            wavelengths=list(range(400, 2000, 10)),
            intensities=[0.5 + 0.1 * np.sin(i * 0.1) for i in range(160)],
            spectrum_type="NIR",
            resolution=10.0,
            integration_time=1.0
        )
        
        # Test processing
        features = await self.fusion._process_spectral_data(spectral_data)
        
        # Assertions
        assert isinstance(features, np.ndarray)
        assert features.shape == (1000,)
        assert features.dtype == np.float32
        assert not np.isnan(features).any()
    
    @pytest.mark.asyncio
    async def test_weight_data_processing(self):
        """Test weight data processing"""
        weight_data = WeightData(
            weight=100.0,
            density=1.2,
            volume=83.3,
            distribution=[25.0, 25.0, 25.0, 25.0],
            stability=0.95
        )
        
        # Test processing
        features = await self.fusion._process_weight_data(weight_data)
        
        # Assertions
        assert isinstance(features, np.ndarray)
        assert features.shape == (10,)
        assert features.dtype == np.float32
        assert features[0] == 100.0  # weight
        assert features[1] == 1.2    # density
        assert features[2] == 83.3   # volume
        assert features[3] == 0.95   # stability
    
    @pytest.mark.asyncio
    async def test_chemical_data_processing(self):
        """Test chemical data processing"""
        chemical_data = ChemicalData(
            elements={'C': 45.0, 'H': 6.0, 'O': 44.0, 'N': 3.0, 'S': 2.0},
            compounds={'cellulose': 60.0, 'lignin': 25.0, 'protein': 15.0},
            ph_level=6.5,
            moisture_content=12.0,
            organic_content=85.0
        )
        
        # Test processing
        features = await self.fusion._process_chemical_data(chemical_data)
        
        # Assertions
        assert isinstance(features, np.ndarray)
        assert features.shape == (50,)
        assert features.dtype == np.float32
        assert features[0] == 45.0  # Carbon content
        assert features[1] == 6.0   # Hydrogen content
    
    @pytest.mark.asyncio
    async def test_multi_modal_processing_integration(self):
        """Test complete multi-modal processing pipeline"""
        # Create test data
        visual_data = b"test_image_data"
        spectral_data = SpectralData(
            wavelengths=list(range(400, 2000, 10)),
            intensities=[0.5] * 160,
            spectrum_type='NIR',
            resolution=10.0,
            integration_time=1.0
        )
        weight_data = WeightData(
            weight=100.0,
            density=1.2,
            volume=83.3,
            distribution=[25.0, 25.0, 25.0, 25.0],
            stability=0.95
        )
        chemical_data = ChemicalData(
            elements={'C': 45.0, 'H': 6.0, 'O': 44.0, 'N': 3.0, 'S': 2.0},
            compounds={'cellulose': 60.0, 'lignin': 25.0, 'protein': 15.0},
            ph_level=6.5,
            moisture_content=12.0,
            organic_content=85.0
        )
        
        # Mock visual classifier
        mock_visual_result = {
            'success': True,
            'classification': {
                'model_results': {
                    'general': {'all_predictions': [0.8, 0.1, 0.05, 0.05]},
                    'detailed': {'all_predictions': [
                        {'class': 'plastic_bottle', 'confidence': 0.9}
                    ]},
                    'material': {'material_probabilities': {'plastic': 0.85}}
                }
            }
        }
        
        with patch.object(self.fusion.visual_classifier, 'classify_image', new_callable=AsyncMock) as mock_classify:
            mock_classify.return_value = mock_visual_result
            
            # Test complete processing
            result = await self.fusion.process_multi_modal_data(
                visual_data, spectral_data, weight_data, chemical_data
            )
            
            # Assertions
            assert isinstance(result, FusionResult)
            assert result.classification is not None
            assert 0.0 <= result.confidence <= 1.0
            assert 0.0 <= result.contamination_level <= 1.0
            assert result.value_estimate >= 0.0
            assert result.carbon_footprint >= 0.0
            assert 0.0 <= result.quality_score <= 1.0
            assert len(result.processing_recommendations) > 0
            assert len(result.material_composition) > 0
            assert len(result.sensor_contributions) == 4
    
    def test_spectral_peak_detection(self):
        """Test spectral peak detection"""
        # Create test spectrum with known peaks
        intensities = np.array([0.1, 0.2, 0.8, 0.3, 0.1, 0.9, 0.2, 0.1])
        
        peaks = self.fusion._detect_spectral_peaks(intensities)
        
        # Should detect peaks at indices 2 and 5
        assert len(peaks) >= 2
        assert 0.8 in peaks
        assert 0.9 in peaks
    
    def test_spectral_moments_calculation(self):
        """Test spectral moments calculation"""
        intensities = np.array([0.1, 0.2, 0.3, 0.4, 0.5])
        
        moments = self.fusion._calculate_spectral_moments(intensities)
        
        # Should return 4 moments
        assert len(moments) == 4
        assert moments[0] == 0.3  # mean
        assert moments[1] == pytest.approx(0.02, rel=1e-2)  # variance
    
    def test_processing_recommendations_generation(self):
        """Test processing recommendations generation"""
        # Test different scenarios
        recommendations = self.fusion._generate_processing_recommendations(
            "plastic_bottle", 0.2, 25.0
        )
        assert "Direct recycling suitable" in recommendations
        
        recommendations = self.fusion._generate_processing_recommendations(
            "mixed_waste", 0.8, 5.0
        )
        assert "Pre-cleaning required" in recommendations
        assert "Advanced sorting required" in recommendations
        
        recommendations = self.fusion._generate_processing_recommendations(
            "hazardous_waste", 0.1, 100.0
        )
        assert "Hazardous waste protocols required" in recommendations
        assert "High-value recovery potential" in recommendations
    
    def test_material_composition_estimation(self):
        """Test material composition estimation"""
        spectral_features = np.random.rand(1000)
        chemical_features = np.random.rand(50)
        
        # Test plastic classification
        composition = self.fusion._estimate_material_composition(
            "plastic_bottle", spectral_features, chemical_features
        )
        assert "plastic" in composition
        assert composition["plastic"] > 0.5
        
        # Test glass classification
        composition = self.fusion._estimate_material_composition(
            "glass_bottle", spectral_features, chemical_features
        )
        assert "glass" in composition
        assert composition["glass"] > 0.5
    
    def test_carbon_footprint_calculation(self):
        """Test carbon footprint calculation"""
        # Test different waste types
        footprint = self.fusion._calculate_carbon_footprint("plastic_bottle", 1.0)
        assert footprint == 2.5
        
        footprint = self.fusion._calculate_carbon_footprint("aluminum_can", 1.0)
        assert footprint == 8.0
        
        footprint = self.fusion._calculate_carbon_footprint("organic_waste", 2.0)
        assert footprint == 1.0  # 0.5 * 2.0

class TestAPIFunctions:
    """Test API functions"""
    
    @pytest.mark.asyncio
    async def test_analyze_multi_modal_waste_api(self):
        """Test the main API function"""
        # Create test data
        visual_data = b"test_image_data"
        spectral_data = {
            'wavelengths': list(range(400, 2000, 10)),
            'intensities': [0.5] * 160,
            'spectrum_type': 'NIR',
            'resolution': 10.0,
            'integration_time': 1.0
        }
        weight_data = {
            'weight': 100.0,
            'density': 1.2,
            'volume': 83.3,
            'distribution': [25.0, 25.0, 25.0, 25.0],
            'stability': 0.95
        }
        chemical_data = {
            'elements': {'C': 45.0, 'H': 6.0, 'O': 44.0, 'N': 3.0, 'S': 2.0},
            'compounds': {'cellulose': 60.0, 'lignin': 25.0, 'protein': 15.0},
            'ph_level': 6.5,
            'moisture_content': 12.0,
            'organic_content': 85.0
        }
        
        # Mock the fusion system
        with patch('ai_services.multi_modal_sensor_fusion.multi_modal_fusion') as mock_fusion:
            mock_result = FusionResult(
                classification="plastic_bottle",
                confidence=0.95,
                material_composition={"plastic": 0.9, "other": 0.1},
                contamination_level=0.1,
                processing_recommendations=["Direct recycling suitable"],
                value_estimate=25.0,
                carbon_footprint=2.5,
                sensor_contributions={
                    SensorType.VISUAL: 0.4,
                    SensorType.SPECTRAL: 0.3,
                    SensorType.WEIGHT: 0.1,
                    SensorType.CHEMICAL: 0.2
                },
                quality_score=0.9
            )
            
            mock_fusion.process_multi_modal_data = AsyncMock(return_value=mock_result)
            
            # Test API function
            result = await analyze_multi_modal_waste(
                visual_data, spectral_data, weight_data, chemical_data
            )
            
            # Assertions
            assert 'classification' in result
            assert 'confidence' in result
            assert 'material_composition' in result
            assert 'contamination_level' in result
            assert 'processing_recommendations' in result
            assert 'value_estimate' in result
            assert 'carbon_footprint' in result
            assert 'sensor_contributions' in result
            assert 'quality_score' in result
            assert 'timestamp' in result
            
            assert result['classification'] == "plastic_bottle"
            assert result['confidence'] == 0.95
            assert result['quality_score'] == 0.9
    
    @pytest.mark.asyncio
    async def test_analyze_multi_modal_waste_api_error_handling(self):
        """Test API function error handling"""
        # Test with invalid data
        result = await analyze_multi_modal_waste(
            b"invalid", {}, {}, {}
        )
        
        # Should return error response
        assert 'error' in result
        assert 'timestamp' in result

class TestDataClasses:
    """Test data classes and enums"""
    
    def test_sensor_type_enum(self):
        """Test SensorType enum"""
        assert SensorType.VISUAL.value == "visual"
        assert SensorType.SPECTRAL.value == "spectral"
        assert SensorType.WEIGHT.value == "weight"
        assert SensorType.CHEMICAL.value == "chemical"
    
    def test_spectral_data_creation(self):
        """Test SpectralData dataclass"""
        data = SpectralData(
            wavelengths=[400, 500, 600],
            intensities=[0.1, 0.5, 0.3],
            spectrum_type="NIR",
            resolution=10.0,
            integration_time=1.0
        )
        
        assert data.wavelengths == [400, 500, 600]
        assert data.intensities == [0.1, 0.5, 0.3]
        assert data.spectrum_type == "NIR"
        assert data.resolution == 10.0
        assert data.integration_time == 1.0
    
    def test_weight_data_creation(self):
        """Test WeightData dataclass"""
        data = WeightData(
            weight=100.0,
            density=1.2,
            volume=83.3,
            distribution=[25.0, 25.0, 25.0, 25.0],
            stability=0.95
        )
        
        assert data.weight == 100.0
        assert data.density == 1.2
        assert data.volume == 83.3
        assert data.distribution == [25.0, 25.0, 25.0, 25.0]
        assert data.stability == 0.95
    
    def test_chemical_data_creation(self):
        """Test ChemicalData dataclass"""
        data = ChemicalData(
            elements={'C': 45.0, 'H': 6.0},
            compounds={'cellulose': 60.0},
            ph_level=6.5,
            moisture_content=12.0,
            organic_content=85.0
        )
        
        assert data.elements == {'C': 45.0, 'H': 6.0}
        assert data.compounds == {'cellulose': 60.0}
        assert data.ph_level == 6.5
        assert data.moisture_content == 12.0
        assert data.organic_content == 85.0
    
    def test_fusion_result_creation(self):
        """Test FusionResult dataclass"""
        result = FusionResult(
            classification="plastic_bottle",
            confidence=0.95,
            material_composition={"plastic": 0.9},
            contamination_level=0.1,
            processing_recommendations=["Direct recycling"],
            value_estimate=25.0,
            carbon_footprint=2.5,
            sensor_contributions={SensorType.VISUAL: 0.4},
            quality_score=0.9
        )
        
        assert result.classification == "plastic_bottle"
        assert result.confidence == 0.95
        assert result.material_composition == {"plastic": 0.9}
        assert result.contamination_level == 0.1
        assert result.processing_recommendations == ["Direct recycling"]
        assert result.value_estimate == 25.0
        assert result.carbon_footprint == 2.5
        assert result.sensor_contributions == {SensorType.VISUAL: 0.4}
        assert result.quality_score == 0.9

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])