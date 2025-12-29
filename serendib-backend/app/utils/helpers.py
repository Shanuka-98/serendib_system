"""
Helper Utility Functions
Common functions used across the application
"""

import secrets
import string
from datetime import datetime, timedelta
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from app.models.user import User

# Sri Lanka Timezone (Asia/Colombo, UTC+5:30)
SL_TIMEZONE_OFFSET = timedelta(hours=5, minutes=30)


def get_local_time():
    """
    Get current time in Sri Lanka timezone (Asia/Colombo).
    Use this instead of datetime.utcnow() throughout the application.
    """
    return datetime.utcnow() + SL_TIMEZONE_OFFSET


def get_local_date():
    """Get current date in Sri Lanka timezone."""
    return get_local_time().date()


def generate_token(length=32):
    """Generate a random secure token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_booking_reference():
    """Generate a unique booking reference"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return f"SER-{timestamp}-{random_part}"


def generate_transaction_id():
    """Generate a unique transaction ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"TXN-{timestamp}-{random_part}"


def calculate_nights(check_in, check_out):
    """Calculate number of nights between two dates"""
    if isinstance(check_in, str):
        check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
    if isinstance(check_out, str):
        check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
    
    return (check_out - check_in).days


def calculate_booking_amount(price_per_night, check_in, check_out, tax_rate=15.0, service_charge_rate=0.10):
    """Calculate total booking amount including tax and service charge"""
    nights = calculate_nights(check_in, check_out)
    subtotal = float(price_per_night) * nights
    
    # Ensure rates are floats (handle Decimals from DB)
    sc_val = float(service_charge_rate)
    tax_val = float(tax_rate)
    
    # Calculate service charge
    service_charge = subtotal * sc_val
    
    # Calculate tax (on subtotal + service charge)
    taxable_amount = subtotal + service_charge
    tax = taxable_amount * (tax_val / 100)
    
    total = subtotal + service_charge + tax
    
    return {
        'nights': nights,
        'subtotal': float(subtotal),
        'service_charge': float(service_charge),
        'service_charge_rate': service_charge_rate,
        'tax': float(tax),
        'tax_rate': tax_rate,
        'total': float(total)
    }


def paginate_query(query, page=1, per_page=20):
    """Paginate a SQLAlchemy query"""
    if page < 1:
        page = 1
    
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return {
        'items': [item.to_dict() for item in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_pages': pagination.pages,
            'total_items': pagination.total,
            'has_prev': pagination.has_prev,
            'has_next': pagination.has_next
        }
    }


def validate_date_range(check_in, check_out):
    """Validate check-in and check-out dates"""
    errors = []
    
    # Convert strings to dates if needed
    if isinstance(check_in, str):
        try:
            check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
        except ValueError:
            errors.append('Invalid check-in date format. Use YYYY-MM-DD')
    
    if isinstance(check_out, str):
        try:
            check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            errors.append('Invalid check-out date format. Use YYYY-MM-DD')
    
    if errors:
        return False, errors
    
    # Validate dates
    today = datetime.now().date()
    
    if check_in < today:
        errors.append('Check-in date cannot be in the past')
    
    if check_out <= check_in:
        errors.append('Check-out date must be after check-in date')
    
    nights = (check_out - check_in).days
    if nights > 30:
        errors.append('Maximum booking duration is 30 nights')
    
    return len(errors) == 0, errors


def format_currency(amount, currency='LKR'):
    """Format amount as currency"""
    return f"{currency} {amount:,.2f}"


def send_email_notification(to_email, subject, template, **kwargs):
    """Send email notification (placeholder - implement with Flask-Mail)"""
    # TODO: Implement actual email sending
    print(f"Sending email to {to_email}: {subject}")
    return True


def allowed_file(filename, allowed_extensions={'png', 'jpg', 'jpeg', 'gif'}):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_ip_address():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr


def success_response(data=None, message='Success', status_code=200):
    """Standard success response format"""
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code


def error_response(message='An error occurred', errors=None, status_code=400):
    """Standard error response format"""
    response = {
        'success': False,
        'message': message
    }
    if errors:
        response['errors'] = errors
    
    return jsonify(response), status_code


def validate_required_fields(data, required_fields):
    """Validate that required fields are present in data"""
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None


def get_current_user():
    """Get the current authenticated user from JWT identity"""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(user_id)

