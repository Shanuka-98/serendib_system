"""
SMS Service for Text.lk API
Sends booking confirmations, reminders, and promotional messages
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
            phone_number: Recipient phone number (with or without country code)
            message: SMS message content
            
        Returns:
            dict with success status and response data
        """
        try:
            # Format phone number to international format
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
        # Remove any non-digit characters
        digits = ''.join(filter(str.isdigit, str(phone_number)))
        
        # If starts with 0, replace with 94 (Sri Lanka country code)
        if digits.startswith('0'):
            digits = '94' + digits[1:]
        # If does not start with country code, add it
        elif not digits.startswith('94'):
            digits = '94' + digits
        
        return digits


# SMS message templates
SMS_TEMPLATES = {
    'booking_confirmation': (
        'Hi {guest_name}, Your booking is confirmed! '
        'Confirmation: {confirmation_number}. '
        'Check-in: {check_in}. Room: {room_name}. '
        'Total: LKR {total}. '
        'Serendib Hotels'
    ),
    
    'check_in_reminder': (
        'Hi {guest_name}, Reminder: Your check-in is tomorrow! '
        'Booking: {confirmation_number}. '
        'Check-in from 2:00 PM. '
        'We look forward to welcoming you!'
    ),
    
    'check_out_reminder': (
        'Hi {guest_name}, Check-out reminder! '
        'Check-out is at 11:00 AM today. '
        'Thank you for staying with us!'
    ),
    
    'payment_success': (
        'Payment received! LKR {amount} for booking {confirmation_number}. '
        'Thank you for choosing Serendib Hotels.'
    ),
}


# Create singleton instance
sms_service = TextLkSMSService()


def send_booking_confirmation(booking, guest):
    """Send booking confirmation SMS"""
    message = SMS_TEMPLATES['booking_confirmation'].format(
        guest_name=guest.full_name.split()[0],
        confirmation_number=booking.booking_id,
        check_in=booking.check_in_date.strftime('%Y-%m-%d'),
        room_name=booking.room.room_number if booking.room else 'Room',
        total=f"{booking.total_amount:,.2f}",
    )
    
    if guest.phone:
        return sms_service.send_sms(guest.phone, message)
    return {'success': False, 'error': 'No phone number'}


def send_check_in_reminder(booking, guest):
    """Send check-in reminder SMS (24 hours before)"""
    message = SMS_TEMPLATES['check_in_reminder'].format(
        guest_name=guest.full_name.split()[0],
        confirmation_number=booking.booking_id,
    )
    
    if guest.phone:
        return sms_service.send_sms(guest.phone, message)
    return {'success': False, 'error': 'No phone number'}


def send_check_out_reminder(booking, guest):
    """Send check-out reminder SMS"""
    message = SMS_TEMPLATES['check_out_reminder'].format(
        guest_name=guest.full_name.split()[0],
    )
    
    if guest.phone:
        return sms_service.send_sms(guest.phone, message)
    return {'success': False, 'error': 'No phone number'}


def send_payment_confirmation(booking, amount):
    """Send payment confirmation SMS"""
    message = SMS_TEMPLATES['payment_success'].format(
        amount=f"{amount:,.2f}",
        confirmation_number=booking.booking_id,
    )
    
    if booking.user and booking.user.phone:
        return sms_service.send_sms(booking.user.phone, message)
    return {'success': False, 'error': 'No phone number'}
