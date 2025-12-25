"""
Payment Management Routes
Payment processing, refunds, payment history
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.payment import Payment
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.middleware.auth import admin_required, get_current_user
from app.utils.helpers import (
    success_response, error_response, validate_required_fields,
    generate_transaction_id, get_ip_address
)

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/', methods=['POST'])
@jwt_required()
def process_payment():
    """
    Process payment for a booking
    
    Request Body:
        booking_id: Booking ID
        payment_method: Payment method (credit_card, debit_card, paypal, bank_transfer, cash)
        payment_details: Additional payment details (optional)
    """
    current_user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['booking_id', 'payment_method']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate booking exists
    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if booking.user_id != current_user.user_id and current_user.role not in ['staff', 'admin']:
        return error_response('You do not have permission to process payment for this booking', status_code=403)
    
    # Check if booking already paid
    existing_payment = Payment.query.filter_by(
        booking_id=booking.booking_id,
        payment_status='completed'
    ).first()
    
    if existing_payment:
        return error_response('Payment already completed for this booking', status_code=400)
    
    # Validate payment method
    valid_methods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash']
    if data['payment_method'] not in valid_methods:
        return error_response(f'Invalid payment method. Must be one of: {", ".join(valid_methods)}', status_code=400)
    
    try:
        # Create payment
        payment = Payment(
            booking_id=booking.booking_id,
            user_id=booking.user_id,
            amount=booking.total_amount,
            payment_method=data['payment_method'],
            payment_status='pending',
            payment_details=data.get('payment_details', {})
        )
        
        db.session.add(payment)
        db.session.flush()
        
        # Simulate payment processing (In production, integrate with payment gateway)
        transaction_id = generate_transaction_id()
        payment.process_payment(transaction_id)
        
        # Create notification
        Notification.create_notification(
            user_id=booking.user_id,
            message=f'Payment of Rs. {float(booking.total_amount):,.2f} received successfully for booking #{booking.booking_id}.',
            notification_type='payment',
            related_id=payment.payment_id
        )
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='PAYMENT_PROCESS',
            table_name='Payment',
            record_id=payment.payment_id,
            new_values=payment.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        # Send payment confirmation SMS (non-blocking)
        try:
            from app.services.sms_service import send_payment_confirmation
            send_payment_confirmation(booking, payment.amount)
        except Exception as sms_error:
            print(f"SMS payment notification failed: {sms_error}")
        
        return success_response(
            data={
                'payment': payment.to_dict(include_relations=True),
                'booking': booking.to_dict()
            },
            message='Payment processed successfully',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Payment processing failed: {str(e)}', status_code=500)


@payments_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_payment_history(booking_id):
    """
    Get payment history for a booking
    """
    current_user = get_current_user()
    
    # Validate booking
    booking = Booking.query.get(booking_id)
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if not current_user.can_manage_booking(booking):
        return error_response('You do not have permission to view payment history for this booking', status_code=403)
    
    payments = Payment.get_booking_payments(booking_id)
    
    return success_response(data={
        'payments': [payment.to_dict(include_relations=True) for payment in payments],
        'count': len(payments)
    })


@payments_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_payments():
    """
    Get all payments for current user
    """
    current_user = get_current_user()
    payments = Payment.get_user_payments(current_user.user_id)
    
    return success_response(data={
        'payments': [payment.to_dict(include_relations=True) for payment in payments],
        'count': len(payments)
    })


@payments_bp.route('/refund', methods=['POST'])
@jwt_required()
@admin_required
def process_refund():
    """
    Process refund for a payment (Admin only)
    
    Request Body:
        payment_id: Payment ID
        refund_amount: Refund amount (optional, defaults to full amount)
        reason: Refund reason
    """
    current_user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['payment_id']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate payment
    payment = Payment.query.get(data['payment_id'])
    if not payment:
        return error_response('Payment not found', status_code=404)
    
    refund_amount = data.get('refund_amount')
    
    try:
        # Process refund
        success, message = payment.process_refund(refund_amount)
        
        if not success:
            return error_response(message, status_code=400)
        
        # Create notification
        Notification.create_notification(
            user_id=payment.user_id,
            message=f'A refund of Rs. {float(payment.refund_amount):,.2f} has been processed for your booking.',
            notification_type='payment',
            related_id=payment.payment_id
        )
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='REFUND',
            table_name='Payment',
            record_id=payment.payment_id,
            new_values={'refund_amount': float(payment.refund_amount), 'reason': data.get('reason')},
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'payment': payment.to_dict(include_relations=True)},
            message=message
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Refund processing failed: {str(e)}', status_code=500)


@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """
    Get available payment methods
    """
    methods = [
        {
            'value': 'credit_card',
            'label': 'Credit Card',
            'icon': 'credit-card',
            'available': True
        },
        {
            'value': 'debit_card',
            'label': 'Debit Card',
            'icon': 'credit-card',
            'available': True
        },
        {
            'value': 'paypal',
            'label': 'PayPal',
            'icon': 'paypal',
            'available': True
        },
        {
            'value': 'bank_transfer',
            'label': 'Bank Transfer',
            'icon': 'bank',
            'available': True
        },
        {
            'value': 'cash',
            'label': 'Cash (At Reception)',
            'icon': 'cash',
            'available': True
        }
    ]
    
    return success_response(data={'payment_methods': methods})

