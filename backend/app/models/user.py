"""
User model for authentication and role management
"""
from datetime import datetime
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Enum as SQLEnum
from app import db


class UserType(Enum):
    """User type enumeration"""
    CITIZEN = 'citizen'
    BUSINESS = 'business'
    COLLECTOR = 'collector'
    ADMIN = 'admin'


class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    user_type = db.Column(SQLEnum(UserType), nullable=False, default=UserType.CITIZEN)
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.id'), nullable=True)
    address = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    reset_token = db.Column(db.String(100))
    reset_token_expires = db.Column(db.DateTime)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    zone = db.relationship('Zone', backref='users', lazy=True)
    waste_entries = db.relationship('WasteEntry', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    collections = db.relationship('Collection', backref='collector', lazy='dynamic', foreign_keys='Collection.collector_id')
    alerts = db.relationship('Alert', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    # Business-specific fields
    business_name = db.Column(db.String(200))
    business_type = db.Column(db.String(100))
    gst_number = db.Column(db.String(50))
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'user_type': self.user_type.value,
            'zone_id': self.zone_id,
            'zone_name': self.zone.name if self.zone else None,
            'address': self.address,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        # Add business fields if applicable
        if self.user_type == UserType.BUSINESS:
            data.update({
                'business_name': self.business_name,
                'business_type': self.business_type,
                'gst_number': self.gst_number
            })
        
        return data
    
    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.user_type == UserType.ADMIN
    
    @property
    def is_collector(self):
        """Check if user is collector"""
        return self.user_type == UserType.COLLECTOR
    
    @property
    def is_business(self):
        """Check if user is business"""
        return self.user_type == UserType.BUSINESS