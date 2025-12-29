"""
User Model
Represents system users (guests, staff, admins)
"""

from app import db, bcrypt
from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token


class User(db.Model):
    __tablename__ = 'User'
    
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.Enum('guest', 'staff', 'admin', name='user_role'), default='guest')
    role_type = db.Column(
        db.Enum('front_desk', 'housekeeping', 'food_beverage', 'maintenance', 'concierge', 'spa', 'manager', name='staff_role_type'),
        nullable=True
    )  # Only applicable for staff users
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), index=True)
    reset_token = db.Column(db.String(255), index=True)
    reset_token_expiry = db.Column(db.DateTime)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships with cascade delete: removing a user also removes their related records
    bookings = db.relationship('Booking', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    service_requests = db.relationship('ServiceRequest', foreign_keys='ServiceRequest.user_id', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    loyalty_program = db.relationship('LoyaltyProgram', backref='user', uselist=False, cascade='all, delete-orphan')
    staff_profile = db.relationship('Staff', backref='user', uselist=False, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def generate_tokens(self):
        """Generate JWT access and refresh tokens"""
        additional_claims = {
            'role': self.role,
            'branch_id': self.branch_id,
            'email': self.email
        }
        
        access_token = create_access_token(
            identity=self.user_id,
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=self.user_id,
            additional_claims=additional_claims
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer'
        }
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Serialize user to dictionary"""
        data = {
            'user_id': self.user_id,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'role_type': self.role_type,
            'branch_id': self.branch_id,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if self.branch:
            data['branch_name'] = self.branch.name
            data['branch_city'] = self.branch.city
        
        if include_sensitive:
            data['verification_token'] = self.verification_token
            data['reset_token'] = self.reset_token
        
        return data
    
    def to_public_dict(self):
        """Public-facing user data (limited info)"""
        return {
            'user_id': self.user_id,
            'full_name': self.full_name,
            'role': self.role
        }
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def find_by_verification_token(token):
        """Find user by verification token"""
        return User.query.filter_by(verification_token=token).first()
    
    @staticmethod
    def find_by_reset_token(token):
        """Find user by password reset token"""
        return User.query.filter_by(reset_token=token).first()
    
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'
    
    def is_staff(self):
        """Check if user is staff"""
        return self.role in ['staff', 'admin']
    
    def can_manage_booking(self, booking):
        """Check if user can manage a specific booking"""
        if self.role == 'admin':
            return True
        if self.role == 'staff' and self.branch_id == booking.branch_id:
            return True
        if booking.user_id == self.user_id:
            return True
        return False

