-- Migration: Service Pricing & Dynamic Catalog (Consolidated)
-- 1. Adds pricing columns to ServiceRequest
-- 2. Creates ServiceType table (Catalog)
-- 3. Seeds catalog with initial data
-- 4. Converts ServiceRequest to use dynamic types

-- SECTION A: Add Pricing Columns (If not exists)
-- (We use a procedure to check existence or just run ALTER and ignore if exists, 
-- but for simplicity in this script we assume standard migration flow)

-- 1. Add pricing columns to ServiceRequest
SET @dbname = DATABASE();
SET @tablename = "ServiceRequest";
SET @columnname = "price";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE ServiceRequest ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00, ADD COLUMN is_chargeable BOOLEAN DEFAULT FALSE, ADD COLUMN is_billed BOOLEAN DEFAULT FALSE, ADD COLUMN billed_at TIMESTAMP NULL;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add Index
-- CREATE INDEX idx_is_billed ON ServiceRequest(is_billed); 
-- (Index creation might fail if exists, skipping silent check for brevity)

-- SECTION B: Create ServiceType Table
CREATE TABLE IF NOT EXISTS ServiceType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    is_chargeable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- SECTION C: Seed Data (Initial Catalog)
INSERT IGNORE INTO ServiceType (name, code, base_price, is_chargeable) VALUES 
('Room Service', 'room_service', 1500.00, TRUE),
('Laundry', 'laundry', 500.00, TRUE),
('Spa', 'spa', 5000.00, TRUE),
('Dining', 'dining', 2500.00, TRUE),
('Transport', 'transport', 3000.00, TRUE),
('Housekeeping', 'housekeeping', 0.00, FALSE),
('Maintenance', 'maintenance', 0.00, FALSE),
('Concierge', 'concierge', 0.00, FALSE),
('Pool Usage', 'pool', 0.00, FALSE),
('Other', 'other', 0.00, FALSE);

-- SECTION D: Modify ServiceRequest
-- Convert ENUM to VARCHAR to support dynamic types
ALTER TABLE ServiceRequest MODIFY COLUMN service_type VARCHAR(50) NOT NULL;

-- Index for performance
CREATE INDEX idx_service_type ON ServiceType(code);

-- SECTION E: Update Historical Data (Optional)
-- Mark completed chargeable services as billed
UPDATE ServiceRequest SET is_billed = TRUE, billed_at = completed_at 
WHERE status = 'completed' AND is_chargeable = TRUE AND is_billed = FALSE;

SELECT 'Migration Complete: Service Pricing & Dynamic Catalog ready.' as message;

