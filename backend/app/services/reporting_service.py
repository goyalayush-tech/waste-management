from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import base64
from sqlalchemy import func, and_, or_
from ..models import Bin, WasteEntry, Collection, Zone, User
from ..database import db
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO

class ReportingService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def generate_daily_report(self, date: datetime = None) -> Dict[str, Any]:
        """Generate daily waste collection report"""
        if not date:
            date = datetime.utcnow().date()
            
        # Get daily statistics
        daily_collections = db.session.query(Collection).filter(
            func.date(Collection.scheduled_time) == date
        ).all()
        
        daily_waste = db.session.query(WasteEntry).filter(
            func.date(WasteEntry.timestamp) == date
        ).all()
        
        # Calculate metrics
        total_collections = len(daily_collections)
        completed_collections = len([c for c in daily_collections if c.status == 'completed'])
        total_waste_collected = sum([w.quantity for w in daily_waste])
        
        # Waste by type
        waste_by_type = {}
        for entry in daily_waste:
            waste_by_type[entry.waste_type] = waste_by_type.get(entry.waste_type, 0) + entry.quantity
            
        # Zone-wise collection
        zone_collections = {}
        for collection in daily_collections:
            zone_name = collection.bin.zone.name
            zone_collections[zone_name] = zone_collections.get(zone_name, 0) + 1
            
        return {
            'date': date.isoformat(),
            'total_collections': total_collections,
            'completed_collections': completed_collections,
            'completion_rate': (completed_collections / total_collections * 100) if total_collections > 0 else 0,
            'total_waste_collected': total_waste_collected,
            'waste_by_type': waste_by_type,
            'zone_collections': zone_collections,
            'collections': [self._serialize_collection(c) for c in daily_collections]
        }
    
    def generate_weekly_report(self, start_date: datetime = None) -> Dict[str, Any]:
        """Generate weekly waste management report"""
        if not start_date:
            start_date = datetime.utcnow().date() - timedelta(days=7)
        end_date = start_date + timedelta(days=7)
        
        # Weekly collections
        weekly_collections = db.session.query(Collection).filter(
            and_(
                func.date(Collection.scheduled_time) >= start_date,
                func.date(Collection.scheduled_time) < end_date
            )
        ).all()
        
        # Weekly waste entries
        weekly_waste = db.session.query(WasteEntry).filter(
            and_(
                func.date(WasteEntry.timestamp) >= start_date,
                func.date(WasteEntry.timestamp) < end_date
            )
        ).all()
        
        # Daily breakdown
        daily_breakdown = {}
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            day_collections = [c for c in weekly_collections if c.scheduled_time.date() == current_date]
            day_waste = [w for w in weekly_waste if w.timestamp.date() == current_date]
            
            daily_breakdown[current_date.isoformat()] = {
                'collections': len(day_collections),
                'completed': len([c for c in day_collections if c.status == 'completed']),
                'waste_collected': sum([w.quantity for w in day_waste])
            }
        
        # Efficiency metrics
        total_scheduled = len(weekly_collections)
        total_completed = len([c for c in weekly_collections if c.status == 'completed'])
        efficiency_rate = (total_completed / total_scheduled * 100) if total_scheduled > 0 else 0
        
        return {
            'period': f"{start_date.isoformat()} to {end_date.isoformat()}",
            'total_collections_scheduled': total_scheduled,
            'total_collections_completed': total_completed,
            'efficiency_rate': efficiency_rate,
            'total_waste_collected': sum([w.quantity for w in weekly_waste]),
            'daily_breakdown': daily_breakdown,
            'top_performing_zones': self._get_top_zones(weekly_collections),
            'waste_type_distribution': self._get_waste_distribution(weekly_waste)
        }
    
    def generate_monthly_report(self, month: int = None, year: int = None) -> Dict[str, Any]:
        """Generate comprehensive monthly report"""
        if not month or not year:
            now = datetime.utcnow()
            month = now.month
            year = now.year
            
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()
        
        # Monthly data
        monthly_collections = db.session.query(Collection).filter(
            and_(
                func.date(Collection.scheduled_time) >= start_date,
                func.date(Collection.scheduled_time) < end_date
            )
        ).all()
        
        monthly_waste = db.session.query(WasteEntry).filter(
            and_(
                func.date(WasteEntry.timestamp) >= start_date,
                func.date(WasteEntry.timestamp) < end_date
            )
        ).all()
        
        # Calculate comprehensive metrics
        metrics = self._calculate_monthly_metrics(monthly_collections, monthly_waste)
        
        # Trends and insights
        trends = self._analyze_trends(monthly_collections, monthly_waste, start_date, end_date)
        
        return {
            'period': f"{start_date.strftime('%B %Y')}",
            'metrics': metrics,
            'trends': trends,
            'zone_performance': self._analyze_zone_performance(monthly_collections),
            'waste_composition': self._analyze_waste_composition(monthly_waste),
            'recommendations': self._generate_recommendations(metrics, trends)
        }
    
    def generate_pdf_report(self, report_data: Dict[str, Any], report_type: str) -> bytes:
        """Generate PDF report from data"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        title = Paragraph(f"Delhi Waste Management - {report_type.title()} Report", title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Report period
        if 'period' in report_data:
            period = Paragraph(f"<b>Period:</b> {report_data['period']}", self.styles['Normal'])
            story.append(period)
            story.append(Spacer(1, 12))
        
        # Key metrics table
        if 'metrics' in report_data:
            metrics_data = [['Metric', 'Value']]
            for key, value in report_data['metrics'].items():
                metrics_data.append([key.replace('_', ' ').title(), str(value)])
            
            metrics_table = Table(metrics_data)
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(Paragraph("<b>Key Metrics</b>", self.styles['Heading2']))
            story.append(metrics_table)
            story.append(Spacer(1, 20))
        
        # Zone performance
        if 'zone_performance' in report_data:
            zone_data = [['Zone', 'Collections', 'Efficiency %']]
            for zone, data in report_data['zone_performance'].items():
                zone_data.append([zone, str(data.get('collections', 0)), f"{data.get('efficiency', 0):.1f}%"])
            
            zone_table = Table(zone_data)
            zone_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(Paragraph("<b>Zone Performance</b>", self.styles['Heading2']))
            story.append(zone_table)
            story.append(Spacer(1, 20))
        
        # Recommendations
        if 'recommendations' in report_data:
            story.append(Paragraph("<b>Recommendations</b>", self.styles['Heading2']))
            for i, rec in enumerate(report_data['recommendations'], 1):
                story.append(Paragraph(f"{i}. {rec}", self.styles['Normal']))
            story.append(Spacer(1, 12))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def generate_excel_report(self, report_data: Dict[str, Any]) -> bytes:
        """Generate Excel report with multiple sheets"""
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Summary sheet
            if 'metrics' in report_data:
                metrics_df = pd.DataFrame(list(report_data['metrics'].items()), 
                                        columns=['Metric', 'Value'])
                metrics_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Zone performance sheet
            if 'zone_performance' in report_data:
                zone_df = pd.DataFrame.from_dict(report_data['zone_performance'], orient='index')
                zone_df.to_excel(writer, sheet_name='Zone Performance')
            
            # Daily breakdown (if available)
            if 'daily_breakdown' in report_data:
                daily_df = pd.DataFrame.from_dict(report_data['daily_breakdown'], orient='index')
                daily_df.to_excel(writer, sheet_name='Daily Breakdown')
            
            # Waste composition
            if 'waste_composition' in report_data:
                waste_df = pd.DataFrame.from_dict(report_data['waste_composition'], orient='index', 
                                                columns=['Quantity'])
                waste_df.to_excel(writer, sheet_name='Waste Composition')
        
        buffer.seek(0)
        return buffer.getvalue()
    
    def generate_chart(self, data: Dict[str, Any], chart_type: str) -> str:
        """Generate chart and return as base64 string"""
        plt.figure(figsize=(10, 6))
        
        if chart_type == 'waste_by_type':
            plt.pie(data.values(), labels=data.keys(), autopct='%1.1f%%')
            plt.title('Waste Distribution by Type')
        
        elif chart_type == 'zone_performance':
            zones = list(data.keys())
            values = [data[zone].get('efficiency', 0) for zone in zones]
            plt.bar(zones, values)
            plt.title('Zone Performance (Efficiency %)')
            plt.ylabel('Efficiency %')
            plt.xticks(rotation=45)
        
        elif chart_type == 'daily_trend':
            dates = list(data.keys())
            collections = [data[date]['collections'] for date in dates]
            plt.plot(dates, collections, marker='o')
            plt.title('Daily Collection Trend')
            plt.ylabel('Number of Collections')
            plt.xticks(rotation=45)
        
        plt.tight_layout()
        
        # Convert to base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        chart_data = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_data
    
    def _serialize_collection(self, collection: Collection) -> Dict[str, Any]:
        """Serialize collection object"""
        return {
            'id': collection.id,
            'bin_id': collection.bin_id,
            'bin_location': collection.bin.location,
            'zone': collection.bin.zone.name,
            'scheduled_time': collection.scheduled_time.isoformat(),
            'actual_time': collection.actual_time.isoformat() if collection.actual_time else None,
            'status': collection.status,
            'collector_id': collection.collector_id,
            'vehicle_id': collection.vehicle_id
        }
    
    def _get_top_zones(self, collections: List[Collection]) -> Dict[str, int]:
        """Get top performing zones"""
        zone_counts = {}
        for collection in collections:
            if collection.status == 'completed':
                zone_name = collection.bin.zone.name
                zone_counts[zone_name] = zone_counts.get(zone_name, 0) + 1
        
        return dict(sorted(zone_counts.items(), key=lambda x: x[1], reverse=True)[:5])
    
    def _get_waste_distribution(self, waste_entries: List[WasteEntry]) -> Dict[str, float]:
        """Get waste type distribution"""
        waste_dist = {}
        for entry in waste_entries:
            waste_dist[entry.waste_type] = waste_dist.get(entry.waste_type, 0) + entry.quantity
        return waste_dist
    
    def _calculate_monthly_metrics(self, collections: List[Collection], 
                                 waste_entries: List[WasteEntry]) -> Dict[str, Any]:
        """Calculate comprehensive monthly metrics"""
        total_collections = len(collections)
        completed_collections = len([c for c in collections if c.status == 'completed'])
        
        return {
            'total_collections_scheduled': total_collections,
            'total_collections_completed': completed_collections,
            'completion_rate': (completed_collections / total_collections * 100) if total_collections > 0 else 0,
            'total_waste_collected': sum([w.quantity for w in waste_entries]),
            'average_daily_waste': sum([w.quantity for w in waste_entries]) / 30,
            'unique_bins_serviced': len(set([c.bin_id for c in collections])),
            'active_collectors': len(set([c.collector_id for c in collections if c.collector_id])),
            'zones_covered': len(set([c.bin.zone_id for c in collections]))
        }
    
    def _analyze_trends(self, collections: List[Collection], waste_entries: List[WasteEntry],
                       start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Analyze trends in the data"""
        # Weekly trends
        weekly_data = {}
        current_date = start_date
        
        while current_date < end_date:
            week_end = min(current_date + timedelta(days=7), end_date)
            week_collections = [c for c in collections 
                              if current_date <= c.scheduled_time.date() < week_end]
            week_waste = [w for w in waste_entries 
                         if current_date <= w.timestamp.date() < week_end]
            
            weekly_data[f"Week {current_date.strftime('%m/%d')}"] = {
                'collections': len(week_collections),
                'waste_collected': sum([w.quantity for w in week_waste])
            }
            
            current_date = week_end
        
        return {
            'weekly_breakdown': weekly_data,
            'trend_direction': self._calculate_trend_direction(weekly_data),
            'peak_day': self._find_peak_day(collections),
            'efficiency_trend': self._calculate_efficiency_trend(collections)
        }
    
    def _analyze_zone_performance(self, collections: List[Collection]) -> Dict[str, Any]:
        """Analyze performance by zone"""
        zone_performance = {}
        
        for collection in collections:
            zone_name = collection.bin.zone.name
            if zone_name not in zone_performance:
                zone_performance[zone_name] = {
                    'total_scheduled': 0,
                    'completed': 0,
                    'efficiency': 0
                }
            
            zone_performance[zone_name]['total_scheduled'] += 1
            if collection.status == 'completed':
                zone_performance[zone_name]['completed'] += 1
        
        # Calculate efficiency
        for zone_data in zone_performance.values():
            if zone_data['total_scheduled'] > 0:
                zone_data['efficiency'] = (zone_data['completed'] / zone_data['total_scheduled']) * 100
        
        return zone_performance
    
    def _analyze_waste_composition(self, waste_entries: List[WasteEntry]) -> Dict[str, float]:
        """Analyze waste composition"""
        composition = {}
        total_waste = sum([w.quantity for w in waste_entries])
        
        for entry in waste_entries:
            composition[entry.waste_type] = composition.get(entry.waste_type, 0) + entry.quantity
        
        # Convert to percentages
        if total_waste > 0:
            for waste_type in composition:
                composition[waste_type] = (composition[waste_type] / total_waste) * 100
        
        return composition
    
    def _generate_recommendations(self, metrics: Dict[str, Any], trends: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Completion rate recommendations
        if metrics.get('completion_rate', 0) < 80:
            recommendations.append("Improve collection completion rate by optimizing routes and schedules")
        
        # Efficiency recommendations
        if trends.get('efficiency_trend', 'stable') == 'declining':
            recommendations.append("Address declining efficiency trend through staff training and equipment maintenance")
        
        # Waste volume recommendations
        avg_daily = metrics.get('average_daily_waste', 0)
        if avg_daily > 1000:  # Threshold for high waste volume
            recommendations.append("Consider increasing collection frequency in high-volume areas")
        
        # Zone-specific recommendations
        recommendations.append("Focus on underperforming zones identified in the zone performance analysis")
        
        # General recommendations
        recommendations.extend([
            "Implement predictive maintenance for collection vehicles",
            "Consider IoT sensors for real-time bin monitoring",
            "Develop citizen engagement programs for waste reduction"
        ])
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _calculate_trend_direction(self, weekly_data: Dict[str, Any]) -> str:
        """Calculate overall trend direction"""
        weeks = list(weekly_data.keys())
        if len(weeks) < 2:
            return 'insufficient_data'
        
        first_week = weekly_data[weeks[0]]['collections']
        last_week = weekly_data[weeks[-1]]['collections']
        
        if last_week > first_week * 1.1:
            return 'increasing'
        elif last_week < first_week * 0.9:
            return 'decreasing'
        else:
            return 'stable'
    
    def _find_peak_day(self, collections: List[Collection]) -> str:
        """Find the day with most collections"""
        day_counts = {}
        for collection in collections:
            day = collection.scheduled_time.strftime('%A')
            day_counts[day] = day_counts.get(day, 0) + 1
        
        if day_counts:
            return max(day_counts, key=day_counts.get)
        return 'No data'
    
    def _calculate_efficiency_trend(self, collections: List[Collection]) -> str:
        """Calculate efficiency trend over time"""
        # Group by week and calculate efficiency
        weekly_efficiency = {}
        
        for collection in collections:
            week = collection.scheduled_time.strftime('%Y-W%U')
            if week not in weekly_efficiency:
                weekly_efficiency[week] = {'total': 0, 'completed': 0}
            
            weekly_efficiency[week]['total'] += 1
            if collection.status == 'completed':
                weekly_efficiency[week]['completed'] += 1
        
        # Calculate efficiency percentages
        efficiency_values = []
        for week_data in weekly_efficiency.values():
            if week_data['total'] > 0:
                efficiency = (week_data['completed'] / week_data['total']) * 100
                efficiency_values.append(efficiency)
        
        if len(efficiency_values) < 2:
            return 'insufficient_data'
        
        # Simple trend calculation
        if efficiency_values[-1] > efficiency_values[0] * 1.05:
            return 'improving'
        elif efficiency_values[-1] < efficiency_values[0] * 0.95:
            return 'declining'
        else:
            return 'stable'