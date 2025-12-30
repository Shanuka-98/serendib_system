-- =====================================================
-- SERENDIB SMART HOTEL MANAGEMENT SYSTEM
-- Facility Booking System Tables
-- Pool, Gym, Spa, Event Halls, Meeting Rooms
-- =====================================================

USE serendib_hotels;

-- =====================================================
-- TABLE: Facility
-- Stores all bookable facilities (pool, gym, spa, halls)
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
-- Time slots configuration for each facility
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
    INDEX idx_slot_facility (facility_id),
    INDEX idx_slot_day (day_of_week)
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: FacilityAddOn
-- Add-on services for event halls (catering, AV, etc.)
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
    
    -- Booking details
    booking_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    number_of_guests INT DEFAULT 1,
    
    -- Status workflow
    status ENUM('inquiry', 'quoted', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    
    -- Event-specific fields (for event halls)
    event_type VARCHAR(100),
    event_name VARCHAR(200),
    contact_name VARCHAR(150),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    organization VARCHAR(200),
    
    -- Pricing
    base_price DECIMAL(10,2) DEFAULT 0.00,
    selected_addons JSON,
    addons_total DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Payment
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_paid_at TIMESTAMP NULL,
    payment_type ENUM('free', 'pay_now', 'add_to_bill', 'deposit_required') DEFAULT 'free',
    payment_status ENUM('not_required', 'pending', 'partial', 'paid', 'refunded') DEFAULT 'not_required',
    stripe_payment_id VARCHAR(255),
    
    -- Notes
    special_requests TEXT,
    admin_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    
    -- Metadata
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
    INDEX idx_fb_status (status),
    INDEX idx_fb_payment (payment_status)
) ENGINE=InnoDB;

-- =====================================================
-- INSERT SAMPLE FACILITIES
-- =====================================================

-- Colombo Branch Facilities
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, images, operating_hours) VALUES
(1, 'Infinity Pool', 'pool', 'Rooftop infinity pool with stunning city views. Includes poolside service and complimentary towels.', 30, 0.00, 60, TRUE, TRUE, 
 JSON_ARRAY('Towels', 'Poolside Service', 'Sun Loungers', 'Changing Rooms', 'Showers'),
 JSON_ARRAY('/images/facilities/infinity_pool.png'),
 JSON_OBJECT('open', '06:00', 'close', '20:00')),
(1, 'Fitness Center', 'gym', 'State-of-the-art fitness center with cardio and weight training equipment. Personal trainers available.', 20, 0.00, 60, FALSE, TRUE,
 JSON_ARRAY('Cardio Equipment', 'Free Weights', 'Yoga Mats', 'Locker Room', 'Water Station'),
 JSON_ARRAY('/images/facilities/fitness_center.png'),
 JSON_OBJECT('open', '05:00', 'close', '22:00')),
(1, 'Serenity Spa', 'spa', 'Luxury spa offering traditional Ayurvedic treatments and modern therapies. Advance booking required.', 8, 5000.00, 60, TRUE, FALSE,
 JSON_ARRAY('Ayurvedic Treatments', 'Massage Therapy', 'Aromatherapy', 'Steam Room', 'Relaxation Lounge'),
 JSON_ARRAY('/images/facilities/spa_wellness.png'),
 JSON_OBJECT('open', '09:00', 'close', '21:00')),
(1, 'Grand Ballroom', 'event_hall', 'Elegant ballroom perfect for weddings, galas, and corporate events. Includes basic AV setup.', 300, 150000.00, 240, TRUE, FALSE,
 JSON_ARRAY('Stage', 'Dance Floor', 'Basic AV', 'Bridal Suite Access', 'Valet Parking'),
 JSON_ARRAY('/images/facilities/event_hall.png'),
 JSON_OBJECT('open', '08:00', 'close', '23:00')),
(1, 'Boardroom One', 'meeting_room', 'Executive boardroom with video conferencing capabilities. Ideal for corporate meetings.', 20, 15000.00, 60, TRUE, FALSE,
 JSON_ARRAY('Projector', 'Video Conferencing', 'Whiteboard', 'Coffee Service', 'WiFi'),
 JSON_ARRAY('/images/facilities/meeting_room.png'),
 JSON_OBJECT('open', '08:00', 'close', '20:00'));

-- Mirissa Branch Facilities (Beach Resort)
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, images, operating_hours) VALUES
(2, 'Beach Pool', 'pool', 'Oceanfront pool with direct beach access. Swim-up bar available.', 40, 0.00, 60, TRUE, TRUE,
 JSON_ARRAY('Swim-up Bar', 'Beach Access', 'Towels', 'Sun Loungers', 'Cabanas'),
 JSON_ARRAY('/images/facilities/beach_pool.png'),
 JSON_OBJECT('open', '06:00', 'close', '19:00')),
