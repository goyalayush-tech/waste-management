"""
Example usage of the Dynamic Parameter Optimization standalone system
"""

import asyncio
import sys
import os
import json
from datetime import datetime
import time

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the standalone module
from dynamic_parameter_optimization_standalone import (
    DynamicParameterOptimizer, 
    ProcessingStage, 
    OptimizationObjective,
    ProcessingParameters,
    CompositionChangeDetector,
    OperatorAlertSystem,
    RealTimeParameterOptimizer,
    OperatorAlert
)

# Sample waste compositions
INITIAL_COMPOSITION = {
    'plastic_pet': 0.25,
    'plastic_hdpe': 0.15,
    'plastic_pvc': 0.05,
    'plastic_ldpe': 0.10,
    'plastic_pp': 0.10,
    'plastic_ps': 0.05,
    'paper': 0.10,
    'cardboard': 0.05,
    'metal_ferrous': 0.05,
    'metal_aluminum': 0.05,
    'glass_clear': 0.03,
    'glass_colored': 0.02,
    'contamination_level': 0.08,
    'moisture_content': 0.15,
    'density': 0.4
}

CHANGED_COMPOSITION = {
    'plastic_pet': 0.15,  # Decreased
    'plastic_hdpe': 0.10,  # Decreased
    'plastic_pvc': 0.05,
    'plastic_ldpe': 0.10,
    'plastic_pp': 0.10,
    'plastic_ps': 0.05,
    'paper': 0.20,  # Increased
    'cardboard': 0.10,  # Increased
    'metal_ferrous': 0.05,
    'metal_aluminum': 0.05,
    'glass_clear': 0.03,
    'glass_colored': 0.02,
    'contamination_level': 0.12,  # Increased
    'moisture_content': 0.20,  # Increased
    'density': 0.35  # Decreased
}

def print_parameters(parameters):
    """Print processing parameters in a readable format"""
    print(f"Processing Stage: {parameters.stage.value}")
    
    for attr_name in dir(parameters):
        if not attr_name.startswith('_') and attr_name != 'stage':
            value = getattr(parameters, attr_name)
            if value is not None:
                print(f"  {attr_name}: {value:.2f}")

def print_optimization_result(result):
    """Print optimization result in a readable format"""
    print("\nOptimization Result:")
    print(f"Expected Efficiency: {result.expected_efficiency:.2f}%")
    print(f"Expected Quality: {result.expected_quality:.2f}%")
    print(f"Expected Energy Consumption: {result.expected_energy_consumption:.2f} units")
    print(f"Expected Processing Time: {result.expected_processing_time:.2f} seconds")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Optimization Method: {result.optimization_method}")
    
    if result.parameter_changes:
        print("\nParameter Changes:")
        for param, (old_value, new_value) in result.parameter_changes.items():
            change_pct = ((new_value - old_value) / old_value) * 100 if old_value != 0 else float('inf')
            direction = "increased" if new_value > old_value else "decreased"
            print(f"  {param} {direction} from {old_value:.2f} to {new_value:.2f} ({abs(change_pct):.1f}%)")

def alert_callback(alert):
    """Callback function for operator alerts"""
    print("\n" + "=" * 80)
    print(f"OPERATOR ALERT - {alert.severity.upper()}")
    print(f"Type: {alert.alert_type}")
    print(f"Time: {alert.timestamp}")
    print(f"Message: {alert.message}")
    print("=" * 80)

async def example_basic_optimization():
    """Example of basic parameter optimization"""
    print("\n=== Basic Parameter Optimization Example ===\n")
    
    # Create optimizer
    optimizer = DynamicParameterOptimizer()
    
    # Optimize parameters for sorting stage
    print("Optimizing parameters for sorting stage...")
    result = await optimizer.optimize_parameters(
        INITIAL_COMPOSITION,
        ProcessingStage.SORTING,
        None,
        OptimizationObjective.MAXIMIZE_EFFICIENCY
    )
    
    # Print optimized parameters
    print("\nOptimized Parameters:")
    print_parameters(result.optimized_parameters)
    print_optimization_result(result)
    
    # Optimize for different objective
    print("\nOptimizing for energy efficiency...")
    result = await optimizer.optimize_parameters(
        INITIAL_COMPOSITION,
        ProcessingStage.SORTING,
        None,
        OptimizationObjective.MINIMIZE_ENERGY
    )
    
    # Print optimized parameters
    print("\nEnergy-Optimized Parameters:")
    print_parameters(result.optimized_parameters)
    print_optimization_result(result)

