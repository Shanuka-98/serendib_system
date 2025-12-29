"""
Branch Model
Represents hotel branch locations
"""

from app import db
from datetime import datetime
import json


class Branch(db.Model):
    __tablename__ = 'Branch'
    
    branch_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    address = db.Column(db.Text, nullable=False)
    tax_rate = db.Column(db.Numeric(5, 2), default=15.00)
    contact_info = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rooms = db.relationship('Room', backref='branch', lazy='dynamic', cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='branch', lazy='dynamic', cascade='all, delete-orphan')
    users = db.relationship('User', backref='branch', lazy='dynamic')
    staff = db.relationship('Staff', backref='branch', lazy='dynamic')
    promotions = db.relationship('Promotion', backref='branch', lazy='dynamic')
    configs = db.relationship('PropertyConfig', backref='branch', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Branch {self.name}>'
    
    def to_dict(self, include_relations=False):
        """Serialize branch to dictionary"""
        data = {
            'branch_id': self.branch_id,
            'name': self.name,
            'location': self.location,
            'city': self.city,
            'address': self.address,
            'tax_rate': float(self.tax_rate),
            'contact_info': self.contact_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_relations:
            data['total_rooms'] = self.rooms.count()
            data['available_rooms'] = self.rooms.filter_by(status='available').count()
        
        return data
    
    def get_config(self, key, default=None):
        """Get configuration value for this branch"""
        from app.models.property_config import PropertyConfig
        
        config = PropertyConfig.query.filter_by(
            branch_id=self.branch_id,
            config_key=key
        ).first()
        
        return config.config_value if config else default
    
    @staticmethod
    def get_all_branches():
        """Get all branches"""
        return Branch.query.all()
    
    @staticmethod
    def get_by_city(city):
        """Get branches by city"""
        return Branch.query.filter_by(city=city).all()

