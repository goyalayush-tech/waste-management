"""
Zone model for Delhi area management
"""
from datetime import datetime
from app import db


class Zone(db.Model):
    """Zone model representing different areas of Delhi"""
    __tablename__ = 'zones'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    area = db.Column(db.Float, nullable=False)  # in square kilometers
    population = db.Column(db.Integer, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    boundaries = db.Column(db.JSON)  # GeoJSON polygon data
    waste_generation_rate = db.Column(db.Float, default=0.5)  # kg per person per day
    collection_frequency = db.Column(db.Integer, default=1)  # times per day
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    waste_bins = db.relationship('WasteBin', backref='zone', lazy='dynamic', cascade='all, delete-orphan')
    vehicles = db.relationship('Vehicle', backref='zone', lazy='dynamic')
    
    def __repr__(self):
        return f'<Zone {self.name}>'
    
    def to_dict(self, include_stats=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'area': self.area,
            'population': self.population,
            'coordinates': {
                'lat': self.latitude,
                'lng': self.longitude
            },
            'boundaries': self.boundaries,
            'waste_generation_rate': self.waste_generation_rate,
            'collection_frequency': self.collection_frequency,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data['stats'] = {
                'total_bins': self.waste_bins.count(),
                'active_bins': self.waste_bins.filter_by(is_active=True).count(),
                'total_vehicles': self.vehicles.count(),
                'active_vehicles': self.vehicles.filter_by(is_active=True).count(),
                'estimated_daily_waste': self.population * self.waste_generation_rate
            }
        
        return data
    
    def get_bin_fill_average(self):
        """Get average fill level of all bins in zone"""
        bins = self.waste_bins.filter_by(is_active=True).all()
        if not bins:
            return 0
        return sum(bin.current_level for bin in bins) / len(bins)
    
    def get_collection_efficiency(self):
        """Calculate collection efficiency for the zone"""
        # This would involve analyzing collection data
        # For now, return a placeholder
        return 85.0  # percentage