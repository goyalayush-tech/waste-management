"""
Database models initialization
"""
from .user import User, UserType
from .zone import Zone
from .waste_bin import WasteBin, BinStatus
from .waste_entry import WasteEntry, WasteType
from .vehicle import Vehicle, VehicleStatus
from .collection import Collection, CollectionBin
from .alert import Alert, AlertType, AlertStatus
from .blockchain_transaction import BlockchainTransaction

__all__ = [
    'User', 'UserType',
    'Zone',
    'WasteBin', 'BinStatus',
    'WasteEntry', 'WasteType',
    'Vehicle', 'VehicleStatus',
    'Collection', 'CollectionBin',
    'Alert', 'AlertType', 'AlertStatus',
    'BlockchainTransaction'
]