"""
Email Test Script
Sends all 4 email types to TEST_EMAIL for verification

Usage: python test_emails.py
"""

import os
import sys
import time

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_mail import Mail

# Create minimal Flask app for email context
app = Flask(__name__)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# Get test email from env
TEST_EMAIL = os.getenv('TEST_EMAIL', 'shanukapiyu@gmail.com')

print(f"=" * 50)
print(f"Email Test Script")
print(f"=" * 50)
print(f"SMTP Server: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
print(f"Sender: {app.config['MAIL_DEFAULT_SENDER']}")
print(f"Test Recipient: {TEST_EMAIL}")
print(f"=" * 50)

# Sample booking data for testing
sample_booking = {
    'booking_ref': 'SER-2026-000123',
    'guest_name': 'Shanuka Piyumantha',
    'branch_name': 'Serendib Colombo',
    'room_number': '301',
    'room_type': 'Deluxe Suite',
    'check_in': '2026-01-15',
    'check_out': '2026-01-18',
    'guests': 2,
    'total_amount': 45000.00,
    'points_earned': 450,
    'total_points': 1250,
    'refund_info': 'A full refund has been processed to your card.'
}


def test_booking_confirmation():
    """Test booking confirmation email"""
    print("\n[1/4] Sending Booking Confirmation Email...")
    try:
        from app.utils.email_service import send_booking_confirmation_email
        with app.app_context():
            result = send_booking_confirmation_email(TEST_EMAIL, sample_booking)
            time.sleep(1)  # Wait for async thread
            print(f"      Result: {'SENT' if result else 'QUEUED'}")
            return True
    except Exception as e:
        print(f"      ERROR: {e}")
        return False


def test_checkin_email():
    """Test check-in welcome email"""
    print("\n[2/4] Sending Check-in Welcome Email...")
    try:
        from app.utils.email_service import send_checkin_email
        with app.app_context():
            result = send_checkin_email(TEST_EMAIL, sample_booking)
            time.sleep(1)
            print(f"      Result: {'SENT' if result else 'QUEUED'}")
            return True
    except Exception as e:
        print(f"      ERROR: {e}")
        return False


def test_checkout_email():
    """Test check-out summary email"""
    print("\n[3/4] Sending Check-out Summary Email...")
    try:
        from app.utils.email_service import send_checkout_email
        with app.app_context():
            result = send_checkout_email(TEST_EMAIL, sample_booking)
            time.sleep(1)
            print(f"      Result: {'SENT' if result else 'QUEUED'}")
            return True
    except Exception as e:
        print(f"      ERROR: {e}")
        return False


def test_cancellation_email():
    """Test booking cancellation email"""
    print("\n[4/4] Sending Booking Cancellation Email...")
    try:
        from app.utils.email_service import send_booking_cancelled_email
        with app.app_context():
            result = send_booking_cancelled_email(TEST_EMAIL, sample_booking)
            time.sleep(1)
            print(f"      Result: {'SENT' if result else 'QUEUED'}")
            return True
    except Exception as e:
        print(f"      ERROR: {e}")
        return False


if __name__ == '__main__':
    results = []
    
    results.append(('Booking Confirmation', test_booking_confirmation()))
    results.append(('Check-in Welcome', test_checkin_email()))
    results.append(('Check-out Summary', test_checkout_email()))
    results.append(('Cancellation', test_cancellation_email()))
    
    print("\n" + "=" * 50)
    print("RESULTS SUMMARY")
    print("=" * 50)
    
    for name, success in results:
        status = "✓ OK" if success else "✗ FAILED"
        print(f"  {name}: {status}")
    
    passed = sum(1 for _, s in results if s)
    print(f"\nTotal: {passed}/4 emails queued for sending")
    print(f"\nCheck your inbox at: {TEST_EMAIL}")
    print("Note: Emails are sent asynchronously, may take 1-2 minutes to arrive.")
