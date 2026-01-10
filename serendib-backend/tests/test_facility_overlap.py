
import pytest
from app.models.facility import Facility, FacilityBooking
from datetime import datetime, date

@pytest.fixture
def event_hall(db_session, sample_branch):
    """Create a test event hall."""
    hall = Facility(
        branch_id=sample_branch.branch_id,
        name='Grand Ballroom',
        facility_type='event_hall',
        description='Large ballroom for weddings',
        capacity=200,
        is_active=True,
        requires_booking=True,
        is_guest_only=False
    )
    db_session.add(hall)
    db_session.commit()
    return hall

def test_full_day_overlap(client, auth_headers, event_hall, db_session):
    """Test full day booking conflict."""
    # Create existing confirmed full day booking
    booking1 = FacilityBooking(
        facility_id=event_hall.facility_id,
        user_id=1,
        booking_date=date(2025, 2, 1),
        status='confirmed',
        created_by=1
    )
    db_session.add(booking1)
    db_session.commit()
    
    # Attempt to book same day
    response = client.post('/api/facilities/book', json={
        'facility_id': event_hall.facility_id,
        'booking_date': '2025-02-01',
        'event_name': 'New Event',
        'number_of_guests': 50
    }, headers=auth_headers)
    
    # Ideally should be 400
    assert response.status_code == 400
    assert 'already fully booked' in response.json['message']

def test_time_slot_overlap(client, auth_headers, event_hall, db_session):
    """Test time slot overlap conflict."""
    # Create existing booking 10:00 - 14:00
    booking1 = FacilityBooking(
        facility_id=event_hall.facility_id,
        user_id=1,
        booking_date=date(2025, 2, 2),
        start_time=datetime.strptime('10:00', '%H:%M').time(),
        end_time=datetime.strptime('14:00', '%H:%M').time(),
        status='confirmed',
        created_by=1
    )
    db_session.add(booking1)
    db_session.commit()
    
    # Attempt overlapping booking 12:00 - 16:00
    response = client.post('/api/facilities/book', json={
        'facility_id': event_hall.facility_id,
        'booking_date': '2025-02-02',
        'start_time': '12:00',
        'end_time': '16:00',
        'event_name': 'Overlapping Event',
        'number_of_guests': 50
    }, headers=auth_headers)
    
    # Ideally should be 400
    assert response.status_code == 400
    assert 'overlaps with an existing booking' in response.json['message']

def test_full_day_vs_slot_overlap(client, auth_headers, event_hall, db_session):
    """Test full day blocking a specific slot."""
    # Create existing full day booking
    booking1 = FacilityBooking(
        facility_id=event_hall.facility_id,
        user_id=1,
        booking_date=date(2025, 2, 3),
        status='confirmed',
        created_by=1
    )
    db_session.add(booking1)
    db_session.commit()
    
    # Attempt to book a specific slot
    response = client.post('/api/facilities/book', json={
        'facility_id': event_hall.facility_id,
        'booking_date': '2025-02-03',
        'start_time': '18:00',
        'end_time': '20:00',
        'event_name': 'Dinner Event',
        'number_of_guests': 50
    }, headers=auth_headers)
    
    assert response.status_code == 400
    assert 'already fully booked' in response.json['message']
