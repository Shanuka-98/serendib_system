"""
Booking Route Tests

Tests for booking creation, retrieval, and management endpoints.
"""

import pytest
from datetime import datetime, timedelta


class TestBookingRetrieval:
    """Tests for booking retrieval endpoints."""
    
    def test_get_user_bookings_authenticated(self, client, db_session, sample_booking, auth_headers):
        """Authenticated users should retrieve their bookings."""
        response = client.get('/api/bookings', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
    
    def test_get_user_bookings_unauthenticated(self, client, db_session):
        """Unauthenticated users should be rejected."""
        response = client.get('/api/bookings')
        
        assert response.status_code == 401


class TestBookingCreation:
    """Tests for booking creation."""
    
    def test_create_booking_unauthenticated(self, client, db_session, sample_room):
        """Booking creation should require authentication."""
        check_in = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
        check_out = (datetime.now() + timedelta(days=9)).strftime('%Y-%m-%d')
        
        response = client.post('/api/bookings', json={
            'room_id': sample_room.room_id,
            'check_in_date': check_in,
            'check_out_date': check_out,
            'number_of_guests': 2
        })
        
        assert response.status_code == 401
