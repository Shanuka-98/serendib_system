"""
Loyalty Program Routes
Loyalty points, tiers, and benefits
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.loyalty_program import LoyaltyProgram
from app.models.notification import Notification
from app.middleware.auth import get_current_user
from app.utils.helpers import success_response, error_response, validate_required_fields

loyalty_bp = Blueprint('loyalty', __name__)


@loyalty_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_loyalty_profile():
    """
    Get user's loyalty program profile
    """
    current_user = get_current_user()
    
    if current_user.role != 'guest':
        return error_response('Loyalty program is only available for guests', status_code=400)
    
    if not current_user.loyalty_program:
        return error_response('Loyalty program not found', status_code=404)
    
    return success_response(data={'loyalty': current_user.loyalty_program.to_dict()})


@loyalty_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_points():
    """
    Redeem loyalty points
    
    Request Body:
        points: Number of points to redeem
    """
    current_user = get_current_user()
    
    if current_user.role != 'guest':
        return error_response('Loyalty program is only available for guests', status_code=400)
    
    if not current_user.loyalty_program:
        return error_response('Loyalty program not found', status_code=404)
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['points']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    points_to_redeem = data['points']
    
    # Validate points
    if points_to_redeem <= 0:
        return error_response('Points must be greater than 0', status_code=400)
    
    # Redeem points
    success, message, discount_amount = current_user.loyalty_program.redeem_points(points_to_redeem)
    
    if not success:
        return error_response(message, status_code=400)
    
    # Create notification
    Notification.create_notification(
        user_id=current_user.user_id,
        message=f'You redeemed {points_to_redeem} points for Rs. {discount_amount:,.2f} discount!',
        notification_type='loyalty'
    )
    
    return success_response(
        data={
            'loyalty': current_user.loyalty_program.to_dict(),
            'discount_amount': discount_amount
        },
        message=message
    )


@loyalty_bp.route('/history', methods=['GET'])
@jwt_required()
def get_points_history():
    """
    Get loyalty points history
    """
    current_user = get_current_user()
    
    if current_user.role != 'guest':
        return error_response('Loyalty program is only available for guests', status_code=400)
    
    if not current_user.loyalty_program:
        return error_response('Loyalty program not found', status_code=404)
    
    # Get bookings for points history
    from app.models.booking import Booking
    bookings = Booking.query.filter_by(
        user_id=current_user.user_id,
        status='checked_out'
    ).order_by(Booking.checked_out_at.desc()).limit(50).all()
    
    history = []
    for booking in bookings:
        points_earned = LoyaltyProgram.calculate_points_for_amount(float(booking.total_amount))
        history.append({
            'booking_id': booking.booking_id,
            'date': booking.checked_out_at.isoformat() if booking.checked_out_at else None,
            'amount': float(booking.total_amount),
            'points_earned': points_earned,
            'branch': booking.branch.name if booking.branch else None
        })
    
    return success_response(data={
        'history': history,
        'count': len(history)
    })


@loyalty_bp.route('/benefits', methods=['GET'])
@jwt_required()
def get_benefits():
    """
    Get loyalty benefits for user's tier
    """
    current_user = get_current_user()
    
    if current_user.role != 'guest':
        return error_response('Loyalty program is only available for guests', status_code=400)
    
    if not current_user.loyalty_program:
        return error_response('Loyalty program not found', status_code=404)
    
    loyalty = current_user.loyalty_program
    
    return success_response(data={
        'current_tier': loyalty.tier,
        'benefits': loyalty.get_tier_benefits(),
        'discount_percentage': loyalty.get_discount_percentage(),
        'next_tier': loyalty.get_next_tier(),
        'points_to_next_tier': loyalty.points_to_next_tier()
    })


@loyalty_bp.route('/tiers', methods=['GET'])
def get_all_tiers():
    """
    Get all loyalty tiers and their benefits
    """
    tiers = {
        'bronze': {
            'threshold': 0,
            'discount': 0,
            'benefits': [
                'Earn 10 points per 1000 spent',
                'Birthday bonus points',
                'Exclusive member offers'
            ]
        },
        'silver': {
            'threshold': 1000,
            'discount': 5,
            'benefits': [
                'All Bronze benefits',
                '5% discount on bookings',
                'Late checkout (subject to availability)',
                'Priority customer support'
            ]
        },
        'gold': {
            'threshold': 3000,
            'discount': 10,
            'benefits': [
                'All Silver benefits',
                '10% discount on bookings',
                'Free room upgrade (subject to availability)',
                'Complimentary breakfast',
                'Airport transfer discount'
            ]
        },
        'platinum': {
            'threshold': 5000,
            'discount': 15,
            'benefits': [
                'All Gold benefits',
                '15% discount on bookings',
                'Guaranteed room upgrade',
                'Free spa services',
                'VIP concierge service',
                'Exclusive lounge access'
            ]
        }
    }
    
    # Get tier statistics
    stats = LoyaltyProgram.get_tier_stats()
    
    return success_response(data={
        'tiers': tiers,
        'statistics': stats
    })

