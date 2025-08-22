import random
from datetime import datetime, timezone

from simulators.base_simulator import BaseSimulator
from utils import generate_random_point_in_polygon, load_geojson_area


class SmartBinSimulator(BaseSimulator):
    """
    Simulates a smart waste bin, generating data for fill level, temperature,
    and other relevant metrics.
    """
    def __init__(self, bin_id, location_polygon):
        super().__init__(client_id_prefix=f"smart-bin-{bin_id}")
        self.bin_id = bin_id
        self.location_polygon = location_polygon
        self.location = generate_random_point_in_polygon(self.location_polygon)
        self.fill_level = random.uniform(0, 20)  # Start with a low fill level
        self.temperature = random.uniform(25, 35) # Ambient temperature
        self.status = "active"

    def generate_data(self):
        """
        Generates a new data point for the smart bin.
        """
        # Simulate a gradual increase in fill level
        self.fill_level += random.uniform(0.5, 2)
        if self.fill_level > 100:
            self.fill_level = 100
            self.status = "full"
        
        # Simulate temperature fluctuations
        self.temperature += random.uniform(-1, 1)
        if self.temperature > 50: # Overheating
            self.status = "maintenance_required"

        return {
            "bin_id": self.bin_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "location": {
                "latitude": self.location[0],
                "longitude": self.location[1]
            },
            "fill_level_percent": round(self.fill_level, 2),
            "temperature_celsius": round(self.temperature, 2),
            "status": self.status,
            "waste_type": random.choice(["general", "recyclable", "organic"]),
            "battery_level": round(random.uniform(80, 100), 2) # Assuming good battery
        }
