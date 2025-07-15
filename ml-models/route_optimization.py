"""
Route optimization using machine learning
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import requests
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RouteOptimizer:
    def __init__(self, api_url="http://localhost:5000"):
        self.api_url = api_url
        self.scaler = StandardScaler()
        self.kmeans = None
        
    def fetch_bin_data(self):
        """Fetch current bin data from API"""
        try:
            response = requests.get(f"{self.api_url}/api/bins")
            if response.status_code == 200:
                return response.json()['bins']
            else:
                logger.error(f"Failed to fetch bin data: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching bin data: {e}")
            return []
    
    def prepare_data(self, bins):
        """Prepare bin data for clustering"""
        data = []
        for bin in bins:
            if bin['is_active'] and bin['current_level'] > 50:  # Only bins > 50% full
                data.append([
                    bin['coordinates']['lat'],
                    bin['coordinates']['lng'],
                    bin['current_level'],
                    bin['capacity'],
                    1 if bin['status'] == 'full' else 0  # Priority for full bins
                ])
        
        return np.array(data)
    
    def optimize_routes(self, zone_id=None, max_routes=5):
        """Optimize collection routes using K-means clustering"""
        try:
            bins = self.fetch_bin_data()
            
            if zone_id:
                bins = [bin for bin in bins if bin['zone_id'] == zone_id]
            
            if len(bins) < 2:
                return {"routes": [], "message": "Not enough bins for optimization"}
            
            # Prepare data
            data = self.prepare_data(bins)
            
            if len(data) < 2:
                return {"routes": [], "message": "Not enough bins requiring collection"}
            
            # Scale features
            scaled_data = self.scaler.fit_transform(data)
            
            # Determine optimal number of clusters
            n_clusters = min(max_routes, len(data))
            
            # Perform clustering
            self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            clusters = self.kmeans.fit_predict(scaled_data)
            
            # Create routes
            routes = []
            for cluster_id in range(n_clusters):
                cluster_bins = [bins[i] for i, c in enumerate(clusters) if c == cluster_id]
                
                if cluster_bins:
                    # Sort bins in cluster by priority (fill level)
                    cluster_bins.sort(key=lambda x: x['current_level'], reverse=True)
                    
                    # Calculate route statistics
                    total_capacity = sum(bin['capacity'] for bin in cluster_bins)
                    avg_fill_level = sum(bin['current_level'] for bin in cluster_bins) / len(cluster_bins)
                    
                    route = {
                        "route_id": f"route_{cluster_id + 1}",
                        "bins": cluster_bins,
                        "bin_count": len(cluster_bins),
                        "total_capacity": total_capacity,
                        "avg_fill_level": avg_fill_level,
                        "priority": "high" if avg_fill_level > 80 else "medium" if avg_fill_level > 60 else "low",
                        "estimated_time": len(cluster_bins) * 15,  # 15 minutes per bin
                        "center": {
                            "lat": np.mean([bin['coordinates']['lat'] for bin in cluster_bins]),
                            "lng": np.mean([bin['coordinates']['lng'] for bin in cluster_bins])
                        }
                    }
                    routes.append(route)
            
            # Sort routes by priority
            routes.sort(key=lambda x: x['avg_fill_level'], reverse=True)
            
            return {
                "routes": routes,
                "total_bins": len(bins),
                "bins_to_collect": len(data),
                "optimization_score": self._calculate_optimization_score(routes),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing routes: {e}")
            return {"error": str(e)}
    
    def _calculate_optimization_score(self, routes):
        """Calculate optimization score (0-100)"""
        if not routes:
            return 0
        
        # Score based on route balance and efficiency
        bin_counts = [route['bin_count'] for route in routes]
        balance_score = 100 - (np.std(bin_counts) / np.mean(bin_counts) * 100) if np.mean(bin_counts) > 0 else 0
        
        # Priority distribution score
        high_priority = sum(1 for route in routes if route['priority'] == 'high')
        priority_score = min(100, high_priority * 20)  # Max 100 for 5+ high priority routes
        
        return min(100, (balance_score + priority_score) / 2)
    
    def save_model(self, filepath="route_optimizer.pkl"):
        """Save the trained model"""
        model_data = {
            'scaler': self.scaler,
            'kmeans': self.kmeans
        }
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath="route_optimizer.pkl"):
        """Load a trained model"""
        try:
            model_data = joblib.load(filepath)
            self.scaler = model_data['scaler']
            self.kmeans = model_data['kmeans']
            logger.info(f"Model loaded from {filepath}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")


def main():
    """Test the route optimizer"""
    optimizer = RouteOptimizer()
    
    # Test with sample data
    print("Testing Route Optimizer...")
    result = optimizer.optimize_routes(zone_id=1)
    
    if 'error' in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Generated {len(result['routes'])} optimized routes")
        print(f"Optimization Score: {result['optimization_score']:.1f}/100")
        
        for i, route in enumerate(result['routes']):
            print(f"\nRoute {i+1} ({route['priority']} priority):")
            print(f"  - Bins: {route['bin_count']}")
            print(f"  - Avg Fill: {route['avg_fill_level']:.1f}%")
            print(f"  - Est. Time: {route['estimated_time']} minutes")


if __name__ == "__main__":
    main()