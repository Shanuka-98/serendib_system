"""
Authentication Middleware
Role-based access control decorators
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def role_required(*roles):
    """
    Decorator to require specific roles for accessing endpoints
    
    Usage:
        @role_required('admin')
        @role_required('admin', 'staff')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({
                    'error': 'User not found',
                    'message': 'User account no longer exists'
                }), 404
            
            if not user.is_active:
                return jsonify({
                    'error': 'Account Disabled',
                    'message': 'Your account has been disabled'
                }), 403
            
            if user.role not in roles:
                return jsonify({
                    'error': 'Forbidden',
                    'message': f'This action requires one of the following roles: {", ".join(roles)}'
                }), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def admin_required(fn):
    """Decorator to require admin role"""
    return role_required('admin')(fn)


def staff_or_admin_required(fn):
    """Decorator to require staff or admin role"""
    return role_required('admin', 'staff')(fn)


def get_current_user():
    """Get the current authenticated user"""
    user_id = get_jwt_identity()
    return User.query.get(user_id)


def is_user_or_admin(user_id):
    """Check if current user is the specified user or an admin"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    return current_user_id == user_id or current_user.role == 'admin'

