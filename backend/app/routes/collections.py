from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Collection, Bin, User, Vehicle, db
from app.utils.decorators import role_required
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
import json

collections_bp = Blueprint('collections', __name__)

@collections_bp.route('/collections', methods=['GET'])
@jwt_required()
def get_collections():
    """Get all collections with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        # Filters
        status = request.args.get('status')
        zone_id = request.args.get('zone_id', type=int)
        vehicle_id = request.args.get('vehicle_id', type=int)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Collection.query
        
        # Apply filters
        if status:
            query = query.filter(Collection.status == status)
        if zone_id:
            query = query.join(Bin).filter(Bin.zone_id == zone_id)
        if vehicle_id:
            query = query.filter(Collection.vehicle_id == vehicle_id)
        if date_from:
            query = query.filter(Collection.scheduled_time >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Collection.scheduled_time <= datetime.fromisoformat(date_to))
        
        # Order by scheduled time
        query = query.order_by(Collection.scheduled_time.desc())
        
        collections = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'collections': [{
                'id': c.id,
                'bin_id': c.bin_id,
                'bin_location': c.bin.location if c.bin else None,
                'vehicle_id': c.vehicle_id,
                'vehicle_number': c.vehicle.license_plate if c.vehicle else None,
                'collector_id': c.collector_id,
                'collector_name': c.collector.name if c.collector else None,
                'scheduled_time': c.scheduled_time.isoformat(),
                'actual_time': c.actual_time.isoformat() if c.actual_time else None,
                'status': c.status,
                'waste_collected': c.waste_collected,
                'notes': c.notes,
                'created_at': c.created_at.isoformat()
            } for c in collections.items],
            'pagination': {
                'page': collections.page,
                'pages': collections.pages,
                'per_page': collections.per_page,
                'total': collections.total,
                'has_next': collections.has_next,
                'has_prev': collections.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections', methods=['POST'])
@jwt_required()
@role_required(['admin', 'collector'])
def create_collection():
    """Create a new collection"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['bin_id', 'scheduled_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if bin exists
        bin_obj = Bin.query.get(data['bin_id'])
        if not bin_obj:
            return jsonify({'error': 'Bin not found'}), 404
        
        # Parse scheduled time
        try:
            scheduled_time = datetime.fromisoformat(data['scheduled_time'])
        except ValueError:
            return jsonify({'error': 'Invalid scheduled_time format'}), 400
        
        # Create collection
        collection = Collection(
            bin_id=data['bin_id'],
            vehicle_id=data.get('vehicle_id'),
            collector_id=data.get('collector_id'),
            scheduled_time=scheduled_time,
            status='scheduled',
            notes=data.get('notes', '')
        )
        
        db.session.add(collection)
        db.session.commit()
        
        return jsonify({
            'message': 'Collection created successfully',
            'collection': {
                'id': collection.id,
                'bin_id': collection.bin_id,
                'vehicle_id': collection.vehicle_id,
                'collector_id': collection.collector_id,
                'scheduled_time': collection.scheduled_time.isoformat(),
                'status': collection.status,
                'notes': collection.notes
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/<int:collection_id>', methods=['GET'])
@jwt_required()
def get_collection(collection_id):
    """Get a specific collection"""
    try:
        collection = Collection.query.get_or_404(collection_id)
        
        return jsonify({
            'id': collection.id,
            'bin_id': collection.bin_id,
            'bin': {
                'id': collection.bin.id,
                'location': collection.bin.location,
                'zone_id': collection.bin.zone_id,
                'current_level': collection.bin.current_level
            } if collection.bin else None,
            'vehicle_id': collection.vehicle_id,
            'vehicle': {
                'id': collection.vehicle.id,
                'license_plate': collection.vehicle.license_plate,
                'capacity': collection.vehicle.capacity
            } if collection.vehicle else None,
            'collector_id': collection.collector_id,
            'collector': {
                'id': collection.collector.id,
                'name': collection.collector.name,
                'phone': collection.collector.phone
            } if collection.collector else None,
            'scheduled_time': collection.scheduled_time.isoformat(),
            'actual_time': collection.actual_time.isoformat() if collection.actual_time else None,
            'status': collection.status,
            'waste_collected': collection.waste_collected,
            'notes': collection.notes,
            'created_at': collection.created_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/<int:collection_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'collector'])
def update_collection(collection_id):
    """Update a collection"""
    try:
        collection = Collection.query.get_or_404(collection_id)
        data = request.get_json()
        
        # Update fields
        if 'vehicle_id' in data:
            collection.vehicle_id = data['vehicle_id']
        if 'collector_id' in data:
            collection.collector_id = data['collector_id']
        if 'scheduled_time' in data:
            collection.scheduled_time = datetime.fromisoformat(data['scheduled_time'])
        if 'status' in data:
            collection.status = data['status']
            # Set actual_time when status changes to completed
            if data['status'] == 'completed' and not collection.actual_time:
                collection.actual_time = datetime.utcnow()
        if 'waste_collected' in data:
            collection.waste_collected = data['waste_collected']
        if 'notes' in data:
            collection.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Collection updated successfully',
            'collection': {
                'id': collection.id,
                'status': collection.status,
                'actual_time': collection.actual_time.isoformat() if collection.actual_time else None,
                'waste_collected': collection.waste_collected
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/<int:collection_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_collection(collection_id):
    """Delete a collection"""
    try:
        collection = Collection.query.get_or_404(collection_id)
        
        # Only allow deletion of scheduled collections
        if collection.status != 'scheduled':
            return jsonify({'error': 'Can only delete scheduled collections'}), 400
        
        db.session.delete(collection)
        db.session.commit()
        
        return jsonify({'message': 'Collection deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/schedule', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def schedule_collections():
    """Auto-schedule collections for bins that need it"""
    try:
        data = request.get_json()
        zone_id = data.get('zone_id')
        days_ahead = data.get('days_ahead', 7)
        
        # Find bins that need collection (>80% full or haven't been collected in 3 days)
        query = Bin.query.filter(
            or_(
                Bin.current_level >= 80,
                Bin.last_collection < datetime.utcnow() - timedelta(days=3)
            )
        )
        
        if zone_id:
            query = query.filter(Bin.zone_id == zone_id)
        
        bins_needing_collection = query.all()
        
        scheduled_count = 0
        for bin_obj in bins_needing_collection:
            # Check if already scheduled
            existing = Collection.query.filter(
                and_(
                    Collection.bin_id == bin_obj.id,
                    Collection.status == 'scheduled',
                    Collection.scheduled_time > datetime.utcnow()
                )
            ).first()
            
            if not existing:
                # Schedule for next available time slot
                scheduled_time = datetime.utcnow() + timedelta(
                    hours=8 + (scheduled_count % 8)  # Spread across 8-hour window
                )
                
                collection = Collection(
                    bin_id=bin_obj.id,
                    scheduled_time=scheduled_time,
                    status='scheduled',
                    notes='Auto-scheduled based on bin level/time'
                )
                
                db.session.add(collection)
                scheduled_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Scheduled {scheduled_count} collections',
            'scheduled_count': scheduled_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/stats', methods=['GET'])
@jwt_required()
def get_collection_stats():
    """Get collection statistics"""
    try:
        # Get date range
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic stats
        total_collections = Collection.query.filter(
            Collection.created_at >= start_date
        ).count()
        
        completed_collections = Collection.query.filter(
            and_(
                Collection.created_at >= start_date,
                Collection.status == 'completed'
            )
        ).count()
        
        pending_collections = Collection.query.filter(
            Collection.status == 'scheduled'
        ).count()
        
        # Completion rate
        completion_rate = (completed_collections / total_collections * 100) if total_collections > 0 else 0
        
        # Average collection time
        avg_collection_time = db.session.query(
            db.func.avg(
                db.func.extract('epoch', Collection.actual_time - Collection.scheduled_time)
            )
        ).filter(
            and_(
                Collection.status == 'completed',
                Collection.actual_time.isnot(None),
                Collection.created_at >= start_date
            )
        ).scalar()
        
        avg_collection_time = avg_collection_time / 3600 if avg_collection_time else 0  # Convert to hours
        
        # Collections by status
        status_stats = db.session.query(
            Collection.status,
            db.func.count(Collection.id)
        ).filter(
            Collection.created_at >= start_date
        ).group_by(Collection.status).all()
        
        # Daily collection trend
        daily_stats = db.session.query(
            db.func.date(Collection.actual_time).label('date'),
            db.func.count(Collection.id).label('count'),
            db.func.sum(Collection.waste_collected).label('total_waste')
        ).filter(
            and_(
                Collection.status == 'completed',
                Collection.actual_time >= start_date
            )
        ).group_by(db.func.date(Collection.actual_time)).all()
        
        return jsonify({
            'total_collections': total_collections,
            'completed_collections': completed_collections,
            'pending_collections': pending_collections,
            'completion_rate': round(completion_rate, 2),
            'avg_collection_time_hours': round(avg_collection_time, 2),
            'status_breakdown': {status: count for status, count in status_stats},
            'daily_trend': [{
                'date': stat.date.isoformat(),
                'collections': stat.count,
                'waste_collected': float(stat.total_waste or 0)
            } for stat in daily_stats]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collections_bp.route('/collections/optimize-routes', methods=['POST'])
def optimize_routes():
    """Optimize collection routes"""
    try:
        data = request.get_json()
        zone_id = data.get('zone_id')
        vehicle_id = data.get('vehicle_id')
        
        # Get scheduled collections
        query = Collection.query.filter(Collection.status == 'scheduled')
        
        if zone_id:
            query = query.join(Bin).filter(Bin.zone_id == zone_id)
        if vehicle_id:
            query = query.filter(Collection.vehicle_id == vehicle_id)
        
        collections = query.all()
        
        if not collections:
            return jsonify({'message': 'No scheduled collections found'}), 200
        
        # Use RouteOptimizer from collection_service
        from ..services.collection_service import DynamicRouteOptimizerRL

        all_bins_data = []
        for bin_obj in Bin.query.filter(Bin.zone_id == zone_id, Bin.status == 'active'):
             all_bins_data.append({
                 'id': bin_obj.id,
                 'latitude': bin_obj.latitude,
                 'longitude': bin_obj.longitude,
                 'fill_level': bin_obj.fill_level,
                 'capacity': bin_obj.capacity
             })
        
        optimizer = DynamicRouteOptimizerRL()
        optimization_result = optimizer.optimize_route(all_bins_data)
        
        return jsonify({
           'message': 'Routes optimized successfully',
           'route': [
               {
                   'bin_id': bin_data['id'],
                   'location': (bin_data['latitude'], bin_data['longitude']),
                   'fill_level': bin_data['fill_level']
               }
               for bin_data in optimization_result['route']
           ],
           'total_distance_km': optimization_result['total_distance'],
           'estimated_time_minutes': optimization_result['estimated_time_mins'],
           'bins_count': optimization_result['bins_count'],
           'load_utilization_percent': optimization_result['load_utilization_percent']
        }), 200

    except Exception as e:
         return jsonify({'error': str(e)}), 500