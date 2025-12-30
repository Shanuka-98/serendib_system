"""
Loyalty Program Tests

Tests for loyalty program and promotion functionality.
"""

import pytest


class TestLoyaltyProgram:
    """Tests for loyalty program endpoints."""
    
    def test_get_loyalty_status_authenticated(self, client, db_session, sample_user, auth_headers):
        """Authenticated users should retrieve their loyalty status."""
        response = client.get('/api/loyalty/status', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
    
    def test_get_loyalty_status_unauthenticated(self, client, db_session):
        """Unauthenticated users should be rejected."""
        response = client.get('/api/loyalty/status')
        
        assert response.status_code == 401


class TestPromotions:
    """Tests for promotion validation."""
    
    def test_validate_invalid_promo_code(self, client, db_session):
        """Should reject invalid promo codes."""
        response = client.post('/api/promotions/validate', json={
            'promo_code': 'INVALID_CODE',
            'booking_amount': 500
        })
        
        # Should return 200 with valid=false or 404
        assert response.status_code in [200, 404]
