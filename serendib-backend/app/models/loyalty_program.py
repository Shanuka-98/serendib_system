"""
LoyaltyProgram Model
Represents guest loyalty program data
"""

from app import db
from datetime import datetime


class LoyaltyProgram(db.Model):
    __tablename__ = 'LoyaltyProgram'
    
    loyalty_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    points = db.Column(db.Integer, default=0)
    tier = db.Column(
        db.Enum('bronze', 'silver', 'gold', 'platinum', name='loyalty_tier'),
        default='bronze'
    )
    join_date = db.Column(db.DateTime, default=datetime.utcnow)
    lifetime_points = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_tier', 'tier'),
        db.Index('idx_points', 'points'),
    )
    
    # Tier thresholds
    TIER_THRESHOLDS = {
        'bronze': 0,
        'silver': 1000,
        'gold': 3000,
        'platinum': 5000
    }
    
    # Points earning rate: 10 points per 1000 currency units
    POINTS_RATE = 10
    CURRENCY_UNIT = 1000
    
    def __repr__(self):
        return f'<LoyaltyProgram User#{self.user_id} - {self.tier}>'
    
    def to_dict(self):
        """Serialize loyalty program to dictionary"""
        return {
            'loyalty_id': self.loyalty_id,
            'user_id': self.user_id,
            'points': self.points,
            'tier': self.tier,
            'join_date': self.join_date.isoformat() if self.join_date else None,
            'lifetime_points': self.lifetime_points,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'next_tier': self.get_next_tier(),
            'points_to_next_tier': self.points_to_next_tier(),
            'benefits': self.get_tier_benefits()
        }
    
    def add_points(self, amount):
        """
        Add points based on spending amount
        
        Args:
            amount: Amount spent
        
        Returns:
            int: Points earned
        """
        points_earned = int(amount / self.CURRENCY_UNIT) * self.POINTS_RATE
        
        self.points += points_earned
        self.lifetime_points += points_earned
        self.last_activity = datetime.utcnow()
        
        # Update tier
        self.update_tier()
        
        # Create history record
        from app.models.loyalty_history import LoyaltyHistory
        history = LoyaltyHistory(
            loyalty_id=self.loyalty_id,
            amount=points_earned,
            transaction_type='earned',
            description=f'Earned {points_earned} points'
        )
        db.session.add(history)
        
        db.session.commit()
        
        return points_earned
    
    def redeem_points(self, points_to_redeem, booking_id=None):
        """
        Redeem loyalty points
        
        Args:
            points_to_redeem: Number of points to redeem
            booking_id: Optional booking ID for history
        
        Returns:
            tuple: (success, message, discount_amount)
        """
        if points_to_redeem > self.points:
            return False, "Insufficient points", 0
        
        # 100 points = 100 currency units discount
        discount_amount = points_to_redeem
        
        self.points -= points_to_redeem
        self.last_activity = datetime.utcnow()
        
        # Create history record
        from app.models.loyalty_history import LoyaltyHistory
        history = LoyaltyHistory(
            loyalty_id=self.loyalty_id,
            amount=-points_to_redeem,
            transaction_type='redeemed',
            description=f'Redeemed {points_to_redeem} points',
            related_booking_id=booking_id
        )
        db.session.add(history)
        
        db.session.commit()
        
        return True, "Points redeemed successfully", discount_amount
    
    def update_tier(self):
        """Update loyalty tier based on lifetime points"""
        if self.lifetime_points >= self.TIER_THRESHOLDS['platinum']:
            self.tier = 'platinum'
        elif self.lifetime_points >= self.TIER_THRESHOLDS['gold']:
            self.tier = 'gold'
        elif self.lifetime_points >= self.TIER_THRESHOLDS['silver']:
            self.tier = 'silver'
        else:
            self.tier = 'bronze'
    
    def get_next_tier(self):
        """Get the next tier"""
        tiers = ['bronze', 'silver', 'gold', 'platinum']
        current_index = tiers.index(self.tier)
        
        if current_index < len(tiers) - 1:
            return tiers[current_index + 1]
        
        return None
    
    def points_to_next_tier(self):
        """Calculate points needed for next tier"""
        next_tier = self.get_next_tier()
        
        if not next_tier:
            return 0
        
        return self.TIER_THRESHOLDS[next_tier] - self.lifetime_points
    
    def get_tier_benefits(self):
        """Get benefits for current tier"""
        benefits = {
            'bronze': [
                'Earn 10 points per 1000 spent',
                'Birthday bonus points',
                'Exclusive member offers'
            ],
            'silver': [
                'All Bronze benefits',
                '5% discount on bookings',
                'Late checkout (subject to availability)',
                'Priority customer support'
            ],
            'gold': [
                'All Silver benefits',
                '10% discount on bookings',
                'Free room upgrade (subject to availability)',
                'Complimentary breakfast',
                'Airport transfer discount'
            ],
            'platinum': [
                'All Gold benefits',
                '15% discount on bookings',
                'Guaranteed room upgrade',
                'Free spa services',
                'VIP concierge service',
                'Exclusive lounge access'
            ]
        }
        
        return benefits.get(self.tier, [])
    
    def get_discount_percentage(self):
        """Get discount percentage for current tier"""
        discounts = {
            'bronze': 0,
            'silver': 5,
            'gold': 10,
            'platinum': 15
        }
        
        return discounts.get(self.tier, 0)
    
    @staticmethod
    def calculate_points_for_amount(amount):
        """Calculate how many points would be earned for an amount"""
        return int(amount / LoyaltyProgram.CURRENCY_UNIT) * LoyaltyProgram.POINTS_RATE
    
    @staticmethod
    def get_tier_stats():
        """Get statistics for all tiers"""
        return {
            'bronze': LoyaltyProgram.query.filter_by(tier='bronze').count(),
            'silver': LoyaltyProgram.query.filter_by(tier='silver').count(),
            'gold': LoyaltyProgram.query.filter_by(tier='gold').count(),
            'platinum': LoyaltyProgram.query.filter_by(tier='platinum').count()
        }

