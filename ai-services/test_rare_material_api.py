"""
Test script for Rare Material API endpoints
"""

import asyncio
import sys
import os
import json
import base64
import requests
from typing import Dict, Any
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rare_material_detection import (
    RareMaterialDetector,
    RareMaterialType,
    MaterialValue,
    NotificationPriority
)
from rare_material_api import (
    detect_rare_materials_api,
    get_handling_protocol,
    send_stakeholder_notifications
)
from multi_modal_sensor_fusion import SpectralData, ChemicalData

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

async def test_api_detection():
    """Test rare material detection API"""
    print("Testing Rare Material Detection API...")
    
    # Create sample data
    sample_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
    sample_image_data += b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c'
    
    # Create spectral data with gold signature (peak at 2676 nm)
    wavelengths = list(range(400, 4000, 10))
    intensities = [0.5] * len(wavelengths)
    gold_idx = wavelengths.index(2670)  # Closest to 2676
    intensities[gold_idx] = 2.0  # Strong peak
    
    sample_spectral_data = SpectralData(
        wavelengths=wavelengths,
        intensities=intensities,
        spectrum_type="XRF",
        resolution=10.0,
        integration_time=5.0
    )
    
    # Create chemical data with gold and silver traces
    sample_chemical_data = ChemicalData(
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
    
    # Test API function
    try:
        result = await detect_rare_materials_api(
            image_data=sample_image_data,
            spectral_data=sample_spectral_data,
            chemical_data=sample_chemical_data
        )
        
        print("✓ API detection completed")
        
        # Verify response structure
        assert "materials_detected" in result
        assert "total_estimated_value" in result
        assert "detection_confidence" in result
        assert "recommended_actions" in result
        assert "special_handling_required" in result
        assert "stakeholder_notifications" in result
        assert "extraction_feasibility" in result
        assert "market_analysis" in result
        assert "timestamp" in result
        
        print("✓ API response structure verified")
        
        # Print detection results
        if result.get("materials_detected"):
            print(f"  - Materials detected: {len(result['materials_detected'])}")
            for material in result["materials_detected"]:
                print(f"  - Detected: {material['material_name']} ({material['material_type']})")
                print(f"    - Purity: {material['purity_percentage']:.1f}%")
                print(f"    - Quantity: {material['quantity_detected']:.5f} kg")
                print(f"    - Value: ${material['total_value']:.2f}")
                print(f"    - Confidence: {material['confidence']:.3f}")
        else:
            print("  - No materials detected")
        
        print(f"  - Total estimated value: ${result.get('total_estimated_value', 0.0):.2f}")
        print(f"  - Detection confidence: {result.get('detection_confidence', 0.0):.3f}")
        print(f"  - Special handling required: {result.get('special_handling_required', False)}")
        
        print("✓ API detection test passed")
        return True
        
    except Exception as e:
        print(f"✗ API detection test failed: {str(e)}")
        return False

async def test_handling_protocol_api():
    """Test handling protocol API"""
    print("\nTesting Handling Protocol API...")
    
    try:
        # Test with precious metals
        result = await get_handling_protocol(
            material_type="precious_metals",
            quantity=0.5,
            purity=75.0,
            custom_requirements=["Special security clearance required"]
        )
        
        print("✓ Handling protocol API call completed")
        
        # Verify response structure
        assert "protocol_id" in result
        assert "material_type" in result
        assert "safety_requirements" in result
        assert "equipment_needed" in result
        assert "extraction_steps" in result
        assert "storage_conditions" in result
        assert "transportation_requirements" in result
        assert "regulatory_compliance" in result
        assert "timestamp" in result
        
        print("✓ Protocol response structure verified")
        
        # Check customization
        assert result["material_type"] == "precious_metals"
        assert "Special security clearance required" in result["safety_requirements"]
        assert any("purity_level" in str(result["storage_conditions"]))
        
        print("✓ Protocol customization verified")
        
        # Test with invalid material type
        invalid_result = await get_handling_protocol(
            material_type="invalid_type",
            quantity=0.5,
            purity=75.0
        )
        
        assert "error" in invalid_result
        
        print("✓ Invalid material type handling verified")
        print("✓ Handling protocol API test passed")
        return True
        
    except Exception as e:
        print(f"✗ Handling protocol API test failed: {str(e)}")
        return False

async def test_stakeholder_notifications_api():
    """Test stakeholder notifications API"""
    print("\nTesting Stakeholder Notifications API...")
    
    try:
        # Create detector for direct access to notification method
        detector = RareMaterialDetector()
        
        # Test with high-value material
        result = await detector.send_stakeholder_notifications(
            materials=[
                detector._create_test_material(
                    "gold",
                    RareMaterialType.PRECIOUS_METALS,
                    65000.0,  # High value per kg
                    0.1,      # Quantity
                    90.0      # Purity
                )
            ],
            stakeholders=["management", "security", "finance"],
            priority_threshold=NotificationPriority.MEDIUM,
            notification_channels=["email", "sms", "dashboard"]
        )
        
        print("✓ Stakeholder notification API call completed")
        
        # Verify response structure
        assert "notification_id" in result
        assert "status" in result
        assert "stakeholders_notified" in result
        assert "channels_used" in result
        assert "priority" in result
        
        print("✓ Notification response structure verified")
        
        # Check notification details
        assert result["status"] == "sent"
        assert len(result["stakeholders_notified"]) == 3
        assert len(result["channels_used"]) == 3
        assert "message" in result
        
        print("✓ Notification details verified")
        
        # Test with low-value material and high threshold (should be skipped)
        low_value_result = await detector.send_stakeholder_notifications(
            materials=[
                detector._create_test_material(
                    "iron",
                    RareMaterialType.SPECIALTY_ALLOYS,
                    5.0,      # Low value per kg
                    0.1,      # Quantity
                    50.0      # Purity
                )
            ],
            stakeholders=["management"],
            priority_threshold=NotificationPriority.HIGH,
            notification_channels=["email"]
        )
        
        assert low_value_result["status"] == "skipped"
        
        print("✓ Priority threshold handling verified")
        print("✓ Stakeholder notifications API test passed")
        return True
        
    except Exception as e:
        print(f"✗ Stakeholder notifications API test failed: {str(e)}")
        return False

async def main():
    """Run all API tests"""
    print("=" * 60)
    print("RARE MATERIAL API - INTEGRATION TESTS")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    # Run tests
    if await test_api_detection():
        tests_passed += 1
    
    if await test_handling_protocol_api():
        tests_passed += 1
    
    if await test_stakeholder_notifications_api():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✓ ALL TESTS PASSED - Rare Material API is working correctly!")
        print("\nKey Features Verified:")
        print("  ✓ Multi-modal rare material detection API")
        print("  ✓ Customizable handling protocol generation")
        print("  ✓ Stakeholder notification system with priority thresholds")
        print("  ✓ Error handling and validation")
        return True
    else:
        print(f"✗ {total_tests - tests_passed} tests failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)