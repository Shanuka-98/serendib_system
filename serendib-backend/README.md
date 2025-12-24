# Serendib Hotels - Backend API

Flask-based REST API for the Serendib Smart Hotel Management System.

**Last Updated:** December 2025

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp env.example .env
# Edit .env with your database credentials

# Run the application
python run.py
```

Backend runs at: **http://localhost:5000**

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Rooms
- `GET /api/rooms` - List rooms (with filters)
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/check-in` - Check-in
- `POST /api/bookings/:id/check-out` - Check-out

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/branches` - List branches
- `PUT /api/admin/branches/:id` - Update branch

### Analytics
- `GET /api/analytics/revenue` - Revenue data
- `GET /api/analytics/occupancy` - Occupancy rates
- `GET /api/analytics/booking-trends` - Booking trends

## Project Structure

```
app/
├── models/          # SQLAlchemy models
├── routes/          # API route handlers
├── services/        # Business logic
├── utils/           # Helpers & decorators
└── __init__.py      # App factory
```

## Environment Variables

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=serendib_hotels
DB_USER=root
DB_PASSWORD=
JWT_SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxx
SMS_API_KEY=xxx
```

## License

© 2025 Serendib Hotels
