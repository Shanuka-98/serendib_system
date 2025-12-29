"""
Notification Service
Centralized service for creating and emitting real-time notifications
"""

from datetime import datetime
from app import db
from app.models.notification import Notification
from app.models.user import User


def get_socketio():
    """Get Socket.IO instance (lazy import to avoid circular dependency)"""
    from app import socketio
    return socketio


def format_booking_ref(booking_id, year=None):
    """
    Format booking ID to professional reference number
    Example: 9 -> "SER-2024-000009"
    """
    current_year = year or datetime.now().year
    padded_id = str(booking_id).zfill(6)
    return f"SER-{current_year}-{padded_id}"


def create_booking_notification(booking, guest_user):
    """
    Create notifications for staff in the booking's branch when a booking is confirmed
    
    Args:
        booking: Booking object
        guest_user: User object of the guest who made the booking
    """
    branch_id = booking.branch_id
    branch_name = booking.branch.name if booking.branch else 'Unknown'
    booking_ref = format_booking_ref(booking.booking_id)
    
    # Get staff users for this branch only (Manager and Front Desk only)
    staff_users = User.query.filter(
        db.and_(
            User.role == 'staff', 
            User.branch_id == branch_id,
            User.role_type.in_(['manager', 'front_desk'])
        )
    ).all()
    
    message = f"New booking {booking_ref} by {guest_user.full_name} for Room {booking.room.room_number} ({branch_name})"
    action_url = f"/staff/bookings"
    
    notifications = []
    
    for staff in staff_users:
        notification = Notification(
            user_id=staff.user_id,
            message=message,
            notification_type='booking',
            related_id=booking.booking_id,
            action_url=action_url
        )
        db.session.add(notification)
        notifications.append(notification)
    
    db.session.commit()
    
    # Emit real-time notification to branch-specific role rooms
    if notifications:
        notification_data = {
            'type': 'booking',
            'title': 'New Booking Confirmed',
            'message': message,
            'related_id': booking.booking_id,
            'booking_ref': booking_ref,
            'action_url': action_url,
            'branch_id': branch_id,
            'branch_name': branch_name,
            'guest_name': guest_user.full_name,
            'room_number': booking.room.room_number if booking.room else None,
            'check_in': booking.check_in_date.isoformat() if booking.check_in_date else None,
            'check_out': booking.check_out_date.isoformat() if booking.check_out_date else None
        }
        
        # Emit to managers and front desk only
        try:
            socketio = get_socketio()
            socketio.emit('new_notification', notification_data, room=f'branch_{branch_id}_manager')
            socketio.emit('new_notification', notification_data, room=f'branch_{branch_id}_front_desk')
            print(f"[Notification] Emitted booking alert to {branch_name} (Mgr/FD)")
        except Exception as e:
            print(f"[Notification] Error emitting booking alert: {str(e)}")
    
    return notifications


def create_service_request_notification(service_request, guest_user, booking):
    """
    Create notifications for staff in the booking's branch when a service request is raised.
    Routes to staff with matching role_type for the service.
    
    Args:
        service_request: ServiceRequest object
        guest_user: User object of the guest
        booking: Related Booking object
    """
    from app.models.service_request import ServiceRequest as SR
    
    branch_id = booking.branch_id if booking else None
    branch_name = booking.branch.name if booking and booking.branch else 'Unknown'
    
    # Get the role_type that should handle this service type
    target_role_type = SR.get_role_type_for_service(service_request.service_type)
    
    # Get staff users for this branch with matching role_type
    # Managers and front_desk also receive all service notifications
    if branch_id:
        staff_users = User.query.filter(
            db.and_(
                User.role == 'staff',
                User.branch_id == branch_id,
                db.or_(
                    User.role_type == target_role_type,
                    User.role_type == 'manager',
                    User.role_type == 'front_desk'
                )
            )
        ).all()
    else:
        # Fallback: notify managers and front desk only (no branch filter)
        staff_users = User.query.filter(
            db.and_(
                User.role == 'staff',
                db.or_(
                    User.role_type == 'manager',
                    User.role_type == 'front_desk'
                )
            )
        ).all()
    
    service_type_display = service_request.service_type.replace('_', ' ').title()
    room_number = booking.room.room_number if booking and booking.room else 'N/A'
    
    message = f"New {service_type_display} request from {guest_user.full_name} (Room {room_number}, {branch_name})"
    action_url = f"/staff/services"
    
    notifications = []
    
    for staff in staff_users:
        notification = Notification(
            user_id=staff.user_id,
            message=message,
            notification_type='service',
            related_id=service_request.request_id,
            action_url=action_url
        )
        db.session.add(notification)
        notifications.append(notification)
    
    db.session.commit()
    
    # Emit real-time notification to branch-specific room
    if notifications and branch_id:
        notification_data = {
            'type': 'service',
            'title': f'{service_type_display} Request',
            'message': message,
            'related_id': service_request.request_id,
            'action_url': action_url,
            'branch_id': branch_id,
            'branch_name': branch_name,
            'guest_name': guest_user.full_name,
            'room_number': room_number,
            'service_type': service_request.service_type,
            'priority': service_request.priority
        }
        emit_to_branch(branch_id, notification_data)
    
    return notifications


def emit_to_branch(branch_id, notification_data):
    """
    Emit notification to staff in a specific branch
    
    Args:
        branch_id: Branch ID to target
        notification_data: Dict containing notification details
    
    NOTE: To also notify admins, uncomment the admin_notifications emit below
    """
    try:
        socketio = get_socketio()
        # Emit to branch-specific room (staff in this branch)
        socketio.emit('new_notification', notification_data, room=f'branch_{branch_id}')
        # NOTE: Uncomment below to also send to admins
        # socketio.emit('new_notification', notification_data, room='admin_notifications')
        print(f"[Notification] Emitted to branch_{branch_id}: {notification_data.get('title')}")
    except Exception as e:
        print(f"[Notification] Error emitting to branch {branch_id}: {str(e)}")


def emit_to_staff(notification_data):
    """
    Emit notification to all connected staff/admin users
    
    Args:
        notification_data: Dict containing notification details
    """
    try:
        socketio = get_socketio()
        socketio.emit('new_notification', notification_data, room='staff_notifications')
        print(f"[Notification] Emitted to staff_notifications: {notification_data.get('title')}")
    except Exception as e:
        print(f"[Notification] Error emitting to staff: {str(e)}")


def emit_to_user(user_id, notification_data):
    """
    Emit notification to a specific user
    
    Args:
        user_id: Target user ID
        notification_data: Dict containing notification details
    """
    try:
        socketio = get_socketio()
        socketio.emit('new_notification', notification_data, room=f'user_{user_id}')
        print(f"[Notification] Emitted to user_{user_id}: {notification_data.get('title')}")
    except Exception as e:
        print(f"[Notification] Error emitting to user {user_id}: {str(e)}")

