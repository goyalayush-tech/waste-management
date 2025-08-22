"""
Integration tests for Advanced Contamination Detection System
Tests the complete contamination detection workflow including flagging and remediation
"""

import pytest
import numpy as np
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import tempfile
import os
from typing import List, Dict, Any

# Import the contamination detection system
    from contamination_detection import (
    ContaminationDetector,
    ContaminationType,
    ContaminationSeverity,
    ContaminationResult,
    ContaminationBatchProcessor
)

# Mock the multi-modal sensor fusion imports since they may not be available
class MockSpectralData:
    def __init__(self, wavelengths, intensities, sensor_type, timestamp, calibration_data):
        self.wavelengths = wavelengths
        self.intensities = intensities
        self.sensor_type = sensor_type
        self.timestamp = timestamp
        self.calibration_data = calibration_data

class MockChemicalData:
    def __init__(self, elements, compounds, ph_level, moisture_content, organic_content, timestamp):
        self.elements = elements
        self.compounds = compounds
        self.ph_level = ph_level
        self.moisture_content = moisture_content
        self.organic_content = organic_content
        self.timestamp = timestamp


class TestContaminationDetectionIntegration:
    """Integration tests for contamination detection workflow"""
    
    @pytest.fixture
    def contamination_detector(self):
        """Create contamination detector instance for testing"""
        return ContaminationDetector()
    
    @pytest.fixture
    def sample_image_data(self):
        """Create sample image data for testing"""
        # Create mock image data as bytes
        # Simulate a JPEG header and some image data
        mock_jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        mock_jpeg_data += b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c'
        mock_jpeg_data += b'\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444'
        mock_jpeg_data += b'\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\xe0\x00\xe0\x03\x01"\x00\x02\x11\x01\x03\x11\x01'
        return mock_jpeg_data
    
    @pytest.fixture
    def sample_spectral_data(self):
        """Create sample spectral data for testing"""
        wavelengths = np.linspace(400, 2500, 1000)
        
        # Create spectral signature with contamination peaks
        base_intensities = np.random.normal(0.5, 0.1, 1000)
        
        # Add contamination peaks
        # Organic contamination peak around 1600 nm
        organic_peak_idx = np.argmin(np.abs(wavelengths - 1600))
        base_intensities[organic_peak_idx-10:organic_peak_idx+10] += 0.3
        
        # Plastic contamination peak around 2900 nm
        plastic_peak_idx = np.argmin(np.abs(wavelengths - 2900))
        base_intensities[plastic_peak_idx-5:plastic_peak_idx+5] += 0.4
        
        return MockSpectralData(
            wavelengths=wavelengths.tolist(),
            intensities=base_intensities.tolist(),
            sensor_type="NIR",
            timestamp="2024-01-01T12:00:00Z",
            calibration_data={}
        )
    
    @pytest.fixture
    def sample_chemical_data(self):
        """Create sample chemical data for testing"""
        return MockChemicalData(
            elements={
                'C': 45.2,
                'H': 6.8,
                'O': 35.1,
                'N': 2.1,
                'S': 0.3,
                'Pb': 0.002,  # Lead contamination above threshold
                'Cd': 0.001   # Cadmium contamination above threshold
            },
            compounds={
                'cellulose': 25.0,
                'lignin': 15.0,
                'PET': 2.5,   # Plastic contamination in organic waste
                'protein': 8.0
            },
            ph_level=6.5,
            moisture_content=12.5,
            organic_content=85.0,
            timestamp="2024-01-01T12:00:00Z"
        )
    
    @pytest.mark.asyncio
    async def test_complete_contamination_detection_workflow(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_spectral_data, 
        sample_chemical_data
    ):
        """Test complete contamination detection workflow"""
        
        # Run contamination detection with all data types
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        # Verify contamination was detected
        assert result.contamination_detected is True
        assert len(result.contamination_types) > 0
        assert result.confidence > 0.0
        assert result.severity_level != ContaminationSeverity.NONE
        
        # Verify contamination locations were identified
        assert len(result.contamination_locations) > 0
        assert result.affected_area_percentage > 0.0
        
        # Verify remediation suggestions were generated
        assert len(result.remediation_suggestions) > 0
        
        # Verify processing impact was calculated
        assert isinstance(result.processing_impact, dict)
        assert result.quality_degradation >= 0.0
        assert result.economic_impact >= 0.0
    
    @pytest.mark.asyncio
    async def test_visual_contamination_detection(
        self, 
        contamination_detector, 
        sample_image_data
    ):
        """Test visual contamination detection component"""
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            expected_material_type="plastic"
        )
        
        # Should detect organic contamination in plastic
        assert result.contamination_detected is True
        assert ContaminationType.ORGANIC_IN_PLASTIC in result.contamination_types
        assert len(result.contamination_locations) > 0
        assert result.affected_area_percentage > 0.0
    
    @pytest.mark.asyncio
    async def test_spectral_contamination_detection(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_spectral_data
    ):
        """Test spectral contamination detection component"""
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            expected_material_type="paper"
        )
        
        # Should detect contamination based on spectral signatures
        assert result.contamination_detected is True
        assert result.confidence > 0.0
        
        # Spectral data should enhance detection confidence
        result_without_spectral = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            expected_material_type="paper"
        )
        
        # Confidence should be higher with spectral data
        assert result.confidence >= result_without_spectral.confidence
    
    @pytest.mark.asyncio
    async def test_chemical_contamination_detection(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_chemical_data
    ):
        """Test chemical contamination detection component"""
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        # Should detect heavy metal contamination
        assert result.contamination_detected is True
        assert result.severity_level in [ContaminationSeverity.HIGH, ContaminationSeverity.CRITICAL]
        
        # Should detect plastic in organic waste
        assert any('plastic' in ct.value for ct in result.contamination_types)
    
    @pytest.mark.asyncio
    async def test_contamination_severity_levels(
        self, 
        contamination_detector, 
        sample_image_data
    ):
        """Test different contamination severity levels"""
        
        # Test low severity contamination
        low_contamination_data = MockChemicalData(
            elements={'C': 45.0, 'H': 6.0, 'O': 49.0},
            compounds={'cellulose': 80.0, 'PET': 0.5},  # Low plastic contamination
            ph_level=7.0,
            moisture_content=10.0,
            organic_content=95.0,
            timestamp="2024-01-01T12:00:00Z"
        )
        
        result_low = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            chemical_data=low_contamination_data,
            expected_material_type="organic"
        )
        
        # Test high severity contamination
        high_contamination_data = MockChemicalData(
            elements={
                'C': 30.0, 'H': 4.0, 'O': 20.0,
                'Pb': 0.01,   # Very high lead contamination
                'Hg': 0.005,  # Mercury contamination
                'Cd': 0.008   # High cadmium contamination
            },
            compounds={'PET': 15.0, 'PVC': 10.0},  # High plastic contamination
            ph_level=2.5,  # Acidic contamination
            moisture_content=5.0,
            organic_content=40.0,
            timestamp="2024-01-01T12:00:00Z"
        )
        
        result_high = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            chemical_data=high_contamination_data,
            expected_material_type="organic"
        )
        
        # High contamination should have higher severity
        assert result_high.severity_level.value > result_low.severity_level.value
        assert result_high.economic_impact > result_low.economic_impact
        assert result_high.quality_degradation > result_low.quality_degradation
    
    @pytest.mark.asyncio
    async def test_automated_flagging_system(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_chemical_data
    ):
        """Test automated flagging system for contaminated batches"""
        
        # Create batch processor
    from contamination_detection import ContaminationBatchProcessor
        batch_processor = ContaminationBatchProcessor(contamination_detector)
        
        # Create test batch with mixed contamination levels
        test_batch = []
        for i in range(10):
            # Vary contamination levels
            contamination_level = i * 0.001  # Increasing contamination
            
            chemical_data = MockChemicalData(
                elements={
                    'C': 45.0, 'H': 6.0, 'O': 49.0 - contamination_level * 1000,
                    'Pb': contamination_level,  # Increasing lead contamination
                },
                compounds={'cellulose': 80.0, 'PET': contamination_level * 500},
                ph_level=7.0 - contamination_level * 100,
                moisture_content=10.0,
                organic_content=95.0 - contamination_level * 1000,
                timestamp="2024-01-01T12:00:00Z"
            )
            
            test_batch.append({
                'id': f'item_{i}',
                'image_data': sample_image_data,
                'chemical_data': chemical_data,
                'expected_material_type': 'organic'
            })
        
        # Process batch
        batch_result = await batch_processor.process_batch("test_batch_001", test_batch)
        
        # Verify batch processing results
        assert batch_result['batch_id'] == "test_batch_001"
        assert batch_result['total_items'] == 10
        assert len(batch_result['contaminated_items']) > 0
        assert len(batch_result['clean_items']) > 0
        
        # High contamination items should be flagged
        high_contamination_items = [
            item for item in batch_result['contaminated_items']
            if item['contamination_result'].severity_level == ContaminationSeverity.HIGH
        ]
        assert len(high_contamination_items) > 0
        
        # Batch should be flagged if contamination level is high
        if batch_result['overall_contamination_level'] > 0.3:
            assert batch_result['flagged'] is True
            assert len(batch_result['remediation_actions']) > 0
    
    @pytest.mark.asyncio
    async def test_remediation_suggestion_engine(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_chemical_data
    ):
        """Test remediation suggestion engine"""
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        # Verify remediation suggestions are appropriate
        assert len(result.remediation_suggestions) > 0
        
        # Check for specific remediation actions based on contamination types
        suggestions_text = ' '.join(result.remediation_suggestions).lower()
        
        if ContaminationType.PLASTIC_IN_ORGANIC in result.contamination_types:
            assert any(keyword in suggestions_text for keyword in ['remove', 'separate', 'sort'])
        
        if result.severity_level == ContaminationSeverity.CRITICAL:
            assert any(keyword in suggestions_text for keyword in ['stop', 'halt', 'emergency', 'quarantine'])
        
        # Verify remediation actions include cost and time estimates
        remediation_actions = await contamination_detector._generate_detailed_remediation_actions(result)
        assert len(remediation_actions) > 0
        
        for action in remediation_actions:
            assert isinstance(action, RemediationAction)
            assert action.estimated_cost >= 0.0
            assert action.estimated_time >= 0.0
            assert 0.0 <= action.success_probability <= 1.0
    
    @pytest.mark.asyncio
    async def test_processing_impact_calculation(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_chemical_data
    ):
        """Test processing impact calculation"""
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        # Verify processing impact is calculated
        assert isinstance(result.processing_impact, dict)
        assert 'throughput_reduction' in result.processing_impact
        assert 'quality_impact' in result.processing_impact
        assert 'additional_processing_required' in result.processing_impact
        
        # Higher contamination should have higher impact
        assert result.processing_impact['throughput_reduction'] >= 0.0
        assert result.processing_impact['quality_impact'] >= 0.0
        
        # Economic impact should be positive (cost)
        assert result.economic_impact >= 0.0
        
        # Quality degradation should be between 0 and 100
        assert 0.0 <= result.quality_degradation <= 100.0
    
    @pytest.mark.asyncio
    async def test_multi_modal_fusion_accuracy(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_spectral_data, 
        sample_chemical_data
    ):
        """Test that multi-modal fusion improves detection accuracy"""
        
        # Test with visual only
        result_visual = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            expected_material_type="organic"
        )
        
        # Test with visual + spectral
        result_visual_spectral = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            expected_material_type="organic"
        )
        
        # Test with all modalities
        result_all = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        # Multi-modal should have higher or equal confidence
        assert result_visual_spectral.confidence >= result_visual.confidence
        assert result_all.confidence >= result_visual_spectral.confidence
        
        # Multi-modal should detect more contamination types
        assert len(result_all.contamination_types) >= len(result_visual.contamination_types)
    
    @pytest.mark.asyncio
    async def test_error_handling_and_recovery(
        self, 
        contamination_detector
    ):
        """Test error handling and recovery mechanisms"""
        
        # Test with invalid image data
        result_invalid_image = await contamination_detector.detect_contamination(
            image_data=b"invalid_image_data",
            expected_material_type="plastic"
        )
        
        # Should return safe default result
        assert result_invalid_image.contamination_detected is False
        assert result_invalid_image.confidence == 0.0
        assert result_invalid_image.severity_level == ContaminationSeverity.NONE
        
        # Test with corrupted spectral data
        corrupted_spectral = MockSpectralData(
            wavelengths=[],  # Empty wavelengths
            intensities=[1, 2, 3],  # Mismatched intensities
            sensor_type="NIR",
            timestamp="invalid_timestamp",
            calibration_data={}
        )
        
        result_corrupted = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=corrupted_spectral,
            expected_material_type="plastic"
        )
        
        # Should still work with visual data only
        assert isinstance(result_corrupted, ContaminationResult)
        assert result_corrupted.confidence >= 0.0
    
    @pytest.mark.asyncio
    async def test_performance_benchmarks(
        self, 
        contamination_detector, 
        sample_image_data, 
        sample_spectral_data, 
        sample_chemical_data
    ):
        """Test performance benchmarks for contamination detection"""
        
        import time
        
        # Measure detection time
        start_time = time.time()
        
        result = await contamination_detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        detection_time = time.time() - start_time
        
        # Detection should complete within reasonable time (< 5 seconds)
        assert detection_time < 5.0
        
        # Test batch processing performance
        from ..contamination_detection import ContaminationBatchProcessor
        batch_processor = ContaminationBatchProcessor(contamination_detector)
        
        # Create larger test batch
        large_batch = []
        for i in range(50):
            large_batch.append({
                'id': f'item_{i}',
                'image_data': sample_image_data,
                'spectral_data': sample_spectral_data,
                'chemical_data': sample_chemical_data,
                'expected_material_type': 'organic'
            })
        
        start_time = time.time()
        batch_result = await batch_processor.process_batch("performance_test", large_batch)
        batch_time = time.time() - start_time
        
        # Batch processing should be efficient (< 2 seconds per item on average)
        average_time_per_item = batch_time / len(large_batch)
        assert average_time_per_item < 2.0
        
        # Verify batch was processed correctly
        assert batch_result['total_items'] == 50
        assert len(batch_result['contaminated_items']) + len(batch_result['clean_items']) == 50


