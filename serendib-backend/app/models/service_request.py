"""
ServiceRequest Model
Represents guest service requests
"""

from app import db
from datetime import datetime


class ServiceRequest(db.Model):
    __tablename__ = 'ServiceRequest'
    
    request_id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('Booking.booking_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False)
    service_type = db.Column(
        db.Enum('room_service', 'housekeeping', 'maintenance', 'concierge', 'laundry', 'spa', 'other', name='service_type'),
        nullable=False
    )
    description = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.Enum('pending', 'in_progress', 'completed', 'cancelled', name='service_status'),
        default='pending'
    )
    priority = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='service_priority'),
        default='medium'
    )
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='SET NULL'))
    notes = db.Column(db.Text)
    
    # Relationships
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id], backref='assigned_requests')
    
    # Indexes
    __table_args__ = (
        db.Index('idx_booking', 'booking_id'),
        db.Index('idx_user', 'user_id'),
        db.Index('idx_status', 'status'),
        db.Index('idx_priority', 'priority'),
        db.Index('idx_requested_at', 'requested_at'),
    )
    
    def __repr__(self):
        return f'<ServiceRequest #{self.request_id} - {self.service_type}>'
    
    def to_dict(self, include_relations=False):
        """Serialize service request to dictionary"""
        data = {
            'request_id': self.request_id,
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'service_type': self.service_type,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'assigned_staff_id': self.assigned_staff_id,
            'notes': self.notes
        }
        
        if include_relations:
            if self.user:
                data['guest_name'] = self.user.full_name
                data['guest_email'] = self.user.email
                data['guest_phone'] = self.user.phone
                data['guest_room'] = self.booking.room.room_number if self.booking and self.booking.room else None
            
            if self.assigned_staff:
                data['assigned_staff_name'] = self.assigned_staff.full_name
        
        return data
    
    def assign_to_staff(self, staff_id):
        """Assign request to staff member"""
        self.assigned_staff_id = staff_id
        if self.status == 'pending':
            self.status = 'in_progress'
        db.session.commit()
        return True
    
    def update_status(self, new_status, notes=None):
        """Update request status"""
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        
        if new_status not in valid_statuses:
            return False, "Invalid status"
        
        self.status = new_status
        
        if new_status == 'completed':
            self.completed_at = datetime.utcnow()
        
        if notes:
            self.notes = notes
        
        db.session.commit()
        return True, f"Status updated to {new_status}"
    
    def complete(self, notes=None):
        """Mark request as completed"""
        return self.update_status('completed', notes)
    
    def cancel(self, notes=None):
        """Cancel request"""
        return self.update_status('cancelled', notes)
    
    @staticmethod
    def get_booking_requests(booking_id):
        """Get all service requests for a booking"""
        return ServiceRequest.query.filter_by(booking_id=booking_id).order_by(ServiceRequest.requested_at.desc()).all()
    
    @staticmethod
    def get_user_requests(user_id):
        """Get all service requests for a user"""
        return ServiceRequest.query.filter_by(user_id=user_id).order_by(ServiceRequest.requested_at.desc()).all()
    
    @staticmethod
    def get_pending_requests(branch_id=None):
        """Get all pending service requests"""
        query = ServiceRequest.query.filter(
            ServiceRequest.status.in_(['pending', 'in_progress'])
        ).order_by(
            ServiceRequest.priority.desc(),
            ServiceRequest.requested_at
        )
        
        if branch_id:
            query = query.join(Booking).filter(Booking.branch_id == branch_id)
        
        return query.all()
    
    @staticmethod
    def get_staff_requests(staff_id):
        """Get requests assigned to a staff member"""
        return ServiceRequest.query.filter_by(
            assigned_staff_id=staff_id,
            status='in_progress'
        ).order_by(ServiceRequest.priority.desc()).all()

