"""
Collection model for tracking waste collection activities
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class CollectionStatus(Enum):
    """Collection status enumeration"""
    SCHEDULED = 'scheduled'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'


class Collection(db.Model):
    """Collection model for tracking collection activities"""
    __tablename__ = 'collections'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    collector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    route_id = db.Column(db.String(100))  # External route identifier
    status = db.Column(SQLEnum(CollectionStatus), nullable=False, default=CollectionStatus.SCHEDULED)
    scheduled_start = db.Column(db.DateTime, nullable=False)
    actual_start = db.Column(db.DateTime)
    actual_end = db.Column(db.DateTime)
    total_weight = db.Column(db.Float, default=0.0)  # in kg
    total_bins = db.Column(db.Integer, default=0)
    distance_covered = db.Column(db.Float, default=0.0)  # in km
    fuel_consumed = db.Column(db.Float, default=0.0)  # in liters
    route_data = db.Column(db.JSON)  # Store route coordinates and waypoints
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    collection_bins = db.relationship('CollectionBin', backref='collection', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Collection {self.id} - {self.status.value}>'
    
    def calculate_efficiency(self):
        """Calculate collection efficiency"""
        if self.status != CollectionStatus.COMPLETED:
            return None
        
        if not self.actual_start or not self.actual_end:
            return None
        
        duration = (self.actual_end - self.actual_start).total_seconds() / 3600  # hours
        
        return {
            'duration_hours': duration,
            'bins_per_hour': self.total_bins / duration if duration > 0 else 0,
            'weight_per_hour': self.total_weight / duration if duration > 0 else 0,
            'fuel_efficiency': self.distance_covered / self.fuel_consumed if self.fuel_consumed > 0 else 0
        }
    
    def to_dict(self, include_bins=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle_number': self.vehicle.vehicle_number if self.vehicle else None,
            'collector_id': self.collector_id,
            'collector_name': self.collector.name if self.collector else None,
            'route_id': self.route_id,
            'status': self.status.value,
            'scheduled_start': self.scheduled_start.isoformat(),
            'actual_start': self.actual_start.isoformat() if self.actual_start else None,
            'actual_end': self.actual_end.isoformat() if self.actual_end else None,
            'total_weight': self.total_weight,
            'total_bins': self.total_bins,
            'distance_covered': self.distance_covered,
            'fuel_consumed': self.fuel_consumed,
            'route_data': self.route_data,
            'notes': self.notes,
            'efficiency': self.calculate_efficiency(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_bins:
            data['bins'] = [cb.to_dict() for cb in self.collection_bins.all()]
        
        return data


class CollectionBin(db.Model):
    """Association table for collections and bins"""
    __tablename__ = 'collection_bins'
    
    id = db.Column(db.Integer, primary_key=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collections.id'), nullable=False)
    bin_id = db.Column(db.Integer, db.ForeignKey('waste_bins.id'), nullable=False)
    collected_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    weight_collected = db.Column(db.Float)  # in kg
    fill_level_before = db.Column(db.Float)  # percentage
    fill_level_after = db.Column(db.Float, default=0.0)  # percentage (should be 0 after collection)
    collection_time = db.Column(db.Integer)  # seconds taken to empty
    notes = db.Column(db.Text)
    
    def __repr__(self):
        return f'<CollectionBin {self.collection_id}-{self.bin_id}>'
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'collection_id': self.collection_id,
            'bin_id': self.bin_id,
            'bin_code': self.bin.bin_code if self.bin else None,
            'bin_location': self.bin.get_location_string() if self.bin else None,
            'collected_at': self.collected_at.isoformat(),
            'weight_collected': self.weight_collected,
            'fill_level_before': self.fill_level_before,
            'fill_level_after': self.fill_level_after,
            'collection_time': self.collection_time,
            'notes': self.notes
        }