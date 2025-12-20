"""
Booking Model
Represents guest reservations and bookings
"""

from app import db
from datetime import datetime, timedelta


class Booking(db.Model):
    __tablename__ = 'Booking'
    
    booking_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('Room.room_id', ondelete='CASCADE'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_out_date = db.Column(db.Date, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(
        db.Enum('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', name='booking_status'),
        default='pending'
    )
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    special_requests = db.Column(db.Text)
    number_of_guests = db.Column(db.Integer, default=1)
    cancellation_reason = db.Column(db.Text)
    cancelled_at = db.Column(db.DateTime)
    checked_in_at = db.Column(db.DateTime)
    checked_out_at = db.Column(db.DateTime)
    
    # Relationships
    payments = db.relationship('Payment', backref='booking', lazy='dynamic', cascade='all, delete-orphan')
    service_requests = db.relationship('ServiceRequest', backref='booking', lazy='dynamic', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        db.Index('idx_user', 'user_id'),
        db.Index('idx_room', 'room_id'),
        db.Index('idx_branch', 'branch_id'),
        db.Index('idx_dates', 'check_in_date', 'check_out_date'),
        db.Index('idx_status', 'status'),
        db.Index('idx_booking_date', 'booking_date'),
    )
    
    def __repr__(self):
        return f'<Booking #{self.booking_id} - {self.status}>'
    
    def to_dict(self, include_relations=False):
        """Serialize booking to dictionary"""
        data = {
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'room_id': self.room_id,
            'branch_id': self.branch_id,
            'check_in_date': self.check_in_date.isoformat() if self.check_in_date else None,
            'check_out_date': self.check_out_date.isoformat() if self.check_out_date else None,
            'total_amount': float(self.total_amount),
            'status': self.status,
            'booking_date': self.booking_date.isoformat() if self.booking_date else None,
            'special_requests': self.special_requests,
            'number_of_guests': self.number_of_guests,
            'cancellation_reason': self.cancellation_reason,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'checked_out_at': self.checked_out_at.isoformat() if self.checked_out_at else None,
            'nights': self.calculate_nights()
        }
        
        if include_relations:
            if self.user:
                data['guest_name'] = self.user.full_name
                data['guest_email'] = self.user.email
                data['guest_phone'] = self.user.phone
            
            if self.room:
                data['room'] = self.room.to_dict()
            
            if self.branch:
                data['branch'] = self.branch.to_dict()
            
            # Payment info
            payment = self.payments.first()
            if payment:
                data['payment_status'] = payment.payment_status
                data['payment_method'] = payment.payment_method
        
        return data
    
    def calculate_nights(self):
        """Calculate number of nights"""
        if self.check_in_date and self.check_out_date:
            return (self.check_out_date - self.check_in_date).days
        return 0
    
    def calculate_total_amount(self):
        """
        Calculate total booking amount including tax
        
        Returns:
            dict: Breakdown of costs
        """
        nights = self.calculate_nights()
        price_per_night = float(self.room.price_per_night) if self.room else 0
        subtotal = price_per_night * nights
        
        # Get branch tax rate
        tax_rate = float(self.branch.tax_rate) if self.branch else 15.0
        tax = subtotal * (tax_rate / 100)
        total = subtotal + tax
        
        return {
            'nights': nights,
            'price_per_night': price_per_night,
            'subtotal': subtotal,
            'tax_rate': tax_rate,
            'tax': tax,
            'total': total
        }
    
    def can_cancel(self):
        """Check if booking can be cancelled"""
        if self.status in ['cancelled', 'checked_out']:
            return False, "Booking already cancelled or completed"
        
        # Check cancellation policy (24 hours before check-in)
        hours_until_checkin = (datetime.combine(self.check_in_date, datetime.min.time()) - datetime.utcnow()).total_seconds() / 3600
        
        if hours_until_checkin < 24:
            return False, "Cancellation period has expired (must cancel 24 hours before check-in)"
        
        return True, "Booking can be cancelled"
    
    def cancel(self, reason=None):
        """Cancel booking"""
        can_cancel, message = self.can_cancel()
        
        if not can_cancel:
            return False, message
        
        self.status = 'cancelled'
        self.cancellation_reason = reason
        self.cancelled_at = datetime.utcnow()
        
        # Update room status
        if self.room.status == 'reserved':
            self.room.status = 'available'
        
        db.session.commit()
        
        return True, "Booking cancelled successfully"
    
    def check_in(self):
        """Check in guest"""
        if self.status != 'confirmed':
            return False, "Only confirmed bookings can be checked in"
        
        today = datetime.utcnow().date()
        if self.check_in_date > today:
            return False, "Check-in date has not arrived yet"
        
        self.status = 'checked_in'
        self.checked_in_at = datetime.utcnow()
        
        # Update room status
        self.room.status = 'occupied'
        
        db.session.commit()
        
        return True, "Guest checked in successfully"
    
    def check_out(self):
        """Check out guest"""
        if self.status != 'checked_in':
            return False, "Only checked-in bookings can be checked out"
        
        self.status = 'checked_out'
        self.checked_out_at = datetime.utcnow()
        
        # Update room status
        self.room.status = 'available'
        
        db.session.commit()
        
        return True, "Guest checked out successfully"
    
    def is_active(self):
        """Check if booking is currently active"""
        return self.status in ['confirmed', 'checked_in']
    
    @staticmethod
    def get_user_bookings(user_id, status=None):
        """Get all bookings for a user"""
        query = Booking.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        return query.order_by(Booking.booking_date.desc()).all()
    
    @staticmethod
    def get_branch_bookings(branch_id, status=None, date_from=None, date_to=None):
        """Get all bookings for a branch"""
        query = Booking.query.filter_by(branch_id=branch_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if date_from:
            query = query.filter(Booking.check_in_date >= date_from)
        
        if date_to:
            query = query.filter(Booking.check_out_date <= date_to)
        
        return query.order_by(Booking.check_in_date.desc()).all()
    
    @staticmethod
    def get_upcoming_bookings(days=7):
        """Get upcoming bookings within specified days"""
        today = datetime.utcnow().date()
        end_date = today + timedelta(days=days)
        
        return Booking.query.filter(
            Booking.check_in_date >= today,
            Booking.check_in_date <= end_date,
            Booking.status.in_(['confirmed', 'pending'])
        ).order_by(Booking.check_in_date).all()
    
    @staticmethod
    def get_active_bookings():
        """Get all currently active bookings"""
        return Booking.query.filter(
            Booking.status.in_(['confirmed', 'checked_in'])
        ).all()

