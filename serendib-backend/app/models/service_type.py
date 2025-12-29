"""
ServiceType Model
Represents the catalog of available services (dynamic)
"""

from app import db
from datetime import datetime

class ServiceType(db.Model):
    __tablename__ = 'ServiceType'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)  # Display Name
    code = db.Column(db.String(50), unique=True, nullable=False)   # System Code (slug)
    description = db.Column(db.Text)
    base_price = db.Column(db.Numeric(10, 2), default=0.00)
    is_chargeable = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'base_price': float(self.base_price) if self.base_price else 0.00,
            'is_chargeable': self.is_chargeable,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<ServiceType {self.name} ({self.code})>'
