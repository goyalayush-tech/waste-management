"""
Custom decorators for authentication and authorization
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import User, UserType


def admin_required():
    """Decorator to require admin privileges"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type != UserType.ADMIN:
                return jsonify({'error': 'Admin privileges required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def collector_required():
    """Decorator to require collector privileges"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type not in [UserType.COLLECTOR, UserType.ADMIN]:
                return jsonify({'error': 'Collector privileges required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def business_required():
    """Decorator to require business privileges"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type not in [UserType.BUSINESS, UserType.ADMIN]:
                return jsonify({'error': 'Business privileges required'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator