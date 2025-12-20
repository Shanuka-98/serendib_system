"""
Authentication Routes
User registration, login, password reset, email verification
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from app.models.loyalty_program import LoyaltyProgram
from app.models.audit_log import AuditLog
from app.utils.helpers import (
    generate_token, success_response, error_response,
    validate_required_fields, get_ip_address
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Request Body:
        email: User email
        password: User password
        full_name: User full name
        phone: User phone number (optional)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'full_name']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate email format
    email = data['email'].lower().strip()
    if not '@' in email:
        return error_response('Invalid email format', status_code=400)
    
    # Check if user already exists
    if User.find_by_email(email):
        return error_response('Email already registered', status_code=409)
    
    # Validate password strength
    password = data['password']
    if len(password) < 6:
        return error_response('Password must be at least 6 characters long', status_code=400)
    
    try:
        # Create new user
        user = User(
            email=email,
            full_name=data['full_name'].strip(),
            phone=data.get('phone'),
            role='guest',
            verification_token=generate_token(),
            is_verified=False
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush()
        
        # Create loyalty program for guest (only if it doesn't exist)
        existing_loyalty = LoyaltyProgram.query.filter_by(user_id=user.user_id).first()
        if not existing_loyalty:
            loyalty = LoyaltyProgram(user_id=user.user_id)
            db.session.add(loyalty)
        
        # Log registration (don't fail if audit log fails)
        try:
            AuditLog.log_action(
                user_id=user.user_id,
                action='REGISTER',
                table_name='User',
                record_id=user.user_id,
                ip_address=get_ip_address(),
                user_agent=request.headers.get('User-Agent')
            )
        except Exception as audit_error:
            # Don't fail registration if audit log fails
            print(f"Audit log error (non-critical): {audit_error}")
        
        db.session.commit()
        
        # TODO: Send verification email
        verification_link = f"{request.host_url}api/auth/verify-email/{user.verification_token}"
        print(f"Verification link: {verification_link}")
        
        return success_response(
            data={
                'user': user.to_dict(),
                'message': 'Registration successful! Please check your email to verify your account.'
            },
            message='User registered successfully',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Registration failed: {str(e)}', status_code=500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    
    Request Body:
        email: User email
        password: User password
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    email = data['email'].lower().strip()
    password = data['password']
    
    # Find user
    user = User.find_by_email(email)
    
    if not user or not user.check_password(password):
        return error_response('Invalid email or password', status_code=401)
    
    # Check if user is active
    if not user.is_active:
        return error_response('Your account has been disabled. Please contact support.', status_code=403)
    
    # Generate JWT tokens
    tokens = user.generate_tokens()
    
    # Update last login
    user.update_last_login()
    
    # Log login
    AuditLog.log_action(
        user_id=user.user_id,
        action='LOGIN',
        table_name='User',
        record_id=user.user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(
        data={
            'user': user.to_dict(),
            'tokens': tokens,
            'verified': user.is_verified
        },
        message='Login successful'
    )


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    User logout
    Note: In a production environment, you'd want to maintain a blacklist of tokens
    """
    user_id = get_jwt_identity()
    
    # Log logout
    AuditLog.log_action(
        user_id=user_id,
        action='LOGOUT',
        table_name='User',
        record_id=user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(message='Logout successful')


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh JWT access token using refresh token
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', status_code=404)
    
    if not user.is_active:
        return error_response('Account disabled', status_code=403)
    
    # Generate new access token
    additional_claims = {
        'role': user.role,
        'branch_id': user.branch_id,
        'email': user.email
    }
    
    access_token = create_access_token(
        identity=user_id,
        additional_claims=additional_claims
    )
    
    return success_response(
        data={
            'access_token': access_token,
            'token_type': 'Bearer'
        },
        message='Token refreshed successfully'
    )


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset
    
    Request Body:
        email: User email
    """
    data = request.get_json()
    
    if not data or 'email' not in data:
        return error_response('Email is required', status_code=400)
    
    email = data['email'].lower().strip()
    user = User.find_by_email(email)
    
    # For security, always return success even if email doesn't exist
    if not user:
        return success_response(
            message='If an account with that email exists, a password reset link has been sent.'
        )
    
    # Generate reset token (valid for 1 hour)
    reset_token = generate_token()
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    
    db.session.commit()
    
    # TODO: Send password reset email
    reset_link = f"{request.host_url}reset-password?token={reset_token}"
    print(f"Password reset link: {reset_link}")
    
    # Log action
    AuditLog.log_action(
        user_id=user.user_id,
        action='PASSWORD_RESET_REQUEST',
        table_name='User',
        record_id=user.user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(
        message='If an account with that email exists, a password reset link has been sent.'
    )


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password using reset token
    
    Request Body:
        token: Reset token from email
        password: New password
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['token', 'password']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    token = data['token']
    new_password = data['password']
    
    # Validate password strength
    if len(new_password) < 6:
        return error_response('Password must be at least 6 characters long', status_code=400)
    
    # Find user by reset token
    user = User.find_by_reset_token(token)
    
    if not user:
        return error_response('Invalid or expired reset token', status_code=400)
    
    # Check if token has expired
    if user.reset_token_expiry < datetime.utcnow():
        return error_response('Reset token has expired', status_code=400)
    
    # Update password
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    
    db.session.commit()
    
    # Log action
    AuditLog.log_action(
        user_id=user.user_id,
        action='PASSWORD_RESET',
        table_name='User',
        record_id=user.user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(message='Password reset successful. You can now login with your new password.')


@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """
    Verify user email using verification token
    
    URL Parameter:
        token: Verification token from email
    """
    user = User.find_by_verification_token(token)
    
    if not user:
        return error_response('Invalid verification token', status_code=400)
    
    if user.is_verified:
        return success_response(message='Email already verified')
    
    # Verify user
    user.is_verified = True
    user.verification_token = None
    
    db.session.commit()
    
    # Log action
    AuditLog.log_action(
        user_id=user.user_id,
        action='EMAIL_VERIFIED',
        table_name='User',
        record_id=user.user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(
        data={'user': user.to_dict()},
        message='Email verified successfully! You can now login.'
    )


@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
def resend_verification():
    """
    Resend email verification link
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', status_code=404)
    
    if user.is_verified:
        return error_response('Email already verified', status_code=400)
    
    # Generate new verification token
    user.verification_token = generate_token()
    db.session.commit()
    
    # TODO: Send verification email
    verification_link = f"{request.host_url}api/auth/verify-email/{user.verification_token}"
    print(f"Verification link: {verification_link}")
    
    return success_response(message='Verification email sent successfully')


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', status_code=404)
    
    user_data = user.to_dict()
    
    # Include loyalty program if guest
    if user.role == 'guest' and user.loyalty_program:
        user_data['loyalty'] = user.loyalty_program.to_dict()
    
    # Include staff info if staff
    if user.role in ['staff', 'admin'] and user.staff_profile:
        user_data['staff'] = user.staff_profile.to_dict()
    
    return success_response(data={'user': user_data})


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change password for authenticated user
    
    Request Body:
        current_password: Current password
        new_password: New password
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('User not found', status_code=404)
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['current_password', 'new_password']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return error_response('Current password is incorrect', status_code=400)
    
    # Validate new password
    if len(data['new_password']) < 6:
        return error_response('New password must be at least 6 characters long', status_code=400)
    
    # Update password
    user.set_password(data['new_password'])
    db.session.commit()
    
    # Log action
    AuditLog.log_action(
        user_id=user.user_id,
        action='PASSWORD_CHANGE',
        table_name='User',
        record_id=user.user_id,
        ip_address=get_ip_address(),
        user_agent=request.headers.get('User-Agent')
    )
    
    return success_response(message='Password changed successfully')

