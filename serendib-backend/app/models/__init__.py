"""
Models Package
Import all models here to ensure SQLAlchemy can resolve relationships
"""

from app.models.branch import Branch
from app.models.user import User
from app.models.staff import Staff
from app.models.room import Room
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.service_request import ServiceRequest
from app.models.notification import Notification
from app.models.loyalty_program import LoyaltyProgram
from app.models.audit_log import AuditLog
from app.models.property_config import PropertyConfig
from app.models.promotion import Promotion

__all__ = [
    'Branch',
    'User',
    'Staff',
    'Room',
    'Booking',
    'Payment',
    'ServiceRequest',
    'Notification',
    'LoyaltyProgram',
    'AuditLog',
    'PropertyConfig',
    'Promotion'
]
