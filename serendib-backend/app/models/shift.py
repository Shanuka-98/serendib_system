"""
Shift Model
Represents staff work schedules and shift assignments
"""

from app import db
from datetime import datetime


class Shift(db.Model):
    __tablename__ = 'Shift'
    
    shift_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Reception, Housekeeping, Manager, etc.
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('shifts', lazy='dynamic'))
    branch = db.relationship('Branch', backref=db.backref('shifts', lazy='dynamic'))
    
    # Indexes
    __table_args__ = (
        db.Index('idx_shift_user', 'user_id'),
        db.Index('idx_shift_branch', 'branch_id'),
        db.Index('idx_shift_dates', 'start_time', 'end_time'),
    )
    
    def __repr__(self):
        return f'<Shift {self.shift_id} - {self.role} ({self.start_time})>'
    
    def to_dict(self, include_relations=False):
        """Serialize shift to dictionary"""
        data = {
            'shift_id': self.shift_id,
            'user_id': self.user_id,
            'branch_id': self.branch_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'role': self.role,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_relations:
            if self.user:
                data['user_name'] = self.user.full_name
                data['user_email'] = self.user.email
            if self.branch:
                data['branch_name'] = self.branch.name
        
        return data
    
    @staticmethod
    def get_branch_shifts(branch_id, start_date=None, end_date=None, user_id=None):
        """Get shifts for a branch within a date range"""
        query = Shift.query.filter_by(branch_id=branch_id)
        
        if start_date:
            query = query.filter(Shift.start_time >= start_date)
        if end_date:
            query = query.filter(Shift.end_time <= end_date)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.order_by(Shift.start_time).all()
    
    @staticmethod
    def get_user_shifts(user_id, start_date=None, end_date=None):
        """Get all shifts for a specific user"""
        query = Shift.query.filter_by(user_id=user_id)
        
        if start_date:
            query = query.filter(Shift.start_time >= start_date)
        if end_date:
            query = query.filter(Shift.end_time <= end_date)
        
        return query.order_by(Shift.start_time).all()
    
    @staticmethod
    def check_overlap(user_id, start_time, end_time, exclude_shift_id=None):
        """Check if a shift overlaps with existing shifts for a user"""
        query = Shift.query.filter(
            Shift.user_id == user_id,
            Shift.start_time < end_time,
            Shift.end_time > start_time
        )
        
        if exclude_shift_id:
            query = query.filter(Shift.shift_id != exclude_shift_id)
        
        return query.first() is not None