async def example_composition_change_detection():
    """Example of composition change detection"""
    print("\n=== Composition Change Detection Example ===\n")
    
    # Create detector
    detector = CompositionChangeDetector(threshold=0.15)  # 15% change threshold
    
    # Set baseline composition
    print("Setting baseline composition...")
    change = detector.detect_changes(INITIAL_COMPOSITION)
    print("Baseline set, no changes detected yet.")
    
    # Detect changes with small variation
    small_change = INITIAL_COMPOSITION.copy()
    small_change['plastic_pet'] = 0.26  # Small increase
    
    print("\nTesting with small composition change...")
    change = detector.detect_changes(small_change)
    
    if change:
        print("Change detected (unexpected)!")
    else:
        print("No significant change detected (expected).")
    
    # Detect changes with significant variation
    print("\nTesting with significant composition change...")
    change = detector.detect_changes(CHANGED_COMPOSITION)
    
    if change:
        print("Significant change detected (expected)!")
        print("\nSignificant Changes:")
        for material, change_pct in change.significant_changes.items():
            direction = "increased" if change_pct > 0 else "decreased"
            print(f"  {material} {direction} by {abs(change_pct*100):.1f}%")
        
        print(f"\nOverall change magnitude: {change.overall_change_magnitude:.2f}")
    else:
        print("No change detected (unexpected)!")

async def example_operator_alerts():
    """Example of operator alert system"""
    print("\n=== Operator Alert System Example ===\n")
    
    # Create alert system
    alert_system = OperatorAlertSystem()
    
    # Add callback
    alert_system.add_alert_callback(alert_callback)
    
    # Generate different types of alerts
    print("Generating info alert...")
    alert_system.generate_alert(
        alert_type="system_status",
        severity="info",
        message="System startup complete, all parameters nominal",
        details={"status": "running", "startup_time": "2.5s"}
    )
    
    print("\nGenerating warning alert...")
    alert_system.generate_alert(
        alert_type="parameter_warning",
        severity="warning",
        message="Temperature approaching upper limit in melting stage",
        details={"stage": "melting", "temperature": 1450, "limit": 1500}
    )
    
    print("\nGenerating critical alert...")
    alert_system.generate_alert(
        alert_type="contamination_critical",
        severity="critical",
        message="Hazardous material detected in recyclable stream",
        details={"material": "mercury", "concentration": "0.02%", "location": "input_conveyor_3"}
    )
    
    # Get active alerts
    active_alerts = alert_system.get_active_alerts()
    print(f"\nActive alerts: {len(active_alerts)}")
    
    # Acknowledge an alert
    if active_alerts:
        alert_id = active_alerts[0].alert_id
        print(f"\nAcknowledging alert {alert_id}...")
        alert_system.acknowledge_alert(
            alert_id, 
            "Operator notified, material removed from stream"
        )
        
        # Check active alerts again
        active_alerts = alert_system.get_active_alerts()
        print(f"Active alerts after acknowledgement: {len(active_alerts)}")

async def example_real_time_optimization():
    """Example of real-time parameter optimization"""
    print("\n=== Real-Time Parameter Optimization Example ===\n")
    
    # Create real-time optimizer
    optimizer = RealTimeParameterOptimizer()
    
    # Add alert callback
    optimizer.alert_system.add_alert_callback(alert_callback)
    
    # Initial optimization (direct mode without thread)
    print("\nProcessing initial waste composition...")
    result = await optimizer.parameter_optimizer.optimize_parameters(
        INITIAL_COMPOSITION,
        ProcessingStage.SORTING
    )
    
    # Print optimized parameters
    print("\nInitial Optimized Parameters:")
    print_parameters(result.optimized_parameters)
    print_optimization_result(result)
    
    # Wait a moment
    print("\nWaiting for 2 seconds...")
    await asyncio.sleep(2)
    
    # Process changed composition and detect changes
    print("\nProcessing changed waste composition...")
    composition_change = optimizer.composition_detector.detect_changes(INITIAL_COMPOSITION)
    composition_change = optimizer.composition_detector.detect_changes(CHANGED_COMPOSITION)
    
    if composition_change:
        print("\nSignificant composition change detected:")
        for material, change_pct in composition_change.significant_changes.items():
            direction = "increased" if change_pct > 0 else "decreased"
            print(f"  {material} {direction} by {abs(change_pct*100):.1f}%")
    
    # Optimize for changed composition
    result = await optimizer.parameter_optimizer.optimize_parameters(
        CHANGED_COMPOSITION,
        ProcessingStage.SORTING,
        result.optimized_parameters
    )
    
    # Print optimized parameters
    print("\nUpdated Optimized Parameters:")
    print_parameters(result.optimized_parameters)
    print_optimization_result(result)

async def main():
    """Run all examples"""
    await example_basic_optimization()
    await example_composition_change_detection()
    await example_operator_alerts()
    await example_real_time_optimization()

if __name__ == "__main__":
    # Run examples
    asyncio.run(main())