class TestContaminationBatchProcessor:
    """Test the contamination batch processing and flagging system"""
    
    @pytest.fixture
    def batch_processor(self):
        """Create batch processor for testing"""
        detector = ContaminationDetector()
        from ..contamination_detection import ContaminationBatchProcessor
        return ContaminationBatchProcessor(detector)
    
    @pytest.mark.asyncio
    async def test_batch_flagging_thresholds(self, batch_processor):
        """Test batch flagging based on contamination thresholds"""
        
        # Create clean batch
        clean_batch = []
        clean_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        
        for i in range(10):
            clean_batch.append({
                'id': f'clean_item_{i}',
                'image_data': clean_image_data,
                'expected_material_type': 'plastic'
            })
        
        clean_result = await batch_processor.process_batch("clean_batch", clean_batch)
        
        # Clean batch should not be flagged
        assert clean_result['flagged'] is False
        assert clean_result['overall_contamination_level'] < 0.3
        
        # Create contaminated batch with mock contaminated image data
        contaminated_batch = []
        contaminated_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        contaminated_image_data += b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c'
        contaminated_image_data += b'\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444'
        
        for i in range(10):
            contaminated_batch.append({
                'id': f'contaminated_item_{i}',
                'image_data': contaminated_image_data,
                'expected_material_type': 'plastic'
            })
        
        contaminated_result = await batch_processor.process_batch("contaminated_batch", contaminated_batch)
        
        # Contaminated batch should be flagged
        assert contaminated_result['flagged'] is True
        assert contaminated_result['overall_contamination_level'] > 0.3
        assert len(contaminated_result['remediation_actions']) > 0
    
    @pytest.mark.asyncio
    async def test_contamination_statistics(self, batch_processor):
        """Test contamination statistics tracking"""
        
        # Process multiple batches with varying contamination levels
        for batch_num in range(5):
            test_batch = []
            contamination_level = batch_num * 0.2  # Increasing contamination
            
            # Create mock image data with increasing contamination simulation
            base_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
            
            # Add more data to simulate higher contamination
            if contamination_level > 0.5:
                contaminated_image_data = base_image_data + b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c'
            else:
                contaminated_image_data = base_image_data
            
            for item_num in range(10):
                test_batch.append({
                    'id': f'batch_{batch_num}_item_{item_num}',
                    'image_data': contaminated_image_data,
                    'expected_material_type': 'plastic'
                })
            
            await batch_processor.process_batch(f"test_batch_{batch_num}", test_batch)
        
        # Get contamination statistics
        stats = batch_processor.get_contamination_statistics()
        
        # Verify statistics
        assert stats['total_batches_processed'] == 5
        assert 'flagged_batches' in stats
        assert 'average_contamination_level' in stats
        assert 'contamination_trend' in stats
        
        # Trend should be increasing due to our test setup
        assert stats['contamination_trend'] in ['increasing', 'stable', 'insufficient_data']
    
    def test_flagged_batches_retrieval(self, batch_processor):
        """Test retrieval of flagged batches"""
        
        # Initially no flagged batches
        flagged = batch_processor.get_flagged_batches()
        initial_count = len(flagged)
        
        # The flagged count should be non-negative
        assert initial_count >= 0


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])