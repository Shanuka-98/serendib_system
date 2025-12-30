"""
Facility Booking Tests

Tests for facility listing and booking functionality.
"""

import pytest


class TestFacilityAccess:
    """Tests for facility access control."""
    
    def test_book_facility_unauthenticated(self, client, db_session):
        """Facility booking should require authentication."""
        response = client.post('/api/facilities/book', json={
            'facility_id': 1,
            'date': '2025-01-15',
            'slot_id': 1
        })
        
        assert response.status_code == 401
