"""
Stripe Payment Integration for FACILITY BOOKINGS (Event Halls, Meeting Rooms)
Separate from room booking payments to avoid conflicts
"""

import os
import stripe
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.facility import FacilityBooking
from app.models.user import User
from app.utils.helpers import success_response, error_response

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

facility_stripe_bp = Blueprint('facility_stripe', __name__)


@facility_stripe_bp.route('/checkout', methods=['POST'])
@jwt_required()
def create_facility_checkout():
    """
    Create a Stripe Checkout session for a FACILITY booking (Event Halls)
    
    Request Body:
        booking_id: ID of the facility booking to pay for
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        booking_id = data.get('booking_id')
        
        # Validate facility booking exists and belongs to user
        booking = FacilityBooking.query.get(booking_id)
        if not booking:
            return error_response('Facility booking not found', status_code=404)
        
        if booking.user_id != user_id:
            return error_response('Unauthorized', status_code=403)
        
        # Check if already paid
        if booking.payment_status == 'paid':
            return error_response('Booking already paid', status_code=400)
        
        # Check if quote exists (must be in quoted status for payment)
        if booking.status != 'quoted':
            return error_response('Booking must have an accepted quote before payment', status_code=400)
        
        # Get user for customer info
        user = User.query.get(user_id)
        
        # Frontend URLs for redirect
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        success_url = f"{frontend_url}/facilities/bookings/{booking.booking_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/facilities/bookings/{booking.booking_id}?payment=cancelled"
        
        # Amount in cents
        amount = int(float(booking.total_amount) * 100)
        
        if amount <= 0:
            return error_response('Invalid payment amount', status_code=400)
        
        # Create Stripe Checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'lkr',
                    'product_data': {
                        'name': f'{booking.facility.name} - {booking.event_name or "Event Booking"}',
                        'description': f'Event on {booking.booking_date} | {booking.number_of_guests} guests',
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email if user else booking.contact_email,
            metadata={
                'facility_booking_id': str(booking.booking_id),
                'user_id': str(user_id),
                'booking_type': 'facility',
            },
        )
        
        return success_response(
            data={
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
            },
            message='Facility checkout session created'
        )
        
    except stripe.error.StripeError as e:
        return error_response(f'Stripe error: {str(e)}', status_code=400)
    except Exception as e:
        return error_response(f'Error creating checkout session: {str(e)}', status_code=500)


@facility_stripe_bp.route('/confirm', methods=['POST'])
@jwt_required()
def confirm_facility_payment():
    """
    Confirm payment after successful Stripe charge for facility booking
    
    Request Body:
        session_id: Stripe Checkout Session ID
        booking_id: Facility Booking ID
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        session_id = data.get('session_id')
        booking_id = data.get('booking_id')
        
        if not session_id:
            return error_response('session_id is required', status_code=400)
        
        # Retrieve the checkout session
        checkout_session = stripe.checkout.Session.retrieve(session_id)
        
        if checkout_session.payment_status != 'paid':
            return error_response('Payment not completed', status_code=400)
        
        # Get facility booking
        booking = FacilityBooking.query.get(booking_id)
        if not booking or booking.user_id != user_id:
            return error_response('Facility booking not found', status_code=404)
        
        # Update booking status
        booking.status = 'confirmed'
        booking.payment_status = 'paid'
        booking.payment_type = 'pay_now'
        booking.stripe_payment_id = checkout_session.payment_intent
        booking.confirmed_at = datetime.utcnow()
        
        db.session.commit()
        
        return success_response(
            data={
                'booking_id': booking.booking_id,
                'status': 'confirmed',
                'payment_status': 'paid',
            },
            message='Facility payment confirmed successfully'
        )
        
    except stripe.error.StripeError as e:
        return error_response(f'Stripe error: {str(e)}', status_code=400)
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error confirming payment: {str(e)}', status_code=500)


@facility_stripe_bp.route('/webhook', methods=['POST'])
def facility_stripe_webhook():
    """
    Handle Stripe webhook events for facility bookings
    """
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_FACILITY_ENDPOINT_SECRET')
    
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
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle checkout.session.completed for facility bookings
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})
        
        if metadata.get('booking_type') == 'facility':
            facility_booking_id = metadata.get('facility_booking_id')
            if facility_booking_id:
                try:
                    booking = FacilityBooking.query.get(int(facility_booking_id))
                    if booking and booking.payment_status != 'paid':
                        booking.status = 'confirmed'
                        booking.payment_status = 'paid'
                        booking.stripe_payment_id = session.get('payment_intent')
                        booking.confirmed_at = datetime.utcnow()
                        db.session.commit()
                        print(f"Facility Booking {facility_booking_id} confirmed via webhook")
                except Exception as e:
                    print(f"Facility webhook error: {e}")
    
    return jsonify({'status': 'success'})
