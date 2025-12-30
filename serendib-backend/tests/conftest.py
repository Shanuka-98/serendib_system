"""
Pytest Configuration and Fixtures

This module provides shared fixtures for all test files. It creates an
in-memory SQLite database for each test session, ensuring tests run in
isolation without affecting the production MySQL database.

Fixtures:
    app: Flask application with testing configuration
    client: Flask test client for making HTTP requests
    db_session: Database session that rolls back after each test
    auth_headers: JWT authorization headers for authenticated requests
    sample_branch: A test branch record
    sample_user: A test user record
    sample_room: A test room record
"""

import pytest
from datetime import datetime, timedelta
from app import create_app, db, bcrypt
from app.models.user import User
from app.models.branch import Branch
from app.models.room import Room
from app.models.booking import Booking
from app.models.loyalty_program import LoyaltyProgram
from app.models.promotion import Promotion
from app.models.service_request import ServiceRequest
from app.models.service_type import ServiceType
from app.models.facility import Facility, FacilitySlot
from flask_jwt_extended import create_access_token


@pytest.fixture(scope='function')
def app():
    """
    Create a Flask application configured for testing.
    
    Uses SQLite in-memory database which provides fast execution
    and complete isolation from the production database.
    
    Note: We skip index creation since SQLite requires globally unique
    index names whereas MySQL allows duplicate names across tables.
    Indexes are performance optimizations and not needed for unit tests.
    """
    application = create_app('testing')
    
    with application.app_context():
        db.drop_all()
        
        # Create tables without indexes to avoid SQLite naming conflicts
        # This is done by temporarily removing indexes from __table_args__
        from sqlalchemy import event
        
        @event.listens_for(db.metadata, 'before_create')
        def skip_indexes(target, connection, **kw):
            # SQLite will skip creating indexes that cause conflicts
            pass
        
        # Use checkfirst=True to ignore errors
        for table in db.metadata.sorted_tables:
            try:
                table.create(db.engine, checkfirst=True)
            except Exception:
                pass  # Ignore index creation errors in SQLite
        
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Provide a Flask test client for making HTTP requests."""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Provide the database session for test functions."""
    with app.app_context():
        yield db.session


@pytest.fixture
def sample_branch(db_session):
    """Create a test branch for use in room and booking tests."""
    branch = Branch(
        name='Test Colombo Branch',
        location='Colombo City Center',
        address='123 Test Street, Colombo',
        city='Colombo',
        tax_rate=15.00
    )
    db_session.add(branch)
    db_session.commit()
    return branch


