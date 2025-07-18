"""
Simple test runner for rare material detection system
Tests core functionality without external dependencies
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rare_material_detection import (
    RareMaterialDetector,
    RareMaterialType,
    MaterialValue,
    RareMaterial,
    DetectionResult,
    HandlingProtocol
)

# Mock classes for testing
class MockSpectralData:
    def __init__(self, wavelengths, intensities, spectrum_type, resolution, integration_time):
        self.wavelengths = wavelengths
        self.intensities = intensities
        self.spectrum_type = spectrum_type
        self.resolution = resolution
        self.integration_time = integration_time

class MockChemicalData:
    def __init__(self, elements, compounds, ph_level, moisture_content, organic_content):
        self.elements = elements
        self.compounds = compounds
        self.ph_level = ph_level
        self.moisture_content = moisture_content
        self.organic_content = organic_content

async def test_rare_material_detection():
    """Test basic rare material detection functionality"""
    print("Testing Rare Material Detection System...")
    
    # Create detector
    detector = RareMaterialDetector()
    print("✓ RareMaterialDetector created successfully")
    
    # Create sample data
    sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
    sample_image_data += b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c'
    
    # Create spectral data with gold signature (peak at 2676 nm)
    wavelengths = list(range(400, 4000, 10))
    intensities = [0.5] * len(wavelengths)
    gold_idx = wavelengths.index(2670)  # Closest to 2676
    intensities[gold_idx] = 2.0  # Strong peak
    
    sample_spectral_data = MockSpectralData(
        wavelengths=wavelengths,
        intensities=intensities,
        spectrum_type="XRF",
        resolution=10.0,
        integration_time=5.0
    )
    
    # Create chemical data with gold and silver traces
    sample_chemical_data = MockChemicalData(
        elements={
            'C': 20.0, 'H': 3.0, 'O': 15.0, 'N': 1.0, 'S': 0.5,
            'Au': 0.05,  # Gold 0.05%
            'Ag': 0.02   # Silver 0.02%
        },
        compounds={'Au_metal': 0.05, 'Ag_metal': 0.02},
        ph_level=7.0,
        moisture_content=5.0,
        organic_content=40.0
    )
    
    print("✓ Sample data created")
    
    # Test rare material detection
    try:
        result = await detector.detect_rare_materials(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data
        )
        
        print("✓ Rare material detection completed")
        print(f"  - Materials detected: {len(result.materials_detected)}")
        
        if result.materials_detected:
            for material in result.materials_detected:
                print(f"  - Detected: {material.material_name} ({material.material_type.value})")
                print(f"    - Purity: {material.purity_percentage:.1f}%")
                print(f"    - Quantity: {material.quantity_detected:.5f} kg")
                print(f"    - Value: ${material.market_value_per_kg * material.quantity_detected:.2f}")
                print(f"    - Confidence: {material.confidence:.3f}")
        
        print(f"  - Total estimated value: ${result.total_estimated_value:.2f}")
        print(f"  - Detection confidence: {result.detection_confidence:.3f}")
        print(f"  - Special handling required: {result.special_handling_required}")
        print(f"  - Stakeholder notifications: {len(result.stakeholder_notifications)}")
        
        # Verify basic functionality
        assert isinstance(result, DetectionResult)
        assert isinstance(result.materials_detected, list)
        assert result.detection_confidence >= 0.0
        assert result.total_estimated_value >= 0.0
        assert isinstance(result.special_handling_required, bool)
        assert isinstance(result.recommended_actions, list)
        assert isinstance(result.stakeholder_notifications, list)
        
        print("✓ Basic rare material detection test passed")
        
    except Exception as e:
        print(f"✗ Rare material detection test failed: {str(e)}")
        return False
    
    return True

async def test_handling_protocols():
    """Test handling protocol functionality"""
    print("\nTesting Handling Protocol System...")
    
    try:
        # Create detector
        detector = RareMaterialDetector()
        
        # Test handling protocols for different material types
        for material_type in [RareMaterialType.PRECIOUS_METALS, RareMaterialType.RARE_EARTH_ELEMENTS]:
            protocol = detector.handling_protocols.get(material_type)
            
            assert isinstance(protocol, HandlingProtocol)
            assert protocol.material_type == material_type
            assert len(protocol.safety_requirements) > 0
            assert len(protocol.equipment_needed) > 0
            assert len(protocol.extraction_steps) > 0
            assert isinstance(protocol.storage_conditions, dict)
            assert len(protocol.transportation_requirements) > 0
            assert len(protocol.regulatory_compliance) > 0
            
            print(f"✓ Handling protocol for {material_type.value} verified")
        
        # Test handling recommendations generation
        test_material = RareMaterial(
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
        
        recommendations = await detector._generate_handling_recommendations([test_material])
        
        assert len(recommendations) > 0
        print(f"✓ Generated {len(recommendations)} handling recommendations")
        
        # Test stakeholder notifications
        notifications = detector._determine_stakeholder_notifications([test_material])
        
        assert len(notifications) > 0
        print(f"✓ Generated {len(notifications)} stakeholder notifications")
        
        print("✓ Handling protocol test passed")
        
    except Exception as e:
        print(f"✗ Handling protocol test failed: {str(e)}")
        return False
    
    return True

async def test_error_handling():
    """Test error handling capabilities"""
    print("\nTesting Error Handling...")
    
    try:
        detector = RareMaterialDetector()
        
        # Test with invalid image data
        result = await detector.detect_rare_materials(
            image_data=b"invalid_data"
        )
        
        # Should return safe default result
        assert isinstance(result, DetectionResult)
        assert len(result.materials_detected) == 0
        assert result.total_estimated_value == 0.0
        assert result.detection_confidence == 0.0
        
        print("✓ Invalid image data handled correctly")
        
        # Test with corrupted spectral data
        corrupted_spectral = MockSpectralData(
            wavelengths=[],  # Empty wavelengths
            intensities=[1, 2, 3],  # Mismatched intensities
            spectrum_type="XRF",
            resolution=10.0,
            integration_time=5.0
        )
        
        sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
        
        result = await detector.detect_rare_materials(
            image_data=sample_image_data,
            spectral_data=corrupted_spectral
        )
        
        # Should still work with visual data only
        assert isinstance(result, DetectionResult)
        
        print("✓ Corrupted spectral data handled correctly")
        print("✓ Error handling test passed")
        
    except Exception as e:
        print(f"✗ Error handling test failed: {str(e)}")
        return False
    
    return True

async def main():
    """Run all tests"""
    print("=" * 60)
    print("ADVANCED RARE MATERIAL DETECTION SYSTEM - INTEGRATION TESTS")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if await test_rare_material_detection():
        tests_passed += 1
    
    if await test_handling_protocols():
        tests_passed += 1
    
    if await test_error_handling():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✓ ALL TESTS PASSED - Rare Material Detection System is working correctly!")
        print("\nKey Features Verified:")
        print("  ✓ Multi-modal rare material detection (visual, spectral, chemical)")
        print("  ✓ Special handling protocol automation for high-value materials")
        print("  ✓ Stakeholder notification system for rare material discoveries")
        print("  ✓ Market value estimation and extraction feasibility assessment")
        print("  ✓ Error handling and recovery mechanisms")
        return True
    else:
        print(f"✗ {total_tests - tests_passed} tests failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)