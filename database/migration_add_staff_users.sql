-- Skip ALTER TABLE since role_type column already exists

-- Update ServiceRequest service_type enum to include dining and transport
ALTER TABLE `ServiceRequest` MODIFY COLUMN service_type ENUM('room_service', 'housekeeping', 'maintenance', 'concierge', 'laundry', 'spa', 'dining', 'transport', 'other') NOT NULL;

-- Insert new staff users (password: Test@123)
-- Branch 3 = Kandy
INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'manager@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Ruwan Wickramasinghe', '+94700000001', 'staff', 'manager', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'manager@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'frontdesk@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Nadeesha Fernando', '+94700000002', 'staff', 'front_desk', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'frontdesk@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'housekeeping@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Kumari Jayasuriya', '+94700000003', 'staff', 'housekeeping', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'housekeeping@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'fnb@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Tharanga Perera', '+94700000004', 'staff', 'food_beverage', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'fnb@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'maintenance@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Chaminda Bandara', '+94700000005', 'staff', 'maintenance', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'maintenance@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'concierge@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Dilini Rajapaksa', '+94700000006', 'staff', 'concierge', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'concierge@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 'spa@serendibhotels.lk', '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 'Sachini Wijewardena', '+94700000007', 'staff', 'spa', 3, TRUE) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'spa@serendibhotels.lk');

-- Update existing staff user to have a role_type
UPDATE `User` SET role_type = 'front_desk' WHERE email = 'staff@serendibhotels.lk' AND role = 'staff';
