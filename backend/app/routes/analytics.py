from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from ..models import db, WasteEntry, Bin, Zone, Collection, User
from ..utils.decorators import admin_required
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard-stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        # Total bins and their status
        total_bins = Bin.query.count()
        full_bins = Bin.query.filter(Bin.fill_level >= 80).count()
        maintenance_bins = Bin.query.filter(Bin.status == 'maintenance').count()
        
        # Today's waste collection
        today = datetime.utcnow().date()
        today_waste = db.session.query(func.sum(WasteEntry.quantity)).filter(
            func.date(WasteEntry.timestamp) == today
        ).scalar() or 0
        
        # Weekly trend
        week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_waste = db.session.query(func.sum(WasteEntry.quantity)).filter(
            WasteEntry.timestamp >= week_ago
        ).scalar() or 0
        
        # Collections today
        today_collections = Collection.query.filter(
            func.date(Collection.scheduled_time) == today
        ).count()
        
        completed_collections = Collection.query.filter(
            and_(
                func.date(Collection.scheduled_time) == today,
                Collection.status == 'completed'
            )
        ).count()
        
        # Zone-wise statistics
        zone_stats = db.session.query(
            Zone.name,
            func.count(Bin.id).label('total_bins'),
            func.avg(Bin.fill_level).label('avg_fill_level'),
            func.sum(WasteEntry.quantity).label('total_waste')
        ).outerjoin(Bin).outerjoin(WasteEntry).group_by(Zone.id, Zone.name).all()
        
        zone_data = []
        for zone in zone_stats:
            zone_data.append({
                'name': zone.name,
                'total_bins': zone.total_bins or 0,
                'avg_fill_level': round(zone.avg_fill_level or 0, 2),
                'total_waste': round(zone.total_waste or 0, 2)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'bins': {
                    'total': total_bins,
                    'full': full_bins,
                    'maintenance': maintenance_bins,
                    'operational': total_bins - maintenance_bins
                },
                'waste': {
                    'today': round(today_waste, 2),
                    'weekly': round(weekly_waste, 2),
                    'avg_daily': round(weekly_waste / 7, 2)
                },
                'collections': {
                    'scheduled_today': today_collections,
                    'completed_today': completed_collections,
                    'completion_rate': round((completed_collections / today_collections * 100) if today_collections > 0 else 0, 2)
                },
                'zones': zone_data
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/waste-trends', methods=['GET'])
@jwt_required()
def get_waste_trends():
    """Get waste generation trends over time"""
    try:
        days = request.args.get('days', 30, type=int)
        waste_type = request.args.get('type', None)
        zone_id = request.args.get('zone_id', None, type=int)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = db.session.query(
            func.date(WasteEntry.timestamp).label('date'),
            func.sum(WasteEntry.quantity).label('total_quantity'),
            WasteEntry.waste_type
        ).filter(WasteEntry.timestamp >= start_date)
        
        if waste_type:
            query = query.filter(WasteEntry.waste_type == waste_type)
        
        if zone_id:
            query = query.join(Bin).filter(Bin.zone_id == zone_id)
        
        results = query.group_by(
            func.date(WasteEntry.timestamp),
            WasteEntry.waste_type
        ).order_by(func.date(WasteEntry.timestamp)).all()
        
        # Organize data by date and waste type
        trends = {}
        for result in results:
            date_str = result.date.strftime('%Y-%m-%d')
            if date_str not in trends:
                trends[date_str] = {}
            trends[date_str][result.waste_type] = round(result.total_quantity, 2)
        
        return jsonify({
            'success': True,
            'data': trends
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/collection-efficiency', methods=['GET'])
@jwt_required()
def get_collection_efficiency():
    """Get collection efficiency metrics"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Collection statistics
        total_collections = Collection.query.filter(
            Collection.scheduled_time >= start_date
        ).count()
        
        completed_collections = Collection.query.filter(
            and_(
                Collection.scheduled_time >= start_date,
                Collection.status == 'completed'
            )
        ).count()
        
        # Average collection time
        avg_collection_time = db.session.query(
            func.avg(
                func.extract('epoch', Collection.completed_time - Collection.scheduled_time) / 3600
            )
        ).filter(
            and_(
                Collection.scheduled_time >= start_date,
                Collection.status == 'completed',
                Collection.completed_time.isnot(None)
            )
        ).scalar()
        
        # Daily efficiency
        daily_efficiency = db.session.query(
            func.date(Collection.scheduled_time).label('date'),
            func.count(Collection.id).label('total'),
            func.sum(func.case([(Collection.status == 'completed', 1)], else_=0)).label('completed')
        ).filter(
            Collection.scheduled_time >= start_date
        ).group_by(func.date(Collection.scheduled_time)).all()
        
        efficiency_data = []
        for day in daily_efficiency:
            efficiency_rate = (day.completed / day.total * 100) if day.total > 0 else 0
            efficiency_data.append({
                'date': day.date.strftime('%Y-%m-%d'),
                'total': day.total,
                'completed': day.completed,
                'efficiency_rate': round(efficiency_rate, 2)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'overall': {
                    'total_collections': total_collections,
                    'completed_collections': completed_collections,
                    'completion_rate': round((completed_collections / total_collections * 100) if total_collections > 0 else 0, 2),
                    'avg_collection_time_hours': round(avg_collection_time or 0, 2)
                },
                'daily_efficiency': efficiency_data
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/bin-utilization', methods=['GET'])
@jwt_required()
def get_bin_utilization():
    """Get bin utilization analytics"""
    try:
        zone_id = request.args.get('zone_id', None, type=int)
        
        query = db.session.query(
            Bin.id,
            Bin.location,
            Bin.capacity,
            Bin.fill_level,
            Zone.name.label('zone_name'),
            func.count(WasteEntry.id).label('entry_count'),
            func.sum(WasteEntry.quantity).label('total_waste')
        ).join(Zone).outerjoin(WasteEntry)
        
        if zone_id:
            query = query.filter(Bin.zone_id == zone_id)
        
        results = query.group_by(Bin.id, Zone.name).all()
        
        utilization_data = []
        for bin_data in results:
            utilization_rate = (bin_data.fill_level / 100) if bin_data.fill_level else 0
            utilization_data.append({
                'bin_id': bin_data.id,
                'location': bin_data.location,
                'zone': bin_data.zone_name,
                'capacity': bin_data.capacity,
                'fill_level': bin_data.fill_level,
                'utilization_rate': round(utilization_rate * 100, 2),
                'entry_count': bin_data.entry_count,
                'total_waste': round(bin_data.total_waste or 0, 2)
            })
        
        # Calculate utilization categories
        high_utilization = len([b for b in utilization_data if b['fill_level'] >= 80])
        medium_utilization = len([b for b in utilization_data if 50 <= b['fill_level'] < 80])
        low_utilization = len([b for b in utilization_data if b['fill_level'] < 50])
        
        return jsonify({
            'success': True,
            'data': {
                'bins': utilization_data,
                'summary': {
                    'high_utilization': high_utilization,
                    'medium_utilization': medium_utilization,
                    'low_utilization': low_utilization,
                    'total_bins': len(utilization_data)
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/environmental-impact', methods=['GET'])
@jwt_required()
def get_environmental_impact():
    """Calculate environmental impact metrics"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Waste type breakdown
        waste_breakdown = db.session.query(
            WasteEntry.waste_type,
            func.sum(WasteEntry.quantity).label('total_quantity')
        ).filter(WasteEntry.timestamp >= start_date).group_by(WasteEntry.waste_type).all()
        
        # Environmental impact calculations (example values)
        impact_factors = {
            'organic': {'co2_saved': 0.5, 'energy_saved': 2.0},  # kg CO2, kWh per kg
            'plastic': {'co2_saved': 2.0, 'energy_saved': 5.0},
            'paper': {'co2_saved': 1.0, 'energy_saved': 3.0},
            'metal': {'co2_saved': 3.0, 'energy_saved': 8.0},
            'e-waste': {'co2_saved': 5.0, 'energy_saved': 15.0}
        }
        
        total_co2_saved = 0
        total_energy_saved = 0
        waste_data = []
        
        for waste in waste_breakdown:
            waste_type = waste.waste_type
            quantity = waste.total_quantity
            
            if waste_type in impact_factors:
                co2_saved = quantity * impact_factors[waste_type]['co2_saved']
                energy_saved = quantity * impact_factors[waste_type]['energy_saved']
                
                total_co2_saved += co2_saved
                total_energy_saved += energy_saved
                
                waste_data.append({
                    'type': waste_type,
                    'quantity': round(quantity, 2),
                    'co2_saved': round(co2_saved, 2),
                    'energy_saved': round(energy_saved, 2)
                })
        
        # Calculate trees equivalent (1 tree absorbs ~22kg CO2/year)
        trees_equivalent = total_co2_saved / 22
        
        return jsonify({
            'success': True,
            'data': {
                'total_impact': {
                    'co2_saved_kg': round(total_co2_saved, 2),
                    'energy_saved_kwh': round(total_energy_saved, 2),
                    'trees_equivalent': round(trees_equivalent, 2)
                },
                'waste_breakdown': waste_data,
                'period_days': days
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/predictive-insights', methods=['GET'])
@jwt_required()
def get_predictive_insights():
    """Get AI-powered predictive insights"""
    try:
        # This would integrate with ML models
        # For now, providing mock predictions based on historical data
        
        days_ahead = request.args.get('days', 7, type=int)
        
        # Historical average for prediction
        historical_avg = db.session.query(
            func.avg(func.sum(WasteEntry.quantity))
        ).filter(
            WasteEntry.timestamp >= datetime.utcnow() - timedelta(days=30)
        ).group_by(func.date(WasteEntry.timestamp)).scalar() or 0
        
        # Generate predictions (mock data - would use ML model)
        predictions = []
        for i in range(days_ahead):
            future_date = datetime.utcnow() + timedelta(days=i+1)
            # Add some variance to make it realistic
            variance = 0.1 * historical_avg * (0.5 - abs(0.5 - (i % 7) / 7))
            predicted_waste = historical_avg + variance
            
            predictions.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_waste_kg': round(predicted_waste, 2),
                'confidence': round(85 - (i * 2), 2)  # Decreasing confidence over time
            })
        
        # Identify bins likely to be full soon
        high_fill_bins = Bin.query.filter(Bin.fill_level >= 70).all()
        alerts = []
        
        for bin_obj in high_fill_bins:
            # Estimate time to full based on recent fill rate
            recent_entries = WasteEntry.query.filter(
                and_(
                    WasteEntry.bin_id == bin_obj.id,
                    WasteEntry.timestamp >= datetime.utcnow() - timedelta(days=7)
                )
            ).count()
            
            if recent_entries > 0:
                fill_rate = recent_entries / 7  # entries per day
                remaining_capacity = 100 - bin_obj.fill_level
                days_to_full = remaining_capacity / (fill_rate * 10) if fill_rate > 0 else 999
                
                if days_to_full <= 3:
                    alerts.append({
                        'bin_id': bin_obj.id,
                        'location': bin_obj.location,
                        'current_fill_level': bin_obj.fill_level,
                        'estimated_days_to_full': round(days_to_full, 1),
                        'priority': 'high' if days_to_full <= 1 else 'medium'
                    })
        
        return jsonify({
            'success': True,
            'data': {
                'waste_predictions': predictions,
                'bin_alerts': alerts,
                'insights': {
                    'avg_daily_waste': round(historical_avg, 2),
                    'bins_needing_attention': len(alerts),
                    'prediction_period': days_ahead
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@analytics_bp.route('/export-report', methods=['POST'])
@jwt_required()
@admin_required
def export_analytics_report():
    """Export comprehensive analytics report"""
    try:
        data = request.get_json()
        report_type = data.get('type', 'summary')
        start_date = datetime.fromisoformat(data.get('start_date', (datetime.utcnow() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(data.get('end_date', datetime.utcnow().isoformat()))
        
        # Generate comprehensive report data
        report_data = {
            'report_info': {
                'type': report_type,
                'generated_at': datetime.utcnow().isoformat(),
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'generated_by': get_jwt_identity()
            }
        }
        
        if report_type in ['summary', 'waste']:
            # Waste statistics
            waste_stats = db.session.query(
                WasteEntry.waste_type,
                func.sum(WasteEntry.quantity).label('total'),
                func.count(WasteEntry.id).label('entries'),
                func.avg(WasteEntry.quantity).label('avg_per_entry')
            ).filter(
                and_(WasteEntry.timestamp >= start_date, WasteEntry.timestamp <= end_date)
            ).group_by(WasteEntry.waste_type).all()
            
            report_data['waste_statistics'] = [
                {
                    'type': stat.waste_type,
                    'total_kg': round(stat.total, 2),
                    'entries': stat.entries,
                    'avg_per_entry': round(stat.avg_per_entry, 2)
                } for stat in waste_stats
            ]
        
        if report_type in ['summary', 'collections']:
            # Collection statistics
            collection_stats = db.session.query(
                func.count(Collection.id).label('total'),
                func.sum(func.case([(Collection.status == 'completed', 1)], else_=0)).label('completed'),
                func.avg(func.extract('epoch', Collection.completed_time - Collection.scheduled_time) / 3600).label('avg_duration')
            ).filter(
                and_(Collection.scheduled_time >= start_date, Collection.scheduled_time <= end_date)
            ).first()
            
            report_data['collection_statistics'] = {
                'total_scheduled': collection_stats.total,
                'completed': collection_stats.completed,
                'completion_rate': round((collection_stats.completed / collection_stats.total * 100) if collection_stats.total > 0 else 0, 2),
                'avg_duration_hours': round(collection_stats.avg_duration or 0, 2)
            }
        
        return jsonify({
            'success': True,
            'data': report_data
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500