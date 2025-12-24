
from flask_mail import Message
from flask import current_app, render_template_string
from app import mail
from threading import Thread

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            print(f"Email sent to {msg.recipients}")
        except Exception as e:
            print(f"Failed to send email: {e}")

def send_email(subject, recipient, template=None, body=None, html=None):
    """
    Send email asynchronously
    
    Args:
        subject (str): Email subject
        recipient (str): Email recipient
        template (str): Path to template file (optional)
        body (str): Plain text body (optional)
        html (str): HTML content (optional)
    """
    app = current_app._get_current_object()
    msg = Message(
        subject,
        recipients=[recipient],
        html=html,
        body=body,
        sender=app.config.get('MAIL_DEFAULT_SENDER')
    )
    
    # Send asynchronously
    Thread(target=send_async_email, args=(app, msg)).start()
