"""
Admin Management Routes
Dashboard, user management, branch config, audit logs
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from app.models.branch import Branch
from app.models.room import Room
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.service_request import ServiceRequest
from app.models.audit_log import AuditLog
from app.models.property_config import PropertyConfig
from app.models.loyalty_program import LoyaltyProgram
from app.middleware.auth import admin_required, get_current_user
from app.utils.helpers import success_response, error_response, paginate_query, get_ip_address

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard():
    """
    Get admin dashboard statistics
    """
    # Date ranges
    today = datetime.now().date()
    month_start = today.replace(day=1)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # Total counts
    total_users = User.query.count()
    total_guests = User.query.filter_by(role='guest').count()
    total_staff = User.query.filter_by(role='staff').count()
    total_rooms = Room.query.count()
    available_rooms = Room.query.filter_by(status='available').count()
    
    # Bookings stats
    total_bookings = Booking.query.count()
    active_bookings = Booking.query.filter(
        Booking.status.in_(['confirmed', 'checked_in'])
    ).count()
    pending_bookings = Booking.query.filter_by(status='pending').count()
    
    # This month bookings
    month_bookings = Booking.query.filter(
        Booking.booking_date >= month_start
    ).count()
    
    # Revenue stats
    total_revenue = db.session.query(func.sum(Payment.amount)).filter(
        Payment.payment_status == 'completed'
    ).scalar() or 0
    
    month_revenue = db.session.query(func.sum(Payment.amount)).filter(
        and_(
            Payment.payment_status == 'completed',
            Payment.payment_date >= month_start
        )
    ).scalar() or 0
    
    # Occupancy rate
    occupied_rooms = Room.query.filter_by(status='occupied').count()
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Pending service requests
    pending_requests = ServiceRequest.query.filter_by(status='pending').count()
    
    # Recent activity
    recent_bookings = Booking.query.order_by(Booking.booking_date.desc()).limit(5).all()
    recent_payments = Payment.query.order_by(Payment.payment_date.desc()).limit(5).all()
    
    # Branch stats
    branch_stats = []
    for branch in Branch.query.all():
        branch_rooms = Room.query.filter_by(branch_id=branch.branch_id).count()
        branch_available = Room.query.filter_by(branch_id=branch.branch_id, status='available').count()
        branch_bookings = Booking.query.filter_by(branch_id=branch.branch_id).filter(
            Booking.status.in_(['confirmed', 'checked_in'])
        ).count()
        
        branch_stats.append({
            'branch_id': branch.branch_id,
            'name': branch.name,
            'city': branch.city,
            'total_rooms': branch_rooms,
            'available_rooms': branch_available,
            'occupancy_rate': ((branch_rooms - branch_available) / branch_rooms * 100) if branch_rooms > 0 else 0,
            'active_bookings': branch_bookings
        })
    
    return success_response(data={
        'overview': {
            'total_users': total_users,
            'total_guests': total_guests,
            'total_staff': total_staff,
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupancy_rate': round(occupancy_rate, 2),
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'pending_bookings': pending_bookings,
            'pending_service_requests': pending_requests
        },
        'revenue': {
            'total': float(total_revenue),
            'this_month': float(month_revenue),
            'currency': 'LKR'
        },
        'this_month': {
            'bookings': month_bookings,
            'revenue': float(month_revenue)
        },
        'branches': branch_stats,
        'recent_activity': {
            'bookings': [b.to_dict(include_relations=True) for b in recent_bookings],
            'payments': [p.to_dict(include_relations=True) for p in recent_payments]
        }
    })


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """
    List all users with filters
    
    Query Parameters:
        role: Filter by role
        branch_id: Filter by branch
        is_active: Filter by active status
        search: Search by email or name
        page: Page number
        per_page: Items per page
    """
    role = request.args.get('role')
    branch_id = request.args.get('branch_id', type=int)
    is_active = request.args.get('is_active')
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = User.query
    
    if role:
        query = query.filter_by(role=role)
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')
    if search:
        query = query.filter(
            (User.email.like(f'%{search}%')) | (User.full_name.like(f'%{search}%'))
        )
    
    query = query.order_by(User.created_at.desc())
    
    result = paginate_query(query, page, per_page)
    
    return success_response(data=result)


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    """
    Create a new user (Admin only)
    
    Request Body:
        email: User email (required)
        password: User password (required)
        full_name: User full name (required)
        role: User role (guest, staff, admin)
        branch_id: Branch ID (optional)
        phone: Phone number (optional)
    """
    data = request.get_json()
    
    required_fields = ['email', 'password', 'full_name']
    for field in required_fields:
        if not data.get(field):
            return error_response(f'{field} is required', status_code=400)
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return error_response('Email already registered', status_code=400)
    
    try:
        user = User(
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'guest'),
            branch_id=data.get('branch_id'),
            phone=data.get('phone'),
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return success_response(
            message='User created successfully',
            data={'user': user.to_dict()},
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create user: {str(e)}', status_code=500)

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """
    Update user details (Admin only)
    
    Request Body:
        role: Update user role
        is_active: Update active status
        branch_id: Assign to branch
    """
    current_user = get_current_user()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', status_code=404)
    
    data = request.get_json()
    old_values = user.to_dict()
    
    try:
        if 'role' in data:
            valid_roles = ['guest', 'staff', 'admin']
            if data['role'] not in valid_roles:
                return error_response(f'Invalid role. Must be one of: {", ".join(valid_roles)}', status_code=400)
            user.role = data['role']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'branch_id' in data:
            user.branch_id = data['branch_id']
        
        # Log action
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='UPDATE_USER',
            table_name='User',
            record_id=user.user_id,
            old_values=old_values,
            new_values=user.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'user': user.to_dict()},
            message='User updated successfully'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update user: {str(e)}', status_code=500)


@admin_bp.route('/branches', methods=['GET'])
@jwt_required()
@admin_required
def get_branches():
    """
    Get all branches with statistics
    """
    branches = Branch.query.all()
    
    branch_data = []
    for branch in branches:
        total_rooms = Room.query.filter_by(branch_id=branch.branch_id).count()
        available_rooms = Room.query.filter_by(branch_id=branch.branch_id, status='available').count()
        active_bookings = Booking.query.filter_by(branch_id=branch.branch_id).filter(
            Booking.status.in_(['confirmed', 'checked_in'])
        ).count()
        
        branch_info = branch.to_dict()
        branch_info['statistics'] = {
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': total_rooms - available_rooms,
            'occupancy_rate': ((total_rooms - available_rooms) / total_rooms * 100) if total_rooms > 0 else 0,
            'active_bookings': active_bookings
        }
        
        branch_data.append(branch_info)
    
    return success_response(data={'branches': branch_data, 'count': len(branch_data)})


@admin_bp.route('/branches/<int:branch_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_branch(branch_id):
    """
    Update branch details
    """
    branch = Branch.query.get(branch_id)
    if not branch:
        return error_response('Branch not found', status_code=404)
    
    data = request.get_json()
    
    try:
        if 'name' in data:
            branch.name = data['name']
        if 'location' in data:
            branch.location = data['location']
        if 'city' in data:
            branch.city = data['city']
        if 'address' in data:
            branch.address = data['address']
        if 'tax_rate' in data:
            branch.tax_rate = float(data['tax_rate'])
        if 'contact_info' in data:
            branch.contact_info = data['contact_info']
        
        db.session.commit()
        
        return success_response(
            message='Branch updated successfully',
            data={'branch': branch.to_dict()}
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update branch: {str(e)}', status_code=500)

@admin_bp.route('/branches/<int:branch_id>/config', methods=['GET', 'PUT'])
@jwt_required()
@admin_required
def manage_branch_config(branch_id):
    """
    Get or update branch configuration
    """
    branch = Branch.query.get(branch_id)
    
    if not branch:
        return error_response('Branch not found', status_code=404)
    
    if request.method == 'GET':
        configs = PropertyConfig.get_branch_configs(branch_id)
        return success_response(data={
            'branch': branch.to_dict(),
            'configurations': [config.to_dict() for config in configs]
        })
    
    else:  # PUT
        data = request.get_json()
        
        if not data or 'configurations' not in data:
            return error_response('configurations field is required', status_code=400)
        
        try:
            for config_data in data['configurations']:
                PropertyConfig.set_config(
                    branch_id=branch_id,
                    config_key=config_data['key'],
                    config_value=config_data['value'],
                    description=config_data.get('description')
                )
            
            return success_response(message='Branch configuration updated successfully')
            
        except Exception as e:
            db.session.rollback()
            return error_response(f'Failed to update configuration: {str(e)}', status_code=500)


@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_logs():
    """
    Get audit logs
    
    Query Parameters:
        user_id: Filter by user
        action: Filter by action
        table_name: Filter by table
        limit: Number of logs to return (default: 100)
    """
    user_id = request.args.get('user_id', type=int)
    action = request.args.get('action')
    table_name = request.args.get('table_name')
    limit = request.args.get('limit', 100, type=int)
    
    query = AuditLog.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if action:
        query = query.filter_by(action=action)
    if table_name:
        query = query.filter_by(table_name=table_name)
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    return success_response(data={
        'logs': [log.to_dict() for log in logs],
        'count': len(logs)
    })


@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
@admin_required
def generate_reports():
    """
    Generate various reports
    
    Query Parameters:
        report_type: Type of report (occupancy, revenue, staff_performance)
        date_from: Start date
        date_to: End date
        branch_id: Filter by branch
    """
    report_type = request.args.get('report_type', 'occupancy')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    branch_id = request.args.get('branch_id', type=int)
    
    # Parse dates
    try:
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date() if date_from else (datetime.now() - timedelta(days=30)).date()
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date() if date_to else datetime.now().date()
    except ValueError:
        return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
    
    if report_type == 'occupancy':
        # Occupancy report
        query = db.session.query(
            func.date(Booking.check_in_date).label('date'),
            func.count(Booking.booking_id).label('bookings'),
            func.sum(Room.capacity).label('total_capacity')
        ).join(Room).filter(
            and_(
                Booking.check_in_date >= date_from_obj,
                Booking.check_in_date <= date_to_obj,
                Booking.status.in_(['confirmed', 'checked_in', 'checked_out'])
            )
        )
        
        if branch_id:
            query = query.filter(Booking.branch_id == branch_id)
        
        results = query.group_by(func.date(Booking.check_in_date)).all()
        
        report_data = [{
            'date': str(r.date),
            'bookings': r.bookings,
            'total_capacity': r.total_capacity or 0
        } for r in results]
        
    elif report_type == 'revenue':
        # Revenue report
        query = db.session.query(
            func.date(Payment.payment_date).label('date'),
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.payment_id).label('transactions')
        ).filter(
            and_(
                Payment.payment_status == 'completed',
                Payment.payment_date >= date_from_obj,
                Payment.payment_date <= date_to_obj
            )
        )
        
        if branch_id:
            query = query.join(Booking).filter(Booking.branch_id == branch_id)
        
        results = query.group_by(func.date(Payment.payment_date)).all()
        
        report_data = [{
            'date': str(r.date),
            'revenue': float(r.revenue),
            'transactions': r.transactions
        } for r in results]
        
    else:
        return error_response('Invalid report type', status_code=400)
    
    return success_response(data={
        'report_type': report_type,
        'date_from': str(date_from_obj),
        'date_to': str(date_to_obj),
        'data': report_data
    })


@admin_bp.route('/loyalty-stats', methods=['GET'])
@jwt_required()
@admin_required
def get_loyalty_stats():
    """
    Get loyalty program statistics
    """
    tier_stats = LoyaltyProgram.get_tier_stats()
    
    total_members = sum(tier_stats.values())
    avg_points = db.session.query(func.avg(LoyaltyProgram.points)).scalar() or 0
    total_lifetime_points = db.session.query(func.sum(LoyaltyProgram.lifetime_points)).scalar() or 0
    
    return success_response(data={
        'total_members': total_members,
        'tier_distribution': tier_stats,
        'average_points': float(avg_points),
        'total_lifetime_points': int(total_lifetime_points)
    })


@admin_bp.route('/settings', methods=['GET'])
@jwt_required()
@admin_required
def get_settings():
    """
    Get admin settings including SMS toggles and stats
    """
    from app.services.sms_service import get_sms_count
    
    # Get SMS toggle settings
    sms_enabled = PropertyConfig.get_config(None, 'sms_enabled', 'true')
    sms_booking_enabled = PropertyConfig.get_config(None, 'sms_booking_enabled', 'true')
    sms_payment_enabled = PropertyConfig.get_config(None, 'sms_payment_enabled', 'true')
    sms_cancelled_enabled = PropertyConfig.get_config(None, 'sms_cancelled_enabled', 'true')
    
    return success_response(data={
        'sms': {
            'enabled': sms_enabled == 'true',
            'booking_enabled': sms_booking_enabled == 'true',
            'payment_enabled': sms_payment_enabled == 'true',
            'cancelled_enabled': sms_cancelled_enabled == 'true',
            'total_sent': get_sms_count()
        }
    })


@admin_bp.route('/settings', methods=['PUT'])
@jwt_required()
@admin_required
def update_settings():
    """
    Update admin settings
    
    Request Body:
        sms_enabled: Global SMS toggle
        sms_booking_enabled: Booking confirmation SMS toggle
        sms_payment_enabled: Payment confirmation SMS toggle
        sms_cancelled_enabled: Cancellation SMS toggle
    """
    data = request.get_json()
    current_user = get_current_user()
    
    try:
        # Update SMS settings
        if 'sms_enabled' in data:
            PropertyConfig.set_config(
                None, 'sms_enabled', 
                'true' if data['sms_enabled'] else 'false',
                'Global SMS notifications toggle'
            )
        
        if 'sms_booking_enabled' in data:
            PropertyConfig.set_config(
                None, 'sms_booking_enabled',
                'true' if data['sms_booking_enabled'] else 'false',
                'Booking confirmation SMS toggle'
            )
        
        if 'sms_payment_enabled' in data:
            PropertyConfig.set_config(
                None, 'sms_payment_enabled',
                'true' if data['sms_payment_enabled'] else 'false',
                'Payment confirmation SMS toggle'
            )
        
        if 'sms_cancelled_enabled' in data:
            PropertyConfig.set_config(
                None, 'sms_cancelled_enabled',
                'true' if data['sms_cancelled_enabled'] else 'false',
                'Booking cancellation SMS toggle'
            )
        
        # Log the settings change
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='UPDATE_SETTINGS',
            table_name='PropertyConfig',
            record_id=0,
            new_values=data,
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        return success_response(message='Settings updated successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update settings: {str(e)}', status_code=500)


