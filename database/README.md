# Serendib Hotels - Database

MySQL database schema for the Serendib Smart Hotel Management System.

**Last Updated:** December 2024

## Quick Setup

### Using XAMPP (Recommended)
1. Start XAMPP MySQL
2. Open phpMyAdmin: http://localhost/phpmyadmin
3. Create database: `serendib_hotels`
4. Import: `schema.sql`

### Using Command Line
```bash
mysql -u root -p < schema.sql
```

### Fix Passwords (Required!)
After importing, run password fix:
```bash
cd ../serendib-backend
source venv/Scripts/activate
python fix_passwords.py
```

## Database Tables

| Table | Description |
|-------|-------------|
| **Branch** | Hotel locations (Colombo, Mirissa, Kandy) |
| **User** | All users (guests, staff, admins) |
| **Room** | Room inventory |
| **Booking** | Reservations |
| **Payment** | Transactions |
| **ServiceRequest** | Guest requests |
| **Notification** | System alerts |
| **Staff** | Staff details |
| **LoyaltyProgram** | Points & tiers |
| **AuditLog** | Audit trail |
| **PropertyConfig** | Branch configs |
| **Promotion** | Discount codes |

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--|| Staff : "is_staff_profile"
    User ||--|| LoyaltyProgram : "has_loyalty"
    User ||--o{ Booking : "makes"
    User ||--o{ Payment : "pays"
    User ||--o{ ServiceRequest : "requests"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "triggers"
    
    Branch ||--o{ User : "employs"
    Branch ||--o{ Room : "contains"
    Branch ||--o{ Booking : "hosts"
    Branch ||--o{ Staff : "employs"
    Branch ||--o{ Promotion : "offers"
    Branch ||--o{ PropertyConfig : "configures"

    Room ||--o{ Booking : "reserved_in"
    
    Booking ||--o{ Payment : "has"
    Booking ||--o{ ServiceRequest : "includes"

    User {
        int user_id PK
        string email
        string full_name
        enum role
        int branch_id FK
    }

    Branch {
        int branch_id PK
        string name
        string location
        string city
    }

    Room {
        int room_id PK
        int branch_id FK
        string room_number
        enum room_type
        decimal price_per_night
    }

    Booking {
        int booking_id PK
        int user_id FK
        int room_id FK
        int branch_id FK
        date check_in_date
        date check_out_date
        decimal total_amount
    }

    Payment {
        int payment_id PK
        int booking_id FK
        int user_id FK
        decimal amount
        enum payment_status
    }

    Staff {
        int staff_id PK
        int user_id FK
        int branch_id FK
        string position
    }

    LoyaltyProgram {
        int loyalty_id PK
        int user_id FK
        int points
        enum tier
    }

    ServiceRequest {
        int request_id PK
        int booking_id FK
        int user_id FK
        enum service_type
    }

    Notification {
        int notification_id PK
        int user_id FK
        text message
    }

    Promotion {
        int promotion_id PK
        int branch_id FK
        string promo_code
    }

    PropertyConfig {
        int config_id PK
        int branch_id FK
        string config_key
    }

    AuditLog {
        int log_id PK
        int user_id FK
        string action
    }
```

</details>

## Test Credentials

After running `fix_passwords.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@serendibhotels.lk` | `admin123` |
| Staff | `staff1.colombo@serendibhotels.lk` | `staff123` |
| Guest | `john.doe@example.com` | `guest123` |

## Sample Data

- **3 Branches** - Colombo, Mirissa, Kandy
- **12 Users** - Admins, Staff, Guests
- **16 Rooms** - Various types
- **5 Bookings** - Sample reservations
- **4 Promotions** - Active discounts

## Database Features

### Views
- `vw_room_availability` - Real-time availability
- `vw_revenue_summary` - Revenue analytics
- `vw_booking_dashboard` - Booking overview

### Stored Procedures
- `sp_check_room_availability()` - Check dates
- `sp_calculate_loyalty_points()` - Update points

### Triggers
- Auto-create loyalty on registration
- Update room status on booking
- Audit logging

## Backup

```bash
# Backup
mysqldump -u root -p serendib_hotels > backup.sql

# Restore
mysql -u root -p serendib_hotels < backup.sql
```

## Notes

- Passwords: bcrypt hashed
- Tax rates: Colombo 15%, Mirissa 12%, Kandy 13%
- Loyalty: Bronze, Silver, Gold, Platinum

## License

© 2024 Serendib Hotels
