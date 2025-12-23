-- =====================================================
-- UPDATE ROOM IMAGES
-- Run this script to update all room images in the database
-- =====================================================

USE serendib_hotels;

-- Colombo Branch Rooms (branch_id = 1)
-- Standard rooms (101, 102)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/colombo-standard.png') 
WHERE branch_id = 1 AND room_type = 'standard';

-- Deluxe rooms (201, 202)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/colombo-deluxe.png') 
WHERE branch_id = 1 AND room_type = 'deluxe';

-- Suite room (301)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/colombo-suite.png') 
WHERE branch_id = 1 AND room_type = 'suite';

-- Penthouse (P01)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/colombo-penthouse.png') 
WHERE branch_id = 1 AND room_type = 'penthouse';

-- Mirissa Branch Rooms (branch_id = 2)
-- Standard rooms (B101, B102)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/mirissa-standard.png') 
WHERE branch_id = 2 AND room_type = 'standard';

-- Deluxe rooms (B201, B202)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/mirissa-deluxe.png') 
WHERE branch_id = 2 AND room_type = 'deluxe';

-- Suite room (V01)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/mirissa-suite.png') 
WHERE branch_id = 2 AND room_type = 'suite';

-- Kandy Branch Rooms (branch_id = 3)
-- Standard rooms (H101, H102)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/kandy-standard.png') 
WHERE branch_id = 3 AND room_type = 'standard';

-- Deluxe room (H201)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/kandy-deluxe.png') 
WHERE branch_id = 3 AND room_type = 'deluxe';

-- Suite room (H301)
UPDATE Room SET image_urls = JSON_ARRAY('/images/rooms/kandy-suite.png') 
WHERE branch_id = 3 AND room_type = 'suite';

-- Verify the updates
SELECT room_id, room_number, room_type, branch_id, image_urls FROM Room ORDER BY branch_id, room_type;

SELECT 'Room images updated successfully!' AS message;
