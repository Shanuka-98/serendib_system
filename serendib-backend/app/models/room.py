"""
Room Model
Represents hotel rooms across all branches
"""

from app import db
from datetime import datetime
from sqlalchemy import and_, or_


class Room(db.Model):
    __tablename__ = 'Room'
    
    room_id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'), nullable=False)
    room_number = db.Column(db.String(20), nullable=False)
    room_type = db.Column(db.Enum('standard', 'deluxe', 'suite', 'penthouse', name='room_type'), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    price_per_night = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(
        db.Enum('available', 'occupied', 'maintenance', 'reserved', 'cleaning', name='room_status'),
        default='available'
    )
    amenities = db.Column(db.JSON)
    floor = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    image_urls = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', backref='room', lazy='dynamic', cascade='all, delete-orphan')
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('branch_id', 'room_number', name='unique_room_branch'),
        db.Index('idx_branch_type', 'branch_id', 'room_type'),
        db.Index('idx_status', 'status'),
        db.Index('idx_price', 'price_per_night'),
    )
    
    def __repr__(self):
        return f'<Room {self.room_number} - {self.branch.name if self.branch else "No Branch"}>'
    
    def to_dict(self, include_availability=False):
        """Serialize room to dictionary"""
        # Safely access branch relationship
        branch_name = None
        branch_city = None
        try:
            if self.branch:
                branch_name = self.branch.name
                branch_city = self.branch.city
        except Exception as e:
            # If branch relationship fails to load, just use None
            print(f"Warning: Could not load branch for room {self.room_id}: {str(e)}")
        
        # Parse image_urls if it's a JSON string
        image_urls = self.image_urls
        if isinstance(image_urls, str):
            try:
                import json
                image_urls = json.loads(image_urls)
            except (json.JSONDecodeError, TypeError):
                image_urls = []
        elif image_urls is None:
            image_urls = []
        
        data = {
            'room_id': self.room_id,
            'branch_id': self.branch_id,
            'branch_name': branch_name,
            'branch_city': branch_city,
            'room_number': self.room_number,
            'room_type': self.room_type,
            'capacity': self.capacity,
            'price_per_night': float(self.price_per_night),
            'status': self.status,
            'amenities': self.amenities or [],
            'floor': self.floor,
            'description': self.description,
            'image_urls': image_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_availability:
            data['is_available'] = self.status == 'available'
        
        return data
    
    def check_availability(self, check_in, check_out):
        """
        Check if room is available for given date range
        
        Args:
            check_in: Check-in date
            check_out: Check-out date
        
        Returns:
            bool: True if available, False otherwise
        """
        # Check room status
        if self.status != 'available':
            return False
        
        # Check for conflicting bookings
        from app.models.booking import Booking
        
        conflicting_bookings = Booking.query.filter(
            Booking.room_id == self.room_id,
            Booking.status.in_(['confirmed', 'checked_in']),
            or_(
                and_(Booking.check_in_date <= check_in, Booking.check_out_date > check_in),
                and_(Booking.check_in_date < check_out, Booking.check_out_date >= check_out),
                and_(Booking.check_in_date >= check_in, Booking.check_out_date <= check_out)
            )
        ).first()
        
        return conflicting_bookings is None
    
    def update_status(self, new_status):
        """Update room status"""
        valid_statuses = ['available', 'occupied', 'maintenance', 'reserved', 'cleaning']
        if new_status in valid_statuses:
            self.status = new_status
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def get_available_rooms(branch_id=None, room_type=None, check_in=None, check_out=None, min_capacity=None):
        """
        Get available rooms with filters
        
        Args:
            branch_id: Filter by branch
            room_type: Filter by room type
            check_in: Check-in date
            check_out: Check-out date
            min_capacity: Minimum capacity
        
        Returns:
            List of available rooms
        """
        query = Room.query.filter_by(status='available')
        
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if room_type:
            query = query.filter_by(room_type=room_type)
        
        if min_capacity:
            query = query.filter(Room.capacity >= min_capacity)
        
        rooms = query.all()
        
        # If date range provided, check availability
        if check_in and check_out:
            available_rooms = [
                room for room in rooms
                if room.check_availability(check_in, check_out)
            ]
            return available_rooms
        
        return rooms
    
    @staticmethod
    def get_by_branch(branch_id):
        """Get all rooms for a branch"""
        return Room.query.filter_by(branch_id=branch_id).all()
    
    @staticmethod
    def search_rooms(search_params):
        """
        Advanced room search
        
        Args:
            search_params: Dictionary with search parameters
        
        Returns:
            List of matching rooms
        """
        # Start with basic query - branch will be loaded via backref when needed
        query = Room.query
        
        if search_params.get('branch_id'):
            query = query.filter(Room.branch_id == search_params['branch_id'])
        
        if search_params.get('room_type'):
            query = query.filter(Room.room_type == search_params['room_type'])
        
        if search_params.get('min_price'):
            query = query.filter(Room.price_per_night >= search_params['min_price'])
        
        if search_params.get('max_price'):
            query = query.filter(Room.price_per_night <= search_params['max_price'])
        
        if search_params.get('capacity'):
            query = query.filter(Room.capacity >= search_params['capacity'])
        
        if search_params.get('status'):
            query = query.filter(Room.status == search_params['status'])
        elif not search_params.get('include_all_statuses'):
            # Default to available only if not explicitly requesting all statuses
            query = query.filter(Room.status == 'available')
        # If include_all_statuses is True, don't filter by status at all

        # Add search functionality - search by room number or room type
        if search_params.get('search'):
            search_term = search_params['search'].strip()
            if search_term:
                # Remove common prefixes like "Room " to make search more flexible
                cleaned_term = search_term.replace('Room ', '').replace('room ', '').replace('ROOM ', '').strip()
                
                # If cleaned term is empty after removing prefix, use original
                if not cleaned_term:
                    cleaned_term = search_term
                
                print(f"Searching for: '{search_term}' (cleaned: '{cleaned_term}')")
                
                # Search in room number or room type (case insensitive)
                # Use both original and cleaned term for better matching
                query = query.filter(
                    db.or_(
                        Room.room_number.ilike(f'%{cleaned_term}%'),
                        Room.room_number.ilike(f'%{search_term}%'),
                        Room.room_type.ilike(f'%{cleaned_term}%'),
                        Room.room_type.ilike(f'%{search_term}%')
                    )
                )

        return query.all()

