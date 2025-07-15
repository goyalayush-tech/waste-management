"""
Waste bin model for tracking bin locations and status
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class BinStatus(Enum):
    """Bin status enumeration"""
    EMPTY = 'empty'
    PARTIAL = 'partial'
    FULL = 'full'
    OVERFLOWING = 'overflowing'
    MAINTENANCE = 'maintenance'


class WasteBin(db.Model):
    """Waste bin model"""
    __tablename__ = 'waste_bins'
    
    id = db.Column(db.Integer, primary_key=True)
    bin_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.Text, nullable=False)
    landmark = db.Column(db.String(200))
    capacity = db.Column(db.Float, nullable=False)  # in liters
    current_level = db.Column(db.Float, default=0.0)  # percentage (0-100)
    status = db.Column(SQLEnum(BinStatus), nullable=False, default=BinStatus.EMPTY)
    bin_type = db.Column(db.String(50), default='mixed')  # mixed, organic, recyclable, etc.
    last_emptied = db.Column(db.DateTime)
    last_sensor_update = db.Column(db.DateTime)
    sensor_id = db.Column(db.String(100))  # IoT sensor identifier
    is_active = db.Column(db.Boolean, default=True)
    installation_date = db.Column(db.Date)
    maintenance_due = db.Column(db.Date)
    qr_code = db.Column(db.String(200))  # QR code for bin identification
    image_url = db.Column(db.String(500))  # Photo of bin location
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    waste_entries = db.relationship('WasteEntry', backref='bin', lazy='dynamic', cascade='all, delete-orphan')
    collection_bins = db.relationship('CollectionBin', backref='bin', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='bin', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<WasteBin {self.bin_code}>'
    
    def update_status(self):
        """Update bin status based on current level"""
        if self.current_level >= 100:
            self.status = BinStatus.OVERFLOWING
        elif self.current_level >= 80:
            self.status = BinStatus.FULL
        elif self.current_level >= 30:
            self.status = BinStatus.PARTIAL
        else:
            self.status = BinStatus.EMPTY
    
    def calculate_fill_rate(self):
        """Calculate average fill rate per day"""
        if not self.last_emptied:
            return 0.0
        
        days_since_empty = (datetime.utcnow() - self.last_emptied).days
        if days_since_empty == 0:
            return self.current_level
        
        return self.current_level / days_since_empty
    
    def to_dict(self, include_stats=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'bin_code': self.bin_code,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else None,
            'coordinates': {
                'lat': self.latitude,
                'lng': self.longitude
            },
            'address': self.address,
            'landmark': self.landmark,
            'capacity': self.capacity,
            'current_level': self.current_level,
            'status': self.status.value,
            'bin_type': self.bin_type,
            'last_emptied': self.last_emptied.isoformat() if self.last_emptied else None,
            'last_sensor_update': self.last_sensor_update.isoformat() if self.last_sensor_update else None,
            'sensor_id': self.sensor_id,
            'is_active': self.is_active,
            'installation_date': self.installation_date.isoformat() if self.installation_date else None,
            'maintenance_due': self.maintenance_due.isoformat() if self.maintenance_due else None,
            'qr_code': self.qr_code,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data['stats'] = {
                'fill_rate': self.calculate_fill_rate(),
                'days_since_empty': (datetime.utcnow() - self.last_emptied).days if self.last_emptied else None,
                'total_entries': self.waste_entries.count(),
                'alerts_count': self.alerts.filter_by(is_resolved=False).count()
            }
        
        return data
    
    def get_location_string(self):
        """Get formatted location string"""
        location = self.address
        if self.landmark:
            location += f" (near {self.landmark})"
        return location