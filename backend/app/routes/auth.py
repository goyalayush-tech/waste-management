"""
Authentication routes
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash
from app import db
from app.models import User, UserType
from app.utils.validators import validate_email, validate_password
from app.utils.decorators import admin_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'user_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Validate password
        password_error = validate_password(data['password'])
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # Validate user type
        try:
            user_type = UserType(data['user_type'])
        except ValueError:
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            phone=data.get('phone'),
            user_type=user_type,
            zone_id=data.get('zone_id'),
            address=data.get('address')
        )
        user.set_password(data['password'])
        
        # Add business fields if applicable
        if user_type == UserType.BUSINESS:
            user.business_name = data.get('business_name')
            user.business_type = data.get('business_type')
            user.gst_number = data.get('gst_number')
        
        db.session.add(user)
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout"""
    try:
        # In a production app, you might want to blacklist the token here
        # For now, we'll just return a success message
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        user = User.query.get(user_id)
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        password_error = validate_password(data['new_password'])
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # Update password
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            # Don't reveal if email exists
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
        # Generate reset token (in production, send this via email)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        
        # In production, send email with reset link
        # For now, return token (remove in production!)
        return jsonify({
            'message': 'Password reset token generated',
            'reset_token': reset_token  # Remove this in production!
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('token') or not data.get('new_password'):
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Find user with valid token
        user = User.query.filter_by(reset_token=data['token']).first()
        
        if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired reset token'}), 401
        
        # Validate new password
        password_error = validate_password(data['new_password'])
        if password_error:
            return jsonify({'error': password_error}), 400
        
        # Update password and clear reset token
        user.set_password(data['new_password'])
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500