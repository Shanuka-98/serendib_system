"""
Facility Management Routes
CRUD for facilities, slots, bookings, and event inquiries
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app import db
from app.models.user import User
from app.models.facility import Facility, FacilitySlot, FacilityBooking, FacilityAddOn
from app.models.booking import Booking
from app.models.notification import Notification
from app.utils.helpers import get_local_time, success_response, error_response, validate_required_fields
from app.utils.email_service import send_quote_email

facilities_bp = Blueprint('facilities', __name__)


@facilities_bp.route('', methods=['GET'])
def get_facilities():
    """
    Get all facilities (public endpoint)
    
    Query Parameters:
        branch_id: Filter by branch
        facility_type: Filter by type (pool, gym, spa, event_hall, meeting_room)
        is_active: Filter by active status (default: true)
    """
    try:
        branch_id = request.args.get('branch_id', type=int)
        facility_type = request.args.get('facility_type')
        is_active = request.args.get('is_active', 'true').lower() == 'true'
        
        query = Facility.query
        
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if facility_type:
            query = query.filter_by(facility_type=facility_type)
        
        if is_active:
            query = query.filter_by(is_active=True)
        
        facilities = query.order_by(Facility.facility_type, Facility.name).all()
        
        return success_response(
            data=[f.to_dict() for f in facilities],
            message=f'Found {len(facilities)} facilities'
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('/<int:facility_id>', methods=['GET'])
def get_facility(facility_id):
    """
    Get facility details with slots and addons
    """
    try:
        facility = Facility.query.get(facility_id)
        if not facility:
            return error_response('Facility not found', 404)
        
        include_slots = request.args.get('include_slots', 'true').lower() == 'true'
        include_addons = request.args.get('include_addons', 'true').lower() == 'true'
        
        return success_response(
            data=facility.to_dict(include_slots=include_slots, include_addons=include_addons)
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('', methods=['POST'])
@jwt_required()
def create_facility():
    """
    Create a new facility (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        data = request.get_json()
        
        # Validate required fields
        required = ['branch_id', 'name', 'facility_type', 'capacity']
        missing = validate_required_fields(data, required)
        if missing:
            return error_response(f'Missing required fields: {", ".join(missing)}', 400)
        
        # Validate facility type
        valid_types = ['pool', 'gym', 'spa', 'event_hall', 'meeting_room']
        if data['facility_type'] not in valid_types:
            return error_response(f'Invalid facility type. Must be one of: {", ".join(valid_types)}', 400)
        
        facility = Facility(
            branch_id=data['branch_id'],
            name=data['name'],
            facility_type=data['facility_type'],
            description=data.get('description'),
            capacity=data['capacity'],
            price_per_slot=data.get('price_per_slot', 0),
            slot_duration_minutes=data.get('slot_duration_minutes', 60),
            requires_booking=data.get('requires_booking', True),
            is_guest_only=data.get('is_guest_only', True),
            amenities=data.get('amenities', []),
            images=data.get('images', []),
            operating_hours=data.get('operating_hours', {}),
            rules=data.get('rules')
        )
        
        db.session.add(facility)
        db.session.commit()
        
        return success_response(
            data=facility.to_dict(),
            message='Facility created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@facilities_bp.route('/<int:facility_id>', methods=['PUT'])
@jwt_required()
def update_facility(facility_id):
    """
    Update a facility (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        facility = Facility.query.get(facility_id)
        if not facility:
            return error_response('Facility not found', 404)
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            facility.name = data['name']
        if 'description' in data:
            facility.description = data['description']
        if 'capacity' in data:
            facility.capacity = data['capacity']
        if 'price_per_slot' in data:
            facility.price_per_slot = data['price_per_slot']
        if 'slot_duration_minutes' in data:
            facility.slot_duration_minutes = data['slot_duration_minutes']
        if 'requires_booking' in data:
            facility.requires_booking = data['requires_booking']
        if 'is_guest_only' in data:
            facility.is_guest_only = data['is_guest_only']
        if 'is_active' in data:
            facility.is_active = data['is_active']
        if 'amenities' in data:
            facility.amenities = data['amenities']
        if 'images' in data:
            facility.images = data['images']
        if 'operating_hours' in data:
            facility.operating_hours = data['operating_hours']
        if 'rules' in data:
            facility.rules = data['rules']
        
        db.session.commit()
        
        return success_response(
            data=facility.to_dict(),
            message='Facility updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@facilities_bp.route('/<int:facility_id>', methods=['DELETE'])
@jwt_required()
def delete_facility(facility_id):
    """
    Deactivate a facility (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        facility = Facility.query.get(facility_id)
        if not facility:
            return error_response('Facility not found', 404)
        
        # Soft delete - deactivate instead of removing
        facility.is_active = False
        db.session.commit()
        
        return success_response(message='Facility deactivated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# =====================================================
# FACILITY SLOTS
# =====================================================

@facilities_bp.route('/<int:facility_id>/slots', methods=['GET'])
def get_facility_slots(facility_id):
    """
    Get available slots for a facility on a specific date
    
    Query Parameters:
        date: Date to check availability (YYYY-MM-DD)
    """
    try:
        facility = Facility.query.get(facility_id)
        if not facility:
            return error_response('Facility not found', 404)
        
        date_str = request.args.get('date')
        if date_str:
            try:
                booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return error_response('Invalid date format. Use YYYY-MM-DD', 400)
        else:
            booking_date = date.today()
        
        available_slots = facility.get_available_slots(booking_date)
        
        return success_response(
            data={
                'facility_id': facility_id,
                'date': booking_date.isoformat(),
                'slots': available_slots
            }
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('/<int:facility_id>/slots', methods=['POST'])
@jwt_required()
def create_facility_slot(facility_id):
    """
    Create a time slot for a facility (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        facility = Facility.query.get(facility_id)
        if not facility:
            return error_response('Facility not found', 404)
        
        data = request.get_json()
        
        required = ['start_time', 'end_time']
        missing = validate_required_fields(data, required)
        if missing:
            return error_response(f'Missing required fields: {", ".join(missing)}', 400)
        
        # Parse times
        try:
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return error_response('Invalid time format. Use HH:MM', 400)
        
        slot = FacilitySlot(
            facility_id=facility_id,
            start_time=start_time,
            end_time=end_time,
            day_of_week=data.get('day_of_week', 'all'),
            max_capacity=data.get('max_capacity', facility.capacity),
            price_override=data.get('price_override')
        )
        
        db.session.add(slot)
        db.session.commit()
        
        return success_response(
            data=slot.to_dict(),
            message='Slot created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@facilities_bp.route('/slots/<int:slot_id>', methods=['DELETE'])
@jwt_required()
def delete_facility_slot(slot_id):
    """
    Delete a time slot (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        slot = FacilitySlot.query.get(slot_id)
        if not slot:
            return error_response('Slot not found', 404)
        
        slot.is_active = False
        db.session.commit()
        
        return success_response(message='Slot deactivated successfully')
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# =====================================================
# FACILITY BOOKINGS
# =====================================================

@facilities_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_facility_bookings():
    """
    Get facility bookings (filtered by user role)
    
    Query Parameters:
        facility_id: Filter by facility
        status: Filter by status
        date_from: Filter from date
        date_to: Filter to date
        type: Filter by facility_type (for event calendar)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        query = FacilityBooking.query.join(Facility)
        
        # Role-based filtering
        if user.role == 'guest':
            # Guests only see their own bookings
            query = query.filter(FacilityBooking.user_id == current_user_id)
        elif user.role == 'staff':
            # Staff see their branch bookings
            if user.branch_id:
                query = query.filter(Facility.branch_id == user.branch_id)
        # Admins see all
        
        # Apply filters
        facility_id = request.args.get('facility_id', type=int)
        if facility_id:
            query = query.filter(FacilityBooking.facility_id == facility_id)
        
        status = request.args.get('status')
        if status:
            query = query.filter(FacilityBooking.status == status)
        
        facility_type = request.args.get('type')
        if facility_type:
            query = query.filter(Facility.facility_type == facility_type)
        
        date_from = request.args.get('date_from')
        if date_from:
            query = query.filter(FacilityBooking.booking_date >= date_from)
        
        date_to = request.args.get('date_to')
        if date_to:
            query = query.filter(FacilityBooking.booking_date <= date_to)
        
        bookings = query.order_by(FacilityBooking.created_at.desc()).all()
        
        return success_response(
            data=[b.to_dict() for b in bookings],
            message=f'Found {len(bookings)} bookings'
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('/bookings/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_facility_booking(booking_id):
    """
    Get facility booking details
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = FacilityBooking.query.get(booking_id)
        if not booking:
            return error_response('Booking not found', 404)
        
        # Check access
        if user.role == 'guest' and booking.user_id != current_user_id:
            return error_response('Access denied', 403)
        
        return success_response(
            data=booking.to_dict(include_facility=True, include_user=True)
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('/bookings', methods=['POST'])
@jwt_required()
def create_facility_booking():
    """
    Create a facility booking or event inquiry
    
    For slot-based facilities (pool, gym, spa):
        - slot_id and booking_date required
        - Capacity is checked
    
    For event halls:
        - Creates an inquiry that admin/manager will quote
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        # Validate required fields
        required = ['facility_id', 'booking_date']
        is_valid, error_msg = validate_required_fields(data, required)
        if not is_valid:
            return error_response(error_msg, 400)
        
        facility = Facility.query.get(data['facility_id'])
        if not facility:
            return error_response('Facility not found', 404)
        
        if not facility.is_active:
            return error_response('Facility is not available', 400)
        
        # Parse booking date
        try:
            booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
        except ValueError:
            return error_response('Invalid date format. Use YYYY-MM-DD', 400)
        
        # Check for active room booking (to allow bill charge)
        room_booking_id = data.get('room_booking_id')
        if not room_booking_id and user.role == 'guest':
            # Find an active room booking for this user
            active_booking = Booking.query.filter(
                Booking.user_id == current_user_id,
                Booking.status.in_(['confirmed', 'checked_in']),
                Booking.check_in_date <= booking_date,
                Booking.check_out_date > booking_date
            ).order_by(Booking.check_in_date.desc()).first()
            
            if active_booking:
                room_booking_id = active_booking.booking_id

        # Enforce room booking for guest-only facilities
        if facility.is_guest_only and user.role == 'guest':
            if not room_booking_id:
                 return error_response('You need an active room reservation to book this facility', 400)
            
            # Verify the provided/found booking belongs to user (double check)
            room_booking = Booking.query.get(room_booking_id)
            if not room_booking or room_booking.user_id != current_user_id:
                return error_response('Invalid room booking', 400)
        
        number_of_guests = data.get('number_of_guests', 1)
        
        # Different handling for slot-based vs event bookings
        if facility.facility_type in ['event_hall', 'meeting_room']:
            # Event hall inquiry
            booking = FacilityBooking(
                facility_id=facility.facility_id,
                user_id=current_user_id,
                booking_date=booking_date,
                number_of_guests=number_of_guests,
                status='inquiry',
                event_type=data.get('event_type'),
                event_name=data.get('event_name'),
                contact_name=data.get('contact_name', user.full_name),
                contact_email=data.get('contact_email', user.email),
                contact_phone=data.get('contact_phone', user.phone),
                organization=data.get('organization'),
                special_requests=data.get('special_requests'),
                selected_addons=data.get('selected_addons', []),  # Guest's requested addons
                created_by=current_user_id
            )
            
            # Parse times if provided
            if data.get('start_time'):
                booking.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            if data.get('end_time'):
                booking.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            
        else:
            # Slot-based booking (pool, gym, spa)
            slot_id = data.get('slot_id')
            if not slot_id:
                return error_response('Slot ID is required for this facility type', 400)
            
            slot = FacilitySlot.query.get(slot_id)
            if not slot or slot.facility_id != facility.facility_id:
                return error_response('Invalid slot', 400)
            
            # Check capacity
            booked_count = FacilityBooking.query.filter(
                FacilityBooking.facility_id == facility.facility_id,
                FacilityBooking.slot_id == slot_id,
                FacilityBooking.booking_date == booking_date,
                FacilityBooking.status.in_(['pending', 'confirmed', 'in_progress'])
            ).with_entities(db.func.sum(FacilityBooking.number_of_guests)).scalar() or 0
            
            max_capacity = slot.max_capacity or facility.capacity
            if booked_count + number_of_guests > max_capacity:
                return error_response(f'Not enough capacity. Only {max_capacity - booked_count} spots remaining', 400)
            
            # Determine payment type and status
            price = float(slot.price_override) if slot.price_override else float(facility.price_per_slot)
            
            if price == 0:
                payment_type = 'free'
                payment_status = 'not_required'
                status = 'confirmed'
            else:
                payment_type = data.get('payment_type', 'add_to_bill')
                if payment_type == 'add_to_bill' and room_booking_id:
                    payment_status = 'pending'
                    status = 'confirmed'
                else:
                    payment_status = 'pending'
                    status = 'pending'
            
            booking = FacilityBooking(
                facility_id=facility.facility_id,
                slot_id=slot_id,
                user_id=current_user_id,
                room_booking_id=room_booking_id,
                booking_date=booking_date,
                start_time=slot.start_time,
                end_time=slot.end_time,
                number_of_guests=number_of_guests,
                status=status,
                base_price=price,
                total_amount=price,
                payment_type=payment_type,
                payment_status=payment_status,
                special_requests=data.get('special_requests'),
                created_by=current_user_id
            )
        
        db.session.add(booking)
        db.session.commit()
        
        # Notify managers for event inquiries
        if facility.facility_type in ['event_hall', 'meeting_room']:
            managers = User.query.filter(
                User.branch_id == facility.branch_id,
                User.role == 'staff',
                User.role_type.in_(['manager', 'front_desk']),
                User.is_active == True
            ).all()
            
            for manager in managers:
                notification = Notification(
                    user_id=manager.user_id,
                    message=f'New event inquiry for {facility.name} on {booking_date.strftime("%b %d, %Y")}',
                    notification_type='service',
                    related_id=booking.booking_id
                )
                db.session.add(notification)
            
            db.session.commit()
        
        return success_response(
            data=booking.to_dict(),
            message='Booking created successfully' if booking.status == 'confirmed' else 'Inquiry submitted successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@facilities_bp.route('/bookings/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_facility_booking(booking_id):
    """
    Update a facility booking
    - Guests can cancel their pending bookings
    - Staff/Admin can update status, add notes
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        booking = FacilityBooking.query.get(booking_id)
        if not booking:
            return error_response('Booking not found', 404)
        
        data = request.get_json()
        
        # Check access
        is_owner = booking.user_id == current_user_id
        is_staff_or_admin = user.role in ['staff', 'admin']
        is_manager = user.role == 'staff' and user.role_type == 'manager'
        
        if not is_owner and not is_staff_or_admin:
            return error_response('Access denied', 403)
        
        # Handle cancellation
        if data.get('status') == 'cancelled':
            if booking.status in ['completed', 'cancelled']:
                return error_response('Cannot cancel this booking', 400)
            
            booking.status = 'cancelled'
            booking.cancellation_reason = data.get('cancellation_reason')
            booking.cancelled_at = datetime.utcnow()
            db.session.commit()
            
            return success_response(
                data=booking.to_dict(),
                message='Booking cancelled successfully'
            )
        
        # Staff/Admin updates
        if is_staff_or_admin:
            if 'status' in data:
                old_status = booking.status
                booking.status = data['status']
                
                if data['status'] == 'confirmed' and old_status != 'confirmed':
                    booking.confirmed_at = datetime.utcnow()
                elif data['status'] == 'completed':
                    booking.completed_at = datetime.utcnow()
            
            if 'admin_notes' in data:
                booking.admin_notes = data['admin_notes']
            
            if 'payment_status' in data:
                booking.payment_status = data['payment_status']
        
        db.session.commit()
        
        return success_response(
            data=booking.to_dict(),
            message='Booking updated successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@facilities_bp.route('/bookings/<int:booking_id>/quote', methods=['POST'])
@jwt_required()
def create_booking_quote(booking_id):
    """
    Create a quote for an event inquiry (Admin/Manager only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check permission - Admin or Manager
        is_admin = user.role == 'admin'
        is_manager = user.role == 'staff' and user.role_type == 'manager'
        
        if not is_admin and not is_manager:
            return error_response('Admin or Manager access required', 403)
        
        booking = FacilityBooking.query.get(booking_id)
        if not booking:
            return error_response('Booking not found', 404)
        
        if booking.status not in ['inquiry', 'quoted']:
            return error_response('Can only quote inquiries', 400)
        
        # Manager can only quote for their branch
        if is_manager and user.branch_id != booking.facility.branch_id:
            return error_response('You can only manage events at your branch', 403)
        
        data = request.get_json()
        
        # Set base price
        if 'base_price' in data:
            booking.base_price = data['base_price']
        else:
            booking.base_price = float(booking.facility.price_per_slot)
        
        # Set addons
        if 'selected_addons' in data:
            booking.selected_addons = data['selected_addons']
        
        # Update times if provided
        if 'start_time' in data:
            booking.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data:
            booking.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        if 'number_of_guests' in data:
            booking.number_of_guests = data['number_of_guests']
        
        # Get branch rates
        service_charge_rate = 0.10
        tax_rate = 0.12
        if booking.facility.branch:
            try:
                tax_rate = float(booking.facility.branch.tax_rate) / 100
                service_charge_rate = float(booking.facility.branch.get_config('service_charge_rate', '0.10'))
            except:
                pass
        
        # Calculate totals
        booking.calculate_totals(service_charge_rate, tax_rate)
        
        # Update status to quoted
        booking.status = 'quoted'
        booking.quote_sent_at = datetime.utcnow()
        
        if 'admin_notes' in data:
            booking.admin_notes = data['admin_notes']
        
        db.session.commit()
        
        if booking.user_id:
            # Send Notification
            notification = Notification(
                user_id=booking.user_id,
                message=f'Your event inquiry for {booking.facility.name} has received a quote!',
                notification_type='booking',
                related_id=booking.booking_id
            )
            db.session.add(notification)
            db.session.commit()
            
            # Send Email (Fail-safe)
            try:
                # Use a default frontend URL if environment variable is not set
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
                link = f"{frontend_url}/facilities/bookings/{booking.booking_id}"
                
                # Get user email
                user_email = booking.contact_email or (booking.user.email if booking.user else None)
                
                if user_email:
                    booking_data = booking.to_dict()
                    booking_data['facility_name'] = booking.facility.name
                    send_quote_email(user_email, booking_data, link)
            except Exception as e:
                # Log but don't fail
                print(f"Email sending failed (non-blocking): {str(e)}")
        
        return success_response(
            data=booking.to_dict(),
            message='Quote created and sent successfully'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# =====================================================
# ADD-ONS
# =====================================================

@facilities_bp.route('/addons', methods=['GET'])
def get_addons():
    """
    Get available add-ons
    
    Query Parameters:
        branch_id: Filter by branch
        facility_id: Filter by facility
        category: Filter by category
    """
    try:
        query = FacilityAddOn.query.filter_by(is_active=True)
        
        branch_id = request.args.get('branch_id', type=int)
        if branch_id:
            query = query.filter(
                db.or_(
                    FacilityAddOn.branch_id == branch_id,
                    FacilityAddOn.branch_id.is_(None)
                )
            )
        
        facility_id = request.args.get('facility_id', type=int)
        if facility_id:
            query = query.filter(
                db.or_(
                    FacilityAddOn.facility_id == facility_id,
                    FacilityAddOn.facility_id.is_(None)
                )
            )
        
        category = request.args.get('category')
        if category:
            query = query.filter_by(category=category)
        
        addons = query.all()
        
        return success_response(
            data=[a.to_dict() for a in addons],
            message=f'Found {len(addons)} add-ons'
        )
    except Exception as e:
        return error_response(str(e), 500)


@facilities_bp.route('/addons', methods=['POST'])
@jwt_required()
def create_addon():
    """
    Create an add-on (Admin only)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return error_response('Admin access required', 403)
        
        data = request.get_json()
        
        required = ['name', 'price']
        missing = validate_required_fields(data, required)
        if missing:
            return error_response(f'Missing required fields: {", ".join(missing)}', 400)
        
        addon = FacilityAddOn(
            facility_id=data.get('facility_id'),
            branch_id=data.get('branch_id'),
            name=data['name'],
            description=data.get('description'),
            price=data['price'],
            price_type=data.get('price_type', 'flat'),
            category=data.get('category', 'other')
        )
        
        db.session.add(addon)
        db.session.commit()
        
        return success_response(
            data=addon.to_dict(),
            message='Add-on created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# =====================================================
# EVENT CALENDAR
# =====================================================

@facilities_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_event_calendar():
    """
    Get event bookings for calendar view (Admin/Manager only)
    
    Query Parameters:
        branch_id: Filter by branch
        month: Month (1-12)
        year: Year (YYYY)
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check permission
        is_admin = user.role == 'admin'
        is_manager = user.role == 'staff' and user.role_type == 'manager'
        is_front_desk = user.role == 'staff' and user.role_type == 'front_desk'
        
        if not is_admin and not is_manager and not is_front_desk:
            return error_response('Access denied', 403)
        
        # Get month and year
        month = request.args.get('month', type=int, default=datetime.now().month)
        year = request.args.get('year', type=int, default=datetime.now().year)
        
        # Calculate date range
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Build query
        query = FacilityBooking.query.join(Facility).filter(
            Facility.facility_type.in_(['event_hall', 'meeting_room']),
            FacilityBooking.booking_date >= start_date,
            FacilityBooking.booking_date <= end_date,
            FacilityBooking.status != 'cancelled'
        )
        
        # Branch filtering
        branch_id = request.args.get('branch_id', type=int)
        if branch_id:
            query = query.filter(Facility.branch_id == branch_id)
        elif is_manager or is_front_desk:
            # Staff only see their branch
            query = query.filter(Facility.branch_id == user.branch_id)
        
        bookings = query.order_by(FacilityBooking.booking_date).all()
        
        # Group by date for calendar view
        calendar_data = {}
        for booking in bookings:
            date_key = booking.booking_date.isoformat()
            if date_key not in calendar_data:
                calendar_data[date_key] = []
            calendar_data[date_key].append(booking.to_dict())
        
        return success_response(
            data={
                'month': month,
                'year': year,
                'events': calendar_data,
                'total_events': len(bookings)
            }
        )
    except Exception as e:
        return error_response(str(e), 500)
