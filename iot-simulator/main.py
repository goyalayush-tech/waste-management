import os
import time
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

from simulators.smart_bin_simulator import SmartBinSimulator
from simulators.waste_collection_vehicle_simulator import WasteCollectionVehicleSimulator
from utils import load_geojson_area

load_dotenv()

def main():
    """
    Main function to initialize and run the IoT simulators.
    """
    area_geojson_path = os.getenv("AREA_GEOJSON_PATH", "data/delhi_area.geojson")
    num_bins = int(os.getenv("NUM_BINS", "20"))
    num_vehicles = int(os.getenv("NUM_VEHICLES", "5"))
    simulation_interval = int(os.getenv("SIMULATION_INTERVAL_SECONDS", "10"))

    # Load the simulation area
    try:
        delhi_polygon = load_geojson_area(area_geojson_path)
    except FileNotFoundError:
        print(f"Error: GeoJSON file not found at {area_geojson_path}")
        return

    # Initialize simulators
    simulators = []
    for i in range(num_bins):
        simulators.append(SmartBinSimulator(bin_id=f"BIN{i+1:03}", location_polygon=delhi_polygon))
    
    for i in range(num_vehicles):
        simulators.append(WasteCollectionVehicleSimulator(vehicle_id=f"VEH{i+1:02}", route_polygon=delhi_polygon))

    # Connect all simulators to MQTT
    for sim in simulators:
        sim.connect()

    # Schedule data publishing
    scheduler = BackgroundScheduler()
    for sim in simulators:
        scheduler.add_job(sim.publish_data, 'interval', seconds=simulation_interval)
    
    scheduler.start()
    print("IoT Simulation started. Press Ctrl+C to exit.")

    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        print("Shutting down simulators...")
        scheduler.shutdown()
        for sim in simulators:
            sim.disconnect()
        print("Simulators stopped.")

if __name__ == "__main__":
    main()
