"""
Performance tests for the Dynamic Parameter Optimization system
"""

import pytest
import asyncio
import time
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
import sys
import os
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dynamic_parameter_optimization import (
    DynamicParameterOptimizer, 
    ProcessingStage, 
    OptimizationObjective,
    ProcessingParameters,
    CompositionChangeDetector,
    OperatorAlertSystem,
    RealTimeParameterOptimizer
)

class TestDynamicParameterOptimization:
    """Test suite for Dynamic Parameter Optimization"""
    
    @pytest.fixture
    def optimizer(self):
        """Create a parameter optimizer instance"""
        return DynamicParameterOptimizer()
    
    @pytest.fixture
    def real_time_optimizer(self):
        """Create a real-time parameter optimizer instance"""
        return RealTimeParameterOptimizer()
    
    @pytest.fixture
    def sample_waste_composition(self):
        """Sample waste composition for testing"""
        return {
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
    
    @pytest.fixture
    def changed_waste_composition(self):
        """Changed waste composition for testing"""
        return {
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
    
    @pytest.mark.asyncio
    async def test_parameter_optimization_performance(self, optimizer, sample_waste_composition):
        """Test performance of parameter optimization"""
        # Test optimization for different processing stages
        stages = [
            ProcessingStage.SORTING,
            ProcessingStage.CLEANING,
            ProcessingStage.SHREDDING,
            ProcessingStage.SEPARATION
        ]
        
        for stage in stages:
            # Measure optimization time
            start_time = time.time()
            
            # Run optimization
            result = await optimizer.optimize_parameters(
                sample_waste_composition,
                stage,
                None,
                OptimizationObjective.MAXIMIZE_EFFICIENCY
            )
            
            # Calculate elapsed time
            elapsed_time = time.time() - start_time
            
            # Verify result
            assert result is not None
            assert result.optimized_parameters is not None
            assert result.optimized_parameters.stage == stage
            assert result.expected_efficiency > 0
            assert result.expected_quality > 0
            
            # Performance assertion - should complete within reasonable time
            assert elapsed_time < 5.0, f"Optimization for {stage.value} took too long: {elapsed_time:.2f}s"
            
            print(f"Optimization for {stage.value} completed in {elapsed_time:.2f}s")
            print(f"Expected efficiency: {result.expected_efficiency:.2f}%")
            print(f"Expected quality: {result.expected_quality:.2f}%")
            
            # Verify parameter bounds
            for param_name, (min_val, max_val) in optimizer.parameter_bounds[stage].items():
                param_value = getattr(result.optimized_parameters, param_name)
                if param_value is not None:
                    assert min_val <= param_value <= max_val, \
                        f"Parameter {param_name} value {param_value} outside bounds [{min_val}, {max_val}]"
    
    @pytest.mark.asyncio
    async def test_optimization_objectives(self, optimizer, sample_waste_composition):
        """Test different optimization objectives"""
        stage = ProcessingStage.CLEANING
        
        # Test different optimization objectives
        objectives = [
            OptimizationObjective.MAXIMIZE_EFFICIENCY,
            OptimizationObjective.MINIMIZE_ENERGY,
            OptimizationObjective.MAXIMIZE_QUALITY
        ]
        
        results = {}
        
        for objective in objectives:
            # Run optimization with this objective
            result = await optimizer.optimize_parameters(
                sample_waste_composition,
                stage,
                None,
                objective
            )
            
            # Store result
            results[objective] = result
            
            # Verify result
            assert result is not None
            assert result.optimized_parameters is not None
            assert result.optimized_parameters.stage == stage
        
        # Verify that different objectives produce different parameter sets
        # Energy minimization should use less energy than efficiency maximization
        assert results[OptimizationObjective.MINIMIZE_ENERGY].expected_energy_consumption <= \
               results[OptimizationObjective.MAXIMIZE_EFFICIENCY].expected_energy_consumption
        
        # Quality maximization should produce higher quality than efficiency maximization
        assert results[OptimizationObjective.MAXIMIZE_QUALITY].expected_quality >= \
               results[OptimizationObjective.MAXIMIZE_EFFICIENCY].expected_quality
    
    def test_composition_change_detection(self, sample_waste_composition, changed_waste_composition):
        """Test detection of significant waste composition changes"""
        detector = CompositionChangeDetector(threshold=0.15)  # 15% change threshold
        
        # First call should set baseline and return None
        change = detector.detect_changes(sample_waste_composition)
        assert change is None
        
        # No significant change should return None
        small_change = sample_waste_composition.copy()
        small_change['plastic_pet'] = 0.26  # 4% increase, below threshold
        change = detector.detect_changes(small_change)
        assert change is None
        
        # Significant change should return CompositionChange object
        change = detector.detect_changes(changed_waste_composition)
        assert change is not None
        assert len(change.significant_changes) > 0
        
        # Verify specific changes
        assert 'plastic_pet' in change.significant_changes
        assert 'paper' in change.significant_changes
        assert change.significant_changes['plastic_pet'] < 0  # Decreased
        assert change.significant_changes['paper'] > 0  # Increased
    
    def test_operator_alert_system(self):
        """Test operator alert system"""
        alert_system = OperatorAlertSystem()
        
        # Test alert generation
        alert = alert_system.generate_alert(
            alert_type="test_alert",
            severity="warning",
            message="Test alert message",
            details={"test_key": "test_value"}
        )
        
        assert alert is not None
        assert alert.alert_id.startswith("test_alert_")
        assert alert.severity == "warning"
        assert alert.message == "Test alert message"
        assert alert.details["test_key"] == "test_value"
        assert not alert.acknowledged
        
        # Test alert acknowledgement
        result = alert_system.acknowledge_alert(alert.alert_id, "Test action taken")
        assert result is True
        
        # Verify alert was updated
        updated_alert = next((a for a in alert_system.alerts if a.alert_id == alert.alert_id), None)
        assert updated_alert is not None
        assert updated_alert.acknowledged is True
        assert updated_alert.action_taken == "Test action taken"
        
        # Test active alerts filtering
        alert_system.generate_alert(
            alert_type="test_alert",
            severity="info",
            message="Another test alert",
            details={}
        )
        
        active_alerts = alert_system.get_active_alerts()
        assert len(active_alerts) == 1
        assert active_alerts[0].message == "Another test alert"
    
    @pytest.mark.asyncio
    async def test_real_time_parameter_optimization(
        self, real_time_optimizer, sample_waste_composition, changed_waste_composition
    ):
        """Test real-time parameter optimization"""
        # Mock alert callback
        alert_callback = MagicMock()
        real_time_optimizer.alert_system.add_alert_callback(alert_callback)
        
        # Test optimization with initial composition
        result = await real_time_optimizer.optimize_for_composition(
            sample_waste_composition,
            ProcessingStage.SORTING
        )
        
        assert result is not None
        assert result.optimized_parameters is not None
        assert result.optimized_parameters.stage == ProcessingStage.SORTING
        
        # No alerts should be generated for first optimization
        assert alert_callback.call_count == 0
        
        # Test optimization with changed composition
        result = await real_time_optimizer.optimize_for_composition(
            changed_waste_composition,
            ProcessingStage.SORTING
        )
        
        assert result is not None
        
        # Alert should be generated for composition change
        assert alert_callback.call_count > 0
        
        # Verify alert details
        alert = alert_callback.call_args[0][0]
        assert alert.alert_type == "composition_change"
        assert "plastic_pet" in alert.message or "paper" in alert.message
    
    @pytest.mark.asyncio
    async def test_parameter_adjustment_based_on_composition(
        self, optimizer, sample_waste_composition, changed_waste_composition
    ):
        """Test parameter adjustment based on composition changes"""
        stage = ProcessingStage.SORTING
        
        # Get optimized parameters for initial composition
        initial_result = await optimizer.optimize_parameters(
            sample_waste_composition,
            stage
        )
        
        # Get optimized parameters for changed composition
        changed_result = await optimizer.optimize_parameters(
            changed_waste_composition,
            stage
        )
        
        # Verify that parameters were adjusted
        assert initial_result.optimized_parameters != changed_result.optimized_parameters
        
        # Check specific parameter changes
        # For example, with increased paper content, sorting speed might be adjusted
        if hasattr(initial_result.optimized_parameters, 'speed') and \
           hasattr(changed_result.optimized_parameters, 'speed'):
            initial_speed = initial_result.optimized_parameters.speed
            changed_speed = changed_result.optimized_parameters.speed
            
            # Print for debugging
            print(f"Initial speed: {initial_speed}")
            print(f"Changed speed: {changed_speed}")
            
            # We expect some change in speed due to composition change
            assert abs(initial_speed - changed_speed) > 0.01
    
    def test_performance_under_load(self, optimizer, sample_waste_composition):
        """Test system performance under load"""
        # Create multiple variations of waste composition
        compositions = []
        for i in range(10):
            composition = sample_waste_composition.copy()
            # Vary plastic content
            composition['plastic_pet'] = 0.25 + (i * 0.02)
            composition['plastic_hdpe'] = 0.15 - (i * 0.01)
            compositions.append(composition)
        
        # Measure time to process all compositions
        start_time = time.time()
        
        # Process compositions in parallel
        async def process_all():
            tasks = []
            for composition in compositions:
                task = optimizer.optimize_parameters(
                    composition,
                    ProcessingStage.SORTING
                )
                tasks.append(task)
            
            return await asyncio.gather(*tasks)
        
        # Run the async function
        results = asyncio.run(process_all())
        
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Verify results
        assert len(results) == len(compositions)
        assert all(result is not None for result in results)
        
        # Performance assertion - should complete within reasonable time
        # Allow 1 second per optimization on average
        assert elapsed_time < len(compositions) * 1.0, \
            f"Batch optimization took too long: {elapsed_time:.2f}s for {len(compositions)} compositions"
        
        print(f"Processed {len(compositions)} compositions in {elapsed_time:.2f}s "
              f"({elapsed_time/len(compositions):.2f}s per composition)")

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])