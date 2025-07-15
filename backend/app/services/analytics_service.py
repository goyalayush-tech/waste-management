import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from typing import Dict, List, Any, Optional
import json
from ..models import Bin, WasteEntry, Collection, Zone, User
from ..utils.database import db
from ..utils.cache import cache_result
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

class AdvancedAnalyticsService:
    """Advanced analytics service for comprehensive waste management insights"""
    
    @staticmethod
    @cache_result(timeout=300)  # Cache for 5 minutes
    def get_comprehensive_dashboard_data(zone_id: Optional[int] = None) -> Dict[str, Any]:
        """Get comprehensive dashboard data with advanced metrics"""
        
        # Base query filters
        filters = []
        if zone_id:
            filters.append(Bin.zone_id == zone_id)
        
        # Current statistics
        total_bins = db.session.query(Bin).filter(*filters).count()
        active_bins = db.session.query(Bin).filter(
            and_(Bin.status == 'active', *filters)
        ).count()
        
        # Waste collection statistics (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        waste_collected = db.session.query(
            func.sum(WasteEntry.quantity)
        ).join(Bin).filter(
            and_(
                WasteEntry.timestamp >= thirty_days_ago,
                *filters
            )
        ).scalar() or 0
        
        # Collection efficiency
        total_collections = db.session.query(Collection).filter(
            Collection.collection_date >= thirty_days_ago
        ).count()
        
        completed_collections = db.session.query(Collection).filter(
            and_(
                Collection.collection_date >= thirty_days_ago,
                Collection.status == 'completed'
            )
        ).count()
        
        efficiency = (completed_collections / total_collections * 100) if total_collections > 0 else 0
        
        # Waste type distribution
        waste_distribution = db.session.query(
            WasteEntry.waste_type,
            func.sum(WasteEntry.quantity).label('total')
        ).join(Bin).filter(
            and_(
                WasteEntry.timestamp >= thirty_days_ago,
                *filters
            )
        ).group_by(WasteEntry.waste_type).all()
        
        # Zone-wise performance
        zone_performance = db.session.query(
            Zone.name,
            func.count(Bin.id).label('total_bins'),
            func.sum(WasteEntry.quantity).label('waste_collected'),
            func.avg(Bin.fill_level).label('avg_fill_level')
        ).join(Bin).join(WasteEntry).filter(
            WasteEntry.timestamp >= thirty_days_ago
        ).group_by(Zone.id, Zone.name).all()
        
        # Trend analysis (last 7 days)
        daily_trends = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=i)
            daily_waste = db.session.query(
                func.sum(WasteEntry.quantity)
            ).join(Bin).filter(
                and_(
                    func.date(WasteEntry.timestamp) == date.date(),
                    *filters
                )
            ).scalar() or 0
            
            daily_trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'waste_collected': float(daily_waste)
            })
        
        # Alert statistics
        high_fill_bins = db.session.query(Bin).filter(
            and_(Bin.fill_level >= 80, *filters)
        ).count()
        
        overdue_collections = db.session.query(Collection).filter(
            and_(
                Collection.scheduled_date < datetime.utcnow(),
                Collection.status != 'completed'
            )
        ).count()
        
        return {
            'summary': {
                'total_bins': total_bins,
                'active_bins': active_bins,
                'waste_collected_30d': float(waste_collected),
                'collection_efficiency': round(efficiency, 2),
                'high_fill_bins': high_fill_bins,
                'overdue_collections': overdue_collections
            },
            'waste_distribution': [
                {'type': item.waste_type, 'quantity': float(item.total)}
                for item in waste_distribution
            ],
            'zone_performance': [
                {
                    'zone': item.name,
                    'total_bins': item.total_bins,
                    'waste_collected': float(item.waste_collected or 0),
                    'avg_fill_level': float(item.avg_fill_level or 0)
                }
                for item in zone_performance
            ],
            'daily_trends': sorted(daily_trends, key=lambda x: x['date']),
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def generate_predictive_insights(zone_id: Optional[int] = None) -> Dict[str, Any]:
        """Generate predictive insights using historical data"""
        
        # Get historical data for the last 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        filters = []
        if zone_id:
            filters.append(Bin.zone_id == zone_id)
        
        # Daily waste generation pattern
        daily_data = db.session.query(
            func.date(WasteEntry.timestamp).label('date'),
            func.sum(WasteEntry.quantity).label('total_waste'),
            func.count(WasteEntry.id).label('entry_count')
        ).join(Bin).filter(
            and_(
                WasteEntry.timestamp >= ninety_days_ago,
                *filters
            )
        ).group_by(func.date(WasteEntry.timestamp)).all()
        
        if not daily_data:
            return {'error': 'Insufficient data for predictions'}
        
        # Convert to pandas for analysis
        df = pd.DataFrame([
            {
                'date': item.date,
                'total_waste': float(item.total_waste),
                'entry_count': item.entry_count
            }
            for item in daily_data
        ])
        
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Calculate moving averages
        df['waste_7d_avg'] = df['total_waste'].rolling(window=7).mean()
        df['waste_30d_avg'] = df['total_waste'].rolling(window=30).mean()
        
        # Predict next 7 days using simple linear regression
        from sklearn.linear_model import LinearRegression
        
        # Prepare features (day of week, day of month, etc.)
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Features for prediction
        features = ['day_of_week', 'day_of_month', 'is_weekend']
        X = df[features].fillna(0)
        y = df['total_waste'].fillna(0)
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next 7 days
        predictions = []
        last_date = df['date'].max()
        
        for i in range(1, 8):
            future_date = last_date + timedelta(days=i)
            future_features = [[
                future_date.weekday(),
                future_date.day,
                1 if future_date.weekday() in [5, 6] else 0
            ]]
            
            predicted_waste = model.predict(future_features)[0]
            predictions.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_waste': max(0, float(predicted_waste)),
                'confidence': 'medium'  # Simple confidence level
            })
        
        # Calculate trends
        recent_avg = df['total_waste'].tail(7).mean()
        previous_avg = df['total_waste'].tail(14).head(7).mean()
        trend = 'increasing' if recent_avg > previous_avg else 'decreasing'
        trend_percentage = abs((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
        
        # Identify peak days
        peak_days = df.groupby('day_of_week')['total_waste'].mean().sort_values(ascending=False)
        
        return {
            'predictions': predictions,
            'trends': {
                'direction': trend,
                'percentage': round(float(trend_percentage), 2),
                'recent_average': round(float(recent_avg), 2)
            },
            'peak_days': [
                {
                    'day': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][int(day)],
                    'average_waste': round(float(avg), 2)
                }
                for day, avg in peak_days.head(3).items()
            ],
            'recommendations': AdvancedAnalyticsService._generate_recommendations(df, predictions)
        }
    
    @staticmethod
    def _generate_recommendations(df: pd.DataFrame, predictions: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on data analysis"""
        recommendations = []
        
        # Check for increasing trend
        recent_trend = df['total_waste'].tail(7).mean() - df['total_waste'].head(7).mean()
        if recent_trend > 0:
            recommendations.append("Waste generation is increasing. Consider adding more bins in high-traffic areas.")
        
        # Check for weekend patterns
        weekend_avg = df[df['is_weekend'] == 1]['total_waste'].mean()
        weekday_avg = df[df['is_weekend'] == 0]['total_waste'].mean()
        
        if weekend_avg > weekday_avg * 1.2:
            recommendations.append("Weekend waste generation is significantly higher. Schedule additional collections on Sundays.")
        
        # Check predictions for high waste days
        high_prediction_days = [p for p in predictions if p['predicted_waste'] > df['total_waste'].mean() * 1.3]
        if high_prediction_days:
            dates = [p['date'] for p in high_prediction_days]
            recommendations.append(f"High waste generation predicted for {', '.join(dates)}. Prepare additional collection capacity.")
        
        # Check for consistency
        waste_std = df['total_waste'].std()
        waste_mean = df['total_waste'].mean()
        cv = waste_std / waste_mean if waste_mean > 0 else 0
        
        if cv > 0.5:
            recommendations.append("Waste generation is highly variable. Consider implementing dynamic collection scheduling.")
        
        return recommendations
    
    @staticmethod
    def generate_environmental_impact_report(zone_id: Optional[int] = None) -> Dict[str, Any]:
        """Generate environmental impact analysis"""
        
        filters = []
        if zone_id:
            filters.append(Bin.zone_id == zone_id)
        
        # Last 30 days data
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Waste type analysis
        waste_by_type = db.session.query(
            WasteEntry.waste_type,
            func.sum(WasteEntry.quantity).label('total')
        ).join(Bin).filter(
            and_(
                WasteEntry.timestamp >= thirty_days_ago,
                *filters
            )
        ).group_by(WasteEntry.waste_type).all()
        
        # Environmental impact calculations (simplified)
        impact_factors = {
            'organic': {'co2_per_kg': 0.5, 'recyclable': True, 'compostable': True},
            'plastic': {'co2_per_kg': 2.0, 'recyclable': True, 'compostable': False},
            'paper': {'co2_per_kg': 1.0, 'recyclable': True, 'compostable': True},
            'metal': {'co2_per_kg': 3.0, 'recyclable': True, 'compostable': False},
            'glass': {'co2_per_kg': 0.8, 'recyclable': True, 'compostable': False},
            'e-waste': {'co2_per_kg': 5.0, 'recyclable': True, 'compostable': False}
        }
        
        total_co2 = 0
        total_recyclable = 0
        total_compostable = 0
        waste_breakdown = []
        
        for item in waste_by_type:
            waste_type = item.waste_type
            quantity = float(item.total)
            
            factor = impact_factors.get(waste_type, {'co2_per_kg': 1.5, 'recyclable': False, 'compostable': False})
            
            co2_impact = quantity * factor['co2_per_kg']
            total_co2 += co2_impact
            
            if factor['recyclable']:
                total_recyclable += quantity
            if factor['compostable']:
                total_compostable += quantity
            
            waste_breakdown.append({
                'type': waste_type,
                'quantity': quantity,
                'co2_impact': round(co2_impact, 2),
                'recyclable': factor['recyclable'],
                'compostable': factor['compostable']
            })
        
        total_waste = sum(item['quantity'] for item in waste_breakdown)
        
        return {
            'summary': {
                'total_waste_kg': round(total_waste, 2),
                'total_co2_kg': round(total_co2, 2),
                'recyclable_percentage': round((total_recyclable / total_waste * 100) if total_waste > 0 else 0, 2),
                'compostable_percentage': round((total_compostable / total_waste * 100) if total_waste > 0 else 0, 2)
            },
            'waste_breakdown': waste_breakdown,
            'recommendations': [
                f"Focus on recycling programs - {round((total_recyclable / total_waste * 100) if total_waste > 0 else 0, 1)}% of waste is recyclable",
                f"Implement composting - {round((total_compostable / total_waste * 100) if total_waste > 0 else 0, 1)}% of waste is compostable",
                f"Carbon footprint reduction potential: {round(total_co2 * 0.3, 2)} kg CO2 through better waste management"
            ],
            'period': '30 days',
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def generate_collection_optimization_report() -> Dict[str, Any]:
        """Generate collection route optimization analysis"""
        
        # Get all active bins with their current fill levels
        bins = db.session.query(Bin).filter(Bin.status == 'active').all()
        
        # Group bins by zone for route optimization
        zones_data = {}
        for bin_obj in bins:
            zone_id = bin_obj.zone_id
            if zone_id not in zones_data:
                zones_data[zone_id] = {
                    'zone_name': bin_obj.zone.name,
                    'bins': [],
                    'total_bins': 0,
                    'high_priority_bins': 0,
                    'medium_priority_bins': 0,
                    'low_priority_bins': 0
                }
            
            priority = 'high' if bin_obj.fill_level >= 80 else 'medium' if bin_obj.fill_level >= 50 else 'low'
            
            zones_data[zone_id]['bins'].append({
                'id': bin_obj.id,
                'location': bin_obj.location,
                'fill_level': bin_obj.fill_level,
                'priority': priority,
                'last_collection': bin_obj.last_collection.isoformat() if bin_obj.last_collection else None
            })
            
            zones_data[zone_id]['total_bins'] += 1
            zones_data[zone_id][f'{priority}_priority_bins'] += 1
        
        # Calculate collection efficiency metrics
        total_bins = len(bins)
        high_priority_total = sum(zone['high_priority_bins'] for zone in zones_data.values())
        
        # Generate route recommendations
        route_recommendations = []
        for zone_id, zone_data in zones_data.items():
            if zone_data['high_priority_bins'] > 0:
                route_recommendations.append({
                    'zone': zone_data['zone_name'],
                    'priority': 'urgent',
                    'bins_to_collect': zone_data['high_priority_bins'],
                    'estimated_time': zone_data['high_priority_bins'] * 15,  # 15 minutes per bin
                    'recommendation': f"Immediate collection needed for {zone_data['high_priority_bins']} bins"
                })
            elif zone_data['medium_priority_bins'] > zone_data['total_bins'] * 0.6:
                route_recommendations.append({
                    'zone': zone_data['zone_name'],
                    'priority': 'medium',
                    'bins_to_collect': zone_data['medium_priority_bins'],
                    'estimated_time': zone_data['medium_priority_bins'] * 10,
                    'recommendation': f"Schedule collection within 24 hours for {zone_data['medium_priority_bins']} bins"
                })
        
        return {
            'summary': {
                'total_bins': total_bins,
                'high_priority_bins': high_priority_total,
                'zones_requiring_attention': len([z for z in zones_data.values() if z['high_priority_bins'] > 0])
            },
            'zone_analysis': list(zones_data.values()),
            'route_recommendations': sorted(route_recommendations, key=lambda x: {'urgent': 0, 'medium': 1, 'low': 2}[x['priority']]),
            'efficiency_metrics': {
                'average_fill_level': round(sum(bin_obj.fill_level for bin_obj in bins) / len(bins) if bins else 0, 2),
                'collection_urgency_score': round((high_priority_total / total_bins * 100) if total_bins > 0 else 0, 2)
            },
            'generated_at': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def create_interactive_charts(data: Dict[str, Any]) -> Dict[str, str]:
        """Create interactive charts using Plotly"""
        
        charts = {}
        
        # Waste distribution pie chart
        if 'waste_distribution' in data:
            waste_data = data['waste_distribution']
            fig = px.pie(
                values=[item['quantity'] for item in waste_data],
                names=[item['type'] for item in waste_data],
                title='Waste Distribution by Type'
            )
            charts['waste_distribution'] = json.dumps(fig, cls=PlotlyJSONEncoder)
        
        # Daily trends line chart
        if 'daily_trends' in data:
            trends_data = data['daily_trends']
            fig = px.line(
                x=[item['date'] for item in trends_data],
                y=[item['waste_collected'] for item in trends_data],
                title='Daily Waste Collection Trends'
            )
            charts['daily_trends'] = json.dumps(fig, cls=PlotlyJSONEncoder)
        
        # Zone performance bar chart
        if 'zone_performance' in data:
            zone_data = data['zone_performance']
            fig = px.bar(
                x=[item['zone'] for item in zone_data],
                y=[item['waste_collected'] for item in zone_data],
                title='Waste Collection by Zone'
            )
            charts['zone_performance'] = json.dumps(fig, cls=PlotlyJSONEncoder)
        
        return charts