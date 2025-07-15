"""
Machine Learning Models for Waste Management Predictions
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json
from datetime import datetime, timedelta
import requests
import os


class WastePredictionModel:
    """Waste generation prediction model"""
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_features(self, data):
        """Prepare features for training/prediction"""
        features = []
        
        for _, row in data.iterrows():
            # Time-based features
            date = pd.to_datetime(row['date'])
            day_of_week = date.dayofweek
            month = date.month
            is_weekend = 1 if day_of_week >= 5 else 0
            
            # Zone features
            zone_population = row.get('zone_population', 100000)
            zone_area = row.get('zone_area', 10.0)
            population_density = zone_population / zone_area
            
            # Weather features (if available)
            temperature = row.get('temperature', 25.0)
            humidity = row.get('humidity', 60.0)
            rainfall = row.get('rainfall', 0.0)
            
            # Historical features
            avg_last_week = row.get('avg_last_week', 50.0)
            trend = row.get('trend', 0.0)
            
            feature_vector = [
                day_of_week, month, is_weekend,
                zone_population, zone_area, population_density,
                temperature, humidity, rainfall,
                avg_last_week, trend
            ]
            
            features.append(feature_vector)
        
        return np.array(features)
    
    def train(self, training_data):
        """Train the waste prediction model"""
        print("Training waste prediction model...")
        
        # Prepare features and target
        X = self.prepare_features(training_data)
        y = training_data['waste_amount'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"MAE: {mae:.2f}")
        print(f"RMSE: {rmse:.2f}")
        print(f"R²: {r2:.3f}")
        
        self.is_trained = True
        return {
            'mae': mae,
            'rmse': rmse,
            'r2': r2
        }
    
    def predict(self, input_data):
        """Predict waste generation"""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        X = self.prepare_features(input_data)
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def save_model(self, filepath):
        """Save trained model"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
        print(f"Model loaded from {filepath}")


class RouteOptimizer:
    """Route optimization for waste collection"""
    
    def __init__(self):
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        
    def calculate_distance_matrix(self, locations):
        """Calculate distance matrix between locations"""
        n = len(locations)
        distances = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    # Haversine distance calculation
                    lat1, lon1 = locations[i]
                    lat2, lon2 = locations[j]
                    
                    R = 6371  # Earth's radius in km
                    dlat = np.radians(lat2 - lat1)
                    dlon = np.radians(lon2 - lon1)
                    
                    a = (np.sin(dlat/2)**2 + 
                         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * 
                         np.sin(dlon/2)**2)
                    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
                    distances[i][j] = R * c
        
        return distances
    
    def optimize_route(self, bins_data, vehicle_capacity=5000):
        """Optimize collection route using greedy algorithm"""
        # Filter bins that need collection (>80% full)
        bins_to_collect = [
            bin for bin in bins_data 
            if bin['current_level'] >= 80
        ]
        
        if not bins_to_collect:
            return []
        
        # Extract locations
        locations = [(bin['latitude'], bin['longitude']) for bin in bins_to_collect]
        distances = self.calculate_distance_matrix(locations)
        
        # Greedy nearest neighbor algorithm
        n = len(bins_to_collect)
        unvisited = set(range(1, n))  # Start from depot (index 0)
        route = [0]
        current_load = 0
        
        current = 0
        while unvisited:
            # Find nearest unvisited bin
            nearest = min(unvisited, key=lambda x: distances[current][x])
            
            # Check if adding this bin exceeds capacity
            bin_weight = bins_to_collect[nearest]['current_level'] * 0.5  # Estimate weight
            
            if current_load + bin_weight <= vehicle_capacity:
                route.append(nearest)
                current_load += bin_weight
                current = nearest
                unvisited.remove(nearest)
            else:
                # Return to depot and start new route
                break
        
        # Convert indices back to bin data
        optimized_route = [bins_to_collect[i] for i in route]
        
        # Calculate route statistics
        total_distance = sum(distances[route[i]][route[i+1]] for i in range(len(route)-1))
        
        return {
            'route': optimized_route,
            'total_distance': total_distance,
            'estimated_time': total_distance * 2,  # 2 minutes per km
            'bins_count': len(route) - 1,  # Exclude depot
            'load_utilization': (current_load / vehicle_capacity) * 100
        }


