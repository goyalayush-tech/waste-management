"""
Example demonstrating the Enhanced AI/ML Multi-Modal Analysis System
This example shows how to use the system with simulated sensor data
"""

import asyncio
import logging
import numpy as np
import matplotlib.pyplot as plt
import os
import sys
from datetime import datetime
import json
from PIL import Image
import io
import random

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the system
from enhanced_ai_ml_system import (
    EnhancedAIMLSystem, EnhancedAnalysisResult,
    SensorType, SpectralData, WeightData, ChemicalData,
    ProcessingStage, OptimizationObjective
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_sample_image(material_type="plastic"):
    """Generate a sample image for testing"""
    # Create a simple colored image based on material type
    width, height = 224, 224
    image = np.zeros((height, width, 3), dtype=np.uint8)
    
    if material_type == "plastic":
        # Blue-ish color for plastic
        image[:, :] = [200, 230, 255]
        # Add some texture
        for _ in range(1000):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            size = random.randint(1, 5)
            color = [180 + random.randint(-20, 20), 
                     210 + random.randint(-20, 20), 
                     235 + random.randint(-20, 20)]
            image[max(0, y-size):min(height, y+size), 
                  max(0, x-size):min(width, x+size)] = color
    
    elif material_type == "paper":
        # Beige color for paper
        image[:, :] = [230, 225, 200]
        # Add some texture
        for _ in range(1000):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            size = random.randint(1, 5)
            color = [210 + random.randint(-20, 20), 
                     205 + random.randint(-20, 20), 
                     180 + random.randint(-20, 20)]
            image[max(0, y-size):min(height, y+size), 
                  max(0, x-size):min(width, x+size)] = color
    
    elif material_type == "metal":
        # Gray color for metal
        image[:, :] = [180, 180, 180]
        # Add some texture
        for _ in range(1000):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            size = random.randint(1, 5)
            color = [160 + random.randint(-20, 20), 
                     160 + random.randint(-20, 20), 
                     160 + random.randint(-20, 20)]
            image[max(0, y-size):min(height, y+size), 
                  max(0, x-size):min(width, x+size)] = color
    
    elif material_type == "organic":
        # Brown-green color for organic
        image[:, :] = [100, 120, 80]
        # Add some texture
        for _ in range(1000):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            size = random.randint(1, 5)
            color = [80 + random.randint(-20, 20), 
                     100 + random.randint(-20, 20), 
                     60 + random.randint(-20, 20)]
            image[max(0, y-size):min(height, y+size), 
                  max(0, x-size):min(width, x+size)] = color
    
    # Add some contamination (red spots)
    for _ in range(50):
        x = random.randint(0, width-1)
        y = random.randint(0, height-1)
        size = random.randint(1, 3)
        color = [200 + random.randint(0, 55), 
                 50 + random.randint(0, 30), 
                 50 + random.randint(0, 30)]
        image[max(0, y-size):min(height, y+size), 
              max(0, x-size):min(width, x+size)] = color
    
    # Convert to PIL Image and then to bytes
    pil_image = Image.fromarray(image)
    img_byte_arr = io.BytesIO()
    pil_image.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

def generate_spectral_data(material_type="plastic"):
    """Generate sample spectral data for testing"""
    # Wavelength range (400-2500 nm)
    wavelengths = list(range(400, 2501))
    
    # Base intensities (different for each material type)
    if material_type == "plastic":
        # PET plastic has characteristic peaks around 1660 and 2270 nm
        base = np.zeros(len(wavelengths))
        for i, w in enumerate(wavelengths):
            # Add characteristic peaks
            if 1650 <= w <= 1670:
                base[i] = 0.8 + 0.2 * np.exp(-((w - 1660) ** 2) / 10)
            elif 2260 <= w <= 2280:
                base[i] = 0.7 + 0.3 * np.exp(-((w - 2270) ** 2) / 10)
            else:
                base[i] = 0.5 + 0.1 * np.sin(w / 200)
    
    elif material_type == "paper":
        # Paper has characteristic cellulose peaks
        base = np.zeros(len(wavelengths))
        for i, w in enumerate(wavelengths):
            # Add characteristic peaks
            if 1480 <= w <= 1500:
                base[i] = 0.7 + 0.3 * np.exp(-((w - 1490) ** 2) / 10)
            elif 1930 <= w <= 1950:
                base[i] = 0.6 + 0.4 * np.exp(-((w - 1940) ** 2) / 10)
            else:
                base[i] = 0.6 + 0.1 * np.sin(w / 180)
    
    elif material_type == "metal":
        # Metals have high reflectance across spectrum
        base = np.zeros(len(wavelengths))
        for i, w in enumerate(wavelengths):
            base[i] = 0.8 + 0.1 * np.sin(w / 300)
    
    elif material_type == "organic":
        # Organic materials have water and chlorophyll features
        base = np.zeros(len(wavelengths))
        for i, w in enumerate(wavelengths):
            # Add characteristic peaks
            if 1400 <= w <= 1450:
                base[i] = 0.3 + 0.4 * np.exp(-((w - 1425) ** 2) / 20)  # Water absorption
            elif 670 <= w <= 690:
                base[i] = 0.2 + 0.3 * np.exp(-((w - 680) ** 2) / 10)   # Chlorophyll
            else:
                base[i] = 0.4 + 0.2 * np.sin(w / 150)
    
    # Add noise
    noise = np.random.normal(0, 0.02, len(wavelengths))
    intensities = base + noise
    
    # Ensure values are in valid range
    intensities = np.clip(intensities, 0, 1).tolist()
    
    return SpectralData(
        wavelengths=wavelengths,
        intensities=intensities,
        spectrum_type="NIR",
        resolution=2.0,
        integration_time=0.1
    )

def generate_weight_data(material_type="plastic"):
    """Generate sample weight data for testing"""
    # Base weight and density values for different materials
    if material_type == "plastic":
        weight = 0.8 + random.random() * 0.4  # 0.8-1.2 kg
        density = 1.2 + random.random() * 0.3  # 1.2-1.5 g/cm³
    elif material_type == "paper":
        weight = 0.5 + random.random() * 0.3  # 0.5-0.8 kg
        density = 0.7 + random.random() * 0.2  # 0.7-0.9 g/cm³
    elif material_type == "metal":
        weight = 2.0 + random.random() * 1.0  # 2.0-3.0 kg
        density = 7.0 + random.random() * 1.0  # 7.0-8.0 g/cm³
    elif material_type == "organic":
        weight = 1.0 + random.random() * 0.5  # 1.0-1.5 kg
        density = 0.8 + random.random() * 0.4  # 0.8-1.2 g/cm³
    
    # Calculate volume
    volume = weight / density
    
    # Generate weight distribution (simulating multiple weight sensors)
    distribution = []
    for _ in range(5):
        distribution.append(weight * (0.95 + random.random() * 0.1))  # ±5% variation
    
    return WeightData(
        weight=weight,
        density=density,
        volume=volume,
        distribution=distribution,
        stability=0.9 + random.random() * 0.1  # 0.9-1.0 stability
    )

def generate_chemical_data(material_type="plastic"):
    """Generate sample chemical data for testing"""
    elements = {}
    compounds = {}
    
    if material_type == "plastic":
        # PET plastic composition
        elements = {
            'C': 0.625,
            'H': 0.042,
            'O': 0.333,
            'N': 0.0,
            'S': 0.0,
            'Cl': 0.0
        }
        compounds = {
            'PET': 0.95,
            'additives': 0.05
        }
        ph_level = 7.0
        moisture_content = 0.01 + random.random() * 0.02  # 1-3%
        organic_content = 0.0
    
    elif material_type == "paper":
        # Paper composition
        elements = {
            'C': 0.44,
            'H': 0.06,
            'O': 0.5,
            'N': 0.0,
            'S': 0.0,
            'Ca': 0.0
        }
        compounds = {
            'cellulose': 0.7,
            'hemicellulose': 0.2,
            'lignin': 0.1
        }
        ph_level = 6.5 + random.random()  # 6.5-7.5
        moisture_content = 0.05 + random.random() * 0.05  # 5-10%
        organic_content = 1.0
    
    elif material_type == "metal":
        # Aluminum can composition
        elements = {
            'Al': 0.95,
            'Mg': 0.01,
            'Si': 0.01,
            'Fe': 0.005,
            'Cu': 0.005,
            'Mn': 0.01,
            'Zn': 0.01
        }
        compounds = {
            'aluminum_alloy': 1.0
        }
        ph_level = 7.0
        moisture_content = 0.0
        organic_content = 0.0
    
    elif material_type == "organic":
        # Food waste composition
        elements = {
            'C': 0.48,
            'H': 0.06,
            'O': 0.37,
            'N': 0.035,
            'P': 0.02,
            'K': 0.015,
            'S': 0.01,
            'Ca': 0.01
        }
        compounds = {
            'carbohydrates': 0.6,
            'proteins': 0.15,
            'fats': 0.1,
            'fiber': 0.15
        }
        ph_level = 5.0 + random.random() * 2.0  # 5.0-7.0
        moisture_content = 0.6 + random.random() * 0.2  # 60-80%
        organic_content = 0.95 + random.random() * 0.05  # 95-100%
    
    # Add some random contamination
    for element in ['Pb', 'Cd', 'Hg', 'As']:
        elements[element] = random.random() * 0.001  # 0-0.1% contamination
    
    return ChemicalData(
        elements=elements,
        compounds=compounds,
        ph_level=ph_level,
        moisture_content=moisture_content,
        organic_content=organic_content
    )

def print_analysis_result(result: EnhancedAnalysisResult):
    """Print the analysis result in a formatted way"""
    print("\n" + "="*80)
    print(f"ENHANCED AI/ML ANALYSIS RESULT")
    print("="*80)
    
    print(f"\nMaterial Classification: {result.material_classification}")
    print(f"Confidence: {result.confidence:.2f}")
    print("\nMaterial Composition:")
    for material, percentage in result.material_composition.items():
        print(f"  - {material}: {percentage:.2%}")
    
    print(f"\nQuality Score: {result.quality_score:.2f}")
    print(f"Value Estimate: ${result.value_estimate:.2f}")
    print(f"Carbon Footprint: {result.carbon_footprint:.2f} kg CO2e")
    
    if result.contamination_result and result.contamination_result.contamination_detected:
        print("\nContamination Detected:")
        print(f"  - Severity: {result.contamination_result.severity_level.name}")
        print(f"  - Affected Area: {result.contamination_result.affected_area_percentage:.2f}%")
        print("  - Remediation Suggestions:")
        for suggestion in result.contamination_result.remediation_suggestions:
            print(f"    * {suggestion}")
    
    if result.rare_material_result and result.rare_material_result.materials_detected:
        print("\nValuable Materials Detected:")
        print(f"  - Total Value: ${result.rare_material_result.total_estimated_value:.2f}")
        print("  - Recommended Actions:")
        for action in result.rare_material_result.recommended_actions:
            print(f"    * {action}")
    
    if result.parameter_optimization:
        print("\nOptimized Processing Parameters:")
        print(f"  - Processing Stage: {result.parameter_optimization.optimized_parameters.stage.value}")
        print(f"  - Expected Efficiency: {result.parameter_optimization.expected_efficiency:.2f}%")
        print("  - Parameter Changes:")
        for param, (old_val, new_val) in result.parameter_optimization.parameter_changes.items():
            print(f"    * {param}: {old_val:.2f} → {new_val:.2f}")
    
    print("\nProcessing Recommendations:")
    for recommendation in result.processing_recommendations:
        print(f"  - {recommendation}")
    
    print(f"\nAnalysis Time: {result.processing_time:.3f} seconds")
    print(f"Sensors Used: {', '.join([s.value for s in result.sensor_types_used])}")
    print("="*80 + "\n")

async def run_example():
    """Run the example with different material types"""
    # Initialize the system
    system = EnhancedAIMLSystem()
    
    # Configure the system
    system.configure_system({
        'enable_contamination_detection': True,
        'enable_rare_material_detection': True,
        'enable_parameter_optimization': True
    })
    
    # Get system status
    status = await system.get_system_status()
    print("\nSystem Status:")
    print(json.dumps(status, indent=2))
    
    # Material types to test
    material_types = ["plastic", "paper", "metal", "organic"]
    
    for material_type in material_types:
        print(f"\nAnalyzing {material_type.upper()} waste...")
        
        # Generate sample data
        image_data = generate_sample_image(material_type)
        spectral_data = generate_spectral_data(material_type)
        weight_data = generate_weight_data(material_type)
        chemical_data = generate_chemical_data(material_type)
        
        # Analyze waste
        result = await system.analyze_waste(
            visual_data=image_data,
            spectral_data=spectral_data,
            weight_data=weight_data,
            chemical_data=chemical_data,
            processing_stage=ProcessingStage.SORTING,
            optimization_objective=OptimizationObjective.MAXIMIZE_EFFICIENCY
        )
        
        # Print results
        print_analysis_result(result)

if __name__ == "__main__":
    asyncio.run(run_example())