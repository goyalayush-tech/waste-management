"""
Tests for the Enhanced AI/ML Multi-Modal Analysis System
"""

import pytest
import asyncio
import numpy as np
from unittest.mock import MagicMock, patch
import os
import sys
from datetime import datetime

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the system under test
from enhanced_ai_ml_system import (
    EnhancedAIMLSystem, EnhancedAnalysisResult,
    SensorType, SpectralData, WeightData, ChemicalData,
    ProcessingStage, OptimizationObjective
)

# Import mocked dependencies
from multi_modal_sensor_fusion import FusionResult
from contamination_detection import ContaminationResult, ContaminationSeverity
from rare_material_detection import DetectionResult as RareDetectionResult
from dynamic_parameter_optimization import OptimizationResult, ProcessingParameters

class TestEnhancedAIMLSystem:
    """Test suite for the Enhanced AI/ML Multi-Modal Analysis System"""
    
    @pytest.fixture
    def enhanced_system(self):
        """Create an instance of the system with mocked dependencies"""
        system = EnhancedAIMLSystem()
        
        # Mock the subsystems
        system.sensor_fusion = MagicMock()
        system.contamination_detector = MagicMock()
        system.rare_material_detector = MagicMock()
        system.parameter_optimizer = MagicMock()
        
        return system
    
    @pytest.fixture
    def sample_image_data(self):
        """Sample image data for testing"""
        return b'sample_image_data'
    
    @pytest.fixture
    def sample_spectral_data(self):
        """Sample spectral data for testing"""
        return SpectralData(
            wavelengths=[i for i in range(400, 2500)],
            intensities=[0.5 + 0.5 * np.sin(i/100) for i in range(400, 2500)],
            spectrum_type="NIR",
            resolution=2.0,
            integration_time=0.1
        )
    
    @pytest.fixture
    def sample_weight_data(self):
        """Sample weight data for testing"""
        return WeightData(
            weight=1.25,
            density=0.8,
            volume=1.56,
            distribution=[1.2, 1.3, 1.25, 1.22, 1.28],
            stability=0.95
        )
    
    @pytest.fixture
    def sample_chemical_data(self):
        """Sample chemical data for testing"""
        return ChemicalData(
            elements={'C': 0.6, 'H': 0.1, 'O': 0.3},
            compounds={'PET': 0.9, 'additives': 0.1},
            ph_level=7.0,
            moisture_content=0.05,
            organic_content=0.02
        )
    
    @pytest.fixture
    def mock_fusion_result(self):
        """Mock fusion result for testing"""
        result = MagicMock(spec=FusionResult)
        result.classification = "plastic_pet"
        result.confidence = 0.95
        result.material_composition = {
            "plastic_pet": 0.92,
            "plastic_other": 0.05,
            "contaminants": 0.03
        }
        result.contamination_level = 0.03
        result.processing_recommendations = ["Standard PET recycling process"]
        result.value_estimate = 0.45
        result.carbon_footprint = 0.2
        result.quality_score = 0.92
        return result
    
    @pytest.fixture
    def mock_contamination_result(self):
        """Mock contamination result for testing"""
        result = MagicMock(spec=ContaminationResult)
        result.contamination_detected = True
        result.severity_level = ContaminationSeverity.LOW
        result.confidence = 0.85
        result.affected_area_percentage = 5.0
        result.remediation_suggestions = ["Wash before processing"]
        return result
    
    @pytest.fixture
    def mock_rare_material_result(self):
        """Mock rare material detection result for testing"""
        result = MagicMock(spec=RareDetectionResult)
        result.materials_detected = [MagicMock()]
        result.total_estimated_value = 1.25
        result.detection_confidence = 0.8
        result.recommended_actions = ["Separate for specialized processing"]
        return result
    
    @pytest.fixture
    def mock_optimization_result(self):
        """Mock parameter optimization result for testing"""
        result = MagicMock(spec=OptimizationResult)
        result.optimized_parameters = MagicMock(spec=ProcessingParameters)
        result.optimized_parameters.stage = ProcessingStage.SORTING
        result.expected_efficiency = 92.5
        result.parameter_changes = {
            "speed": (1.0, 1.5),
            "temperature": (25.0, 30.0)
        }
        return result
    
    @pytest.mark.asyncio
    async def test_analyze_waste_full_integration(
        self, enhanced_system, sample_image_data, sample_spectral_data,
        sample_weight_data, sample_chemical_data, mock_fusion_result,
        mock_contamination_result, mock_rare_material_result, mock_optimization_result
    ):
        """Test the analyze_waste method with all subsystems enabled"""
        # Set up mocks
        enhanced_system.sensor_fusion.process_multi_modal_data.return_value = mock_fusion_result
        enhanced_system.contamination_detector.detect_contamination.return_value = mock_contamination_result
        enhanced_system.rare_material_detector.detect_rare_materials.return_value = mock_rare_material_result
        enhanced_system.parameter_optimizer.optimize_parameters.return_value = mock_optimization_result
        
        # Call the method under test
        result = await enhanced_system.analyze_waste(
            visual_data=sample_image_data,
            spectral_data=sample_spectral_data,
            weight_data=sample_weight_data,
            chemical_data=sample_chemical_data,
            processing_stage=ProcessingStage.SORTING
        )
        
        # Verify the result
        assert isinstance(result, EnhancedAnalysisResult)
        assert result.material_classification == "plastic_pet"
        assert result.confidence == 0.95
        assert result.contamination_result == mock_contamination_result
        assert result.rare_material_result == mock_rare_material_result
        assert result.parameter_optimization == mock_optimization_result
        assert result.value_estimate == mock_fusion_result.value_estimate + mock_rare_material_result.total_estimated_value
        assert len(result.processing_recommendations) > 0
        assert len(result.sensor_types_used) == 4  # All sensor types used
        
        # Verify subsystem calls
        enhanced_system.sensor_fusion.process_multi_modal_data.assert_called_once()
        enhanced_system.contamination_detector.detect_contamination.assert_called_once()
        enhanced_system.rare_material_detector.detect_rare_materials.assert_called_once()
        enhanced_system.parameter_optimizer.optimize_parameters.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_analyze_waste_minimal_sensors(
        self, enhanced_system, sample_image_data, mock_fusion_result
    ):
        """Test analyze_waste with only visual data"""
        # Set up mocks
        enhanced_system.sensor_fusion.process_multi_modal_data.return_value = mock_fusion_result
        enhanced_system.contamination_detector.detect_contamination.return_value = None
        enhanced_system.rare_material_detector.detect_rare_materials.return_value = None
        
        # Call the method under test
        result = await enhanced_system.analyze_waste(
            visual_data=sample_image_data
        )
        
        # Verify the result
        assert isinstance(result, EnhancedAnalysisResult)
        assert result.material_classification == "plastic_pet"
        assert len(result.sensor_types_used) == 1  # Only visual sensor
        
        # Verify subsystem calls
        enhanced_system.sensor_fusion.process_multi_modal_data.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_analyze_waste_with_error(self, enhanced_system, sample_image_data):
        """Test analyze_waste error handling"""
        # Set up mock to raise an exception
        enhanced_system.sensor_fusion.process_multi_modal_data.side_effect = Exception("Test error")
        
        # Call the method under test
        result = await enhanced_system.analyze_waste(
            visual_data=sample_image_data
        )
        
        # Verify the result is a fallback result
        assert isinstance(result, EnhancedAnalysisResult)
        assert result.material_classification == "unknown"
        assert result.confidence == 0.0
        assert "manual inspection" in result.processing_recommendations[0]
    
    @pytest.mark.asyncio
    async def test_analyze_waste_disabled_subsystems(
        self, enhanced_system, sample_image_data, sample_spectral_data, mock_fusion_result
    ):
        """Test analyze_waste with disabled subsystems"""
        # Disable subsystems
        enhanced_system.enable_contamination_detection = False
        enhanced_system.enable_rare_material_detection = False
        enhanced_system.enable_parameter_optimization = False
        
        # Set up mocks
        enhanced_system.sensor_fusion.process_multi_modal_data.return_value = mock_fusion_result
        
        # Call the method under test
        result = await enhanced_system.analyze_waste(
            visual_data=sample_image_data,
            spectral_data=sample_spectral_data,
            processing_stage=ProcessingStage.SORTING
        )
        
        # Verify the result
        assert isinstance(result, EnhancedAnalysisResult)
        assert result.contamination_result is None
        assert result.rare_material_result is None
        assert result.parameter_optimization is None
        
        # Verify subsystem calls
        enhanced_system.sensor_fusion.process_multi_modal_data.assert_called_once()
        enhanced_system.contamination_detector.detect_contamination.assert_not_called()
        enhanced_system.rare_material_detector.detect_rare_materials.assert_not_called()
        enhanced_system.parameter_optimizer.optimize_parameters.assert_not_called()
    
    def test_configure_system(self, enhanced_system):
        """Test system configuration"""
        # Initial state
        assert enhanced_system.enable_contamination_detection is True
        assert enhanced_system.enable_rare_material_detection is True
        assert enhanced_system.enable_parameter_optimization is True
        
        # Configure system
        config = {
            'enable_contamination_detection': False,
            'enable_rare_material_detection': True,
            'enable_parameter_optimization': False
        }
        
        result = enhanced_system.configure_system(config)
        
        # Verify configuration applied
        assert enhanced_system.enable_contamination_detection is False
        assert enhanced_system.enable_rare_material_detection is True
        assert enhanced_system.enable_parameter_optimization is False
        assert result['status'] == 'success'
    
    @pytest.mark.asyncio
    async def test_get_system_status(self, enhanced_system):
        """Test getting system status"""
        status = await enhanced_system.get_system_status()
        
        assert status['system_name'] == 'Enhanced AI/ML Multi-Modal Analysis System'
        assert status['status'] == 'operational'
        assert 'subsystems' in status
        assert 'capabilities' in status
        assert 'timestamp' in status
    
    @pytest.mark.asyncio
    async def test_calibrate_sensors(self, enhanced_system, sample_image_data, sample_spectral_data):
        """Test sensor calibration"""
        result = await enhanced_system.calibrate_sensors(
            visual_reference=sample_image_data,
            spectral_reference=[sample_spectral_data]
        )
        
        assert result['status'] == 'success'
        assert 'calibration_results' in result
        assert 'visual' in result['calibration_results']
        assert 'spectral' in result['calibration_results']
    
    def test_generate_comprehensive_recommendations(
        self, enhanced_system, mock_fusion_result, mock_contamination_result,
        mock_rare_material_result, mock_optimization_result
    ):
        """Test recommendation generation"""
        recommendations = enhanced_system._generate_comprehensive_recommendations(
            fusion_result=mock_fusion_result,
            contamination_result=mock_contamination_result,
            rare_material_result=mock_rare_material_result,
            parameter_optimization=mock_optimization_result
        )
        
        assert len(recommendations) > 0
        assert any("Contamination detected" in rec for rec in recommendations)
        assert any("Valuable materials detected" in rec for rec in recommendations)
        assert any("Optimized parameters" in rec for rec in recommendations)
    
    def test_calculate_quality_score(
        self, enhanced_system, mock_fusion_result, mock_contamination_result,
        mock_rare_material_result
    ):
        """Test quality score calculation"""
        # Test with contamination
        quality = enhanced_system._calculate_quality_score(
            fusion_result=mock_fusion_result,
            contamination_result=mock_contamination_result,
            rare_material_result=mock_rare_material_result
        )
        
        assert 0 <= quality <= 1.0
        
        # Test without contamination
        mock_contamination_result.contamination_detected = False
        quality_no_contamination = enhanced_system._calculate_quality_score(
            fusion_result=mock_fusion_result,
            contamination_result=mock_contamination_result,
            rare_material_result=mock_rare_material_result
        )
        
        assert quality_no_contamination > quality


if __name__ == "__main__":
    pytest.main(["-xvs", __file__])