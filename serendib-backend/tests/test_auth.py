"""
Authentication Route Tests

This module tests the authentication endpoints including registration,
login, password management, and user profile operations. These tests
verify that the authentication flow works correctly and handles edge
cases appropriately.
"""

import pytest
from app.models.user import User


class TestRegistration:
    """Tests for the user registration endpoint."""
    
    def test_register_success(self, client, db_session):
        """New users should be able to register with valid credentials."""
        response = client.post('/api/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'full_name': 'New User',
            'phone': '+94771234567'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        # API wraps response in 'data' key
        assert 'data' in data
        assert 'user' in data['data']
        assert data['data']['user']['email'] == 'newuser@example.com'
    
    def test_register_duplicate_email(self, client, db_session, sample_user):
        """Registration should fail when email already exists."""
        response = client.post('/api/auth/register', json={
            'email': sample_user.email,
            'password': 'AnotherPass123!',
            'full_name': 'Duplicate User',
            'phone': '+94779876543'
        })
        
        # API returns 409 Conflict for duplicate email
        assert response.status_code == 409
        data = response.get_json()
        assert 'error' in data or 'message' in data
    
    def test_register_missing_required_fields(self, client, db_session):
        """Registration should fail when required fields are missing."""
        response = client.post('/api/auth/register', json={
            'email': 'incomplete@example.com'
            # Missing password and full_name
        })
        
        assert response.status_code == 400
    
    def test_register_invalid_email_format(self, client, db_session):
        """Registration should reject invalid email formats."""
        response = client.post('/api/auth/register', json={
            'email': 'not-an-email',
            'password': 'ValidPass123!',
            'full_name': 'Test User'
        })
        
        assert response.status_code == 400


class TestLogin:
    """Tests for the user login endpoint."""
    
    def test_login_success(self, client, db_session, sample_user):
        """Users should be able to login with correct credentials."""
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'Test@1234'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        # API wraps response: data.tokens.access_token
        assert 'data' in data
        assert 'tokens' in data['data']
        assert 'access_token' in data['data']['tokens']
        assert 'user' in data['data']
    
    def test_login_wrong_password(self, client, db_session, sample_user):
        """Login should fail with incorrect password."""
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'WrongPassword123'
        })
        
        assert response.status_code == 401
    
    def test_login_nonexistent_email(self, client, db_session):
        """Login should fail for unregistered email addresses."""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123'
        })
        
        assert response.status_code == 401
    
    def test_login_missing_credentials(self, client, db_session):
        """Login should fail when credentials are not provided."""
        response = client.post('/api/auth/login', json={})
        
        assert response.status_code == 400


class TestCurrentUser:
    """Tests for the current user profile endpoint."""
    
    def test_get_current_user_authenticated(self, client, db_session, sample_user, auth_headers):
        """Authenticated users should retrieve their profile."""
        response = client.get('/api/auth/me', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        # API wraps response in 'data' key
        assert 'data' in data
        assert data['data']['user']['email'] == sample_user.email
    
    def test_get_current_user_unauthorized(self, client, db_session):
        """Unauthenticated requests should be rejected."""
        response = client.get('/api/auth/me')
        
        assert response.status_code == 401


class TestPasswordChange:
    """Tests for the password change endpoint."""
    
    def test_change_password_success(self, client, db_session, sample_user, auth_headers):
        """Users should be able to change their password."""
        response = client.post('/api/auth/change-password', 
            headers=auth_headers,
            json={
                'current_password': 'Test@1234',
                'new_password': 'NewSecure@5678'
            }
        )
        
        assert response.status_code == 200
    
    def test_change_password_wrong_current(self, client, db_session, sample_user, auth_headers):
        """Password change should fail with incorrect current password."""
        response = client.post('/api/auth/change-password',
            headers=auth_headers,
            json={
                'current_password': 'WrongCurrent123',
                'new_password': 'NewSecure@5678'
            }
        )
        
        assert response.status_code == 400
