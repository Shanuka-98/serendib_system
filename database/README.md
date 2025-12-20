# Serendib Hotels Database Setup

## Database Schema Overview

This database supports a multi-branch hotel management system with three branches:
- **Colombo** (City Business Hotel)
- **Mirissa** (Beach Resort)
- **Kandy** (Hill Country Retreat)

## Quick Setup

### 1. Create Database

```bash
mysql -u root -p < schema.sql
```

### 2. Verify Installation

```bash
mysql -u root -p serendib_hotels
```

Then run:
```sql
SHOW TABLES;
SELECT * FROM Branch;
```

## Database Tables

| Table | Description |
|-------|-------------|
| **Branch** | Hotel branch locations and configurations |
| **User** | All system users (guests, staff, admins) |
| **Room** | Room inventory across all branches |
| **Booking** | Guest reservations and bookings |
| **Payment** | Payment transactions and refunds |
| **ServiceRequest** | Guest service requests (room service, housekeeping, etc.) |
| **Notification** | System notifications for users |
| **Staff** | Staff member details and schedules |
| **LoyaltyProgram** | Guest loyalty points and tiers |
| **AuditLog** | System audit trail |
| **PropertyConfig** | Branch-specific configurations |
| **Promotion** | Promotional campaigns and discount codes |

## Sample Credentials

### Admin Users
- **Email**: `admin@serendibhotels.lk`  
  **Password**: `admin123`  
  **Role**: System Administrator

- **Email**: `manager.colombo@serendibhotels.lk`  
  **Password**: `admin123`  
  **Role**: Branch Manager (Colombo)

### Staff Users
- **Email**: `staff1.colombo@serendibhotels.lk`  
  **Password**: `staff123`  
  **Role**: Front Desk Manager

### Guest Users
- **Email**: `john.doe@example.com`  
  **Password**: `guest123`  
  **Role**: Guest

## Key Features

### Views
- `vw_room_availability` - Real-time room availability by branch
- `vw_revenue_summary` - Monthly revenue analytics
- `vw_booking_dashboard` - Booking status overview

### Stored Procedures
- `sp_check_room_availability()` - Check available rooms for date range
- `sp_calculate_loyalty_points()` - Auto-calculate and update loyalty points

### Triggers
- Auto-create loyalty program on user registration
- Update room status on booking confirmation
- Audit logging for all booking changes

## Database Statistics

After setup, you should have:
- **3 Branches** (Colombo, Mirissa, Kandy)
- **12 Users** (1 admin, 3 branch managers, 4 staff, 4 guests)
- **16 Rooms** across all branches
- **5 Sample Bookings**
- **5 Payments**
- **5 Service Requests**
- **4 Active Promotions**

## Indexes

Optimized indexes for:
- User authentication (email, role)
- Room availability queries (branch, status, type)
- Booking date range searches
- Payment transaction lookups
- Notification filtering

## Backup & Restore

### Backup
```bash
mysqldump -u root -p serendib_hotels > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p serendib_hotels < backup_20241115.sql
```

## Notes

- All passwords are hashed using bcrypt
- JWT tokens will be managed by the Flask backend
- Tax rates vary by branch (Colombo: 15%, Mirissa: 12%, Kandy: 13%)
- Loyalty tiers: Bronze (0-999), Silver (1000-2999), Gold (3000-4999), Platinum (5000+)

