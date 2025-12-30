-- Update existing Facility records with branch-specific image paths
-- Run this if you have existing facilities

-- Colombo Branch (branch_id = 1) Facilities
UPDATE Facility SET images = JSON_ARRAY('/images/facilities/colombo_pool.png') 
WHERE name = 'Infinity Pool' AND branch_id = 1;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/colombo_gym.png') 
WHERE name = 'Fitness Center' AND branch_id = 1;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/colombo_spa.png') 
WHERE name = 'Serenity Spa' AND branch_id = 1;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/colombo_ballroom.png') 
WHERE name = 'Grand Ballroom' AND branch_id = 1;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/meeting_room.png') 
WHERE name = 'Boardroom One' AND branch_id = 1;

-- Mirissa Branch (branch_id = 2) Facilities
UPDATE Facility SET images = JSON_ARRAY('/images/facilities/mirissa_pool.png') 
WHERE name = 'Beach Pool' AND branch_id = 2;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/mirissa_gym.png') 
WHERE name = 'Beach Gym' AND branch_id = 2;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/mirissa_spa.png') 
WHERE name = 'Ayurveda Retreat' AND branch_id = 2;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/mirissa_pavilion.png') 
WHERE name = 'Sunset Pavilion' AND branch_id = 2;

-- Kandy Branch (branch_id = 3) Facilities
UPDATE Facility SET images = JSON_ARRAY('/images/facilities/kandy_pool.png') 
WHERE name = 'Mountain View Pool' AND branch_id = 3;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/kandy_gym.png') 
WHERE name = 'Highland Gym' AND branch_id = 3;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/kandy_spa.png') 
WHERE name = 'Tea Garden Spa' AND branch_id = 3;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/kandy_hall.png') 
WHERE name = 'Colonial Hall' AND branch_id = 3;

UPDATE Facility SET images = JSON_ARRAY('/images/facilities/meeting_room.png') 
WHERE name = 'Tea Lounge Meeting Room' AND branch_id = 3;

-- Verify the update
SELECT facility_id, name, branch_id, images FROM Facility ORDER BY branch_id, facility_type;
