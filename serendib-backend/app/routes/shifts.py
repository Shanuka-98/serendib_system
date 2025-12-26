"""
Shifts Routes
API endpoints for staff shift scheduling
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.shift import Shift
from app.models.user import User
from app.models.branch import Branch
from app.utils.helpers import success_response, error_response, get_current_user
from datetime import datetime, timedelta

shifts_bp = Blueprint('shifts', __name__)


@shifts_bp.route('/', methods=['GET'])
@jwt_required()
def get_shifts():
    """
    Get shifts with optional filters
    Query params: branch_id, user_id, start_date, end_date
    """
    current_user = get_current_user()
    
    # Get query parameters
    branch_id = request.args.get('branch_id', type=int)
    user_id = request.args.get('user_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Parse dates
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        except ValueError:
            return error_response('Invalid start_date format. Use YYYY-MM-DD', status_code=400)
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)  # Include full day
        except ValueError:
            return error_response('Invalid end_date format. Use YYYY-MM-DD', status_code=400)
    
    # Build query based on role
    if current_user.role == 'guest':
        return error_response('Guests cannot access shift schedules', status_code=403)
    
    query = Shift.query
    
    if current_user.role == 'staff':
        # Staff can see all shifts in their branch (for team coordination)
        if current_user.branch_id:
            query = query.filter_by(branch_id=current_user.branch_id)
        else:
            # Staff without a branch can only see their own shifts
            query = query.filter_by(user_id=current_user.user_id)
    elif current_user.role == 'admin':
        # Admin can filter by branch or user
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
    
    # Apply date filters
    if start_dt:
        query = query.filter(Shift.start_time >= start_dt)
    if end_dt:
        query = query.filter(Shift.end_time <= end_dt)
    
    try:
        shifts = query.order_by(Shift.start_time).all()
    except Exception as e:
        # Table might not exist yet - return empty list
        print(f"Shift query error (table may not exist): {e}")
        return success_response(data={
            'shifts': [],
            'count': 0,
            'warning': 'Shift table not found. Please run database migration.'
        })
    
    return success_response(data={
        'shifts': [shift.to_dict(include_relations=True) for shift in shifts],
        'count': len(shifts)
    })


@shifts_bp.route('/', methods=['POST'])
@jwt_required()
def create_shift():
    """
    Create a new shift assignment (Admin only)
    """
    current_user = get_current_user()
    
    if current_user.role != 'admin':
        return error_response('Only administrators can create shifts', status_code=403)
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'branch_id', 'start_time', 'end_time', 'role']
    for field in required_fields:
        if field not in data:
            return error_response(f'Missing required field: {field}', status_code=400)
    
    # Parse datetime
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return error_response('Invalid datetime format. Use ISO format.', status_code=400)
    
    # Validate times
    if end_time <= start_time:
        return error_response('End time must be after start time', status_code=400)
    
    # Check user exists and is staff/admin
    user = User.query.get(data['user_id'])
    if not user or user.role == 'guest':
        return error_response('Invalid user or user is not staff', status_code=400)
    
    # Check branch exists
    branch = Branch.query.get(data['branch_id'])
    if not branch:
        return error_response('Branch not found', status_code=404)
    
    # Check for overlapping shifts
    if Shift.check_overlap(data['user_id'], start_time, end_time):
        return error_response('This shift overlaps with an existing shift for this user', status_code=409)
    
    # Create shift
    shift = Shift(
        user_id=data['user_id'],
        branch_id=data['branch_id'],
        start_time=start_time,
        end_time=end_time,
        role=data['role'],
        notes=data.get('notes')
    )
    
    db.session.add(shift)
    db.session.commit()
    
    return success_response(
        data={'shift': shift.to_dict(include_relations=True)},
        message='Shift created successfully',
        status_code=201
    )


@shifts_bp.route('/<int:shift_id>', methods=['PUT'])
@jwt_required()
def update_shift(shift_id):
    """
    Update an existing shift (Admin only)
    """
    current_user = get_current_user()
    
    if current_user.role != 'admin':
        return error_response('Only administrators can update shifts', status_code=403)
    
    shift = Shift.query.get(shift_id)
    if not shift:
        return error_response('Shift not found', status_code=404)
    
    data = request.get_json()
    
    # Update fields if provided
    if 'start_time' in data or 'end_time' in data:
        try:
            start_time = datetime.fromisoformat(data.get('start_time', shift.start_time.isoformat()).replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data.get('end_time', shift.end_time.isoformat()).replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return error_response('Invalid datetime format', status_code=400)
        
        if end_time <= start_time:
            return error_response('End time must be after start time', status_code=400)
        
        # Check overlap (excluding current shift)
        user_id = data.get('user_id', shift.user_id)
        if Shift.check_overlap(user_id, start_time, end_time, exclude_shift_id=shift_id):
            return error_response('This shift overlaps with an existing shift', status_code=409)
        
        shift.start_time = start_time
        shift.end_time = end_time
    
    if 'user_id' in data:
        user = User.query.get(data['user_id'])
        if not user or user.role == 'guest':
            return error_response('Invalid user', status_code=400)
        shift.user_id = data['user_id']
    
    if 'branch_id' in data:
        branch = Branch.query.get(data['branch_id'])
        if not branch:
            return error_response('Branch not found', status_code=404)
        shift.branch_id = data['branch_id']
    
    if 'role' in data:
        shift.role = data['role']
    
    if 'notes' in data:
        shift.notes = data['notes']
    
    db.session.commit()
    
    return success_response(
        data={'shift': shift.to_dict(include_relations=True)},
        message='Shift updated successfully'
    )


@shifts_bp.route('/<int:shift_id>', methods=['DELETE'])
@jwt_required()
def delete_shift(shift_id):
    """
    Delete a shift (Admin only)
    """
    current_user = get_current_user()
    
    if current_user.role != 'admin':
        return error_response('Only administrators can delete shifts', status_code=403)
    
    shift = Shift.query.get(shift_id)
    if not shift:
        return error_response('Shift not found', status_code=404)
    
    db.session.delete(shift)
    db.session.commit()
    
    return success_response(message='Shift deleted successfully')


@shifts_bp.route('/staff', methods=['GET'])
@jwt_required()
def get_staff_for_scheduling():
    """
    Get list of staff members available for shift assignment
    """
    current_user = get_current_user()
    
    if current_user.role not in ['admin', 'staff']:
        return error_response('Access denied', status_code=403)
    
    branch_id = request.args.get('branch_id', type=int)
    
    query = User.query.filter(User.role.in_(['staff', 'admin']))
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    
    staff = query.all()
    
    return success_response(data={
        'staff': [{
            'user_id': s.user_id, 
            'full_name': s.full_name, 
            'email': s.email, 
            'role': s.role,
            'branch_id': s.branch_id
        } for s in staff],
        'count': len(staff)
    })
