"""
Routes package initialization
"""
from .auth import auth_bp
from .users import users_bp
from .zones import zones_bp
from .bins import bins_bp
from .waste import waste_bp
from .collections import collections_bp
from .analytics import analytics_bp
from .alerts import alerts_bp
from .blockchain import blockchain_bp

__all__ = [
    'auth_bp',
    'users_bp', 
    'zones_bp',
    'bins_bp',
    'waste_bp',
    'collections_bp',
    'analytics_bp',
    'alerts_bp',
    'blockchain_bp'
]