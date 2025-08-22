import random
from datetime import datetime, timezone

from simulators.base_simulator import BaseSimulator
from utils import generate_random_point_in_polygon


class WasteCollectionVehicleSimulator(BaseSimulator):
    """
    Simulates a waste collection vehicle, tracking its location, route,
    and collected waste volume.
    """
    def __init__(self, vehicle_id, route_polygon):
        super().__init__(client_id_prefix=f"vehicle-{vehicle_id}")
        self.vehicle_id = vehicle_id
        self.route_polygon = route_polygon
        self.current_location = generate_random_point_in_polygon(self.route_polygon)
        self.status = "on_route"
        self.current_load_kg = 0
        self.max_load_kg = 5000 # 5 metric tons

    def generate_data(self):
        """
        Generates a new data point for the vehicle.
        """
        # Simulate movement
        lat, lon = self.current_location
        new_lat = lat + random.uniform(-0.001, 0.001)
        new_lon = lon + random.uniform(-0.001, 0.001)
        self.current_location = (new_lat, new_lon)

        # Simulate waste collection
        if self.status == "on_route" and random.random() > 0.8:
            collected_amount = random.uniform(100, 500)
            if self.current_load_kg + collected_amount <= self.max_load_kg:
                self.current_load_kg += collected_amount
            else:
                self.current_load_kg = self.max_load_kg
                self.status = "returning_to_depot"

        return {
            "vehicle_id": self.vehicle_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "current_location": {
                "latitude": self.current_location[0],
                "longitude": self.current_location[1]
            },
            "status": self.status,
            "current_load_kg": round(self.current_load_kg, 2),
            "fuel_level_percent": round(random.uniform(40, 90), 2),
            "driver_id": f"driver_{self.vehicle_id}"
        }
