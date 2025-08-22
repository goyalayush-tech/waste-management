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
        # If model file doesn't exist, train a model first
        model_path = 'models/waste_prediction_model.pkl'
        if not os.path.exists(model_path):
            print("Model not found on disk, training a new model...")
            train_models()

        # Load trained model
        waste_model = WastePredictionModel()
        waste_model.load_model(model_path)

        # Helper to obtain zone info from backend or fallback
        def get_zone_info(zid):
            try:
                from backend.app.models import Zone
                zone = Zone.query.get(zid)
                if zone:
                    return {'population': zone.population, 'area': zone.area}
                else:
                    raise ValueError(f"Zone with ID {zid} not found in DB")
            except Exception:
                # Fallback zone definitions (kept small and reasonable)
                fallback_zones = {
                    1: {'population': 887978, 'area': 60.86},
                    2: {'population': 2731929, 'area': 250.48},
                    3: {'population': 1709346, 'area': 64.0},
                    4: {'population': 2543243, 'area': 129.38},
                    5: {'population': 582320, 'area': 25.0}
                }
                if zid in fallback_zones:
                    return fallback_zones[zid]
                # If unknown zone id, return a default
                return {'population': 100000, 'area': 10.0}

        zone_info = get_zone_info(zone_id)

        predictions = []
        base_date = datetime.now()

        for i in range(days_ahead):
            pred_date = base_date + timedelta(days=i)

            # Weather data placeholder (could be replaced with real API)
            weather_data = {
                'temperature': 25.0,
                'humidity': 60.0,
                'rainfall': 0.0
            }

            # Historical features placeholder (should be replaced with DB queries)
            historical_data = {
                'avg_last_week': 1000.0,
                'trend': 0.0
            }

            pred_input = pd.DataFrame([{
                'date': pred_date,
                'zone_population': zone_info['population'],
                'zone_area': zone_info['area'],
                'temperature': weather_data['temperature'],
                'humidity': weather_data['humidity'],
                'rainfall': weather_data['rainfall'],
                'avg_last_week': historical_data['avg_last_week'],
                'trend': historical_data['trend']
            }])

            try:
                prediction = waste_model.predict(pred_input)[0]
            except Exception as e:
                print(f"Prediction failed for date {pred_date}: {e}")
                prediction = 0.0

            predictions.append({
                'date': pred_date.isoformat(),
                'predicted_waste': round(float(prediction), 2),
                'zone_id': zone_id
            })

        return predictions


if __name__ == "__main__":
    # Train models if they don't exist
    if not os.path.exists('models/waste_prediction_model.pkl'):
        train_models()
    
    # Example prediction
    predictions = predict_waste_for_zone(zone_id=1, days_ahead=7)
    print("\nSample predictions for Zone 1:")
    for pred in predictions:
        print(f"Date: {pred['date'][:10]}, Predicted Waste: {pred['predicted_waste']} kg")