(2, 'Beach Gym', 'gym', 'Open-air fitness area with ocean views. Yoga sessions available.', 15, 0.00, 60, FALSE, TRUE,
 JSON_ARRAY('Cardio Equipment', 'Free Weights', 'Yoga Deck', 'Ocean View'),
 JSON_ARRAY('/images/facilities/fitness_center.png'),
 JSON_OBJECT('open', '06:00', 'close', '20:00')),
(2, 'Ayurveda Retreat', 'spa', 'Traditional Sri Lankan Ayurvedic spa with herbal treatments.', 6, 7500.00, 90, TRUE, FALSE,
 JSON_ARRAY('Ayurvedic Consultation', 'Herbal Treatments', 'Oil Massage', 'Steam Bath', 'Meditation'),
 JSON_ARRAY('/images/facilities/spa_wellness.png'),
 JSON_OBJECT('open', '08:00', 'close', '20:00')),
(2, 'Sunset Pavilion', 'event_hall', 'Beachfront pavilion for intimate weddings and events. Stunning sunset views.', 150, 200000.00, 300, TRUE, FALSE,
 JSON_ARRAY('Beach Setting', 'Sunset Views', 'Fairy Lights', 'Bridal Tent', 'Sound System'),
 JSON_ARRAY('/images/facilities/event_hall.png'),
 JSON_OBJECT('open', '10:00', 'close', '23:00'));

-- Kandy Branch Facilities (Hill Country)
INSERT INTO Facility (branch_id, name, facility_type, description, capacity, price_per_slot, slot_duration_minutes, requires_booking, is_guest_only, amenities, images, operating_hours) VALUES
(3, 'Mountain View Pool', 'pool', 'Heated pool overlooking the Kandy hills and tea estates.', 25, 0.00, 60, TRUE, TRUE,
 JSON_ARRAY('Heated Pool', 'Mountain View', 'Towels', 'Pool Bar'),
 JSON_ARRAY('/images/facilities/infinity_pool.png'),
 JSON_OBJECT('open', '07:00', 'close', '19:00')),
(3, 'Highland Gym', 'gym', 'Modern fitness center with panoramic mountain views.', 15, 0.00, 60, FALSE, TRUE,
 JSON_ARRAY('Cardio Equipment', 'Weights', 'Sauna', 'Mountain View'),
 JSON_ARRAY('/images/facilities/fitness_center.png'),
 JSON_OBJECT('open', '06:00', 'close', '21:00')),
(3, 'Tea Garden Spa', 'spa', 'Spa inspired by Ceylon tea traditions. Signature tea-infused treatments.', 4, 4500.00, 60, TRUE, FALSE,
 JSON_ARRAY('Tea Treatments', 'Herbal Wraps', 'Hot Stone Massage', 'Private Garden'),
 JSON_ARRAY('/images/facilities/spa_wellness.png'),
 JSON_OBJECT('open', '09:00', 'close', '19:00')),
(3, 'Colonial Hall', 'event_hall', 'Historic colonial-era hall with period architecture. Perfect for elegant celebrations.', 200, 120000.00, 240, TRUE, FALSE,
 JSON_ARRAY('Colonial Architecture', 'Garden Access', 'Vintage Decor', 'Grand Piano'),
 JSON_ARRAY('/images/facilities/event_hall.png'),
 JSON_OBJECT('open', '09:00', 'close', '22:00')),
(3, 'Tea Lounge Meeting Room', 'meeting_room', 'Intimate meeting space with tea garden views. Traditional tea service included.', 12, 8000.00, 60, TRUE, FALSE,
 JSON_ARRAY('Projector', 'Tea Service', 'WiFi', 'Garden View'),
 JSON_ARRAY('/images/facilities/meeting_room.png'),
 JSON_OBJECT('open', '08:00', 'close', '18:00'));

-- =====================================================
-- INSERT SAMPLE TIME SLOTS
-- =====================================================

