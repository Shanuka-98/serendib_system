"""
Promotion Model
Represents promotional campaigns and discount codes
"""

from app import db
from datetime import datetime, date


class Promotion(db.Model):
    __tablename__ = 'Promotion'
    
    promotion_id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    discount_percentage = db.Column(db.Numeric(5, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2))
    promo_code = db.Column(db.String(50), unique=True, index=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    terms_conditions = db.Column(db.Text)
    min_booking_amount = db.Column(db.Numeric(10, 2))
    max_discount = db.Column(db.Numeric(10, 2))
    usage_limit = db.Column(db.Integer)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_branch', 'branch_id'),
        db.Index('idx_dates', 'start_date', 'end_date'),
        db.Index('idx_promo_code', 'promo_code'),
        db.Index('idx_active', 'is_active'),
    )
    
    def __repr__(self):
        return f'<Promotion {self.promo_code} - {self.title}>'
    
    def to_dict(self):
        """Serialize promotion to dictionary"""
        return {
            'promotion_id': self.promotion_id,
            'branch_id': self.branch_id,
            'branch_name': self.branch.name if self.branch else 'All Branches',
            'title': self.title,
            'description': self.description,
            'discount_percentage': float(self.discount_percentage),
            'discount_amount': float(self.discount_amount) if self.discount_amount else None,
            'promo_code': self.promo_code,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'terms_conditions': self.terms_conditions,
            'min_booking_amount': float(self.min_booking_amount) if self.min_booking_amount else None,
            'max_discount': float(self.max_discount) if self.max_discount else None,
            'usage_limit': self.usage_limit,
            'usage_count': self.usage_count,
            'remaining_uses': self.get_remaining_uses(),
            'is_valid': self.is_valid(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_valid(self):
        """Check if promotion is currently valid"""
        if not self.is_active:
            return False
        
        today = date.today()
        
        if today < self.start_date or today > self.end_date:
            return False
        
        if self.usage_limit and self.usage_count >= self.usage_limit:
            return False
        
        return True
    
    def get_remaining_uses(self):
        """Get remaining uses for this promotion"""
        if not self.usage_limit:
            return None
        
        return max(0, self.usage_limit - self.usage_count)
    
    def calculate_discount(self, booking_amount):
        """
        Calculate discount for a booking amount
        
        Args:
            booking_amount: Total booking amount
        
        Returns:
            dict: Discount details
        """
        if not self.is_valid():
            return {
                'valid': False,
                'message': 'Promotion is not valid',
                'discount': 0
            }
        
        if self.min_booking_amount and booking_amount < float(self.min_booking_amount):
            return {
                'valid': False,
                'message': f'Minimum booking amount is {float(self.min_booking_amount)}',
                'discount': 0
            }
        
        # Calculate discount
        if self.discount_amount:
            discount = float(self.discount_amount)
        else:
            discount = booking_amount * (float(self.discount_percentage) / 100)
        
        # Apply max discount limit
        if self.max_discount:
            discount = min(discount, float(self.max_discount))
        
        # Discount cannot exceed booking amount
        discount = min(discount, booking_amount)
        
        return {
            'valid': True,
            'message': 'Promotion applied successfully',
            'discount': discount,
            'final_amount': booking_amount - discount
        }
    
    def apply_promotion(self):
        """Increment usage count when promotion is applied"""
        self.usage_count += 1
        db.session.commit()
    
    @staticmethod
    def get_by_promo_code(promo_code):
        """Get promotion by promo code"""
        return Promotion.query.filter_by(promo_code=promo_code).first()
    
    @staticmethod
    def get_active_promotions(branch_id=None):
        """Get all active promotions"""
        today = date.today()
        
        query = Promotion.query.filter(
            Promotion.is_active == True,
            Promotion.start_date <= today,
            Promotion.end_date >= today
        )
        
        if branch_id:
            query = query.filter(
                (Promotion.branch_id == branch_id) | (Promotion.branch_id == None)
            )
        else:
            query = query.filter(Promotion.branch_id == None)
        
        return query.all()
    
    @staticmethod
    def validate_promo_code(promo_code, booking_amount, branch_id=None):
        """
        Validate promo code and calculate discount
        
        Args:
            promo_code: Promo code to validate
            booking_amount: Booking amount
            branch_id: Branch ID (optional)
        
        Returns:
            dict: Validation result with discount details
        """
        promotion = Promotion.get_by_promo_code(promo_code)
        
        if not promotion:
            return {
                'valid': False,
                'message': 'Invalid promo code',
                'discount': 0
            }
        
        # Check if promotion is for specific branch
        if promotion.branch_id and branch_id and promotion.branch_id != branch_id:
            return {
                'valid': False,
                'message': 'This promo code is not valid for the selected branch',
                'discount': 0
            }
        
        return promotion.calculate_discount(booking_amount)

