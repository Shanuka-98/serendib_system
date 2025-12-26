-- =====================================================
-- MIGRATION: Add Shift Table for Staff Scheduling
-- Run this in phpMyAdmin or MySQL Workbench
-- =====================================================

USE serendib_hotels;

CREATE TABLE IF NOT EXISTS Shift (
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

-- Verify table was created
SHOW TABLES LIKE 'Shift';
