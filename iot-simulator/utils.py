import geojson
import numpy as np

def load_geojson_area(path):
    """Loads a GeoJSON file and returns the first polygon's coordinates."""
    with open(path) as f:
        gj = geojson.load(f)
    # Assuming the first feature is the area of interest and it's a Polygon
    polygon = gj['features'][0]['geometry']['coordinates'][0]
    return polygon

def generate_random_point_in_polygon(polygon):
    """Generates a random GPS coordinate within a given polygon."""
    min_lon, min_lat = np.min(polygon, axis=0)
    max_lon, max_lat = np.max(polygon, axis=0)
    
    while True:
        lon = np.random.uniform(min_lon, max_lon)
        lat = np.random.uniform(min_lat, max_lat)
        # This is a simple check and might not work for complex polygons.
        # A more robust solution would use a library like shapely.
        if is_point_in_polygon(lon, lat, polygon):
            return lat, lon

def is_point_in_polygon(lon, lat, polygon):
    """
    A simple ray-casting algorithm to check if a point is inside a polygon.
    """
    num_vertices = len(polygon)
    inside = False
    p1_lon, p1_lat = polygon[0]
    for i in range(1, num_vertices + 1):
        p2_lon, p2_lat = polygon[i % num_vertices]
        if min(p1_lat, p2_lat) < lat <= max(p1_lat, p2_lat):
            if lon <= max(p1_lon, p2_lon):
                if p1_lat != p2_lat:
                    lon_intersection = (lat - p1_lat) * (p2_lon - p1_lon) / (p2_lat - p1_lat) + p1_lon
                    if p1_lon == p2_lon or lon <= lon_intersection:
                        inside = not inside
        p1_lon, p1_lat = p2_lon, p2_lat
    return inside
