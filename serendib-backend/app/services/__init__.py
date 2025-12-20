"""
Services Package
Contains external service integrations (SMS, Email, etc.)
"""

from app.services.sms_service import (
    sms_service,
    send_booking_confirmation,
    send_check_in_reminder,
    send_check_out_reminder,
    send_payment_confirmation,
)

__all__ = [
    'sms_service',
    'send_booking_confirmation',
    'send_check_in_reminder',
    'send_check_out_reminder',
    'send_payment_confirmation',
]