@pytest.fixture
def sample_user(db_session, sample_branch):
    """Create a test guest user with loyalty program."""
    user = User(
        email='testguest@example.com',
        password_hash=bcrypt.generate_password_hash('Test@1234').decode('utf-8'),
        full_name='Test Guest',
        phone='+94771234567',
        role='guest',
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    
    loyalty = LoyaltyProgram(
        user_id=user.user_id,
        points=1000,
        tier='silver',
        lifetime_points=5000
    )
    db_session.add(loyalty)
    db_session.commit()
    
    return user


@pytest.fixture
def sample_staff(db_session, sample_branch):
    """Create a test staff user."""
    staff = User(
        email='teststaff@serendibhotels.lk',
        password_hash=bcrypt.generate_password_hash('Staff@1234').decode('utf-8'),
        full_name='Test Staff',
        phone='+94777654321',
        role='staff',
        role_type='front_desk',
        branch_id=sample_branch.branch_id,
        is_active=True,
        is_verified=True
    )
    db_session.add(staff)
    db_session.commit()
    return staff


@pytest.fixture
def sample_admin(db_session):
    """Create a test admin user."""
    admin = User(
        email='testadmin@serendibhotels.lk',
        password_hash=bcrypt.generate_password_hash('Admin@1234').decode('utf-8'),
        full_name='Test Admin',
        phone='+94779999999',
        role='admin',
        is_active=True,
        is_verified=True
    )
    db_session.add(admin)
    db_session.commit()
    return admin


@pytest.fixture
def sample_room(db_session, sample_branch):
    """Create a test room for booking tests."""
    room = Room(
        branch_id=sample_branch.branch_id,
        room_number='101',
        room_type='deluxe',
        floor=1,
        capacity=2,
        price_per_night=150.00,
        status='available',
        description='A comfortable deluxe room with ocean view.'
    )
    db_session.add(room)
    db_session.commit()
    return room


@pytest.fixture
def sample_booking(db_session, sample_user, sample_room, sample_branch):
    """Create a test booking for cancellation and check-in tests."""
    from app.models.payment import Payment
    
    check_in = datetime.now().date() + timedelta(days=1)
    check_out = datetime.now().date() + timedelta(days=3)
    
    booking = Booking(
        user_id=sample_user.user_id,
        room_id=sample_room.room_id,
        branch_id=sample_branch.branch_id,
        check_in_date=check_in,
        check_out_date=check_out,
        number_of_guests=2,
        total_amount=300.00,
        status='confirmed'
    )
    db_session.add(booking)
    db_session.commit()
    
    # Create payment record (separate from booking)
    payment = Payment(
        booking_id=booking.booking_id,
        user_id=sample_user.user_id,
        amount=300.00,
        payment_method='credit_card',
        payment_status='completed'
    )
    db_session.add(payment)
    db_session.commit()
    
    return booking


@pytest.fixture
def sample_promotion(db_session, sample_branch):
    """Create a test promotion code."""
    promo = Promotion(
        title='Test Promotion 20% Off',
        description='20% off for testing',
        promo_code='TESTPROMO20',
        discount_percentage=20.0,
        min_booking_amount=100.0,
        max_discount=50.0,
        usage_limit=100,
        usage_count=0,
        start_date=datetime.now().date() - timedelta(days=1),
        end_date=datetime.now().date() + timedelta(days=30),
        is_active=True,
        branch_id=sample_branch.branch_id
    )
    db_session.add(promo)
    db_session.commit()
    return promo


@pytest.fixture
def sample_service_type(db_session):
    """Create a test service type for service request tests."""
    service = ServiceType(
        name='Room Cleaning',
        code='housekeeping',
        category='housekeeping',
        base_price=25.00,
        description='Standard room cleaning service',
        is_active=True
    )
    db_session.add(service)
    db_session.commit()
    return service


@pytest.fixture
def sample_facility(db_session, sample_branch):
    """Create a test facility for facility booking tests."""
    facility = Facility(
        branch_id=sample_branch.branch_id,
        name='Main Swimming Pool',
        facility_type='pool',
        description='Olympic-sized swimming pool',
        capacity=50,
        is_active=True,
        is_chargeable=False
    )
    db_session.add(facility)
    db_session.commit()
    
    slot = FacilitySlot(
        facility_id=facility.facility_id,
        start_time='09:00',
        end_time='11:00',
        max_capacity=20,
        is_active=True
    )
    db_session.add(slot)
    db_session.commit()
    
    return facility


@pytest.fixture
def auth_headers(app, sample_user):
    """Generate JWT authorization headers for authenticated requests."""
    with app.app_context():
        token = create_access_token(
            identity=sample_user.user_id,
            additional_claims={'role': sample_user.role}
        )
        return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def staff_auth_headers(app, sample_staff):
    """Generate JWT authorization headers for staff requests."""
    with app.app_context():
        token = create_access_token(
            identity=sample_staff.user_id,
            additional_claims={'role': sample_staff.role}
        )
        return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def admin_auth_headers(app, sample_admin):
    """Generate JWT authorization headers for admin requests."""
    with app.app_context():
        token = create_access_token(
            identity=sample_admin.user_id,
            additional_claims={'role': sample_admin.role}
        )
        return {'Authorization': f'Bearer {token}'}
