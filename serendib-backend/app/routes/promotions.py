"""
Promotions Routes
Admin management and promo code validation
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.promotion import Promotion
from app.models.branch import Branch
from app.models.audit_log import AuditLog
from app.middleware.auth import admin_required, get_current_user
from app.utils.helpers import success_response, error_response, get_ip_address

promotions_bp = Blueprint('promotions', __name__)


@promotions_bp.route('', methods=['GET'])
@jwt_required()
@admin_required
def get_promotions():
    """Get all promotions with optional filters"""
    branch_id = request.args.get('branch_id', type=int)
    is_active = request.args.get('is_active')
    
    query = Promotion.query
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')
    
    promotions = query.order_by(Promotion.created_at.desc()).all()
    
    return success_response(data={
        'promotions': [p.to_dict() for p in promotions],
        'count': len(promotions)
    })


@promotions_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_promotion():
    """Create a new promotion"""
    data = request.get_json()
    current_user = get_current_user()
    
    required = ['title', 'discount_percentage', 'start_date', 'end_date', 'promo_code']
    for field in required:
        if not data.get(field):
            return error_response(f'{field} is required', status_code=400)
    
    # Check if promo code exists
    if Promotion.get_by_promo_code(data['promo_code']):
        return error_response('Promo code already exists', status_code=400)
    
    try:
        from datetime import datetime
        
        promotion = Promotion(
            branch_id=data.get('branch_id'),
            title=data['title'],
            description=data.get('description'),
            discount_percentage=data['discount_percentage'],
            discount_amount=data.get('discount_amount'),
            promo_code=data['promo_code'].upper(),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            is_active=data.get('is_active', True),
            terms_conditions=data.get('terms_conditions'),
            min_booking_amount=data.get('min_booking_amount'),
            max_discount=data.get('max_discount'),
            usage_limit=data.get('usage_limit')
        )
        
        db.session.add(promotion)
        
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='CREATE',
            table_name='Promotion',
            record_id=promotion.promotion_id,
            new_values=promotion.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'promotion': promotion.to_dict()},
            message='Promotion created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create promotion: {str(e)}', status_code=500)


@promotions_bp.route('/<int:promotion_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_promotion(promotion_id):
    """Update a promotion"""
    promotion = Promotion.query.get(promotion_id)
    if not promotion:
        return error_response('Promotion not found', status_code=404)
    
    data = request.get_json()
    current_user = get_current_user()
    old_values = promotion.to_dict()
    
    try:
        from datetime import datetime
        
        if 'title' in data:
            promotion.title = data['title']
        if 'description' in data:
            promotion.description = data['description']
        if 'discount_percentage' in data:
            promotion.discount_percentage = data['discount_percentage']
        if 'discount_amount' in data:
            promotion.discount_amount = data['discount_amount']
        if 'promo_code' in data:
            # Check uniqueness
            existing = Promotion.get_by_promo_code(data['promo_code'])
            if existing and existing.promotion_id != promotion_id:
                return error_response('Promo code already exists', status_code=400)
            promotion.promo_code = data['promo_code'].upper()
        if 'start_date' in data:
            promotion.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            promotion.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'is_active' in data:
            promotion.is_active = data['is_active']
        if 'branch_id' in data:
            promotion.branch_id = data['branch_id']
        if 'terms_conditions' in data:
            promotion.terms_conditions = data['terms_conditions']
        if 'min_booking_amount' in data:
            promotion.min_booking_amount = data['min_booking_amount']
        if 'max_discount' in data:
            promotion.max_discount = data['max_discount']
        if 'usage_limit' in data:
            promotion.usage_limit = data['usage_limit']
        
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='UPDATE',
            table_name='Promotion',
            record_id=promotion_id,
            old_values=old_values,
            new_values=promotion.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'promotion': promotion.to_dict()},
            message='Promotion updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update promotion: {str(e)}', status_code=500)


@promotions_bp.route('/<int:promotion_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_promotion(promotion_id):
    """Delete a promotion"""
    promotion = Promotion.query.get(promotion_id)
    if not promotion:
        return error_response('Promotion not found', status_code=404)
    
    current_user = get_current_user()
    
    try:
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='DELETE',
            table_name='Promotion',
            record_id=promotion_id,
            old_values=promotion.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.delete(promotion)
        db.session.commit()
        
        return success_response(message='Promotion deleted successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete promotion: {str(e)}', status_code=500)


@promotions_bp.route('/validate', methods=['POST'])
def validate_promo_code():
    """Validate a promo code and return discount details"""
    data = request.get_json()
    
    promo_code = data.get('promo_code')
    booking_amount = data.get('booking_amount')
    branch_id = data.get('branch_id')
    
    if not promo_code:
        return error_response('Promo code is required', status_code=400)
    if not booking_amount:
        return error_response('Booking amount is required', status_code=400)
    
    result = Promotion.validate_promo_code(promo_code.upper(), float(booking_amount), branch_id)
    
    if result['valid']:
        # Get promotion details for response
        promotion = Promotion.get_by_promo_code(promo_code.upper())
        result['promotion'] = {
            'promotion_id': promotion.promotion_id,
            'title': promotion.title,
            'discount_percentage': float(promotion.discount_percentage)
        }
    
    return success_response(data=result)
