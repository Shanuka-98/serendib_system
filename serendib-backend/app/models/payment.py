"""
Payment Model
Represents payment transactions
"""

from app import db
from datetime import datetime


class Payment(db.Model):
    __tablename__ = 'Payment'
    
    payment_id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('Booking.booking_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(
        db.Enum('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash', name='payment_method'),
        nullable=False
    )
    payment_status = db.Column(
        db.Enum('pending', 'completed', 'failed', 'refunded', name='payment_status'),
        default='pending'
    )
    transaction_id = db.Column(db.String(255), index=True)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    refund_amount = db.Column(db.Numeric(10, 2), default=0.00)
    refund_date = db.Column(db.DateTime)
    payment_details = db.Column(db.JSON)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_booking', 'booking_id'),
        db.Index('idx_user', 'user_id'),
        db.Index('idx_status', 'payment_status'),
        db.Index('idx_transaction', 'transaction_id'),
        db.Index('idx_payment_date', 'payment_date'),
    )
    
    def __repr__(self):
        return f'<Payment #{self.payment_id} - {self.payment_status}>'
    
    def to_dict(self, include_relations=False):
        """Serialize payment to dictionary"""
        data = {
            'payment_id': self.payment_id,
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'amount': float(self.amount),
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'transaction_id': self.transaction_id,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'refund_amount': float(self.refund_amount) if self.refund_amount else 0.00,
            'refund_date': self.refund_date.isoformat() if self.refund_date else None,
            'payment_details': self.payment_details
        }
        
        if include_relations and self.booking:
            data['booking_reference'] = f"BKG-{self.booking_id}"
            data['guest_name'] = self.booking.user.full_name if self.booking.user else None
        
        return data
    
    def process_payment(self, transaction_id=None):
        """Mark payment as completed"""
        self.payment_status = 'completed'
        self.transaction_id = transaction_id
        self.payment_date = datetime.utcnow()
        
        # Update booking status to confirmed
        if self.booking and self.booking.status == 'pending':
            self.booking.status = 'confirmed'
            
            # Update room status to reserved
            if self.booking.room:
                self.booking.room.status = 'reserved'
        
        db.session.commit()
        return True
    
    def fail_payment(self, reason=None):
        """Mark payment as failed"""
        self.payment_status = 'failed'
        if reason:
            if not self.payment_details:
                self.payment_details = {}
            self.payment_details['failure_reason'] = reason
        
        db.session.commit()
        return True
    
    def process_refund(self, refund_amount=None):
        """Process refund for payment"""
        if self.payment_status != 'completed':
            return False, "Only completed payments can be refunded"
        
        if refund_amount is None:
            refund_amount = self.amount
        
        if refund_amount > self.amount:
            return False, "Refund amount cannot exceed payment amount"
        
        self.payment_status = 'refunded'
        self.refund_amount = refund_amount
        self.refund_date = datetime.utcnow()
        
        # Cancel booking if full refund
        if refund_amount == self.amount and self.booking:
            self.booking.status = 'cancelled'
            if self.booking.room and self.booking.room.status == 'reserved':
                self.booking.room.status = 'available'
        
        db.session.commit()
        return True, "Refund processed successfully"
    
    @staticmethod
    def get_booking_payments(booking_id):
        """Get all payments for a booking"""
        return Payment.query.filter_by(booking_id=booking_id).all()
    
    @staticmethod
    def get_user_payments(user_id):
        """Get all payments for a user"""
        return Payment.query.filter_by(user_id=user_id).order_by(Payment.payment_date.desc()).all()
    
    @staticmethod
    def get_revenue_stats(branch_id=None, date_from=None, date_to=None):
        """Get revenue statistics"""
        query = db.session.query(
            db.func.count(Payment.payment_id).label('total_payments'),
            db.func.sum(Payment.amount).label('total_revenue'),
            db.func.avg(Payment.amount).label('avg_payment')
        ).filter(Payment.payment_status == 'completed')
        
        if branch_id:
            query = query.join(Booking).filter(Booking.branch_id == branch_id)
        
        if date_from:
            query = query.filter(Payment.payment_date >= date_from)
        
        if date_to:
            query = query.filter(Payment.payment_date <= date_to)
        
        result = query.first()
        
        return {
            'total_payments': result.total_payments or 0,
            'total_revenue': float(result.total_revenue) if result.total_revenue else 0.0,
            'avg_payment': float(result.avg_payment) if result.avg_payment else 0.0
        }