-- Pool slots (hourly)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Infinity Pool (facility_id = 1)
(1, '06:00', '07:00', 'all', 30),
(1, '07:00', '08:00', 'all', 30),
(1, '08:00', '09:00', 'all', 30),
(1, '09:00', '10:00', 'all', 30),
(1, '10:00', '11:00', 'all', 30),
(1, '11:00', '12:00', 'all', 30),
(1, '12:00', '13:00', 'all', 30),
(1, '13:00', '14:00', 'all', 30),
(1, '14:00', '15:00', 'all', 30),
(1, '15:00', '16:00', 'all', 30),
(1, '16:00', '17:00', 'all', 30),
(1, '17:00', '18:00', 'all', 30),
(1, '18:00', '19:00', 'all', 30),
(1, '19:00', '20:00', 'all', 30),
-- Mirissa Beach Pool (facility_id = 6)
(6, '06:00', '07:00', 'all', 40),
(6, '07:00', '08:00', 'all', 40),
(6, '08:00', '09:00', 'all', 40),
(6, '09:00', '10:00', 'all', 40),
(6, '10:00', '11:00', 'all', 40),
(6, '11:00', '12:00', 'all', 40),
(6, '12:00', '13:00', 'all', 40),
(6, '13:00', '14:00', 'all', 40),
(6, '14:00', '15:00', 'all', 40),
(6, '15:00', '16:00', 'all', 40),
(6, '16:00', '17:00', 'all', 40),
(6, '17:00', '18:00', 'all', 40),
(6, '18:00', '19:00', 'all', 40),
-- Kandy Mountain View Pool (facility_id = 10)
(10, '07:00', '08:00', 'all', 25),
(10, '08:00', '09:00', 'all', 25),
(10, '09:00', '10:00', 'all', 25),
(10, '10:00', '11:00', 'all', 25),
(10, '11:00', '12:00', 'all', 25),
(10, '12:00', '13:00', 'all', 25),
(10, '13:00', '14:00', 'all', 25),
(10, '14:00', '15:00', 'all', 25),
(10, '15:00', '16:00', 'all', 25),
(10, '16:00', '17:00', 'all', 25),
(10, '17:00', '18:00', 'all', 25),
(10, '18:00', '19:00', 'all', 25);

-- Spa slots (hourly)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Serenity Spa (facility_id = 3)
(3, '09:00', '10:00', 'all', 4),
(3, '10:00', '11:00', 'all', 4),
(3, '11:00', '12:00', 'all', 4),
(3, '12:00', '13:00', 'all', 4),
(3, '14:00', '15:00', 'all', 4),
(3, '15:00', '16:00', 'all', 4),
(3, '16:00', '17:00', 'all', 4),
(3, '17:00', '18:00', 'all', 4),
(3, '18:00', '19:00', 'all', 4),
(3, '19:00', '20:00', 'all', 4),
(3, '20:00', '21:00', 'all', 4),
-- Mirissa Ayurveda Retreat (facility_id = 8)
(8, '08:00', '09:30', 'all', 3),
(8, '09:30', '11:00', 'all', 3),
(8, '11:00', '12:30', 'all', 3),
(8, '13:00', '14:30', 'all', 3),
(8, '14:30', '16:00', 'all', 3),
(8, '16:00', '17:30', 'all', 3),
(8, '17:30', '19:00', 'all', 3),
(8, '19:00', '20:00', 'all', 3),
-- Kandy Tea Garden Spa (facility_id = 12)
(12, '09:00', '10:00', 'all', 2),
(12, '10:00', '11:00', 'all', 2),
(12, '11:00', '12:00', 'all', 2),
(12, '13:00', '14:00', 'all', 2),
(12, '14:00', '15:00', 'all', 2),
(12, '15:00', '16:00', 'all', 2),
(12, '16:00', '17:00', 'all', 2),
(12, '17:00', '18:00', 'all', 2),
(12, '18:00', '19:00', 'all', 2);

-- Event Hall slots (Morning, Afternoon, Evening)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Grand Ballroom (facility_id = 4)
(4, '08:00', '12:00', 'all', 300),
(4, '13:00', '17:00', 'all', 300),
(4, '18:00', '23:00', 'all', 300),
-- Mirissa Sunset Pavilion (facility_id = 9)
(9, '10:00', '14:00', 'all', 150),
(9, '15:00', '18:00', 'all', 150),
(9, '18:00', '23:00', 'all', 150),
-- Kandy Colonial Hall (facility_id = 13)
(13, '09:00', '13:00', 'all', 200),
(13, '14:00', '18:00', 'all', 200),
(13, '18:00', '22:00', 'all', 200);

-- Meeting Room slots (1-hour)
INSERT INTO FacilitySlot (facility_id, start_time, end_time, day_of_week, max_capacity) VALUES
-- Colombo Boardroom One (facility_id = 5)
(5, '08:00', '09:00', 'all', 20),
(5, '09:00', '10:00', 'all', 20),
(5, '10:00', '11:00', 'all', 20),
(5, '11:00', '12:00', 'all', 20),
(5, '13:00', '14:00', 'all', 20),
(5, '14:00', '15:00', 'all', 20),
(5, '15:00', '16:00', 'all', 20),
(5, '16:00', '17:00', 'all', 20),
(5, '17:00', '18:00', 'all', 20),
(5, '18:00', '19:00', 'all', 20),
(5, '19:00', '20:00', 'all', 20),
-- Kandy Tea Lounge Meeting Room (facility_id = 14)
(14, '08:00', '09:00', 'all', 12),
(14, '09:00', '10:00', 'all', 12),
(14, '10:00', '11:00', 'all', 12),
(14, '11:00', '12:00', 'all', 12),
(14, '13:00', '14:00', 'all', 12),
(14, '14:00', '15:00', 'all', 12),
(14, '15:00', '16:00', 'all', 12),
(14, '16:00', '17:00', 'all', 12),
(14, '17:00', '18:00', 'all', 12);

