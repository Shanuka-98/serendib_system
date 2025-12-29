-- =====================================================
-- MIGRATION: Add Role Type System
-- Run this on existing database to add role_type column
-- =====================================================

-- Add role_type column to User table
ALTER TABLE `User` ADD COLUMN role_type ENUM('front_desk', 'housekeeping', 'food_beverage', 'maintenance', 'concierge', 'spa', 'manager') DEFAULT NULL AFTER role;

-- Add index for role_type
ALTER TABLE `User` ADD INDEX idx_role_type (role_type);

-- Update ServiceRequest service_type enum to include dining and transport
ALTER TABLE `ServiceRequest` MODIFY COLUMN service_type ENUM('room_service', 'housekeeping', 'maintenance', 'concierge', 'laundry', 'spa', 'dining', 'transport', 'other') NOT NULL;

-- =====================================================
-- INSERT NEW STAFF USERS WITH ROLE TYPES
-- Password: Test@123 for all users
-- =====================================================

-- Check if users already exist before inserting
INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'manager@serendibhotels.lk' as email, 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG' as password_hash, 
  'Ruwan Wickramasinghe' as full_name, 
  '+94700000001' as phone, 
  'staff' as role, 
  'manager' as role_type, 
  1 as branch_id, 
  TRUE as is_verified
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'manager@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'frontdesk@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Nadeesha Fernando', 
  '+94700000002', 
  'staff', 
  'front_desk', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'frontdesk@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'housekeeping@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Kumari Jayasuriya', 
  '+94700000003', 
  'staff', 
  'housekeeping', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'housekeeping@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'fnb@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Tharanga Perera', 
  '+94700000004', 
  'staff', 
  'food_beverage', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'fnb@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'maintenance@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Chaminda Bandara', 
  '+94700000005', 
  'staff', 
  'maintenance', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'maintenance@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'concierge@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Dilini Rajapaksa', 
  '+94700000006', 
  'staff', 
  'concierge', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'concierge@serendibhotels.lk');

INSERT INTO `User` (email, password_hash, full_name, phone, role, role_type, branch_id, is_verified) 
SELECT * FROM (SELECT 
  'spa@serendibhotels.lk', 
  '$2b$12$Or9mCJ9uLO5icIs8whk1hebfRIyzRkvZekvuZTG0FVMaNGWzTE/cG', 
  'Sachini Wijewardena', 
  '+94700000007', 
  'staff', 
  'spa', 
  1, 
  TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE email = 'spa@serendibhotels.lk');

-- Update existing staff user to have a role_type
UPDATE `User` SET role_type = 'front_desk' WHERE email = 'staff@serendibhotels.lk' AND role = 'staff';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Migration completed!' AS status;
SELECT email, full_name, role, role_type, branch_id FROM `User` WHERE role = 'staff' ORDER BY user_id;

-- NOTE: After running this migration, run fix_passwords.py to set all passwords to Test@123
