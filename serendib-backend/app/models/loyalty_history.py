"""
LoyaltyHistory Model
Represents history of loyalty points transactions
"""

from app import db
from datetime import datetime


class LoyaltyHistory(db.Model):
    __tablename__ = 'LoyaltyHistory'
    
    id = db.Column(db.Integer, primary_key=True)
    loyalty_id = db.Column(db.Integer, db.ForeignKey('LoyaltyProgram.loyalty_id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # Positive for earned, negative for redeemed
    transaction_type = db.Column(
        db.Enum('earned', 'redeemed', 'adjusted', 'expired', name='loyalty_transaction_type'),
        nullable=False
    )
    description = db.Column(db.String(255))
    related_booking_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_loyalty_history_loyalty', 'loyalty_id'),
        db.Index('idx_loyalty_history_created', 'created_at'),
    )
    
    def __repr__(self):
        return f'<LoyaltyHistory #{self.id} - {self.transaction_type} {self.amount}>'
    
    def to_dict(self):
        """Serialize history to dictionary"""
        return {
            'id': self.id,
            'loyalty_id': self.loyalty_id,
            'amount': self.amount,
            'transaction_type': self.transaction_type,
            'description': self.description,
            'related_booking_id': self.related_booking_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
