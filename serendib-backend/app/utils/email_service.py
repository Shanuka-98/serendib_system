import logging
import os
from flask_mail import Message
from app import mail
from threading import Thread
from flask import current_app

logger = logging.getLogger(__name__)

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            logger.info(f"Email sent to {msg.recipients}")
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")

def send_email(subject, recipients, body=None, html=None):
    """
    Send email with error handling to prevent process blocking.
    """
    try:
        # Check if MAIL_USERNAME is configured, otherwise skip
        if not os.environ.get('MAIL_USERNAME') and not current_app.config.get('MAIL_USERNAME'):
            logger.warning("Email configuration missing. Skipping email send.")
            return False

        app = current_app._get_current_object()
        msg = Message(subject, recipients=recipients)
        msg.body = body
        msg.html = html
        
        # Run in thread to not block the request
        Thread(target=send_async_email, args=(app, msg)).start()
        return True
    except Exception as e:
        logger.error(f"Error preparing email: {str(e)}")
        # Return False but don't raise exception
        return False

def send_quote_email(to_email, booking_details, link):
    """
    Send facility quote email to guest
    """
    subject = f"Quote Received: {booking_details.get('facility_name', 'Event Inquiry')}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0284c7;">Booking Quote Received</h2>
        <p>Dear {booking_details.get('contact_name', 'Guest')},</p>
        
        <p>We have prepared a quote for your inquiry at <strong>{booking_details.get('facility_name')}</strong>.</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> {booking_details.get('booking_date')}</p>
            <p><strong>Total Amount:</strong> Rs. {booking_details.get('total_amount'):,.2f}</p>
        </div>
        
        <p>Please review the details and accept the offer to confirm your booking.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{link}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View & Accept Quote</a>
        </div>
        
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: {link}</p>
    </div>
    """
    
    return send_email(subject, [to_email], html=html_content)
