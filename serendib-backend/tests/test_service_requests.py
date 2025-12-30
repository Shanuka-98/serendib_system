"""
Service Request Tests

Tests for guest service request functionality.
"""

import pytest


class TestServiceRequestAccess:
    """Tests for service request access control."""
    
    def test_get_service_types(self, client, db_session):
        """Should return available service types."""
        response = client.get('/api/service-requests/types')
        
        # Should return 200 with list of service types
        assert response.status_code == 200
    
    def test_create_request_unauthenticated(self, client, db_session):
        """Service request creation should require authentication."""
        response = client.post('/api/service-requests', json={
            'service_type': 'housekeeping',
            'description': 'Need room cleaning'
        })
        
        assert response.status_code == 401
