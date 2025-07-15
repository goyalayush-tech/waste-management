"""
Vehicle model for waste collection vehicles
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class VehicleStatus(Enum):
    """Vehicle status enumeration"""
    IDLE = 'idle'
    IN_TRANSIT = 'in_transit'
    COLLECTING = 'collecting'
    RETURNING = 'returning'
    MAINTENANCE = 'maintenance'
    OFFLINE = 'offline'


class Vehicle(db.Model):
    """Vehicle model for waste collection trucks"""
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    vehicle_type = db.Column(db.String(50), nullable=False)  # truck, mini-truck, auto, etc.
    capacity = db.Column(db.Float, nullable=False)  # in tons
    current_load = db.Column(db.Float, default=0.0)  # in tons
    fuel_type = db.Column(db.String(30))  # diesel, cng, electric
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(SQLEnum(VehicleStatus), nullable=False, default=VehicleStatus.IDLE)
    current_latitude = db.Column(db.Float)
    current_longitude = db.Column(db.Float)
    last_location_update = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    maintenance_due = db.Column(db.Date)
    last_maintenance = db.Column(db.Date)
    total_distance = db.Column(db.Float, default=0.0)  # in kilometers
    total_fuel = db.Column(db.Float, default=0.0)  # in liters
    gps_device_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver = db.relationship('User', backref='vehicle', uselist=False)
    collections = db.relationship('Collection', backref='vehicle', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Vehicle {self.vehicle_number}>'
    
    def update_location(self, latitude, longitude):
        """Update vehicle location"""
        self.current_latitude = latitude
        self.current_longitude = longitude
        self.last_location_update = datetime.utcnow()
    
    def calculate_efficiency(self):
        """Calculate vehicle efficiency"""
        if self.total_fuel == 0:
            return 0.0
        
        # km per liter
        return self.total_distance / self.total_fuel
    
    def get_load_percentage(self):
        """Get current load as percentage of capacity"""
        if self.capacity == 0:
            return 0.0
        return (self.current_load / self.capacity) * 100
    
    def to_dict(self, include_stats=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'vehicle_number': self.vehicle_number,
            'vehicle_type': self.vehicle_type,
            'capacity': self.capacity,
            'current_load': self.current_load,
            'load_percentage': self.get_load_percentage(),
            'fuel_type': self.fuel_type,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else None,
            'driver_id': self.driver_id,
            'driver_name': self.driver.name if self.driver else None,
            'status': self.status.value,
            'current_location': {
                'lat': self.current_latitude,
                'lng': self.current_longitude
            } if self.current_latitude and self.current_longitude else None,
            'last_location_update': self.last_location_update.isoformat() if self.last_location_update else None,
            'is_active': self.is_active,
            'maintenance_due': self.maintenance_due.isoformat() if self.maintenance_due else None,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'gps_device_id': self.gps_device_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data['stats'] = {
                'total_distance': self.total_distance,
                'total_fuel': self.total_fuel,
                'efficiency': self.calculate_efficiency(),
                'collections_today': self.collections.filter(
                    Collection.created_at >= datetime.utcnow().date()
                ).count(),
                'total_collections': self.collections.count()
            }
        
        return data
    
    def needs_maintenance(self):
        """Check if vehicle needs maintenance"""
        if not self.maintenance_due:
            return False
        return datetime.utcnow().date() >= self.maintenance_due