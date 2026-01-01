from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import WasteEntry, WasteType, db
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

waste_bp = Blueprint('waste', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@waste_bp.route('/claims', methods=['POST'])
@jwt_required()
def create_claim():
    """Create a new waste claim"""
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            # Save file
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # Get other data
            data = request.form
            
            # Map material type to WasteType enum
            material_map = {
                'HDPE Plastic': 'plastic',
                'PET Clear': 'plastic',
                'Aluminum': 'metal'
            }
            material_type_input = data.get('material_type', 'mixed')
            waste_type_str = material_map.get(material_type_input, 'mixed')
            
            # Create WasteEntry
            # Note: In a real app, we'd validate bin_id, etc.
            # For now, we'll assume some defaults or optional fields if not provided
            
            waste_entry = WasteEntry(
                user_id=get_jwt_identity(),
                waste_type=WasteType(waste_type_str),
                quantity=float(data.get('weight_kg', 0)),
                image_url=f"/uploads/{unique_filename}",
                metadata={
                    'recycler_id': data.get('recycler_id'),
                    'facility_location': data.get('facility_location'),
                    'batch_code': data.get('batch_code'),
                    'source_stream': data.get('source_stream')
                },
                # For this demo, we might need a dummy bin_id if it's required
                bin_id=1 # Assuming bin_id 1 exists or we need to handle this
            )
            
            db.session.add(waste_entry)
            db.session.commit()
            
            # Trigger AI Verification (Async in real world, mocked here or called directly)
            # ...
            
            return jsonify({
                'message': 'Claim submitted successfully',
                'claim_id': waste_entry.id,
                'status': 'PENDING_VERIFICATION'
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@waste_bp.route('/claims', methods=['GET'])
@jwt_required()
def get_claims():
    """Get user's claims"""
    user_id = get_jwt_identity()
    claims = WasteEntry.query.filter_by(user_id=user_id).order_by(WasteEntry.created_at.desc()).all()
    
    return jsonify({
        'claims': [{
            'id': c.id,
            'waste_type': c.waste_type.value,
            'quantity': c.quantity,
            'status': 'VERIFIED' if c.is_verified else 'PENDING',
            'created_at': c.created_at.isoformat(),
            'image_url': c.image_url
        } for c in claims]
    })

@waste_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get dashboard stats"""
    # Mock stats for now, or aggregate from DB
    return jsonify({
        'total_claims': WasteEntry.query.count(),
        'verified_percentage': 94.2, # Mock
        'high_risk_flags': 3, # Mock
        'pending_audits': 12 # Mock
    })
