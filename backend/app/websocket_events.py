"""
WebSocket events for real-time updates
"""
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio, db
from app.models import User, WasteBin, Alert


@socketio.on('connect', namespace='/bins')
def handle_bin_connect(auth):
    """Handle client connection to bins namespace"""
    try:
        if auth and 'token' in auth:
            token = decode_token(auth['token'])
            user_id = token['sub']
            user = User.query.get(user_id)
            
            if user:
                join_room(f'user_{user_id}')
                if user.zone_id:
                    join_room(f'zone_{user.zone_id}')
                
                emit('connected', {'message': 'Connected to bin updates'})
            else:
                emit('error', {'message': 'Invalid user'})
        else:
            emit('error', {'message': 'Authentication required'})
    except Exception as e:
        emit('error', {'message': str(e)})


@socketio.on('disconnect', namespace='/bins')
def handle_bin_disconnect():
    """Handle client disconnection"""
    print('Client disconnected from bins namespace')


@socketio.on('join_zone', namespace='/bins')
def handle_join_zone(data):
    """Join zone-specific room for updates"""
    try:
        zone_id = data.get('zone_id')
        if zone_id:
            join_room(f'zone_{zone_id}')
            emit('joined_zone', {'zone_id': zone_id})
    except Exception as e:
        emit('error', {'message': str(e)})


@socketio.on('leave_zone', namespace='/bins')
def handle_leave_zone(data):
    """Leave zone-specific room"""
    try:
        zone_id = data.get('zone_id')
        if zone_id:
            leave_room(f'zone_{zone_id}')
            emit('left_zone', {'zone_id': zone_id})
    except Exception as e:
        emit('error', {'message': str(e)})


def broadcast_bin_update(bin_id, data):
    """Broadcast bin update to relevant clients"""
    bin = WasteBin.query.get(bin_id)
    if bin:
        socketio.emit('bin_update', data, 
                     room=f'zone_{bin.zone_id}', 
                     namespace='/bins')


def broadcast_alert(alert_data):
    """Broadcast new alert to relevant clients"""
    socketio.emit('new_alert', alert_data, 
                 namespace='/alerts')