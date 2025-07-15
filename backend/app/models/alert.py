"""
Alert model for system notifications and alerts
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class AlertType(Enum):
    """Alert type enumeration"""
    BIN_FULL = 'bin_full'
    BIN_OVERFLOW = 'bin_overflow'
    COLLECTION_NEEDED = 'collection_needed'
    MAINTENANCE_DUE = 'maintenance_due'
    SENSOR_OFFLINE = 'sensor_offline'
    UNUSUAL_ACTIVITY = 'unusual_activity'
    VEHICLE_BREAKDOWN = 'vehicle_breakdown'
    ROUTE_DEVIATION = 'route_deviation'


class AlertPriority(Enum):
    """Alert priority enumeration"""
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'


class AlertStatus(Enum):
    """Alert status enumeration"""
    ACTIVE = 'active'
    ACKNOWLEDGED = 'acknowledged'
    RESOLVED = 'resolved'
    EXPIRED = 'expired'


class Alert(db.Model):
    """Alert model for system notifications"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(SQLEnum(AlertType), nullable=False)
    priority = db.Column(SQLEnum(AlertPriority), nullable=False, default=AlertPriority.MEDIUM)
    status = db.Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Related entities
    bin_id = db.Column(db.Integer, db.ForeignKey('waste_bins.id'), nullable=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.id'), nullable=True)
    
    # Alert handling
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    
    # Additional data
    metadata = db.Column(db.JSON)  # Store additional context-specific data
    expires_at = db.Column(db.DateTime)
    is_notified = db.Column(db.Boolean, default=False)  # Email/SMS sent
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_alerts')
    acknowledger = db.relationship('User', foreign_keys=[acknowledged_by])
    resolver = db.relationship('User', foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f'<Alert {self.id} - {self.alert_type.value}>'
    
    def acknowledge(self, user_id):
        """Acknowledge the alert"""
        self.status = AlertStatus.ACKNOWLEDGED
        self.acknowledged_by = user_id
        self.acknowledged_at = datetime.utcnow()
    
    def resolve(self, user_id, notes=None):
        """Resolve the alert"""
        self.status = AlertStatus.RESOLVED
        self.resolved_by = user_id
        self.resolved_at = datetime.utcnow()
        self.resolution_notes = notes
    
    def is_expired(self):
        """Check if alert has expired"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            self.status = AlertStatus.EXPIRED
            return True
        return False
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'alert_type': self.alert_type.value,
            'priority': self.priority.value,
            'status': self.status.value,
            'title': self.title,
            'description': self.description,
            'bin_id': self.bin_id,
            'bin_code': self.bin.bin_code if self.bin else None,
            'vehicle_id': self.vehicle_id,
            'vehicle_number': self.vehicle.vehicle_number if self.vehicle else None,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else None,
            'assigned_to': self.assigned_to,
            'assignee_name': self.assignee.name if self.assignee else None,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolved_by': self.resolved_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'metadata': self.metadata,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_notified': self.is_notified,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def create_bin_full_alert(bin_id, fill_level):
        """Create a bin full alert"""
        from app.models import WasteBin
        bin = WasteBin.query.get(bin_id)
        
        if not bin:
            return None
        
        priority = AlertPriority.CRITICAL if fill_level >= 100 else AlertPriority.HIGH
        
        return Alert(
            alert_type=AlertType.BIN_FULL,
            priority=priority,
            title=f"Bin {bin.bin_code} is {fill_level}% full",
            description=f"Waste bin at {bin.get_location_string()} requires immediate collection",
            bin_id=bin_id,
            zone_id=bin.zone_id,
            metadata={'fill_level': fill_level}
        )