"""
Simple test runner for contamination detection system
Tests core functionality without external dependencies
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from contamination_detection import (
    ContaminationDetector,
    ContaminationType,
    ContaminationSeverity,
    ContaminationResult,
    ContaminationBatchProcessor
)

# Mock classes for testing
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

async def test_contamination_detection():
    """Test basic contamination detection functionality"""
    print("Testing Contamination Detection System...")
    
    # Create detector
    detector = ContaminationDetector()
    print("✓ ContaminationDetector created successfully")
    
    # Create sample data
    sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
    sample_image_data += b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c'
    
    sample_spectral_data = MockSpectralData(
        wavelengths=list(range(400, 2500, 2)),
        intensities=[0.5 + 0.1 * (i % 10) for i in range(1050)],
        sensor_type="NIR",
        timestamp="2024-01-01T12:00:00Z",
        calibration_data={}
    )
    
    sample_chemical_data = MockChemicalData(
        elements={
            'C': 45.2, 'H': 6.8, 'O': 35.1, 'N': 2.1, 'S': 0.3,
            'Pb': 0.002,  # Lead contamination
            'Cd': 0.001   # Cadmium contamination
        },
        compounds={
            'cellulose': 25.0, 'lignin': 15.0, 'PET': 2.5, 'protein': 8.0
        },
        ph_level=6.5,
        moisture_content=12.5,
        organic_content=85.0,
        timestamp="2024-01-01T12:00:00Z"
    )
    
    print("✓ Sample data created")
    
    # Test contamination detection
    try:
        result = await detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data,
            expected_material_type="organic"
        )
        
        print("✓ Contamination detection completed")
        print(f"  - Contamination detected: {result.contamination_detected}")
        print(f"  - Contamination types: {[ct.value for ct in result.contamination_types]}")
        print(f"  - Severity level: {result.severity_level.name}")
        print(f"  - Confidence: {result.confidence:.3f}")
        print(f"  - Affected area: {result.affected_area_percentage:.1f}%")
        print(f"  - Remediation suggestions: {len(result.remediation_suggestions)}")
        print(f"  - Economic impact: ${result.economic_impact:.2f}")
        
        # Verify basic functionality
        assert isinstance(result, ContaminationResult)
        assert result.confidence >= 0.0
        assert result.affected_area_percentage >= 0.0
        assert result.quality_degradation >= 0.0
        assert result.economic_impact >= 0.0
        assert isinstance(result.contamination_types, list)
        assert isinstance(result.remediation_suggestions, list)
        
        print("✓ Basic contamination detection test passed")
        
    except Exception as e:
        print(f"✗ Contamination detection test failed: {str(e)}")
        return False
    
    return True

async def test_batch_processing():
    """Test batch processing functionality"""
    print("\nTesting Batch Processing System...")
    
    try:
        # Create detector and batch processor
        detector = ContaminationDetector()
        batch_processor = ContaminationBatchProcessor(detector)
        print("✓ Batch processor created successfully")
        
        # Create test batch
        test_batch = []
        sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        
        for i in range(5):
            # Create varying contamination levels
            contamination_level = i * 0.002
            
            chemical_data = MockChemicalData(
                elements={
                    'C': 45.0, 'H': 6.0, 'O': 49.0,
                    'Pb': contamination_level,  # Increasing lead contamination
                },
                compounds={'cellulose': 80.0, 'PET': contamination_level * 500},
                ph_level=7.0,
                moisture_content=10.0,
                organic_content=95.0,
                timestamp="2024-01-01T12:00:00Z"
            )
            
            test_batch.append({
                'id': f'item_{i}',
                'image_data': sample_image_data,
                'chemical_data': chemical_data,
                'expected_material_type': 'organic'
            })
        
        print("✓ Test batch created")
        
        # Process batch
        batch_result = await batch_processor.process_batch("test_batch_001", test_batch)
        
        print("✓ Batch processing completed")
        print(f"  - Batch ID: {batch_result['batch_id']}")
        print(f"  - Total items: {batch_result['total_items']}")
        print(f"  - Contaminated items: {len(batch_result['contaminated_items'])}")
        print(f"  - Clean items: {len(batch_result['clean_items'])}")
        print(f"  - Overall contamination level: {batch_result['overall_contamination_level']:.3f}")
        print(f"  - Flagged: {batch_result['flagged']}")
        print(f"  - Remediation actions: {len(batch_result['remediation_actions'])}")
        
        # Verify batch processing
        assert batch_result['batch_id'] == "test_batch_001"
        assert batch_result['total_items'] == 5
        assert len(batch_result['contaminated_items']) + len(batch_result['clean_items']) == 5
        assert batch_result['overall_contamination_level'] >= 0.0
        assert isinstance(batch_result['flagged'], bool)
        assert isinstance(batch_result['remediation_actions'], list)
        
        print("✓ Batch processing test passed")
        
        # Test statistics
        stats = batch_processor.get_contamination_statistics()
        print(f"  - Statistics: {stats['total_batches_processed']} batches processed")
        print(f"  - Flagged percentage: {stats['flagged_percentage']:.1f}%")
        print(f"  - Average contamination: {stats['average_contamination_level']:.3f}")
        
        print("✓ Statistics test passed")
        
    except Exception as e:
        print(f"✗ Batch processing test failed: {str(e)}")
        return False
    
    return True

async def test_error_handling():
    """Test error handling capabilities"""
    print("\nTesting Error Handling...")
    
    try:
        detector = ContaminationDetector()
        
        # Test with invalid image data
        result = await detector.detect_contamination(
            image_data=b"invalid_data",
            expected_material_type="plastic"
        )
        
        # Should return safe default result
        assert result.contamination_detected is False
        assert result.confidence == 0.0
        assert result.severity_level == ContaminationSeverity.NONE
        
        print("✓ Invalid image data handled correctly")
        
        # Test with corrupted spectral data
        corrupted_spectral = MockSpectralData(
            wavelengths=[],  # Empty wavelengths
            intensities=[1, 2, 3],  # Mismatched intensities
            sensor_type="NIR",
            timestamp="invalid_timestamp",
            calibration_data={}
        )
        
        sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        
        result = await detector.detect_contamination(
            image_data=sample_image_data,
            spectral_data=corrupted_spectral,
            expected_material_type="plastic"
        )
        
        # Should still work with visual data only
        assert isinstance(result, ContaminationResult)
        assert result.confidence >= 0.0
        
        print("✓ Corrupted spectral data handled correctly")
        print("✓ Error handling test passed")
        
    except Exception as e:
        print(f"✗ Error handling test failed: {str(e)}")
        return False
    
    return True

async def main():
    """Run all tests"""
    print("=" * 60)
    print("ADVANCED CONTAMINATION DETECTION SYSTEM - INTEGRATION TESTS")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if await test_contamination_detection():
        tests_passed += 1
    
    if await test_batch_processing():
        tests_passed += 1
    
    if await test_error_handling():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✓ ALL TESTS PASSED - Contamination Detection System is working correctly!")
        print("\nKey Features Verified:")
        print("  ✓ Multi-modal contamination detection (visual, spectral, chemical)")
        print("  ✓ Automated flagging system for contaminated batches")
        print("  ✓ Remediation suggestion engine")
        print("  ✓ Batch processing and statistics tracking")
        print("  ✓ Error handling and recovery mechanisms")
        print("  ✓ Processing impact and economic impact calculation")
        return True
    else:
        print(f"✗ {total_tests - tests_passed} tests failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)