def generate_training_data():
    """Generate synthetic training data for the model"""
    print("Generating training data...")
    
    # Generate 1 year of daily data for 5 zones
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    zones = [
        {'id': 1, 'population': 887978, 'area': 60.86},
        {'id': 2, 'population': 2731929, 'area': 250.48},
        {'id': 3, 'population': 1709346, 'area': 64.0},
        {'id': 4, 'population': 2543243, 'area': 129.38},
        {'id': 5, 'population': 582320, 'area': 25.0}
    ]
    
    training_data = []
    
    for date in dates:
        for zone in zones:
            # Base waste generation (kg per person per day)
            base_rate = 0.5
            
            # Seasonal variations
            month_factor = 1.0 + 0.2 * np.sin(2 * np.pi * date.month / 12)
            
            # Weekend effect
            weekend_factor = 1.2 if date.weekday() >= 5 else 1.0
            
            # Random weather effect
            temperature = 25 + 10 * np.sin(2 * np.pi * date.dayofyear / 365) + np.random.normal(0, 3)
            weather_factor = 1.0 + (temperature - 25) * 0.01
            
            # Calculate waste amount
            waste_amount = (zone['population'] * base_rate * 
                          month_factor * weekend_factor * weather_factor * 
                          np.random.normal(1.0, 0.1))
            
            # Historical trend (simple moving average)
            if len(training_data) >= 7:
                recent_data = [d['waste_amount'] for d in training_data[-7:] 
                             if d['zone_id'] == zone['id']]
                avg_last_week = np.mean(recent_data) if recent_data else waste_amount
                trend = (waste_amount - avg_last_week) / avg_last_week if avg_last_week > 0 else 0
            else:
                avg_last_week = waste_amount
                trend = 0
            
            training_data.append({
                'date': date,
                'zone_id': zone['id'],
                'zone_population': zone['population'],
                'zone_area': zone['area'],
                'waste_amount': max(0, waste_amount),  # Ensure non-negative
                'temperature': temperature,
                'humidity': 60 + np.random.normal(0, 10),
                'rainfall': max(0, np.random.exponential(2) if np.random.random() < 0.3 else 0),
                'avg_last_week': avg_last_week,
                'trend': trend
            })
    
    return pd.DataFrame(training_data)


def train_models():
    """Train all ML models"""
    print("Starting ML model training...")
    
    # Generate training data
    training_data = generate_training_data()
    
    # Train waste prediction model
    waste_model = WastePredictionModel()
    performance = waste_model.train(training_data)
    
    # Save model
    os.makedirs('models', exist_ok=True)
    waste_model.save_model('models/waste_prediction_model.pkl')
    
    # Save performance metrics
    with open('models/model_performance.json', 'w') as f:
        json.dump(performance, f, indent=2)
    
    print("Model training completed!")
    return waste_model


def predict_waste_for_zone(zone_id, days_ahead=7):
    """Predict waste generation for a specific zone"""
    try:
        # Load trained model
        waste_model = WastePredictionModel()
        waste_model.load_model('models/waste_prediction_model.pkl')
        
        # Prepare prediction data
        predictions = []
        base_date = datetime.now()
        
        # Zone data (in production, fetch from database)
        zone_data = {
            1: {'population': 887978, 'area': 60.86},
            2: {'population': 2731929, 'area': 250.48},
            3: {'population': 1709346, 'area': 64.0},
            4: {'population': 2543243, 'area': 129.38},
            5: {'population': 582320, 'area': 25.0}
        }
        
        zone_info = zone_data.get(zone_id, zone_data[1])
        
        for i in range(days_ahead):
            pred_date = base_date + timedelta(days=i)
            
            # Create prediction input
            pred_input = pd.DataFrame([{
                'date': pred_date,
                'zone_population': zone_info['population'],
                'zone_area': zone_info['area'],
                'temperature': 25.0,  # Default values
                'humidity': 60.0,
                'rainfall': 0.0,
                'avg_last_week': 1000.0,  # Placeholder
                'trend': 0.0
            }])
            
            prediction = waste_model.predict(pred_input)[0]
            
            predictions.append({
                'date': pred_date.isoformat(),
                'predicted_waste': round(prediction, 2),
                'zone_id': zone_id
            })
        
        return predictions
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return []


if __name__ == "__main__":
    # Train models if they don't exist
    if not os.path.exists('models/waste_prediction_model.pkl'):
        train_models()
    
    # Example prediction
    predictions = predict_waste_for_zone(zone_id=1, days_ahead=7)
    print("\nSample predictions for Zone 1:")
    for pred in predictions:
        print(f"Date: {pred['date'][:10]}, Predicted Waste: {pred['predicted_waste']} kg")