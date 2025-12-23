"""
Stripe Payment Integration Routes
Handles payment intents, webhooks, and payment processing
"""

import os
import stripe
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.user import User
from app.utils.helpers import success_response, error_response, get_ip_address
from app.models.audit_log import AuditLog

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

stripe_bp = Blueprint('stripe', __name__)


@stripe_bp.route('/create-intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    """
    Create a Stripe PaymentIntent for a booking
    
    Request Body:
        booking_id: ID of the booking to pay for
        amount: Payment amount in LKR (will be converted to cents)
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate booking exists and belongs to user
        booking = Booking.query.get(data.get('booking_id'))
        if not booking:
            return error_response('Booking not found', status_code=404)
        
        if booking.user_id != user_id:
            return error_response('Unauthorized', status_code=403)
        
        # Check if already paid
        if booking.status == 'confirmed':
            existing_payment = Payment.query.filter_by(
                booking_id=booking.booking_id,
                status='completed'
            ).first()
            if existing_payment:
                return error_response('Booking already paid', status_code=400)
        
        # Amount in cents (Stripe uses smallest currency unit)
        amount = int(float(data.get('amount', booking.total_amount)) * 100)
        
        # Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='lkr',
            metadata={
                'booking_id': str(booking.booking_id),
                'user_id': str(user_id),
                'room_id': str(booking.room_id),
            },
            description=f"Booking #{booking.booking_id} - Serendib Hotels",
        )
        
        return success_response(
            data={
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'amount': amount / 100,
            },
            message='Payment intent created'
        )
        
    except stripe.error.StripeError as e:
        return error_response(f'Stripe error: {str(e)}', status_code=400)
    except Exception as e:
        return error_response(f'Error creating payment: {str(e)}', status_code=500)


@stripe_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """
    Create a Stripe Checkout session for a booking
    Redirects user to Stripe's hosted checkout page
    
    Request Body:
        booking_id: ID of the booking to pay for
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate booking exists and belongs to user
        booking = Booking.query.get(data.get('booking_id'))
        if not booking:
            return error_response('Booking not found', status_code=404)
        
        if booking.user_id != user_id:
            return error_response('Unauthorized', status_code=403)
        
        # Check if already paid
        existing_payment = Payment.query.filter_by(
            booking_id=booking.booking_id,
            payment_status='completed'
        ).first()
        if existing_payment:
            return error_response('Booking already paid', status_code=400)
        
        # Get user for customer info
        user = User.query.get(user_id)
        
        # Frontend URLs for redirect
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        success_url = f"{frontend_url}/booking/success?booking_id={booking.booking_id}&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/booking/cancel?booking_id={booking.booking_id}"
        
        # Amount in cents
        amount = int(float(booking.total_amount) * 100)
        
        # Create Stripe Checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'lkr',
                    'product_data': {
                        'name': f'Hotel Booking #{booking.booking_id}',
                        'description': f'Room booking at Serendib Hotels - Check-in: {booking.check_in_date}, Check-out: {booking.check_out_date}',
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email if user else None,
            metadata={
                'booking_id': str(booking.booking_id),
                'user_id': str(user_id),
            },
        )
        
        return success_response(
            data={
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
            },
            message='Checkout session created'
        )
        
    except stripe.error.StripeError as e:
        return error_response(f'Stripe error: {str(e)}', status_code=400)
    except Exception as e:
        return error_response(f'Error creating checkout session: {str(e)}', status_code=500)


@stripe_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_payment():
    """
    Confirm payment after successful Stripe charge
    
    Request Body:
        session_id: Stripe Checkout Session ID (for checkout flow)
        payment_intent_id: Stripe PaymentIntent ID (for legacy flow)
        booking_id: Booking ID
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        session_id = data.get('session_id')
        payment_intent_id = data.get('payment_intent_id')
        booking_id = data.get('booking_id')
        
        # Handle Checkout Session flow
        if session_id:
            # Retrieve the checkout session
            checkout_session = stripe.checkout.Session.retrieve(session_id)
            
            if checkout_session.payment_status != 'paid':
                return error_response('Payment not completed', status_code=400)
            
            payment_intent_id = checkout_session.payment_intent
            amount = checkout_session.amount_total / 100
        elif payment_intent_id:
            # Legacy flow: retrieve payment intent directly
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status != 'succeeded':
                return error_response('Payment not completed', status_code=400)
            
            amount = intent.amount / 100
        else:
            return error_response('session_id or payment_intent_id required', status_code=400)
        
        # Get booking
        booking = Booking.query.get(booking_id)
        if not booking or booking.user_id != user_id:
            return error_response('Booking not found', status_code=404)
        
        # Create payment record
        payment = Payment(
            booking_id=booking.booking_id,
            user_id=user_id,
            amount=amount,
            payment_method='credit_card',
            payment_status='completed',
            transaction_id=payment_intent_id,
            payment_date=datetime.utcnow(),
        )
        
        db.session.add(payment)
        
        # Update booking status
        booking.status = 'confirmed'
        
        # Log the action
        AuditLog.log_action(
            user_id=user_id,
            action='PAYMENT',
            table_name='Payment',
            record_id=payment.payment_id if payment.payment_id else 0,
            new_values={'amount': payment.amount, 'booking_id': booking_id},
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        # Send SMS confirmation (non-blocking)
        try:
            from app.services.sms_service import send_payment_confirmation
            send_payment_confirmation(booking, payment.amount)
        except Exception as sms_error:
            print(f"SMS notification failed: {sms_error}")
        
        return success_response(
            data={
                'payment_id': payment.payment_id,
                'booking_id': booking.booking_id,
                'status': 'confirmed',
            },
            message='Payment confirmed successfully'
        )
        
    except stripe.error.StripeError as e:
        return error_response(f'Stripe error: {str(e)}', status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error confirming payment: {str(e)}', status_code=500)


@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events
    Used for async payment confirmations and failures
    """
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_ENDPOINT_SECRET')
    
    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            # For testing without webhook signature
            event = stripe.Event.construct_from(
                request.get_json(), stripe.api_key
            )
    except ValueError as e:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle specific event types
    event_type = event['type']
    
    if event_type == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_success(payment_intent)
        
    elif event_type == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_failure(payment_intent)
    
    return jsonify({'status': 'success'})


def handle_payment_success(payment_intent):
    """Process successful payment from webhook"""
    try:
        booking_id = payment_intent.get('metadata', {}).get('booking_id')
        if booking_id:
            booking = Booking.query.get(int(booking_id))
            if booking and booking.status != 'confirmed':
                booking.status = 'confirmed'
                db.session.commit()
                print(f"Booking {booking_id} confirmed via webhook")
    except Exception as e:
        print(f"Webhook payment success handling error: {e}")


def handle_payment_failure(payment_intent):
    """Process failed payment from webhook"""
    try:
        booking_id = payment_intent.get('metadata', {}).get('booking_id')
        if booking_id:
            print(f"Payment failed for booking {booking_id}")
            # Could update booking status or notify user
    except Exception as e:
        print(f"Webhook payment failure handling error: {e}")
