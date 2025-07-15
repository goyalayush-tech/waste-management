"""
Waste entry model for tracking waste disposal records
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class WasteType(Enum):
    """Waste type enumeration"""
    ORGANIC = 'organic'
    PLASTIC = 'plastic'
    PAPER = 'paper'
    METAL = 'metal'
    EWASTE = 'ewaste'
    MIXED = 'mixed'


class WasteEntry(db.Model):
    """Waste entry model for tracking individual waste disposals"""
    __tablename__ = 'waste_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    bin_id = db.Column(db.Integer, db.ForeignKey('waste_bins.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    waste_type = db.Column(SQLEnum(WasteType), nullable=False)
    quantity = db.Column(db.Float, nullable=False)  # in kilograms
    volume = db.Column(db.Float)  # in liters (optional)
    image_url = db.Column(db.String(500))  # Photo of waste (for verification)
    is_verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verification_notes = db.Column(db.Text)
    points_earned = db.Column(db.Integer, default=0)  # Reward points for proper disposal
    blockchain_tx_hash = db.Column(db.String(100))  # Blockchain transaction hash
    metadata = db.Column(db.JSON)  # Additional data (e.g., contamination level, recyclability)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_entries')
    
    def __repr__(self):
        return f'<WasteEntry {self.id} - {self.waste_type.value}>'
    
    def calculate_points(self):
        """Calculate reward points based on waste type and quantity"""
        points_multiplier = {
            WasteType.ORGANIC: 2,
            WasteType.PLASTIC: 5,
            WasteType.PAPER: 3,
            WasteType.METAL: 4,
            WasteType.EWASTE: 10,
            WasteType.MIXED: 1
        }
        
        base_points = points_multiplier.get(self.waste_type, 1)
        quantity_bonus = int(self.quantity * 10)  # 10 points per kg
        
        return base_points * quantity_bonus
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'bin_id': self.bin_id,
            'bin_code': self.bin.bin_code if self.bin else None,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Anonymous',
            'waste_type': self.waste_type.value,
            'quantity': self.quantity,
            'volume': self.volume,
            'image_url': self.image_url,
            'is_verified': self.is_verified,
            'verified_by': self.verified_by,
            'verifier_name': self.verifier.name if self.verifier else None,
            'verification_notes': self.verification_notes,
            'points_earned': self.points_earned,
            'blockchain_tx_hash': self.blockchain_tx_hash,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat()
        }
    
    def get_environmental_impact(self):
        """Calculate environmental impact of the waste entry"""
        # CO2 saved by recycling (kg CO2 per kg waste)
        co2_factors = {
            WasteType.PLASTIC: 2.0,
            WasteType.PAPER: 0.9,
            WasteType.METAL: 3.5,
            WasteType.EWASTE: 5.0,
            WasteType.ORGANIC: 0.5,  # through composting
            WasteType.MIXED: 0.2
        }
        
        co2_saved = self.quantity * co2_factors.get(self.waste_type, 0)
        
        return {
            'co2_saved': co2_saved,
            'trees_equivalent': co2_saved / 21.77,  # Average tree absorbs 21.77 kg CO2/year
            'recyclable': self.waste_type != WasteType.MIXED
        }