-- =====================================================
-- INSERT SAMPLE ADD-ONS
-- =====================================================

-- Catering packages
INSERT INTO FacilityAddOn (branch_id, name, description, price, price_type, category) VALUES
(1, 'Standard Lunch Buffet', 'Sri Lankan and international cuisine buffet', 2500.00, 'per_person', 'catering'),
(1, 'Premium Dinner Buffet', 'Gourmet buffet with live cooking stations', 4500.00, 'per_person', 'catering'),
(1, 'Cocktail Reception', 'Canapes and welcome drinks', 1500.00, 'per_person', 'catering'),
(1, 'Wedding Cake', 'Custom 3-tier wedding cake', 35000.00, 'flat', 'catering'),
(2, 'Beach BBQ', 'Seafood and grill buffet on the beach', 5500.00, 'per_person', 'catering'),
(2, 'Sunset Cocktails', 'Premium cocktails with canapes', 2500.00, 'per_person', 'catering'),
(3, 'Traditional Kandyan Feast', 'Authentic Kandyan cuisine', 3500.00, 'per_person', 'catering'),
(3, 'High Tea Service', 'Ceylon tea with traditional sweets', 2000.00, 'per_person', 'catering');

-- Decoration packages
INSERT INTO FacilityAddOn (branch_id, name, description, price, price_type, category) VALUES
(1, 'Standard Decoration', 'Floral arrangements and table settings', 45000.00, 'flat', 'decoration'),
(1, 'Premium Decoration', 'Luxury decor with custom themes', 95000.00, 'flat', 'decoration'),
(1, 'Wedding Arch', 'Decorated wedding arch with flowers', 25000.00, 'flat', 'decoration'),
(2, 'Beach Wedding Setup', 'Beachfront ceremony setup with aisle', 75000.00, 'flat', 'decoration'),
(3, 'Colonial Theme Decor', 'Period-appropriate decorations', 55000.00, 'flat', 'decoration');

-- Equipment
INSERT INTO FacilityAddOn (branch_id, name, description, price, price_type, category) VALUES
(1, 'Premium Sound System', 'DJ-grade sound system with operator', 35000.00, 'flat', 'equipment'),
(1, 'LED Dance Floor', 'Programmable LED dance floor', 50000.00, 'flat', 'equipment'),
(1, 'Projector & Screen', 'HD projector with large screen', 15000.00, 'flat', 'equipment'),
(1, 'Video Conferencing Kit', 'Professional video conferencing setup', 25000.00, 'per_hour', 'equipment');

-- Services
INSERT INTO FacilityAddOn (branch_id, name, description, price, price_type, category) VALUES
(1, 'Professional Photography', '8-hour coverage with edited photos', 85000.00, 'flat', 'service'),
(1, 'Videography', 'Full event video with highlights reel', 120000.00, 'flat', 'service'),
(1, 'Live Band', '5-piece band for 3 hours', 75000.00, 'flat', 'service'),
(1, 'Valet Parking', 'Valet service for guests', 500.00, 'per_person', 'service'),
(2, 'Beach Ceremony Officiant', 'Licensed ceremony officiant', 25000.00, 'flat', 'service');

-- =====================================================
-- VIEW: Facility Availability Summary
-- =====================================================
CREATE OR REPLACE VIEW vw_facility_availability AS
SELECT 
    f.facility_id,
    f.name,
    f.facility_type,
    b.name AS branch_name,
    f.capacity,
    f.price_per_slot,
    COUNT(DISTINCT fb.booking_id) AS active_bookings
FROM Facility f
JOIN Branch b ON f.branch_id = b.branch_id
LEFT JOIN FacilityBooking fb ON f.facility_id = fb.facility_id 
    AND fb.status IN ('pending', 'confirmed', 'in_progress')
    AND fb.booking_date >= CURDATE()
WHERE f.is_active = TRUE
GROUP BY f.facility_id, f.name, f.facility_type, b.name, f.capacity, f.price_per_slot;

-- =====================================================
-- END OF FACILITY TABLES
-- =====================================================

SELECT 'Facility tables created successfully!' AS message;
SELECT CONCAT('Total Facilities: ', COUNT(*)) AS info FROM Facility;
SELECT CONCAT('Total Slots: ', COUNT(*)) AS info FROM FacilitySlot;
SELECT CONCAT('Total Add-ons: ', COUNT(*)) AS info FROM FacilityAddOn;
