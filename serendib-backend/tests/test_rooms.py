"""
Room Route Tests

Tests for room listing, filtering, and availability endpoints.
"""

import pytest


class TestRoomListing:
    """Tests for room listing endpoints."""
    
    def test_get_all_rooms(self, client, db_session, sample_room):
        """Should return list of available rooms."""
        response = client.get('/api/rooms')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
    
    def test_get_rooms_by_branch(self, client, db_session, sample_room, sample_branch):
        """Should filter rooms by branch ID."""
        response = client.get(f'/api/rooms?branch_id={sample_branch.branch_id}')
        
        assert response.status_code == 200


class TestRoomDetails:
    """Tests for individual room details."""
    
    def test_get_room_details_success(self, client, db_session, sample_room):
        """Should return room details for valid room ID."""
        response = client.get(f'/api/rooms/{sample_room.room_id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
    
    def test_get_room_details_not_found(self, client, db_session):
        """Should return 404 for nonexistent room."""
        response = client.get('/api/rooms/99999')
        
        assert response.status_code == 404
