# Serendib Hotels - Database

MySQL database schema for the Serendib Smart Hotel Management System.

**Last Updated:** December 2025

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
| **LoyaltyHistory** | Points transactions |
| **AuditLog** | Audit trail |
| **PropertyConfig** | Branch configs |
| **Promotion** | Discount codes |
| **Shift** | Staff schedule assignments |

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--|| Staff : "is_staff_profile"
    User ||--|| LoyaltyProgram : "has_loyalty"
    LoyaltyProgram ||--o{ LoyaltyHistory : "has_history"
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
    Branch ||--o{ Shift : "schedules"

    User ||--o{ Shift : "assigned_to"

    Room ||--o{ Booking : "reserved_in"
    
    Booking ||--o{ Payment : "has"
    Booking ||--o{ ServiceRequest : "includes"

    User {
        int user_id PK
        string email UK
        string password_hash
        string full_name
        string phone
        enum role "guest|staff|admin"
        int branch_id FK
        bool is_verified
        string verification_token
        string reset_token
        datetime reset_token_expiry
        bool is_active
        datetime last_login
        datetime created_at
        datetime updated_at
    }

    Branch {
        int branch_id PK
        string name
        string location
        string city
        text address
        decimal tax_rate
        json contact_info
        datetime created_at
        datetime updated_at
    }

    Room {
        int room_id PK
        int branch_id FK
        string room_number
        enum room_type "standard|deluxe|suite|penthouse"
        int capacity
        decimal price_per_night
        enum status "available|occupied|maintenance|reserved"
        json amenities
        int floor
        text description
        json image_urls
        datetime created_at
        datetime updated_at
    }

    Booking {
        int booking_id PK
        int user_id FK
        int room_id FK
        int branch_id FK
        date check_in_date
        date check_out_date
        decimal total_amount
        enum status "pending|confirmed|checked_in|checked_out|cancelled"
        datetime booking_date
        text special_requests
        int number_of_guests
        text cancellation_reason
        datetime cancelled_at
        datetime checked_in_at
        datetime checked_out_at
        string promo_code
        decimal promo_discount
        int loyalty_points_redeemed
        decimal points_discount
        decimal loyalty_discount
    }

    Payment {
        int payment_id PK
        int booking_id FK
        int user_id FK
        decimal amount
        enum payment_method "credit_card|debit_card|paypal|bank_transfer|cash"
        enum payment_status "pending|completed|failed|refunded"
        string transaction_id
        datetime payment_date
        decimal refund_amount
        datetime refund_date
        json payment_details
    }

    Staff {
        int staff_id PK
        int user_id FK "UNIQUE"
        int branch_id FK
        string position
        enum department "front_desk|housekeeping|maintenance|food_beverage|management|security"
        date hire_date
        json schedule
        string employee_id UK
        decimal salary
        bool is_active
    }

    LoyaltyProgram {
        int loyalty_id PK
        int user_id FK "UNIQUE"
        int points
        enum tier "bronze|silver|gold|platinum"
        datetime join_date
        int lifetime_points
        datetime last_activity
    }

    LoyaltyHistory {
        int id PK
        int loyalty_id FK
        int amount
        enum transaction_type "earned|redeemed|adjusted|expired"
        string description
        int related_booking_id
        datetime created_at
    }

    ServiceRequest {
        int request_id PK
        int booking_id FK
        int user_id FK
        enum service_type "room_service|housekeeping|maintenance|concierge|laundry|spa|other"
        text description
        enum status "pending|in_progress|completed|cancelled"
        enum priority "low|medium|high|urgent"
        datetime requested_at
        datetime completed_at
        int assigned_staff_id FK
        text notes
    }

    Notification {
        int notification_id PK
        int user_id FK
        text message
        enum notification_type "booking|payment|service|promotion|system|loyalty|sms"
        bool is_read
        datetime sent_at
        int related_id
        string action_url
    }

    Promotion {
        int promotion_id PK
        int branch_id FK
        string title
        text description
        decimal discount_percentage
        decimal discount_amount
        string promo_code UK
        date start_date
        date end_date
        bool is_active
        text terms_conditions
        decimal min_booking_amount
        decimal max_discount
        int usage_limit
        int usage_count
        datetime created_at
    }

    PropertyConfig {
        int config_id PK
        int branch_id FK
        string config_key
        text config_value
        text description
        datetime created_at
        datetime updated_at
    }

    AuditLog {
        int log_id PK
        int user_id FK
        string action
        string table_name
        int record_id
        json old_values
        json new_values
        datetime timestamp
        string ip_address
        text user_agent
    }
```

## Test Credentials

After running `fix_passwords.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@serendibhotels.lk` | `admin123` |
| Staff | `staff@serendibhotels.lk` | `Test@1234` |
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

## Migration Notes

### SMS Notification Support (Dec 2025)
If you have an existing database, run this to add SMS support:
```sql
ALTER TABLE Notification 
MODIFY COLUMN notification_type ENUM('booking', 'payment', 'service', 'promotion', 'system', 'loyalty', 'sms') NOT NULL;
```
New installations using `schema.sql` already include this.

### Booking Schema Update (Dec 2025)
Added columns for direct promo code and loyalty tracking in bookings:
```sql
ALTER TABLE Booking ADD COLUMN promo_code VARCHAR(20);
ALTER TABLE Booking ADD COLUMN promo_discount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE Booking ADD COLUMN loyalty_points_redeemed INT DEFAULT 0;
ALTER TABLE Booking ADD COLUMN points_discount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE Booking ADD COLUMN loyalty_discount DECIMAL(10,2) DEFAULT 0.00;
```
New installations using `schema.sql` already include this.

### Staff Scheduling Support (Dec 2025)
Added Shift table for staff scheduling. Run this migration:
```bash
# In phpMyAdmin: Import database/add_shift_table.sql
```
New installations using `schema.sql` already include this.

> [!IMPORTANT]
> If you experience any database synchronization issues or errors after these updates, the cleanest fix is to **delete your local database** and re-import `schema.sql` (or let the backend recreate it).

## Notes

- Passwords: bcrypt hashed
- Tax rates: Colombo 15%, Mirissa 12%, Kandy 13%
- Loyalty: Bronze, Silver, Gold, Platinum

## License

© 2025 Serendib Hotels
