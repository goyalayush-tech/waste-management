from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.models import BlockchainTransaction, db
from app.utils.decorators import admin_required
from datetime import datetime
from sqlalchemy import desc

blockchain_bp = Blueprint('blockchain', __name__)

@blockchain_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_transactions():
    """Get all blockchain transactions with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        transactions = BlockchainTransaction.query.order_by(desc(BlockchainTransaction.timestamp)).paginate(
            page=page, per_page=per_page, error_out=False
        )

        transaction_list = [
            {
                'id': t.id,
                'transaction_hash': t.transaction_hash,
                'transaction_type': t.transaction_type,
                'details': t.details,
                'timestamp': t.timestamp.isoformat()
            } for t in transactions.items
        ]
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
    return jsonify({'success': True, 'data': transaction_list})

@blockchain_bp.route('/issue-reward', methods=['POST'])
@jwt_required()
@admin_required
def issue_reward_token():
    """
    Issues a reward token to a user for a verified positive action.
    This logs the transaction on our internal blockchain ledger.
    """
    data = request.get_json()
    if not data or 'user_id' not in data or 'amount' not in data or 'reason' not in data:
        return jsonify({'success': False, 'message': 'Missing user_id, amount, or reason'}), 400

    try:
        user_id = data['user_id']
        amount = float(data['amount'])
        reason = data['reason']

        # In a real implementation, this would interact with a smart contract.
        # Here, we simulate it by creating a transaction record.
        transaction_hash = f"0x{db.func.md5(f'{user_id}{amount}{reason}{datetime.utcnow()}').hexdigest()}"

        new_transaction = BlockchainTransaction(
            transaction_hash=transaction_hash,
            transaction_type='REWARD',
            details=f"Issued {amount} GDT to user {user_id} for {reason}"
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Reward transaction logged successfully.',
            'transaction_hash': transaction_hash
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
