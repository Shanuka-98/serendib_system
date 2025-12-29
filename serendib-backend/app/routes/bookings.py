"""
Booking Management Routes
Booking CRUD operations, check-in, check-out
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.booking import Booking
from app.models.room import Room
from app.models.user import User
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.middleware.auth import staff_or_admin_required, get_current_user
from app.utils.helpers import (
    success_response, error_response, validate_required_fields,
    validate_date_range, calculate_booking_amount, get_ip_address
)

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def get_bookings():
    """
    Get bookings (filtered by user role)
    
    Query Parameters:
        status: Filter by status (optional)
        branch_id: Filter by branch (staff/admin only)
        date_from: Filter bookings from this date
        date_to: Filter bookings until this date
    """
    current_user = get_current_user()
    status = request.args.get('status')
    branch_id = request.args.get('branch_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    
    # Start with empty date filters so they only apply when the user provides them
    date_from_obj = None
    date_to_obj = None
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            return error_response('Invalid date_from format. Use YYYY-MM-DD', status_code=400)
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            return error_response('Invalid date_to format. Use YYYY-MM-DD', status_code=400)
    
    # Get bookings based on role
    if current_user.role == 'guest':
        # Guests see only their bookings
        bookings = Booking.get_user_bookings(current_user.user_id, status)
    elif current_user.role == 'staff':
        # Staff see bookings for their branch
        if not current_user.branch_id:
            return error_response('Staff member not assigned to a branch', status_code=400)
        bookings = Booking.get_branch_bookings(current_user.branch_id, status, date_from_obj, date_to_obj)
    else:  # admin
        # Admins see all bookings or filtered by branch
        if branch_id:
            bookings = Booking.get_branch_bookings(branch_id, status, date_from_obj, date_to_obj)
        else:
            query = Booking.query
            if status:
                query = query.filter_by(status=status)
            if date_from_obj:
                query = query.filter(Booking.check_in_date >= date_from_obj)
            if date_to_obj:
                query = query.filter(Booking.check_out_date <= date_to_obj)
            bookings = query.order_by(Booking.booking_id.desc()).all()
    
    return success_response(data={
        'bookings': [booking.to_dict(include_relations=True) for booking in bookings],
        'count': len(bookings)
    })


@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    """
    Get booking details by ID
    """
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if not current_user.can_manage_booking(booking):
        return error_response('You do not have permission to view this booking', status_code=403)
    
    return success_response(data={'booking': booking.to_dict(include_relations=True)})


@bookings_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    """
    Create a new booking
    
    Request Body:
        room_id: Room ID
        check_in_date: Check-in date (YYYY-MM-DD)
        check_out_date: Check-out date (YYYY-MM-DD)
        number_of_guests: Number of guests
        special_requests: Special requests (optional)
    """
    current_user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['room_id', 'check_in_date', 'check_out_date', 'number_of_guests']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate room exists
    room = Room.query.get(data['room_id'])
    if not room:
        return error_response('Room not found', status_code=404)
    
    # Validate dates
    check_in = data['check_in_date']
    check_out = data['check_out_date']
    
    is_valid, errors = validate_date_range(check_in, check_out)
    if not is_valid:
        return error_response('Invalid date range', errors=errors, status_code=400)
    
    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
    
    # Check room availability
    if not room.check_availability(check_in_date, check_out_date):
        return error_response('Room is not available for the selected dates', status_code=409)
    
    # Validate capacity
    if data['number_of_guests'] > room.capacity:
        return error_response(f'Number of guests exceeds room capacity ({room.capacity})', status_code=400)
    
    try:
        # Get service charge rate
        service_charge_rate = float(room.branch.get_config('service_charge_rate', '0.10'))
        
        # Calculate base amount
        amount_details = calculate_booking_amount(
            room.price_per_night,
            check_in_date,
            check_out_date,
            room.branch.tax_rate,
            service_charge_rate
        )
        
        # Initialize discount tracking
        loyalty_discount = 0
        points_discount = 0
        points_redeemed = 0
        tier_discount_percent = 0
        promo_discount = 0
        promo_code = None
        
        # Apply loyalty tier discount if user has loyalty program
        if current_user.role == 'guest' and current_user.loyalty_program:
            tier_discount_percent = current_user.loyalty_program.get_discount_percentage()
            if tier_discount_percent > 0:
                loyalty_discount = float(amount_details['subtotal']) * (tier_discount_percent / 100)
        
        # Handle points redemption if requested
        redeem_points = data.get('redeem_points', 0)
        if redeem_points > 0 and current_user.loyalty_program:
            if redeem_points <= current_user.loyalty_program.points:
                # 100 points = 100 LKR discount
                points_discount = float(redeem_points)
                points_redeemed = redeem_points
                # Deduct points from user
                current_user.loyalty_program.points -= redeem_points
            else:
                return error_response('Insufficient loyalty points', status_code=400)
        
        # Handle promo code discount if provided
        promo_code = data.get('promo_code')
        promo_discount = float(data.get('promo_discount', 0))
        
        # Calculate final total (with all discounts)
        discounted_subtotal = float(amount_details['subtotal']) - loyalty_discount - points_discount - promo_discount
        if discounted_subtotal < 0:
            discounted_subtotal = 0
        
        # Recalculate tax on discounted amount
        # Service charge is calculated on the discounted subtotal
        service_charge = discounted_subtotal * service_charge_rate
        taxable_amount = discounted_subtotal + service_charge
        tax_amount = taxable_amount * float(room.branch.tax_rate) / 100
        
        final_total = discounted_subtotal + service_charge + tax_amount
        
        # Create booking
        booking = Booking(
            user_id=current_user.user_id,
            room_id=data['room_id'],
            branch_id=room.branch_id,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            total_amount=final_total,
            status='pending',
            number_of_guests=data['number_of_guests'],
            special_requests=data.get('special_requests'),
            
            # Save discount info to new columns
            promo_code=promo_code,
            promo_discount=promo_discount,
            loyalty_discount=loyalty_discount,
            loyalty_points_redeemed=points_redeemed,
            points_discount=points_discount
        )
        
        db.session.add(booking)
        db.session.flush()
        
        # Create plain pending payment record (for status tracking)
        from app.models.payment import Payment
        pending_payment = Payment(
            booking_id=booking.booking_id,
            user_id=current_user.user_id,
            amount=final_total,
            payment_method='credit_card',
            payment_status='pending'
        )
        db.session.add(pending_payment)
        
        # Create notification
        Notification.create_notification(
            user_id=current_user.user_id,
            message=f'Your booking for {room.room_number} at {room.branch.name} has been created. Please complete payment to confirm.',
            notification_type='booking',
            related_id=booking.booking_id,
            action_url=f'/bookings/{booking.booking_id}'
        )

        # Create loyalty notification if points were redeemed
        if redeem_points > 0 and current_user.loyalty_program:
            # Create history record manually to ensure atomicity with booking transaction
            from app.models.loyalty_history import LoyaltyHistory
            history = LoyaltyHistory(
                loyalty_id=current_user.loyalty_program.loyalty_id,
                amount=-points_redeemed,
                transaction_type='redeemed',
                description=f'Redeemed {points_redeemed} points on booking #{booking.booking_id}',
                related_booking_id=booking.booking_id
            )
            db.session.add(history)

            Notification.create_notification(
                user_id=current_user.user_id,
                message=f'You redeemed {points_redeemed} points for {points_discount:,.2f} LKR discount on booking #{booking.booking_id}.',
                notification_type='loyalty',
                related_id=booking.booking_id
            )
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='CREATE',
            table_name='Booking',
            record_id=booking.booking_id,
            new_values=booking.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        # Include loyalty info in response
        loyalty_info = {
            'tier_discount_percent': tier_discount_percent,
            'tier_discount_amount': loyalty_discount,
            'points_redeemed': points_redeemed,
            'points_discount': points_discount,
            'original_total': float(amount_details['total']),
            'final_total': final_total
        }
        
        return success_response(
            data={
                'booking': booking.to_dict(include_relations=True),
                'amount_details': amount_details,
                'loyalty_applied': loyalty_info
            },
            message='Booking created successfully. Please proceed with payment.',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create booking: {str(e)}', status_code=500)


@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    """
    Update booking details
    """
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if not current_user.can_manage_booking(booking):
        return error_response('You do not have permission to modify this booking', status_code=403)
    
    # Only pending or confirmed bookings can be modified
    if booking.status not in ['pending', 'confirmed']:
        return error_response(f'Cannot modify booking with status: {booking.status}', status_code=400)
    
    data = request.get_json()
    old_values = booking.to_dict()
    
    try:
        # Update allowed fields
        if 'check_in_date' in data or 'check_out_date' in data:
            new_check_in = datetime.strptime(data.get('check_in_date', booking.check_in_date.isoformat()), '%Y-%m-%d').date()
            new_check_out = datetime.strptime(data.get('check_out_date', booking.check_out_date.isoformat()), '%Y-%m-%d').date()
            
            # Validate new dates
            is_valid, errors = validate_date_range(new_check_in.isoformat(), new_check_out.isoformat())
            if not is_valid:
                return error_response('Invalid date range', errors=errors, status_code=400)
            
            # Check availability for new dates
            if not booking.room.check_availability(new_check_in, new_check_out):
                return error_response('Room is not available for the new dates', status_code=409)
            
            booking.check_in_date = new_check_in
            booking.check_out_date = new_check_out
            
            # Recalculate amount
            service_charge_rate = float(booking.room.branch.get_config('service_charge_rate', '0.10'))
            amount_details = calculate_booking_amount(
                booking.room.price_per_night,
                new_check_in,
                new_check_out,
                booking.branch.tax_rate,
                service_charge_rate
            )
            booking.total_amount = amount_details['total']
        
        if 'number_of_guests' in data:
            if data['number_of_guests'] > booking.room.capacity:
                return error_response(f'Number of guests exceeds room capacity', status_code=400)
            booking.number_of_guests = data['number_of_guests']
        
        if 'special_requests' in data:
            booking.special_requests = data['special_requests']
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='UPDATE',
            table_name='Booking',
            record_id=booking.booking_id,
            old_values=old_values,
            new_values=booking.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'booking': booking.to_dict(include_relations=True)},
            message='Booking updated successfully'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update booking: {str(e)}', status_code=500)


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    """
    Cancel a booking
    
    Request Body:
        cancellation_reason: Reason for cancellation (optional)
    """
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if not current_user.can_manage_booking(booking):
        return error_response('You do not have permission to cancel this booking', status_code=403)
    
    data = request.get_json() or {}
    reason = data.get('cancellation_reason', 'Cancelled by user')
    
    # Cancel booking
    is_staff = current_user.role in ['staff', 'admin']
    success, message = booking.cancel(reason, ignore_policy=is_staff)
    
    if not success:
        return error_response(message, status_code=400)
    
    # Process refund if payment was made via Stripe
    refund_message = ""
    payment = Payment.query.filter_by(
        booking_id=booking.booking_id,
        payment_status='completed'
    ).first()
    
    if payment and payment.transaction_id and payment.payment_method in ['credit_card', 'debit_card']:
        try:
            import stripe
            stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY')
            
            # Create refund
            refund = stripe.Refund.create(
                payment_intent=payment.transaction_id,
                reason='requested_by_customer'
            )
            
            # Update payment status
            payment.payment_status = 'refunded'
            payment.refund_id = refund.id
            db.session.commit()
            
            refund_message = " A full refund has been processed."
        except Exception as e:
            # Log error but don't fail the cancellation
            print(f"Refund failed: {str(e)}")
            refund_message = " Refund will be processed manually."
    elif payment:
        # Cash or other payment - mark for manual refund
        payment.payment_status = 'refunded'
        db.session.commit()
        refund_message = " Please contact us for your refund."
    
    # Create notification
    Notification.create_notification(
        user_id=booking.user_id,
        message=f'Your booking #{booking.booking_id} has been cancelled.{refund_message}',
        notification_type='booking',
        related_id=booking.booking_id
    )
    
    # Send cancellation SMS (non-blocking)
    try:
        from app.services.sms_service import send_booking_cancelled
        send_booking_cancelled(booking, booking.user)
    except Exception as sms_error:
        print(f"SMS cancellation failed: {sms_error}")
    
    # Log action
    AuditLog.log_action(
        user_id=current_user.user_id,
        action='CANCEL',
        table_name='Booking',
        record_id=booking.booking_id,
        old_values={'status': 'confirmed'},
        new_values={'status': 'cancelled', 'reason': reason},
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(message=message + refund_message)


@bookings_bp.route('/<int:booking_id>/checkin', methods=['POST'])
@jwt_required()
@staff_or_admin_required
def check_in(booking_id):
    """
    Check in a guest (Staff/Admin only)
    """
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Staff can only check in guests for their branch
    if current_user.role == 'staff' and current_user.branch_id != booking.branch_id:
        return error_response('You can only check in guests for your branch', status_code=403)
    
    # Perform check-in
    success, message = booking.check_in()
    
    if not success:
        return error_response(message, status_code=400)
    
    # Create notification
    Notification.create_notification(
        user_id=booking.user_id,
        message=f'Welcome! You have been checked in to {booking.room.room_number} at {booking.branch.name}.',
        notification_type='booking',
        related_id=booking.booking_id
    )
    
    # Log action
    AuditLog.log_action(
        user_id=current_user.user_id,
        action='CHECKIN',
        table_name='Booking',
        record_id=booking.booking_id,
        new_values={'status': 'checked_in'},
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(
        data={'booking': booking.to_dict(include_relations=True)},
        message=message
    )


@bookings_bp.route('/<int:booking_id>/checkout', methods=['POST'])
@jwt_required()
@staff_or_admin_required
def check_out(booking_id):
    """
    Check out a guest (Staff/Admin only)
    """
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Staff can only check out guests for their branch
    if current_user.role == 'staff' and current_user.branch_id != booking.branch_id:
        return error_response('You can only check out guests for your branch', status_code=403)
    
    # Perform check-out
    success, message = booking.check_out()
    
    if not success:
        return error_response(message, status_code=400)
    
    # Award loyalty points if guest
    if booking.user.role == 'guest' and booking.user.loyalty_program:
        points_earned = booking.user.loyalty_program.add_points(float(booking.total_amount))
        
        # Create notification for points earned
        Notification.create_notification(
            user_id=booking.user_id,
            message=f'You earned {points_earned} loyalty points from your stay! Current balance: {booking.user.loyalty_program.points} points.',
            notification_type='loyalty',
            related_id=booking.booking_id
        )
    
    # Create check-out notification
    Notification.create_notification(
        user_id=booking.user_id,
        message=f'Thank you for staying with us! Your check-out from {booking.room.room_number} is complete.',
        notification_type='booking',
        related_id=booking.booking_id
    )
    
    # Log action
    AuditLog.log_action(
        user_id=current_user.user_id,
        action='CHECKOUT',
        table_name='Booking',
        record_id=booking.booking_id,
        new_values={'status': 'checked_out'},
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    db.session.commit()
    
    return success_response(
        data={'booking': booking.to_dict(include_relations=True)},
        message=message
    )


@bookings_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_bookings():
    """
    Get upcoming bookings
    
    Query Parameters:
        days: Number of days to look ahead (default: 7)
    """
    days = request.args.get('days', 7, type=int)
    bookings = Booking.get_upcoming_bookings(days)
    
    current_user = get_current_user()
    
    # Filter by user role
    if current_user.role == 'guest':
        bookings = [b for b in bookings if b.user_id == current_user.user_id]
    elif current_user.role == 'staff':
        bookings = [b for b in bookings if b.branch_id == current_user.branch_id]
    
    return success_response(data={
        'bookings': [booking.to_dict(include_relations=True) for booking in bookings],
        'count': len(bookings)
    })


@bookings_bp.route('/<int:booking_id>/bill', methods=['GET'])
@jwt_required()
def get_booking_bill(booking_id):
    """
    Get itemized bill for a booking (for checkout)
    
    Returns room charges, service charges, taxes, and balance due
    """
    from app.models.service_request import ServiceRequest
    
    current_user = get_current_user()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission
    if current_user.role == 'guest' and booking.user_id != current_user.user_id:
        return error_response('Unauthorized', status_code=403)
    elif current_user.role == 'staff' and booking.branch_id != current_user.branch_id:
        return error_response('Unauthorized', status_code=403)
    
    # Calculate nights
    nights = (booking.check_out_date - booking.check_in_date).days
    if nights < 1:
        nights = 1
    
    # Room charges
    room_rate = float(booking.room.price_per_night) if booking.room else 0
    room_total = room_rate * nights
    
    # Get billed services
    services = ServiceRequest.query.filter_by(
        booking_id=booking_id,
        is_billed=True
    ).order_by(ServiceRequest.completed_at).all()
    
    service_items = []
    services_total = 0
    for svc in services:
        price = float(svc.price) if svc.price else 0
        services_total += price
        service_items.append({
            'request_id': svc.request_id,
            'type': svc.service_type.replace('_', ' ').title(),
            'description': svc.description[:50] if svc.description else '',
            'date': svc.completed_at.strftime('%Y-%m-%d') if svc.completed_at else None,
            'price': price
        })
    
    # Tax rates from branch
    tax_rate = float(booking.room.branch.tax_rate) / 100 if booking.room and booking.room.branch else 0.13
    
    # Service Charge (Dynamic via PropertyConfig)
    service_charge_rate = 0.10 # Default
    if booking.room and booking.room.branch:
        # get_config returns string, so we cast to float
        sc_config = booking.room.branch.get_config('service_charge_rate', '0.10')
        try:
            service_charge_rate = float(sc_config)
        except (ValueError, TypeError):
            service_charge_rate = 0.10
    
    # Calculations
    subtotal = room_total + services_total
    service_charge = subtotal * service_charge_rate
    taxable_amount = subtotal + service_charge
    tax = taxable_amount * tax_rate
    grand_total = subtotal + service_charge + tax
    
    # what's been paid
    payment = booking.payments.filter_by(payment_status='completed').first()
    prepaid = float(booking.total_amount) if payment else 0
    
    balance_due = max(0, grand_total - prepaid)
    
    # Format booking reference
    booking_year = booking.booking_date.year if booking.booking_date else 2025
    booking_ref = f"SER-{booking_year}-{str(booking.booking_id).zfill(6)}"
    
    bill_data = {
        'booking_ref': booking_ref,
        'booking_id': booking.booking_id,
        'guest_name': booking.user.full_name if booking.user else 'Guest',
        'guest_email': booking.user.email if booking.user else None,
        'guest_phone': booking.user.phone if booking.user else None,
        'room_number': booking.room.room_number if booking.room else 'N/A',
        'room_type': booking.room.room_type if booking.room else 'N/A',
        'branch_name': booking.room.branch.name if booking.room and booking.room.branch else 'Serendib Hotels',
        'stay': {
            'check_in': booking.check_in_date.strftime('%Y-%m-%d'),
            'check_out': booking.check_out_date.strftime('%Y-%m-%d'),
            'nights': nights
        },
        'room_charges': {
            'per_night': room_rate,
            'nights': nights,
            'total': room_total,
            'paid': bool(payment)
        },
        'services': service_items,
        'services_total': services_total,
        'service_charge_rate': service_charge_rate,
        'tax_rate': tax_rate,
        'summary': {
            'room_total': room_total,
            'services_subtotal': services_total,
            'subtotal': subtotal,
            'service_charge': round(service_charge, 2),
            'tax': round(tax, 2),
            'grand_total': round(grand_total, 2),
            'prepaid': prepaid,
            'balance_due': round(balance_due, 2)
        }
    }
    
    return success_response(data={'bill': bill_data})
