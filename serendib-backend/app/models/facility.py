"""
Facility Models
Facility, FacilitySlot, FacilityBooking, FacilityAddOn
For shared facilities (pool, gym, spa) and event halls
"""

from app import db
from datetime import datetime, date
from sqlalchemy import and_, or_


class Facility(db.Model):
    """
    Represents a bookable facility (pool, gym, spa, event hall, meeting room)
    """
    __tablename__ = 'Facility'
    
    facility_id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    facility_type = db.Column(
        db.Enum('pool', 'gym', 'spa', 'event_hall', 'meeting_room', name='facility_type'),
        nullable=False
    )
    description = db.Column(db.Text)
    capacity = db.Column(db.Integer, nullable=False)
    price_per_slot = db.Column(db.Numeric(10, 2), default=0.00)
    slot_duration_minutes = db.Column(db.Integer, default=60)
    requires_booking = db.Column(db.Boolean, default=True)
    is_guest_only = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    amenities = db.Column(db.JSON)
    images = db.Column(db.JSON)
    operating_hours = db.Column(db.JSON)
    rules = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    branch = db.relationship('Branch', backref=db.backref('facilities', lazy='dynamic'))
    slots = db.relationship('FacilitySlot', backref='facility', lazy='dynamic', cascade='all, delete-orphan')
    bookings = db.relationship('FacilityBooking', backref='facility', lazy='dynamic', cascade='all, delete-orphan')
    addons = db.relationship('FacilityAddOn', backref='facility', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Facility {self.name} ({self.facility_type})>'
    
    def to_dict(self, include_slots=False, include_addons=False):
        """Serialize facility to dictionary"""
        data = {
            'facility_id': self.facility_id,
            'branch_id': self.branch_id,
            'branch_name': self.branch.name if self.branch else None,
            'name': self.name,
            'facility_type': self.facility_type,
            'description': self.description,
            'capacity': self.capacity,
            'price_per_slot': float(self.price_per_slot) if self.price_per_slot else 0.0,
            'slot_duration_minutes': self.slot_duration_minutes,
            'requires_booking': self.requires_booking,
            'is_guest_only': self.is_guest_only,
            'is_active': self.is_active,
            'amenities': self.amenities or [],
            'images': self.images or [],
            'operating_hours': self.operating_hours or {},
            'rules': self.rules,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_slots:
            data['slots'] = [slot.to_dict() for slot in self.slots.filter_by(is_active=True).all()]
        
        if include_addons:
            # Include facility-specific and branch-wide addons
            facility_addons = FacilityAddOn.query.filter(
                or_(
                    FacilityAddOn.facility_id == self.facility_id,
                    and_(FacilityAddOn.branch_id == self.branch_id, FacilityAddOn.facility_id.is_(None))
                ),
                FacilityAddOn.is_active == True
            ).all()
            data['addons'] = [addon.to_dict() for addon in facility_addons]
        
        return data
    
    def get_available_slots(self, booking_date, day_of_week=None):
        """
        Get available slots for a specific date
        Returns slots with remaining capacity
        """
        from datetime import datetime
        
        if day_of_week is None:
            day_of_week = booking_date.strftime('%A').lower()
        
        # Get all slots for this facility (matching day or 'all')
        slots = FacilitySlot.query.filter(
            FacilitySlot.facility_id == self.facility_id,
            FacilitySlot.is_active == True,
            or_(
                FacilitySlot.day_of_week == day_of_week,
                FacilitySlot.day_of_week == 'all'
            )
        ).all()
        
        # Get current time for filtering past slots on today
        now = datetime.now()
        is_today = booking_date == now.date()
        current_time = now.time()
        
        available_slots = []
        for slot in slots:
            # Skip past slots if booking is for today (slot already started)
            if is_today and slot.start_time < current_time:
                continue
            
            # Count existing bookings for this slot on this date
            booked_count = FacilityBooking.query.filter(
                FacilityBooking.facility_id == self.facility_id,
                FacilityBooking.slot_id == slot.slot_id,
                FacilityBooking.booking_date == booking_date,
                FacilityBooking.status.in_(['pending', 'confirmed', 'in_progress'])
            ).with_entities(db.func.sum(FacilityBooking.number_of_guests)).scalar() or 0
            
            max_capacity = slot.max_capacity or self.capacity
            remaining = max_capacity - booked_count
            
            if remaining > 0:
                slot_data = slot.to_dict()
                slot_data['remaining_capacity'] = remaining
                slot_data['booked_count'] = booked_count
                available_slots.append(slot_data)
        
        return available_slots
    
    def check_date_availability(self, booking_date):
        """
        Check if facility has any availability on a specific date
        Used for event halls to show calendar availability
        """
        # For event halls, check if the entire day is booked
        if self.facility_type in ['event_hall', 'meeting_room']:
            existing_booking = FacilityBooking.query.filter(
                FacilityBooking.facility_id == self.facility_id,
                FacilityBooking.booking_date == booking_date,
                FacilityBooking.status.in_(['inquiry', 'quoted', 'pending', 'confirmed', 'in_progress'])
            ).first()
            return existing_booking is None
        
        # For other facilities, check if any slots have capacity
        available_slots = self.get_available_slots(booking_date)
        return len(available_slots) > 0


class FacilitySlot(db.Model):
    """
    Time slot configuration for facilities
    """
    __tablename__ = 'FacilitySlot'
    
    slot_id = db.Column(db.Integer, primary_key=True)
    facility_id = db.Column(db.Integer, db.ForeignKey('Facility.facility_id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    day_of_week = db.Column(
        db.Enum('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all', name='day_of_week'),
        default='all'
    )
    max_capacity = db.Column(db.Integer)
    price_override = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<FacilitySlot {self.start_time}-{self.end_time}>'
    
    def to_dict(self):
        """Serialize slot to dictionary"""
        return {
            'slot_id': self.slot_id,
            'facility_id': self.facility_id,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'day_of_week': self.day_of_week,
            'max_capacity': self.max_capacity or (self.facility.capacity if self.facility else None),
            'price_override': float(self.price_override) if self.price_override else None,
            'is_active': self.is_active,
        }


class FacilityAddOn(db.Model):
    """
    Add-on services for facilities (catering, decoration, equipment)
    """
    __tablename__ = 'FacilityAddOn'
    
    addon_id = db.Column(db.Integer, primary_key=True)
    facility_id = db.Column(db.Integer, db.ForeignKey('Facility.facility_id', ondelete='CASCADE'))
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    price_type = db.Column(
        db.Enum('flat', 'per_person', 'per_hour', name='addon_price_type'),
        default='flat'
    )
    category = db.Column(
        db.Enum('catering', 'decoration', 'equipment', 'service', 'other', name='addon_category'),
        default='other'
    )
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    branch = db.relationship('Branch', backref=db.backref('facility_addons', lazy='dynamic'))
    
    def __repr__(self):
        return f'<FacilityAddOn {self.name}>'
    
    def to_dict(self):
        """Serialize addon to dictionary"""
        return {
            'addon_id': self.addon_id,
            'facility_id': self.facility_id,
            'branch_id': self.branch_id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else 0.0,
            'price_type': self.price_type,
            'category': self.category,
            'is_active': self.is_active,
        }
    
    def calculate_price(self, guests=1, hours=1):
        """Calculate total price based on price type"""
        base_price = float(self.price) if self.price else 0.0
        if self.price_type == 'per_person':
            return base_price * guests
        elif self.price_type == 'per_hour':
            return base_price * hours
        return base_price


class FacilityBooking(db.Model):
    """
    Guest reservations for facilities
    Handles both slot-based bookings (pool, spa) and event inquiries (halls)
    """
    __tablename__ = 'FacilityBooking'
    
    booking_id = db.Column(db.Integer, primary_key=True)
    facility_id = db.Column(db.Integer, db.ForeignKey('Facility.facility_id', ondelete='CASCADE'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('FacilitySlot.slot_id', ondelete='SET NULL'))
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='SET NULL'))
    room_booking_id = db.Column(db.Integer, db.ForeignKey('Booking.booking_id', ondelete='SET NULL'))
    
    # Booking details
    booking_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    number_of_guests = db.Column(db.Integer, default=1)
    
    # Status workflow
    status = db.Column(
        db.Enum('inquiry', 'quoted', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', name='facility_booking_status'),
        default='pending'
    )
    
    # Event-specific fields
    event_type = db.Column(db.String(100))
    event_name = db.Column(db.String(200))
    contact_name = db.Column(db.String(150))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    organization = db.Column(db.String(200))
    
    # Pricing
    base_price = db.Column(db.Numeric(10, 2), default=0.00)
    selected_addons = db.Column(db.JSON)
    addons_total = db.Column(db.Numeric(10, 2), default=0.00)
    subtotal = db.Column(db.Numeric(10, 2), default=0.00)
    service_charge = db.Column(db.Numeric(10, 2), default=0.00)
    tax_amount = db.Column(db.Numeric(10, 2), default=0.00)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Payment
    deposit_amount = db.Column(db.Numeric(10, 2), default=0.00)
    deposit_paid = db.Column(db.Boolean, default=False)
    deposit_paid_at = db.Column(db.DateTime)
    payment_type = db.Column(
        db.Enum('free', 'pay_now', 'add_to_bill', 'deposit_required', name='facility_payment_type'),
        default='free'
    )
    payment_status = db.Column(
        db.Enum('not_required', 'pending', 'partial', 'paid', 'refunded', name='facility_payment_status'),
        default='not_required'
    )
    stripe_payment_id = db.Column(db.String(255))
    
    # Notes
    special_requests = db.Column(db.Text)
    admin_notes = db.Column(db.Text)
    cancellation_reason = db.Column(db.Text)
    cancelled_at = db.Column(db.DateTime)
    
    # Metadata
    created_by = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='SET NULL'))
    quote_sent_at = db.Column(db.DateTime)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('facility_bookings', lazy='dynamic'))
    room_booking = db.relationship('Booking', backref=db.backref('facility_bookings', lazy='dynamic'))
    slot = db.relationship('FacilitySlot', backref=db.backref('bookings', lazy='dynamic'))
    creator = db.relationship('User', foreign_keys=[created_by])
    
    def __repr__(self):
        return f'<FacilityBooking {self.booking_id} - {self.facility.name if self.facility else "Unknown"}>'
    
    def to_dict(self, include_facility=False, include_user=False):
        """Serialize booking to dictionary"""
        data = {
            'booking_id': self.booking_id,
            'facility_id': self.facility_id,
            'facility_name': self.facility.name if self.facility else None,
            'facility_type': self.facility.facility_type if self.facility else None,
            'branch_id': self.facility.branch_id if self.facility else None,
            'branch_name': self.facility.branch.name if self.facility and self.facility.branch else None,
            'slot_id': self.slot_id,
            'user_id': self.user_id,
            'room_booking_id': self.room_booking_id,
            'booking_date': self.booking_date.isoformat() if self.booking_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'number_of_guests': self.number_of_guests,
            'status': self.status,
            # Event fields
            'event_type': self.event_type,
            'event_name': self.event_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'organization': self.organization,
            # Pricing
            'base_price': float(self.base_price) if self.base_price else 0.0,
            'selected_addons': self.selected_addons or [],
            'addons_total': float(self.addons_total) if self.addons_total else 0.0,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'service_charge': float(self.service_charge) if self.service_charge else 0.0,
            'tax_amount': float(self.tax_amount) if self.tax_amount else 0.0,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            # Payment
            'deposit_amount': float(self.deposit_amount) if self.deposit_amount else 0.0,
            'deposit_paid': self.deposit_paid,
            'deposit_paid_at': self.deposit_paid_at.isoformat() if self.deposit_paid_at else None,
            'payment_type': self.payment_type,
            'payment_status': self.payment_status,
            # Notes
            'special_requests': self.special_requests,
            'admin_notes': self.admin_notes,
            'cancellation_reason': self.cancellation_reason,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            # Metadata
            'quote_sent_at': self.quote_sent_at.isoformat() if self.quote_sent_at else None,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_facility and self.facility:
            data['facility'] = self.facility.to_dict()
        
        if include_user and self.user:
            data['user'] = {
                'user_id': self.user.user_id,
                'full_name': self.user.full_name,
                'email': self.user.email,
                'phone': self.user.phone,
            }
        
        return data
    
    def calculate_totals(self, service_charge_rate=0.10, tax_rate=0.12):
        """
        Calculate all pricing totals
        """
        # Base price
        base = float(self.base_price) if self.base_price else 0.0
        
        # Calculate addons total
        addons = 0.0
        if self.selected_addons:
            for addon in self.selected_addons:
                addon_price = float(addon.get('price', 0))
                if addon.get('price_type') == 'per_person':
                    addon_price *= self.number_of_guests or 1
                addons += addon_price
        
        self.addons_total = addons
        self.subtotal = base + addons
        self.service_charge = self.subtotal * service_charge_rate
        self.tax_amount = (self.subtotal + self.service_charge) * tax_rate
        self.total_amount = self.subtotal + self.service_charge + self.tax_amount
        
        # Set deposit for event halls (50%)
        if self.facility and self.facility.facility_type in ['event_hall', 'meeting_room']:
            self.deposit_amount = self.total_amount * 0.5
            self.payment_type = 'deposit_required'
        
        return self.total_amount
    
    @staticmethod
    def get_by_user(user_id, status=None):
        """Get facility bookings for a user"""
        query = FacilityBooking.query.filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(FacilityBooking.booking_date.desc()).all()
    
    @staticmethod
    def get_by_room_booking(room_booking_id):
        """Get facility bookings linked to a room booking (for checkout billing)"""
        return FacilityBooking.query.filter(
            FacilityBooking.room_booking_id == room_booking_id,
            FacilityBooking.payment_type == 'add_to_bill',
            FacilityBooking.payment_status.in_(['pending', 'not_required'])
        ).all()
    
    @staticmethod
    def get_event_inquiries(branch_id=None, status=None):
        """Get event hall inquiries for admin/manager"""
        query = FacilityBooking.query.join(Facility).filter(
            Facility.facility_type.in_(['event_hall', 'meeting_room'])
        )
        if branch_id:
            query = query.filter(Facility.branch_id == branch_id)
        if status:
            query = query.filter(FacilityBooking.status == status)
        return query.order_by(FacilityBooking.created_at.desc()).all()
