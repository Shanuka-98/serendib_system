-- Backfill service_charge_rate for all existing branches
INSERT INTO PropertyConfig (branch_id, config_key, config_value, description, created_at, updated_at)
SELECT 
    branch_id, 
    'service_charge_rate', 
    '0.10', 
    'Service charge rate (decimal)', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM Branch
WHERE NOT EXISTS (
    SELECT 1 
    FROM PropertyConfig 
    WHERE PropertyConfig.branch_id = Branch.branch_id 
    AND PropertyConfig.config_key = 'service_charge_rate'
);
