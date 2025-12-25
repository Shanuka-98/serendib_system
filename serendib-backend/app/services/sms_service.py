"""
SMS Service for Text.lk API
Sends booking confirmations, payment confirmations, and cancellation notices
"""

import requests
import os
from datetime import datetime


class TextLkSMSService:
    """Text.lk SMS Service for sending notifications"""
    
    BASE_URL = 'https://app.text.lk/api/v3/sms/send'
    
    def __init__(self):
        self.api_token = os.getenv('SMS_API_TOKEN')
        self.sender_id = os.getenv('SMS_SENDER_ID', 'SerendibHotels')
    
    def send_sms(self, phone_number, message):
        """
        Send SMS via Text.lk API
        
        Args:
            phone_number: Recipient phone number
            message: SMS message content
            
        Returns:
            dict with success status and response data
        """
        try:
            phone = self._format_phone(phone_number)
            
            headers = {
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
            
            payload = {
                'recipient': phone,
                'sender_id': self.sender_id,
                'type': 'plain',
                'message': message,
            }
            
            response = requests.post(
                self.BASE_URL,
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'response': response.json() if response.text else None,
                    'timestamp': datetime.utcnow().isoformat(),
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}',
                }
        
        except requests.RequestException as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    def _format_phone(self, phone_number):
        """Format phone number to Sri Lankan international format"""
        digits = ''.join(filter(str.isdigit, str(phone_number)))
        
        if digits.startswith('0'):
            digits = '94' + digits[1:]
        elif not digits.startswith('94'):
            digits = '94' + digits
        
        return digits


# SMS message templates
SMS_TEMPLATES = {
    'booking_confirmation': (
        'Hi {guest_name}, Booking confirmed at {branch_name}! '
        'Ref: SER-{booking_id}. Room {room_number} ({room_type}). '
        'Check-in: {check_in}, Check-out: {check_out}. '
        'Total: LKR {total}. Serendib Hotels'
    ),
    
    'payment_confirmation': (
        'Hi {guest_name}, Payment received! LKR {amount}. '
        'Booking SER-{booking_id} at {branch_name}. '
        'Check-in: {check_in}. Thank you! Serendib Hotels'
    ),
    
    'booking_cancelled': (
        'Hi {guest_name}, Booking SER-{booking_id} cancelled. '
        'Refund processed if applicable. Serendib Hotels'
    ),
}


# Create singleton instance
sms_service = TextLkSMSService()


def is_sms_enabled(sms_type=None):
    """Check if SMS is enabled via PropertyConfig"""
    try:
        from app.models.property_config import PropertyConfig
        
        # Check global toggle (branch_id=None for global config)
        global_value = PropertyConfig.get_config(None, 'sms_enabled', 'true')
        if global_value == 'false':
            return False
        
        # Check individual toggle if sms_type provided
        if sms_type:
            type_value = PropertyConfig.get_config(None, f'sms_{sms_type}_enabled', 'true')
            if type_value == 'false':
                return False
        
        return True
    except Exception:
        # Default to enabled if config check fails
        return True


def log_sms(user_id, message, sms_type, success, error=None):
    """Log SMS to Notification table"""
    try:
        from app.models.notification import Notification
        from app import db
        
        status_msg = 'sent' if success else f'failed: {error}'
        
        notification = Notification(
            user_id=user_id,
            message=f'[SMS {sms_type}] {message[:100]}... Status: {status_msg}',
            notification_type='sms',
            is_read=True  # Mark as read since it's a log, not user notification
        )
        db.session.add(notification)
        db.session.commit()
    except Exception as e:
        print(f'SMS logging failed: {e}')


def send_booking_confirmation(booking, guest, is_paid=False):
    """Send booking confirmation SMS"""
    if not is_sms_enabled('booking'):
        return {'success': False, 'reason': 'sms_disabled'}
    
    if not guest.phone:
        return {'success': False, 'error': 'No phone number'}
    
    try:
        payment_note = '' if is_paid else ' Pay at reception.'
        message = SMS_TEMPLATES['booking_confirmation'].format(
            guest_name=guest.full_name.split()[0],
            booking_id=booking.booking_id,
            branch_name=booking.branch.name if booking.branch else 'Serendib',
            room_number=booking.room.room_number if booking.room else 'TBD',
            room_type=booking.room.room_type.capitalize() if booking.room else '',
            check_in=booking.check_in_date.strftime('%b %d'),
            check_out=booking.check_out_date.strftime('%b %d'),
            total=f"{booking.total_amount:,.0f}",
        )
        if not is_paid:
            message = message.replace('Serendib Hotels', 'Pay at reception. Serendib Hotels')
        
        result = sms_service.send_sms(guest.phone, message)
        log_sms(guest.user_id, message, 'booking', result['success'], result.get('error'))
        return result
    except Exception as e:
        return {'success': False, 'error': str(e)}


def send_payment_confirmation(booking, amount):
    """Send payment confirmation SMS"""
    if not is_sms_enabled('payment'):
        return {'success': False, 'reason': 'sms_disabled'}
    
    if not booking.user or not booking.user.phone:
        return {'success': False, 'error': 'No phone number'}
    
    try:
        message = SMS_TEMPLATES['payment_confirmation'].format(
            guest_name=booking.user.full_name.split()[0],
            amount=f"{amount:,.0f}",
            booking_id=booking.booking_id,
            branch_name=booking.branch.name if booking.branch else 'Serendib',
            check_in=booking.check_in_date.strftime('%b %d'),
        )
        
        result = sms_service.send_sms(booking.user.phone, message)
        log_sms(booking.user_id, message, 'payment', result['success'], result.get('error'))
        return result
    except Exception as e:
        return {'success': False, 'error': str(e)}


def send_booking_cancelled(booking, guest):
    """Send booking cancellation SMS"""
    if not is_sms_enabled('cancelled'):
        return {'success': False, 'reason': 'sms_disabled'}
    
    if not guest.phone:
        return {'success': False, 'error': 'No phone number'}
    
    try:
        message = SMS_TEMPLATES['booking_cancelled'].format(
            guest_name=guest.full_name.split()[0],
            booking_id=booking.booking_id,
        )
        
        result = sms_service.send_sms(guest.phone, message)
        log_sms(guest.user_id, message, 'cancelled', result['success'], result.get('error'))
        return result
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_sms_count():
    """Get count of SMS messages sent"""
    try:
        from app.models.notification import Notification
        return Notification.query.filter_by(notification_type='sms').count()
    except Exception:
        return 0
