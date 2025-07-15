"""
Blockchain transaction model for tracking on-chain activities
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from app import db


class TransactionType(Enum):
    """Transaction type enumeration"""
    WASTE_ENTRY = 'waste_entry'
    COLLECTION = 'collection'
    VERIFICATION = 'verification'
    REWARD = 'reward'


class TransactionStatus(Enum):
    """Transaction status enumeration"""
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    FAILED = 'failed'


class BlockchainTransaction(db.Model):
    """Blockchain transaction model"""
    __tablename__ = 'blockchain_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_hash = db.Column(db.String(100), unique=True, index=True)
    transaction_type = db.Column(SQLEnum(TransactionType), nullable=False)
    status = db.Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.PENDING)
    from_address = db.Column(db.String(100))
    to_address = db.Column(db.String(100))
    
    # Related entities
    waste_entry_id = db.Column(db.Integer, db.ForeignKey('waste_entries.id'), nullable=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collections.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Transaction details
    block_number = db.Column(db.Integer)
    gas_used = db.Column(db.Integer)
    gas_price = db.Column(db.String(50))  # Wei value as string
    value = db.Column(db.String(50))  # Wei value as string
    data = db.Column(db.JSON)  # Transaction input data
    contract_address = db.Column(db.String(100))
    
    # Metadata
    error_message = db.Column(db.Text)
    confirmations = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    
    # Relationships
    waste_entry = db.relationship('WasteEntry', backref='blockchain_transaction', uselist=False)
    collection = db.relationship('Collection', backref='blockchain_transaction', uselist=False)
    user = db.relationship('User', backref='blockchain_transactions')
    
    def __repr__(self):
        return f'<BlockchainTransaction {self.transaction_hash}>'
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'transaction_hash': self.transaction_hash,
            'transaction_type': self.transaction_type.value,
            'status': self.status.value,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'waste_entry_id': self.waste_entry_id,
            'collection_id': self.collection_id,
            'user_id': self.user_id,
            'block_number': self.block_number,
            'gas_used': self.gas_used,
            'gas_price': self.gas_price,
            'value': self.value,
            'data': self.data,
            'contract_address': self.contract_address,
            'error_message': self.error_message,
            'confirmations': self.confirmations,
            'created_at': self.created_at.isoformat(),
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }
    
    def get_explorer_url(self):
        """Get blockchain explorer URL"""
        # Mumbai testnet explorer
        return f"https://mumbai.polygonscan.com/tx/{self.transaction_hash}"