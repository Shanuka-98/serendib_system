-- =====================================================
-- SERENDIB SMART HOTEL MANAGEMENT SYSTEM
-- Database Schema for MySQL
-- Multi-Branch Hotel System (Colombo, Mirissa, Kandy)
-- =====================================================

-- Drop existing database if exists and create fresh
DROP DATABASE IF EXISTS serendib_hotels;
CREATE DATABASE serendib_hotels CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE serendib_hotels;

-- =====================================================
-- TABLE: Branch
-- =====================================================
CREATE TABLE Branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    contact_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: User
-- =====================================================
CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role ENUM('guest', 'staff', 'admin') DEFAULT 'guest',
    role_type ENUM('front_desk', 'housekeeping', 'food_beverage', 'maintenance', 'concierge', 'spa', 'manager') DEFAULT NULL,
    branch_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_role_type (role_type),
    INDEX idx_branch (branch_id),
    INDEX idx_verification (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Room
-- =====================================================
CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    room_type ENUM('standard', 'deluxe', 'suite', 'penthouse') NOT NULL,
    capacity INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
    amenities JSON,
    floor INT NOT NULL,
    description TEXT,
    image_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_branch (branch_id, room_number),
    INDEX idx_branch_type (branch_id, room_type),
    INDEX idx_status (status),
    INDEX idx_price (price_per_night)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Booking
-- =====================================================
CREATE TABLE Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    branch_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    special_requests TEXT,
    number_of_guests INT DEFAULT 1,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    checked_in_at TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    promo_code VARCHAR(20),
    promo_discount DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points_redeemed INT DEFAULT 0,
    points_discount DECIMAL(10,2) DEFAULT 0.00,
    loyalty_discount DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_room (room_id),
    INDEX idx_branch (branch_id),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Payment
-- =====================================================
CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_date TIMESTAMP NULL,
    payment_details JSON,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_user (user_id),
    INDEX idx_status (payment_status),
    INDEX idx_transaction (transaction_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: ServiceType (Dynamic Service Catalog)
-- =====================================================
CREATE TABLE ServiceType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,       -- Display name e.g., "Room Service", "Spa"
    code VARCHAR(50) NOT NULL UNIQUE,        -- Internal code e.g., "room_service", "spa"
    description TEXT,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    is_chargeable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: ServiceRequest
-- =====================================================
CREATE TABLE ServiceRequest (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- References ServiceType.code (Loose FK)
    description TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    assigned_staff_id INT,
    notes TEXT,
    -- Pricing fields
    price DECIMAL(10,2) DEFAULT 0.00,
    is_chargeable BOOLEAN DEFAULT FALSE,
    is_billed BOOLEAN DEFAULT FALSE,
    billed_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES User(user_id) ON DELETE SET NULL,
    INDEX idx_booking (booking_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_requested_at (requested_at),
    INDEX idx_is_billed (is_billed)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Notification
-- =====================================================
CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('booking', 'payment', 'service', 'promotion', 'system', 'loyalty', 'sms') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_id INT,
    action_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_sent_at (sent_at),
    INDEX idx_type (notification_type)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Staff
-- =====================================================
CREATE TABLE Staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    branch_id INT NOT NULL,
    position VARCHAR(100) NOT NULL,
    department ENUM('front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'management', 'security') NOT NULL,
    hire_date DATE NOT NULL,
    schedule JSON,
    employee_id VARCHAR(50) UNIQUE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_branch (branch_id),
    INDEX idx_department (department),
    INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: LoyaltyProgram
-- =====================================================
CREATE TABLE LoyaltyProgram (
    loyalty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    points INT DEFAULT 0,
    tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lifetime_points INT DEFAULT 0,
    last_activity TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_tier (tier),
    INDEX idx_points (points)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: LoyaltyHistory
-- =====================================================
CREATE TABLE LoyaltyHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loyalty_id INT NOT NULL,
    amount INT NOT NULL,
    transaction_type ENUM('earned', 'redeemed', 'adjusted', 'expired') NOT NULL,
    description VARCHAR(255),
    related_booking_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loyalty_id) REFERENCES LoyaltyProgram(loyalty_id) ON DELETE CASCADE,
    INDEX idx_loyalty_history_loyalty (loyalty_id),
    INDEX idx_loyalty_history_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: AuditLog
-- =====================================================
CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_table_record (table_name, record_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: PropertyConfig
-- =====================================================
CREATE TABLE PropertyConfig (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_key (branch_id, config_key),
    INDEX idx_branch_key (branch_id, config_key)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Promotion
-- =====================================================
CREATE TABLE Promotion (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    discount_amount DECIMAL(10,2),
    promo_code VARCHAR(50) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    terms_conditions TEXT,
    min_booking_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_branch (branch_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_promo_code (promo_code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: Shift
-- =====================================================
CREATE TABLE Shift (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    branch_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    role VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_shift_user (user_id),
    INDEX idx_shift_branch (branch_id),
    INDEX idx_shift_dates (start_time, end_time)
) ENGINE=InnoDB;

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert Branches
INSERT INTO Branch (name, location, city, address, tax_rate, contact_info) VALUES
('Serendib Colombo', 'Colombo Fort', 'Colombo', '123 Galle Road, Colombo 03, Sri Lanka', 15.00, 
 JSON_OBJECT('phone', '+94112345678', 'email', 'colombo@serendibhotels.lk', 'website', 'www.serendibhotels.lk/colombo')),
('Serendib Mirissa', 'Mirissa Beach', 'Mirissa', '456 Beach Road, Mirissa, Sri Lanka', 12.00,
 JSON_OBJECT('phone', '+94412345679', 'email', 'mirissa@serendibhotels.lk', 'website', 'www.serendibhotels.lk/mirissa')),
('Serendib Kandy', 'Kandy City Center', 'Kandy', '789 Peradeniya Road, Kandy, Sri Lanka', 13.00,
 JSON_OBJECT('phone', '+94812345680', 'email', 'kandy@serendibhotels.lk', 'website', 'www.serendibhotels.lk/kandy'));

-- Insert Admin Users (password: admin123 - hashed with bcrypt)
INSERT INTO User (email, password_hash, full_name, phone, role, branch_id, is_verified) VALUES
('admin@serendibhotels.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztJ.WQN3MxCS', 'System Administrator', '+94701234567', 'admin', 1, TRUE),
('manager.colombo@serendibhotels.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztJ.WQN3MxCS', 'Nimal Perera', '+94702234567', 'admin', 1, TRUE),
('manager.mirissa@serendibhotels.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztJ.WQN3MxCS', 'Saman Fernando', '+94703234567', 'admin', 2, TRUE),
('manager.kandy@serendibhotels.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztJ.WQN3MxCS', 'Kamala Silva', '+94704234567', 'admin', 3, TRUE);

-- Insert Staff Users with role_type (password: Test@123)
-- Each role_type represents a different department
INSERT INTO User (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) VALUES
-- Manager (oversees all departments)
('manager@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Ruwan Wickramasinghe', '+94700000001', 'staff', 'manager', 1, TRUE),
-- Front Desk Staff
('frontdesk@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Nadeesha Fernando', '+94700000002', 'staff', 'front_desk', 1, TRUE),
-- Housekeeping Staff
('housekeeping@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Kumari Jayasuriya', '+94700000003', 'staff', 'housekeeping', 1, TRUE),
-- Food & Beverage Staff
('fnb@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Tharanga Perera', '+94700000004', 'staff', 'food_beverage', 1, TRUE),
-- Maintenance Staff
('maintenance@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Chaminda Bandara', '+94700000005', 'staff', 'maintenance', 1, TRUE),
-- Concierge Staff
('concierge@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Dilini Rajapaksa', '+94700000006', 'staff', 'concierge', 1, TRUE),
-- Spa Staff
('spa@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Sachini Wijewardena', '+94700000007', 'staff', 'spa', 1, TRUE),
-- Legacy demo staff (kept for backward compatibility)
('staff@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Demo Staff User', '+94700000000', 'staff', 'front_desk', 1, TRUE),
-- Mirissa Branch Staff
('frontdesk.mirissa@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Kasun Bandara', '+94707234567', 'staff', 'front_desk', 2, TRUE),
('housekeeping.mirissa@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Malika Senanayake', '+94707234568', 'staff', 'housekeeping', 2, TRUE),
-- Kandy Branch Staff
('frontdesk.kandy@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Nimali Wijesinghe', '+94708234567', 'staff', 'front_desk', 3, TRUE),
('maintenance.kandy@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Suresh Gunawardena', '+94708234568', 'staff', 'maintenance', 3, TRUE);

-- Insert Guest Users (password: Test@123)
INSERT INTO User (email, password_hash, full_name, phone, role, is_verified) VALUES
('john.doe@example.com', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'John Doe', '+1234567890', 'guest', TRUE),
('jane.smith@example.com', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Jane Smith', '+1234567891', 'guest', TRUE),
('robert.johnson@example.com', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Robert Johnson', '+1234567892', 'guest', TRUE),
('emily.williams@example.com', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Emily Williams', '+1234567893', 'guest', TRUE);

-- Insert Staff Records
INSERT INTO Staff (user_id, branch_id, position, department, hire_date, employee_id, schedule) VALUES
(5, 1, 'Front Desk Manager', 'front_desk', '2023-01-15', 'EMP001', JSON_OBJECT('shift', 'morning', 'days', 'Mon-Fri')),
(6, 1, 'Housekeeping Supervisor', 'housekeeping', '2023-03-20', 'EMP002', JSON_OBJECT('shift', 'full_time', 'days', 'Mon-Sat')),
(7, 2, 'Front Desk Receptionist', 'front_desk', '2023-06-01', 'EMP003', JSON_OBJECT('shift', 'evening', 'days', 'Tue-Sat')),
(8, 3, 'Maintenance Technician', 'maintenance', '2023-02-10', 'EMP004', JSON_OBJECT('shift', 'on_call', 'days', 'Mon-Sun'));

-- Insert Rooms for Colombo Branch
INSERT INTO Room (branch_id, room_number, room_type, capacity, price_per_night, floor, amenities, description, image_urls) VALUES
(1, '101', 'standard', 2, 12000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar'), 'Comfortable standard room with city view', JSON_ARRAY('/images/rooms/colombo-standard.png')),
(1, '102', 'standard', 2, 12000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar'), 'Comfortable standard room with city view', JSON_ARRAY('/images/rooms/colombo-standard.png')),
(1, '201', 'deluxe', 2, 18000.00, 2, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Coffee Maker'), 'Spacious deluxe room with balcony', JSON_ARRAY('/images/rooms/colombo-deluxe.png')),
(1, '202', 'deluxe', 3, 20000.00, 2, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Coffee Maker'), 'Deluxe room with extra bed capacity', JSON_ARRAY('/images/rooms/colombo-deluxe.png')),
(1, '301', 'suite', 4, 35000.00, 3, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Living Area', 'Jacuzzi'), 'Luxurious suite with living area', JSON_ARRAY('/images/rooms/colombo-suite.png')),
(1, 'P01', 'penthouse', 6, 75000.00, 5, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Living Area', 'Jacuzzi', 'Kitchen', 'Ocean View'), 'Premium penthouse with stunning views', JSON_ARRAY('/images/rooms/colombo-penthouse.png'));

-- Insert Rooms for Mirissa Branch (Beach Resort)
INSERT INTO Room (branch_id, room_number, room_type, capacity, price_per_night, floor, amenities, description, image_urls) VALUES
(2, 'B101', 'standard', 2, 15000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Beach Access'), 'Beach view standard room', JSON_ARRAY('/images/rooms/mirissa-standard.png')),
(2, 'B102', 'standard', 2, 15000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Beach Access'), 'Beach view standard room', JSON_ARRAY('/images/rooms/mirissa-standard.png')),
(2, 'B201', 'deluxe', 2, 25000.00, 2, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Beach Access', 'Ocean View', 'Private Deck'), 'Oceanfront deluxe room with deck', JSON_ARRAY('/images/rooms/mirissa-deluxe.png')),
(2, 'B202', 'deluxe', 3, 27000.00, 2, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Beach Access', 'Ocean View', 'Private Deck'), 'Oceanfront deluxe room with extra bed', JSON_ARRAY('/images/rooms/mirissa-deluxe.png')),
(2, 'V01', 'suite', 4, 45000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Beach Access', 'Ocean View', 'Private Deck', 'Outdoor Shower', 'Living Area'), 'Beachfront villa suite', JSON_ARRAY('/images/rooms/mirissa-suite.png'));

-- Insert Rooms for Kandy Branch (Hill Country)
INSERT INTO Room (branch_id, room_number, room_type, capacity, price_per_night, floor, amenities, description, image_urls) VALUES
(3, 'H101', 'standard', 2, 10000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mountain View'), 'Hill view standard room', JSON_ARRAY('/images/rooms/kandy-standard.png')),
(3, 'H102', 'standard', 2, 10000.00, 1, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mountain View'), 'Hill view standard room', JSON_ARRAY('/images/rooms/kandy-standard.png')),
(3, 'H201', 'deluxe', 2, 16000.00, 2, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mountain View', 'Fireplace', 'Tea Garden View'), 'Deluxe room with tea estate views', JSON_ARRAY('/images/rooms/kandy-deluxe.png')),
(3, 'H301', 'suite', 4, 32000.00, 3, JSON_ARRAY('WiFi', 'TV', 'Air Conditioning', 'Mountain View', 'Fireplace', 'Tea Garden View', 'Living Area', 'Bathtub'), 'Panoramic suite with mountain views', JSON_ARRAY('/images/rooms/kandy-suite.png'));

-- Insert Sample Bookings
INSERT INTO Booking (user_id, room_id, branch_id, check_in_date, check_out_date, total_amount, status, number_of_guests, special_requests) VALUES
(9, 1, 1, '2024-12-01', '2024-12-05', 55200.00, 'confirmed', 2, 'Late check-in requested'),
(10, 3, 1, '2024-12-10', '2024-12-15', 103500.00, 'confirmed', 2, 'Anniversary celebration - room decoration requested'),
(11, 7, 2, '2024-12-20', '2024-12-27', 120750.00, 'pending', 2, 'Honeymoon package'),
(12, 10, 2, '2024-11-15', '2024-11-20', 143750.00, 'checked_out', 3, 'Family vacation'),
(9, 13, 3, '2024-12-15', '2024-12-18', 55200.00, 'confirmed', 2, NULL);

-- Insert Payments
INSERT INTO Payment (booking_id, user_id, amount, payment_method, payment_status, transaction_id) VALUES
(1, 9, 55200.00, 'credit_card', 'completed', 'TXN001234567890'),
(2, 10, 103500.00, 'credit_card', 'completed', 'TXN001234567891'),
(3, 11, 120750.00, 'credit_card', 'pending', 'TXN001234567892'),
(4, 12, 143750.00, 'credit_card', 'completed', 'TXN001234567893'),
(5, 9, 55200.00, 'paypal', 'completed', 'TXN001234567894');

-- Insert Service Requests
INSERT INTO ServiceRequest (booking_id, user_id, service_type, description, status, priority, assigned_staff_id) VALUES
(1, 9, 'room_service', 'Breakfast delivery at 8:00 AM', 'completed', 'medium', 5),
(2, 10, 'housekeeping', 'Extra towels and pillows needed', 'completed', 'low', 6),
(3, 11, 'concierge', 'Book sunset cruise and dinner reservation', 'in_progress', 'medium', 7),
(4, 12, 'laundry', 'Express laundry service needed', 'completed', 'high', 6),
(5, 9, 'room_service', 'Dinner delivery to room', 'pending', 'medium', NULL);

-- Insert Loyalty Programs
INSERT INTO LoyaltyProgram (user_id, points, tier, lifetime_points) VALUES
(9, 1250, 'silver', 1250),
(10, 2800, 'gold', 2800),
(11, 750, 'bronze', 750),
(12, 3500, 'gold', 3500);

-- Insert Notifications
INSERT INTO Notification (user_id, message, notification_type, related_id) VALUES
(9, 'Your booking for Colombo has been confirmed! Booking ID: #1', 'booking', 1),
(10, 'Payment of Rs. 103,500.00 received successfully', 'payment', 2),
(11, 'Your honeymoon package booking is pending payment confirmation', 'booking', 3),
(9, 'Your service request has been completed', 'service', 1),
(12, 'Thank you for your stay! You earned 500 loyalty points', 'loyalty', 4);

-- Insert Promotions
INSERT INTO Promotion (branch_id, title, description, discount_percentage, promo_code, start_date, end_date, is_active, min_booking_amount, max_discount, usage_limit) VALUES
(NULL, 'Early Bird Special', 'Book 30 days in advance and save 20%', 20.00, 'EARLY20', '2024-11-01', '2025-03-31', TRUE, 10000.00, 15000.00, 100),
(1, 'Colombo City Break', 'Special discount for Colombo weekday stays', 15.00, 'COLOMBO15', '2024-12-01', '2025-01-31', TRUE, 15000.00, 10000.00, 50),
(2, 'Beach Paradise Deal', 'Mirissa beach resort special offer', 25.00, 'BEACH25', '2024-11-15', '2024-12-20', TRUE, 20000.00, 20000.00, 30),
(3, 'Hill Country Escape', 'Kandy hill station winter special', 18.00, 'HILLS18', '2024-12-01', '2025-02-28', TRUE, 12000.00, 12000.00, 75);

-- Insert Property Configurations
INSERT INTO PropertyConfig (branch_id, config_key, config_value, description) VALUES
(1, 'check_in_time', '14:00', 'Standard check-in time'),
(1, 'check_out_time', '12:00', 'Standard check-out time'),
(1, 'cancellation_policy_hours', '24', 'Hours before check-in for free cancellation'),
(1, 'service_charge_rate', '0.10', 'Service charge rate (decimal)'),
(2, 'check_in_time', '15:00', 'Beach resort check-in time'),
(2, 'check_out_time', '11:00', 'Beach resort check-out time'),
(2, 'service_charge_rate', '0.10', 'Service charge rate (decimal)'),
(3, 'check_in_time', '14:00', 'Hill country check-in time'),
(3, 'check_out_time', '12:00', 'Hill country check-out time'),
(3, 'service_charge_rate', '0.10', 'Service charge rate (decimal)'),
(NULL, 'loyalty_points_rate', '10', 'Points earned per 1000 Rs spent'),
(NULL, 'min_booking_advance_days', '1', 'Minimum days in advance for booking');

-- Insert Audit Logs
INSERT INTO AuditLog (user_id, action, table_name, record_id, timestamp, ip_address) VALUES
(1, 'CREATE', 'Booking', 1, NOW(), '192.168.1.100'),
(2, 'UPDATE', 'Room', 1, NOW(), '192.168.1.101'),
(9, 'CREATE', 'ServiceRequest', 1, NOW(), '203.94.23.45');

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View: Room Availability Summary
CREATE VIEW vw_room_availability AS
SELECT 
    b.name AS branch_name,
    r.room_type,
    COUNT(*) AS total_rooms,
    SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) AS available_rooms,
    SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_rooms,
    SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_rooms
FROM Room r
JOIN Branch b ON r.branch_id = b.branch_id
GROUP BY b.name, r.room_type;

-- View: Revenue Summary
CREATE VIEW vw_revenue_summary AS
SELECT 
    b.name AS branch_name,
    DATE_FORMAT(bk.booking_date, '%Y-%m') AS month,
    COUNT(bk.booking_id) AS total_bookings,
    SUM(bk.total_amount) AS total_revenue,
    AVG(bk.total_amount) AS avg_booking_value
FROM Booking bk
JOIN Branch b ON bk.branch_id = b.branch_id
WHERE bk.status != 'cancelled'
GROUP BY b.name, DATE_FORMAT(bk.booking_date, '%Y-%m');

-- View: Booking Status Dashboard
CREATE VIEW vw_booking_dashboard AS
SELECT 
    b.name AS branch_name,
    COUNT(CASE WHEN bk.status = 'pending' THEN 1 END) AS pending_bookings,
    COUNT(CASE WHEN bk.status = 'confirmed' THEN 1 END) AS confirmed_bookings,
    COUNT(CASE WHEN bk.status = 'checked_in' THEN 1 END) AS checked_in,
    COUNT(CASE WHEN bk.status = 'checked_out' THEN 1 END) AS checked_out,
    COUNT(CASE WHEN bk.status = 'cancelled' THEN 1 END) AS cancelled_bookings
FROM Booking bk
JOIN Branch b ON bk.branch_id = b.branch_id
GROUP BY b.name;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure: Check Room Availability
CREATE PROCEDURE sp_check_room_availability(
    IN p_branch_id INT,
    IN p_check_in DATE,
    IN p_check_out DATE,
    IN p_room_type VARCHAR(50)
)
BEGIN
    SELECT r.* 
    FROM Room r
    WHERE r.branch_id = p_branch_id
    AND (p_room_type IS NULL OR r.room_type = p_room_type)
    AND r.status = 'available'
    AND r.room_id NOT IN (
        SELECT room_id 
        FROM Booking 
        WHERE status IN ('confirmed', 'checked_in')
        AND (
            (check_in_date <= p_check_in AND check_out_date > p_check_in)
            OR (check_in_date < p_check_out AND check_out_date >= p_check_out)
            OR (check_in_date >= p_check_in AND check_out_date <= p_check_out)
        )
    );
END //

-- Procedure: Calculate Loyalty Points
CREATE PROCEDURE sp_calculate_loyalty_points(
    IN p_user_id INT,
    IN p_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_points INT;
    DECLARE v_current_points INT;
    DECLARE v_new_tier VARCHAR(20);
    
    SET v_points = FLOOR(p_amount / 1000) * 10;
    
    SELECT points INTO v_current_points 
    FROM LoyaltyProgram 
    WHERE user_id = p_user_id;
    
    SET v_current_points = v_current_points + v_points;
    
    -- Determine tier
    IF v_current_points >= 5000 THEN
        SET v_new_tier = 'platinum';
    ELSEIF v_current_points >= 3000 THEN
        SET v_new_tier = 'gold';
    ELSEIF v_current_points >= 1000 THEN
        SET v_new_tier = 'silver';
    ELSE
        SET v_new_tier = 'bronze';
    END IF;
    
    UPDATE LoyaltyProgram 
    SET points = v_current_points,
        lifetime_points = lifetime_points + v_points,
        tier = v_new_tier,
        last_activity = NOW()
    WHERE user_id = p_user_id;
    
    SELECT v_points AS points_earned, v_new_tier AS new_tier;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger: Auto-create loyalty program on user registration
CREATE TRIGGER tr_user_loyalty_program
AFTER INSERT ON User
FOR EACH ROW
BEGIN
    IF NEW.role = 'guest' THEN
        INSERT INTO LoyaltyProgram (user_id, points, tier, join_date)
        VALUES (NEW.user_id, 0, 'bronze', NOW());
    END IF;
END //

-- Trigger: Update room status on booking
CREATE TRIGGER tr_booking_room_status
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE Room SET status = 'reserved' WHERE room_id = NEW.room_id;
    END IF;
END //

-- Trigger: Audit log for booking changes
CREATE TRIGGER tr_audit_booking_update
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (user_id, action, table_name, record_id, timestamp)
    VALUES (NEW.user_id, 'UPDATE', 'Booking', NEW.booking_id, NOW());
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_booking_user_status ON Booking(user_id, status);
CREATE INDEX idx_booking_branch_dates ON Booking(branch_id, check_in_date, check_out_date);
CREATE INDEX idx_room_branch_status ON Room(branch_id, status);
CREATE INDEX idx_payment_booking_status ON Payment(booking_id, payment_status);

-- Full-text search indexes
-- ALTER TABLE Room ADD FULLTEXT idx_room_description (description);
-- ALTER TABLE Promotion ADD FULLTEXT idx_promotion_text (title, description);

-- =====================================================
-- GRANT PERMISSIONS (Adjust as needed)
-- =====================================================
-- CREATE USER 'serendib_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON serendib_hotels.* TO 'serendib_app'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- TABLE: Facility
-- Pool, Gym, Spa, Event Halls, Meeting Rooms
-- =====================================================
CREATE TABLE IF NOT EXISTS Facility (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    facility_type ENUM('pool', 'gym', 'spa', 'event_hall', 'meeting_room') NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    price_per_slot DECIMAL(10,2) DEFAULT 0.00,
    slot_duration_minutes INT DEFAULT 60,
    requires_booking BOOLEAN DEFAULT TRUE,
    is_guest_only BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    amenities JSON,
    images JSON,
    operating_hours JSON,
    rules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_facility_branch (branch_id),
    INDEX idx_facility_type (facility_type),
    INDEX idx_facility_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: FacilitySlot
-- Time slots for each facility
-- =====================================================
CREATE TABLE IF NOT EXISTS FacilitySlot (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday','all') DEFAULT 'all',
    max_capacity INT,
    price_override DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE CASCADE,
    INDEX idx_slot_facility (facility_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: FacilityAddOn
-- Add-on services (catering, decoration, equipment)
-- =====================================================
CREATE TABLE IF NOT EXISTS FacilityAddOn (
    addon_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT,
    branch_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    price_type ENUM('flat', 'per_person', 'per_hour') DEFAULT 'flat',
    category ENUM('catering', 'decoration', 'equipment', 'service', 'other') DEFAULT 'other',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_addon_facility (facility_id),
    INDEX idx_addon_category (category)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: FacilityBooking
-- Guest reservations for facilities
-- =====================================================
CREATE TABLE IF NOT EXISTS FacilityBooking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT NOT NULL,
    slot_id INT,
    user_id INT,
    room_booking_id INT,
    booking_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    number_of_guests INT DEFAULT 1,
    status ENUM('inquiry', 'quoted', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    event_type VARCHAR(100),
    event_name VARCHAR(200),
    contact_name VARCHAR(150),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    organization VARCHAR(200),
    base_price DECIMAL(10,2) DEFAULT 0.00,
    selected_addons JSON,
    addons_total DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_at TIMESTAMP NULL,
    payment_type ENUM('free', 'pay_now', 'add_to_bill', 'deposit_required') DEFAULT 'free',
    payment_status ENUM('not_required', 'pending', 'partial', 'paid', 'refunded') DEFAULT 'not_required',
    stripe_payment_id VARCHAR(255),
    special_requests TEXT,
    admin_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    created_by INT,
    quote_sent_at TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES FacilitySlot(slot_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
    FOREIGN KEY (room_booking_id) REFERENCES Booking(booking_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE SET NULL,
    INDEX idx_fb_facility (facility_id),
    INDEX idx_fb_user (user_id),
    INDEX idx_fb_room_booking (room_booking_id),
    INDEX idx_fb_date (booking_date),
    INDEX idx_fb_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- INSERT SAMPLE FACILITIES
-- =====================================================

-- Colombo Branch Facilities
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, operating_hours) VALUES
(1, 'Infinity Pool', 'pool', 'Rooftop infinity pool with stunning city views.', 30, 0.00, 60, TRUE, TRUE, 
 JSON_ARRAY('Towels', 'Poolside Service', 'Sun Loungers', 'Changing Rooms'),
 JSON_OBJECT('open', '06:00', 'close', '20:00')),
(1, 'Fitness Center', 'gym', 'State-of-the-art fitness center with cardio and weight training equipment.', 20, 0.00, 60, FALSE, TRUE,
 JSON_ARRAY('Cardio Equipment', 'Free Weights', 'Yoga Mats', 'Locker Room'),
 JSON_OBJECT('open', '05:00', 'close', '22:00')),
(1, 'Serenity Spa', 'spa', 'Luxury spa offering traditional Ayurvedic treatments.', 8, 5000.00, 60, TRUE, FALSE,
 JSON_ARRAY('Ayurvedic Treatments', 'Massage Therapy', 'Aromatherapy', 'Steam Room'),
 JSON_OBJECT('open', '09:00', 'close', '21:00')),
(1, 'Grand Ballroom', 'event_hall', 'Elegant ballroom for weddings, galas, and corporate events.', 300, 150000.00, 240, TRUE, FALSE,
 JSON_ARRAY('Stage', 'Dance Floor', 'Basic AV', 'Bridal Suite Access'),
 JSON_OBJECT('open', '08:00', 'close', '23:00')),
(1, 'Boardroom One', 'meeting_room', 'Executive boardroom with video conferencing capabilities.', 20, 15000.00, 60, TRUE, FALSE,
 JSON_ARRAY('Projector', 'Video Conferencing', 'Whiteboard', 'Coffee Service'),
 JSON_OBJECT('open', '08:00', 'close', '20:00'));

-- Mirissa Branch Facilities
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, operating_hours) VALUES
(2, 'Beach Pool', 'pool', 'Oceanfront pool with direct beach access.', 40, 0.00, 60, TRUE, TRUE,
 JSON_ARRAY('Swim-up Bar', 'Beach Access', 'Towels', 'Cabanas'),
 JSON_OBJECT('open', '06:00', 'close', '19:00')),
(2, 'Ayurveda Retreat', 'spa', 'Traditional Sri Lankan Ayurvedic spa with herbal treatments.', 6, 7500.00, 90, TRUE, FALSE,
 JSON_ARRAY('Ayurvedic Consultation', 'Herbal Treatments', 'Oil Massage', 'Steam Bath'),
 JSON_OBJECT('open', '08:00', 'close', '20:00')),
(2, 'Sunset Pavilion', 'event_hall', 'Beachfront pavilion for intimate weddings and events.', 150, 200000.00, 300, TRUE, FALSE,
 JSON_ARRAY('Beach Setting', 'Sunset Views', 'Fairy Lights', 'Sound System'),
 JSON_OBJECT('open', '10:00', 'close', '23:00'));

-- Kandy Branch Facilities
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, operating_hours) VALUES
(3, 'Mountain View Pool', 'pool', 'Heated pool overlooking the Kandy hills.', 25, 0.00, 60, TRUE, TRUE,
 JSON_ARRAY('Heated Pool', 'Mountain View', 'Towels', 'Pool Bar'),
 JSON_OBJECT('open', '07:00', 'close', '19:00')),
(3, 'Tea Garden Spa', 'spa', 'Spa inspired by Ceylon tea traditions.', 4, 4500.00, 60, TRUE, FALSE,
 JSON_ARRAY('Tea Treatments', 'Herbal Wraps', 'Hot Stone Massage'),
 JSON_OBJECT('open', '09:00', 'close', '19:00')),
(3, 'Colonial Hall', 'event_hall', 'Historic colonial-era hall with period architecture.', 200, 120000.00, 240, TRUE, FALSE,
 JSON_ARRAY('Colonial Architecture', 'Garden Access', 'Grand Piano'),
 JSON_OBJECT('open', '09:00', 'close', '22:00'));

-- Pool Slots (All Branches)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Infinity Pool (facility_id = 1)
(1, '06:00', '07:00', 'all', 30), (1, '07:00', '08:00', 'all', 30), (1, '08:00', '09:00', 'all', 30),
(1, '09:00', '10:00', 'all', 30), (1, '10:00', '11:00', 'all', 30), (1, '11:00', '12:00', 'all', 30),
(1, '12:00', '13:00', 'all', 30), (1, '13:00', '14:00', 'all', 30), (1, '14:00', '15:00', 'all', 30),
(1, '15:00', '16:00', 'all', 30), (1, '16:00', '17:00', 'all', 30), (1, '17:00', '18:00', 'all', 30),
(1, '18:00', '19:00', 'all', 30), (1, '19:00', '20:00', 'all', 30),
-- Mirissa Beach Pool (facility_id = 6)
(6, '06:00', '07:00', 'all', 40), (6, '07:00', '08:00', 'all', 40), (6, '08:00', '09:00', 'all', 40),
(6, '09:00', '10:00', 'all', 40), (6, '10:00', '11:00', 'all', 40), (6, '11:00', '12:00', 'all', 40),
(6, '12:00', '13:00', 'all', 40), (6, '13:00', '14:00', 'all', 40), (6, '14:00', '15:00', 'all', 40),
(6, '15:00', '16:00', 'all', 40), (6, '16:00', '17:00', 'all', 40), (6, '17:00', '18:00', 'all', 40),
(6, '18:00', '19:00', 'all', 40),
-- Kandy Mountain View Pool (facility_id = 9)
(9, '07:00', '08:00', 'all', 25), (9, '08:00', '09:00', 'all', 25), (9, '09:00', '10:00', 'all', 25),
(9, '10:00', '11:00', 'all', 25), (9, '11:00', '12:00', 'all', 25), (9, '12:00', '13:00', 'all', 25),
(9, '13:00', '14:00', 'all', 25), (9, '14:00', '15:00', 'all', 25), (9, '15:00', '16:00', 'all', 25),
(9, '16:00', '17:00', 'all', 25), (9, '17:00', '18:00', 'all', 25), (9, '18:00', '19:00', 'all', 25);

-- Spa Slots (All Branches)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Serenity Spa (facility_id = 3)
(3, '09:00', '10:00', 'all', 4), (3, '10:00', '11:00', 'all', 4), (3, '11:00', '12:00', 'all', 4),
(3, '14:00', '15:00', 'all', 4), (3, '15:00', '16:00', 'all', 4), (3, '16:00', '17:00', 'all', 4),
(3, '17:00', '18:00', 'all', 4), (3, '18:00', '19:00', 'all', 4), (3, '19:00', '20:00', 'all', 4),
-- Mirissa Ayurveda Retreat (facility_id = 7)
(7, '08:00', '09:30', 'all', 3), (7, '09:30', '11:00', 'all', 3), (7, '11:00', '12:30', 'all', 3),
(7, '13:00', '14:30', 'all', 3), (7, '14:30', '16:00', 'all', 3), (7, '16:00', '17:30', 'all', 3),
(7, '17:30', '19:00', 'all', 3), (7, '19:00', '20:00', 'all', 3),
-- Kandy Tea Garden Spa (facility_id = 10)
(10, '09:00', '10:00', 'all', 2), (10, '10:00', '11:00', 'all', 2), (10, '11:00', '12:00', 'all', 2),
(10, '13:00', '14:00', 'all', 2), (10, '14:00', '15:00', 'all', 2), (10, '15:00', '16:00', 'all', 2),
(10, '16:00', '17:00', 'all', 2), (10, '17:00', '18:00', 'all', 2), (10, '18:00', '19:00', 'all', 2);

-- Event Hall Slots (All Branches)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Grand Ballroom (facility_id = 4)
(4, '08:00', '12:00', 'all', 300), (4, '13:00', '17:00', 'all', 300), (4, '18:00', '23:00', 'all', 300),
-- Mirissa Sunset Pavilion (facility_id = 8)
(8, '10:00', '14:00', 'all', 150), (8, '15:00', '18:00', 'all', 150), (8, '18:00', '23:00', 'all', 150),
-- Kandy Colonial Hall (facility_id = 11)
(11, '09:00', '13:00', 'all', 200), (11, '14:00', '18:00', 'all', 200), (11, '18:00', '22:00', 'all', 200);

-- Meeting Room Slots
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Boardroom One (facility_id = 5)
(5, '08:00', '09:00', 'all', 20), (5, '09:00', '10:00', 'all', 20), (5, '10:00', '11:00', 'all', 20),
(5, '11:00', '12:00', 'all', 20), (5, '13:00', '14:00', 'all', 20), (5, '14:00', '15:00', 'all', 20),
(5, '15:00', '16:00', 'all', 20), (5, '16:00', '17:00', 'all', 20), (5, '17:00', '18:00', 'all', 20);

-- Sample Add-ons
INSERT INTO FacilityAddOn (branch_id, name, description, price, price_type, category) VALUES
(1, 'Standard Lunch Buffet', 'Sri Lankan and international cuisine', 2500.00, 'per_person', 'catering'),
(1, 'Premium Dinner Buffet', 'Gourmet buffet with live cooking', 4500.00, 'per_person', 'catering'),
(1, 'Standard Decoration', 'Floral arrangements and table settings', 45000.00, 'flat', 'decoration'),
(1, 'Premium Sound System', 'DJ-grade sound system with operator', 35000.00, 'flat', 'equipment'),
(1, 'Professional Photography', '8-hour coverage', 85000.00, 'flat', 'service');

-- =====================================================
-- END OF SCHEMA
-- =====================================================

SELECT 'Database schema created successfully!' AS message;
SELECT CONCAT('Total Branches: ', COUNT(*)) AS info FROM Branch;
SELECT CONCAT('Total Users: ', COUNT(*)) AS info FROM User;
SELECT CONCAT('Total Rooms: ', COUNT(*)) AS info FROM Room;
SELECT CONCAT('Total Bookings: ', COUNT(*)) AS info FROM Booking;
SELECT CONCAT('Total Facilities: ', COUNT(*)) AS info FROM Facility;

