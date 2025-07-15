"""
Waste bins routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_, or_
from app import db, socketio
from app.models import WasteBin, BinStatus, Zone, Alert, AlertType
from app.utils.decorators import admin_required, collector_required
from app.utils.pagination import paginate

bins_bp = Blueprint('bins', __name__)


@bins_bp.route('/', methods=['GET'])
@jwt_required()
def get_bins():
    """Get all waste bins with filtering"""
    try:
        # Get query parameters
        zone_id = request.args.get('zone_id', type=int)
        status = request.args.get('status')
        bin_type = request.args.get('bin_type')
        is_active = request.args.get('is_active', type=lambda x: x.lower() == 'true')
        min_fill = request.args.get('min_fill', type=float)
        max_fill = request.args.get('max_fill', type=float)
        search = request.args.get('search')
        
        # Build query
        query = WasteBin.query
        
        if zone_id:
            query = query.filter_by(zone_id=zone_id)
        
        if status:
            try:
                status_enum = BinStatus(status)
                query = query.filter_by(status=status_enum)
            except ValueError:
                pass
        
        if bin_type:
            query = query.filter_by(bin_type=bin_type)
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        if min_fill is not None:
            query = query.filter(WasteBin.current_level >= min_fill)
        
        if max_fill is not None:
            query = query.filter(WasteBin.current_level <= max_fill)
        
        if search:
            query = query.filter(
                or_(
                    WasteBin.bin_code.ilike(f'%{search}%'),
                    WasteBin.address.ilike(f'%{search}%'),
                    WasteBin.landmark.ilike(f'%{search}%')
                )
            )
        
        # Order by fill level (descending) to prioritize full bins
        query = query.order_by(WasteBin.current_level.desc())
        
        # Paginate results
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        pagination = paginate(query, page, per_page)
        
        return jsonify({
            'bins': [bin.to_dict(include_stats=True) for bin in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/<int:bin_id>', methods=['GET'])
@jwt_required()
def get_bin(bin_id):
    """Get specific bin details"""
    try:
        bin = WasteBin.query.get_or_404(bin_id)
        
        return jsonify({
            'bin': bin.to_dict(include_stats=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/', methods=['POST'])
@admin_required()
def create_bin():
    """Create a new waste bin"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['bin_code', 'zone_id', 'latitude', 'longitude', 'address', 'capacity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if bin code already exists
        if WasteBin.query.filter_by(bin_code=data['bin_code']).first():
            return jsonify({'error': 'Bin code already exists'}), 409
        
        # Validate zone exists
        zone = Zone.query.get(data['zone_id'])
        if not zone:
            return jsonify({'error': 'Invalid zone ID'}), 400
        
        # Create new bin
        bin = WasteBin(
            bin_code=data['bin_code'],
            zone_id=data['zone_id'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            address=data['address'],
            landmark=data.get('landmark'),
            capacity=data['capacity'],
            bin_type=data.get('bin_type', 'mixed'),
            sensor_id=data.get('sensor_id'),
            installation_date=datetime.utcnow().date(),
            qr_code=data.get('qr_code'),
            image_url=data.get('image_url')
        )
        
        db.session.add(bin)
        db.session.commit()
        
        return jsonify({
            'message': 'Bin created successfully',
            'bin': bin.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/<int:bin_id>', methods=['PUT'])
@admin_required()
def update_bin(bin_id):
    """Update bin information"""
    try:
        bin = WasteBin.query.get_or_404(bin_id)
        data = request.get_json()
        
        # Update allowed fields
        updateable_fields = [
            'address', 'landmark', 'capacity', 'bin_type', 
            'sensor_id', 'is_active', 'maintenance_due', 
            'qr_code', 'image_url'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(bin, field, data[field])
        
        # Update location if provided
        if 'latitude' in data and 'longitude' in data:
            bin.latitude = data['latitude']
            bin.longitude = data['longitude']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bin updated successfully',
            'bin': bin.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/<int:bin_id>', methods=['DELETE'])
@admin_required()
def delete_bin(bin_id):
    """Delete a waste bin"""
    try:
        bin = WasteBin.query.get_or_404(bin_id)
        
        # Soft delete by deactivating
        bin.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Bin deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/<int:bin_id>/level', methods=['POST'])
@jwt_required()
def update_bin_level(bin_id):
    """Update bin fill level (from IoT sensor or manual)"""
    try:
        bin = WasteBin.query.get_or_404(bin_id)
        data = request.get_json()
        
        if 'level' not in data:
            return jsonify({'error': 'Level is required'}), 400
        
        new_level = data['level']
        if not 0 <= new_level <= 100:
            return jsonify({'error': 'Level must be between 0 and 100'}), 400
        
        old_level = bin.current_level
        bin.current_level = new_level
        bin.last_sensor_update = datetime.utcnow()
        bin.update_status()
        
        # Create alert if bin is getting full
        if new_level >= 80 and old_level < 80:
            alert = Alert.create_bin_full_alert(bin_id, new_level)
            if alert:
                db.session.add(alert)
        
        db.session.commit()
        
        # Emit real-time update via WebSocket
        socketio.emit('bin_level_update', {
            'bin_id': bin_id,
            'bin_code': bin.bin_code,
            'level': new_level,
            'status': bin.status.value,
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/bins')
        
        return jsonify({
            'message': 'Bin level updated successfully',
            'bin': bin.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/<int:bin_id>/empty', methods=['POST'])
@collector_required()
def empty_bin(bin_id):
    """Mark bin as emptied"""
    try:
        bin = WasteBin.query.get_or_404(bin_id)
        user_id = get_jwt_identity()
        
        # Update bin status
        bin.current_level = 0.0
        bin.status = BinStatus.EMPTY
        bin.last_emptied = datetime.utcnow()
        
        # Resolve any active alerts for this bin
        active_alerts = Alert.query.filter_by(
            bin_id=bin_id,
            status=AlertStatus.ACTIVE
        ).all()
        
        for alert in active_alerts:
            alert.resolve(user_id, "Bin emptied")
        
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('bin_emptied', {
            'bin_id': bin_id,
            'bin_code': bin.bin_code,
            'emptied_by': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/bins')
        
        return jsonify({
            'message': 'Bin marked as empty',
            'bin': bin.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bins_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_bins():
    """Get bins near a specific location"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 1.0, type=float)  # km
        
        if lat is None or lng is None:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        # Simple distance calculation (for small distances)
        # In production, use PostGIS or similar for accurate calculations
        bins = WasteBin.query.filter_by(is_active=True).all()
        
        nearby_bins = []
        for bin in bins:
            # Haversine formula for distance
            from math import radians, sin, cos, sqrt, atan2
            
            R = 6371  # Earth's radius in km
            lat1, lon1 = radians(lat), radians(lng)
            lat2, lon2 = radians(bin.latitude), radians(bin.longitude)
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            if distance <= radius:
                bin_dict = bin.to_dict()
                bin_dict['distance'] = round(distance, 2)
                nearby_bins.append(bin_dict)
        
        # Sort by distance
        nearby_bins.sort(key=lambda x: x['distance'])
        
        return jsonify({
            'bins': nearby_bins,
            'total': len(nearby_bins)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500