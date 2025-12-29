"""
Service Request Management Routes
Guest service requests (room service, housekeeping, etc.)
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.service_request import ServiceRequest
from app.models.booking import Booking
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.user import User
from app.middleware.auth import staff_or_admin_required, get_current_user
from app.utils.helpers import (
    success_response, error_response, validate_required_fields, get_ip_address
)

service_requests_bp = Blueprint('service_requests', __name__)


@service_requests_bp.route('/', methods=['GET'])
@jwt_required()
def get_service_requests():
    """
    Get service requests (filtered by user role)
    
    Query Parameters:
        status: Filter by status (optional)
        service_type: Filter by service type (optional)
        branch_id: Filter by branch (staff/admin only)
    """
    current_user = get_current_user()
    status = request.args.get('status')
    service_type = request.args.get('service_type')
    branch_id = request.args.get('branch_id', type=int)
    
    # Get requests based on role
    if current_user.role == 'guest':
        # Guests see only their requests
        requests = ServiceRequest.get_user_requests(current_user.user_id)
        
        if status:
            requests = [r for r in requests if r.status == status]
        if service_type:
            requests = [r for r in requests if r.service_type == service_type]
            
    elif current_user.role == 'staff':
        # Staff see requests for their branch
        if not current_user.branch_id:
            return error_response('Staff member not assigned to a branch', status_code=400)
        
        # Query all requests for the branch
        query = ServiceRequest.query.join(Booking).filter(Booking.branch_id == current_user.branch_id)
        
        if status:
            query = query.filter(ServiceRequest.status == status)
        if service_type:
            query = query.filter(ServiceRequest.service_type == service_type)
            
        requests = query.order_by(
            ServiceRequest.priority.desc(),
            ServiceRequest.requested_at.desc()
        ).all()
                
    else:  # admin
        # Admins see all requests or filtered by branch
        query = ServiceRequest.query
        
        if branch_id:
            query = query.join(Booking).filter(Booking.branch_id == branch_id)
        if status:
            query = query.filter_by(status=status)
        if service_type:
            query = query.filter_by(service_type=service_type)
        
        requests = query.order_by(
            ServiceRequest.priority.desc(),
            ServiceRequest.requested_at.desc()
        ).all()
    
    return success_response(data={
        'service_requests': [req.to_dict(include_relations=True) for req in requests],
        'count': len(requests)
    })


@service_requests_bp.route('/<int:request_id>', methods=['GET'])
@jwt_required()
def get_service_request(request_id):
    """
    Get service request details by ID
    """
    current_user = get_current_user()
    service_request = ServiceRequest.query.get(request_id)
    
    if not service_request:
        return error_response('Service request not found', status_code=404)
    
    # Check permission
    if current_user.role == 'guest' and service_request.user_id != current_user.user_id:
        return error_response('You do not have permission to view this request', status_code=403)
    
    if current_user.role == 'staff' and service_request.booking.branch_id != current_user.branch_id:
        return error_response('You can only view requests for your branch', status_code=403)
    
    return success_response(data={'service_request': service_request.to_dict(include_relations=True)})


@service_requests_bp.route('/', methods=['POST'])
@jwt_required()
def create_service_request():
    """
    Create a new service request
    
    Request Body:
        booking_id: Booking ID
        service_type: Service type (room_service, housekeeping, maintenance, concierge, laundry, spa, other)
        description: Request description
        priority: Priority level (optional, default: medium)
    """
    current_user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['booking_id', 'service_type', 'description']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate booking
    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return error_response('Booking not found', status_code=404)
    
    # Check permission (only booking owner can create requests)
    if booking.user_id != current_user.user_id and current_user.role != 'admin':
        return error_response('You can only create service requests for your own bookings', status_code=403)
    
    # Check if booking is active
    if not booking.is_active():
        return error_response('Service requests can only be created for active bookings', status_code=400)
    
    # Validate service type
    valid_types = ['room_service', 'housekeeping', 'maintenance', 'concierge', 'laundry', 'spa', 'other']
    if data['service_type'] not in valid_types:
        return error_response(f'Invalid service type. Must be one of: {", ".join(valid_types)}', status_code=400)
    
    # Validate priority if provided
    priority = data.get('priority', 'medium')
    valid_priorities = ['low', 'medium', 'high', 'urgent']
    if priority not in valid_priorities:
        return error_response(f'Invalid priority. Must be one of: {", ".join(valid_priorities)}', status_code=400)
    
    try:
        # Create service request
        service_request = ServiceRequest(
            booking_id=booking.booking_id,
            user_id=current_user.user_id,
            service_type=data['service_type'],
            description=data['description'],
            priority=priority,
            status='pending'
        )
        
        db.session.add(service_request)
        db.session.flush()
        
        # Create notification for staff
        Notification.create_notification(
            user_id=current_user.user_id,
            message=f'Your {data["service_type"].replace("_", " ")} request has been submitted.',
            notification_type='service',
            related_id=service_request.request_id
        )
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='CREATE',
            table_name='ServiceRequest',
            record_id=service_request.request_id,
            new_values=service_request.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        # Emit real-time notification to staff
        try:
            from app.services.notification_service import create_service_request_notification
            create_service_request_notification(service_request, current_user, booking)
        except Exception as notif_error:
            print(f"Real-time notification failed: {notif_error}")
        
        return success_response(
            data={'service_request': service_request.to_dict(include_relations=True)},
            message='Service request created successfully',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create service request: {str(e)}', status_code=500)


@service_requests_bp.route('/<int:request_id>', methods=['PUT'])
@jwt_required()
@staff_or_admin_required
def update_service_request(request_id):
    """
    Update service request status (Staff/Admin only)
    
    Request Body:
        status: New status (pending, in_progress, completed, cancelled)
        notes: Additional notes (optional)
        assigned_staff_id: Assign to staff member (optional)
    """
    current_user = get_current_user()
    service_request = ServiceRequest.query.get(request_id)
    
    if not service_request:
        return error_response('Service request not found', status_code=404)
    
    # Staff can only update requests for their branch
    if current_user.role == 'staff' and service_request.booking.branch_id != current_user.branch_id:
        return error_response('You can only update requests for your branch', status_code=403)
    
    data = request.get_json()
    old_values = service_request.to_dict()
    
    try:
        # Update status
        if 'status' in data:
            success, message = service_request.update_status(data['status'], data.get('notes'))
            if not success:
                return error_response(message, status_code=400)
        
        # Assign or unassign staff
        if 'assigned_staff_id' in data:
            new_staff_id = data['assigned_staff_id']
            
            # Handle unassign (null or empty)
            if new_staff_id is None or new_staff_id == '' or new_staff_id == 0:
                service_request.assigned_staff_id = None
                db.session.flush()
            else:
                staff_to_assign = User.query.get(new_staff_id)
                if not staff_to_assign:
                    return error_response('Assigned staff member not found', status_code=404)
                
                # Cross-branch protection
                if staff_to_assign.branch_id != service_request.booking.branch_id:
                    return error_response('Cannot assign staff from a different branch', status_code=403)

                service_request.assign_to_staff(new_staff_id)
                
                # Notify the assigned staff member (database)
                room_number = service_request.booking.room.room_number if service_request.booking and service_request.booking.room else 'N/A'
                Notification.create_notification(
                    user_id=new_staff_id,
                    message=f'You have been assigned a {service_request.service_type.replace("_", " ")} task for Room {room_number}.',
                    notification_type='service',
                    related_id=service_request.request_id
                )
                
                # Emit real-time notification to assigned user
                try:
                    from app.services.notification_service import emit_to_user
                    service_type_display = service_request.service_type.replace('_', ' ').title()
                    emit_to_user(new_staff_id, {
                        'type': 'assignment',
                        'title': 'New Task Assigned',
                        'message': f'You have been assigned a {service_type_display} task for Room {room_number}.',
                        'related_id': service_request.request_id,
                        'action_url': f'/staff/services/{service_request.request_id}',
                        'service_type': service_request.service_type,
                        'room_number': room_number
                    })
                except Exception as emit_error:
                    print(f"[Assignment] Real-time notification failed: {emit_error}")
        
        # Auto-assign to current staff if moving to in_progress
        if data.get('status') == 'in_progress' and not service_request.assigned_staff_id:
            service_request.assign_to_staff(current_user.user_id)
        
        # Create notification for guest when completed
        if data.get('status') == 'completed':
            Notification.create_notification(
                user_id=service_request.user_id,
                message=f'Your {service_request.service_type.replace("_", " ")} request has been completed.',
                notification_type='service',
                related_id=service_request.request_id
            )
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='UPDATE',
            table_name='ServiceRequest',
            record_id=service_request.request_id,
            old_values=old_values,
            new_values=service_request.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'service_request': service_request.to_dict(include_relations=True)},
            message='Service request updated successfully'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update service request: {str(e)}', status_code=500)


@service_requests_bp.route('/<int:request_id>', methods=['DELETE'])
@jwt_required()
def cancel_service_request(request_id):
    """
    Cancel a service request
    """
    current_user = get_current_user()
    service_request = ServiceRequest.query.get(request_id)
    
    if not service_request:
        return error_response('Service request not found', status_code=404)
    
    # Only request owner or admin can cancel
    if service_request.user_id != current_user.user_id and current_user.role != 'admin':
        return error_response('You do not have permission to cancel this request', status_code=403)
    
    # Cannot cancel completed requests
    if service_request.status == 'completed':
        return error_response('Cannot cancel completed requests', status_code=400)
    
    try:
        service_request.cancel('Cancelled by user')
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='CANCEL',
            table_name='ServiceRequest',
            record_id=service_request.request_id,
            new_values={'status': 'cancelled'},
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(message='Service request cancelled successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel service request: {str(e)}', status_code=500)


@service_requests_bp.route('/types', methods=['GET'])
def get_service_types():
    """
    Get available service types
    """
    types = [
        {'value': 'room_service', 'label': 'Room Service', 'icon': 'utensils'},
        {'value': 'housekeeping', 'label': 'Housekeeping', 'icon': 'broom'},
        {'value': 'maintenance', 'label': 'Maintenance', 'icon': 'tools'},
        {'value': 'concierge', 'label': 'Concierge', 'icon': 'concierge-bell'},
        {'value': 'laundry', 'label': 'Laundry', 'icon': 'tshirt'},
        {'value': 'spa', 'label': 'Spa', 'icon': 'spa'},
        {'value': 'other', 'label': 'Other', 'icon': 'ellipsis-h'}
    ]
    
    return success_response(data={'service_types': types})

