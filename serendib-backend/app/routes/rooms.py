"""
Room Management Routes
Room CRUD operations and availability checking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.room import Room
from app.models.branch import Branch
from app.models.user import User
from app.models.audit_log import AuditLog
from app.middleware.auth import admin_required, staff_or_admin_required, get_current_user
from app.utils.helpers import (
    success_response, error_response, paginate_query,
    validate_required_fields, get_ip_address, validate_date_range
)

rooms_bp = Blueprint('rooms', __name__)


@rooms_bp.route('/', methods=['GET'])
def get_rooms():
    """
    Get all rooms with optional filters
    
    Query Parameters:
        branch_id: Filter by branch ID
        room_type: Filter by room type (standard, deluxe, suite, penthouse)
        min_price: Minimum price per night
        max_price: Maximum price per night
        capacity: Minimum capacity
        status: Filter by status (available, occupied, maintenance, reserved)
        check_in: Check-in date (YYYY-MM-DD)
        check_out: Check-out date (YYYY-MM-DD)
        page: Page number (default: 1)
        per_page: Items per page (default: 20)
    """
    # Get query parameters
    branch_id = request.args.get('branch_id', type=int)
    room_type = request.args.get('room_type')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    capacity = request.args.get('capacity', type=int)
    status = request.args.get('status')
    search = request.args.get('search', '').strip()  # Get search parameter
    check_in = request.args.get('check_in')
    check_out = request.args.get('check_out')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Build search parameters
    search_params = {}
    
    if branch_id:
        search_params['branch_id'] = branch_id
    if room_type:
        search_params['room_type'] = room_type
    if min_price:
        search_params['min_price'] = min_price
    if max_price:
        search_params['max_price'] = max_price
    if capacity:
        search_params['capacity'] = capacity
    if status:
        search_params['status'] = status
    elif request.args.get('include_all_statuses') in ['true', 'True', '1', 'true']:
        # If explicitly requested to include all statuses (admin view)
        search_params['include_all_statuses'] = True
    
    # Add search parameter if provided
    if search:
        search_params['search'] = search
        print(f"Search parameter received: '{search}'")
    
    try:
        # Debug: Check total rooms in database
        total_rooms = Room.query.count()
        print(f"Total rooms in database: {total_rooms}")

        # Search rooms
        rooms = Room.search_rooms(search_params)
        print(f"Found {len(rooms)} rooms from search")
        print(f"include_all_statuses: {search_params.get('include_all_statuses')}, type: {type(search_params.get('include_all_statuses'))}")
        print(f"Request args: {dict(request.args)}")

        # Debug: Show first few rooms
        if rooms:
            print("First few rooms:")
            for i, room in enumerate(rooms[:3]):
                print(f"  {i+1}. Room {room.room_number} - {room.status} - Branch: {room.branch.name if room.branch else 'None'}")
        
        # Filter by availability if dates provided
        if check_in and check_out:
            # Validate dates
            is_valid, errors = validate_date_range(check_in, check_out)
            if not is_valid:
                return error_response('Invalid date range', errors=errors, status_code=400)
            
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
                
                rooms = [
                    room for room in rooms
                    if room.check_availability(check_in_date, check_out_date)
                ]
            except ValueError:
                return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
        
        # Serialize rooms with error handling
        rooms_data = []
        for room in rooms:
            try:
                room_dict = room.to_dict(include_availability=True)
                rooms_data.append(room_dict)
            except Exception as e:
                # Log error but continue with other rooms
                print(f"Error serializing room {room.room_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Serialized {len(rooms_data)} rooms successfully")

        # Debug: Show response structure
        print(f"Response will contain {len(rooms_data)} rooms")
    except Exception as e:
        import traceback
        print(f"Error in get_rooms route: {str(e)}")
        traceback.print_exc()
        return error_response(f'Error fetching rooms: {str(e)}', status_code=500)
    
    # Simple pagination for list
    total = len(rooms_data)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_rooms = rooms_data[start:end]
    
    return success_response(data={
        'rooms': paginated_rooms,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total,
            'total_pages': (total + per_page - 1) // per_page
        }
    })


@rooms_bp.route('/<int:room_id>', methods=['GET'])
def get_room(room_id):
    """
    Get room details by ID
    """
    room = Room.query.get(room_id)
    
    if not room:
        return error_response('Room not found', status_code=404)
    
    return success_response(data={'room': room.to_dict(include_availability=True)})


@rooms_bp.route('/create', methods=['POST'])
@jwt_required()
@admin_required
def create_room():
    """
    Create a new room (Admin only)
    
    Request Body:
        branch_id: Branch ID
        room_number: Room number
        room_type: Room type (standard, deluxe, suite, penthouse)
        capacity: Room capacity
        price_per_night: Price per night
        floor: Floor number
        amenities: List of amenities
        description: Room description
        image_urls: List of image URLs
    """
    print("Create room request received")
    print(f"Request data: {request.get_json()}")

    data = request.get_json()

    # Validate required fields
    required_fields = ['branch_id', 'room_number', 'room_type', 'capacity', 'price_per_night', 'floor']
    is_valid, error_msg = validate_required_fields(data, required_fields)
    
    if not is_valid:
        return error_response(error_msg, status_code=400)
    
    # Validate branch exists
    branch = Branch.query.get(data['branch_id'])
    if not branch:
        return error_response('Branch not found', status_code=404)
    
    # Validate room type
    valid_types = ['standard', 'deluxe', 'suite', 'penthouse']
    if data['room_type'] not in valid_types:
        return error_response(f'Invalid room type. Must be one of: {", ".join(valid_types)}', status_code=400)
    
    # Check if room number already exists in branch
    existing_room = Room.query.filter_by(
        branch_id=data['branch_id'],
        room_number=data['room_number']
    ).first()
    
    if existing_room:
        return error_response('Room number already exists in this branch', status_code=409)
    
    try:
        # Create room
        room = Room(
            branch_id=data['branch_id'],
            room_number=data['room_number'],
            room_type=data['room_type'],
            capacity=data['capacity'],
            price_per_night=data['price_per_night'],
            floor=data['floor'],
            amenities=data.get('amenities', []),
            description=data.get('description'),
            image_urls=data.get('image_urls', []),
            status='available'
        )
        
        db.session.add(room)
        db.session.flush()
        
        # Log action
        user_id = get_jwt_identity()
        AuditLog.log_action(
            user_id=user_id,
            action='CREATE',
            table_name='Room',
            record_id=room.room_id,
            new_values=room.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        print(f"Room created successfully: {room.room_id}")

        return success_response(
            data={'room': room.to_dict()},
            message='Room created successfully',
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating room: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to create room: {str(e)}', status_code=500)


@rooms_bp.route('/<int:room_id>', methods=['PUT'])
@jwt_required()
@staff_or_admin_required
def update_room(room_id):
    """
    Update room details (Admin only)
    """
    room = Room.query.get(room_id)
    
    if not room:
        return error_response('Room not found', status_code=404)
    
    data = request.get_json()
    old_values = room.to_dict()
    
    try:
        # Update fields
        if 'room_number' in data:
            room.room_number = data['room_number']
        if 'room_type' in data:
            room.room_type = data['room_type']
        if 'capacity' in data:
            room.capacity = data['capacity']
        if 'price_per_night' in data:
            room.price_per_night = data['price_per_night']
        if 'status' in data:
            room.status = data['status']
        if 'floor' in data:
            room.floor = data['floor']
        if 'amenities' in data:
            room.amenities = data['amenities']
        if 'description' in data:
            room.description = data['description']
        if 'image_urls' in data:
            room.image_urls = data['image_urls']
        
        # Log action
        user_id = get_jwt_identity()
        AuditLog.log_action(
            user_id=user_id,
            action='UPDATE',
            table_name='Room',
            record_id=room.room_id,
            old_values=old_values,
            new_values=room.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.commit()
        
        return success_response(
            data={'room': room.to_dict()},
            message='Room updated successfully'
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to update room: {str(e)}', status_code=500)


@rooms_bp.route('/<int:room_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_room(room_id):
    """
    Delete a room (Admin only)
    """
    room = Room.query.get(room_id)
    
    if not room:
        return error_response('Room not found', status_code=404)
    
    # Check if room has active bookings
    from app.models.booking import Booking
    active_bookings = Booking.query.filter_by(
        room_id=room_id
    ).filter(
        Booking.status.in_(['confirmed', 'checked_in'])
    ).count()
    
    if active_bookings > 0:
        return error_response('Cannot delete room with active bookings', status_code=400)
    
    try:
        # Log action
        user_id = get_jwt_identity()
        AuditLog.log_action(
            user_id=user_id,
            action='DELETE',
            table_name='Room',
            record_id=room.room_id,
            old_values=room.to_dict(),
            ip_address=get_ip_address(),
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.delete(room)
        db.session.commit()
        
        return success_response(message='Room deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete room: {str(e)}', status_code=500)


@rooms_bp.route('/availability', methods=['GET'])
def check_availability():
    """
    Check room availability for date range
    
    Query Parameters:
        branch_id: Branch ID (required)
        check_in: Check-in date (required, YYYY-MM-DD)
        check_out: Check-out date (required, YYYY-MM-DD)
        room_type: Filter by room type (optional)
        capacity: Minimum capacity (optional)
    """
    branch_id = request.args.get('branch_id', type=int)
    check_in = request.args.get('check_in')
    check_out = request.args.get('check_out')
    room_type = request.args.get('room_type')
    capacity = request.args.get('capacity', type=int)
    
    # Validate required parameters
    if not branch_id or not check_in or not check_out:
        return error_response('branch_id, check_in, and check_out are required', status_code=400)
    
    # Validate dates
    is_valid, errors = validate_date_range(check_in, check_out)
    if not is_valid:
        return error_response('Invalid date range', errors=errors, status_code=400)
    
    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        
        # Get available rooms
        available_rooms = Room.get_available_rooms(
            branch_id=branch_id,
            room_type=room_type,
            check_in=check_in_date,
            check_out=check_out_date,
            min_capacity=capacity
        )
        
        return success_response(data={
            'available_rooms': [room.to_dict() for room in available_rooms],
            'count': len(available_rooms),
            'check_in': check_in,
            'check_out': check_out
        })
        
    except ValueError:
        return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)


@rooms_bp.route('/types', methods=['GET'])
def get_room_types():
    """
    Get available room types with price ranges
    
    Query Parameters:
        branch_id: Filter by branch ID (optional)
    """
    branch_id = request.args.get('branch_id', type=int)
    
    query = db.session.query(
        Room.room_type,
        db.func.count(Room.room_id).label('count'),
        db.func.min(Room.price_per_night).label('min_price'),
        db.func.max(Room.price_per_night).label('max_price'),
        db.func.avg(Room.price_per_night).label('avg_price')
    )
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    
    results = query.group_by(Room.room_type).all()
    
    room_types = []
    for result in results:
        room_types.append({
            'room_type': result.room_type,
            'count': result.count,
            'min_price': float(result.min_price),
            'max_price': float(result.max_price),
            'avg_price': float(result.avg_price)
        })
    
    return success_response(data={'room_types': room_types})


@rooms_bp.route('/upload-image', methods=['POST'])
@jwt_required()
@admin_required
def upload_room_image_without_room():
    """
    Upload image for a room (can be used before room creation)
    Returns the image URL to include when creating/updating the room.
    
    Request Body (multipart/form-data):
        image: Image file (JPEG, PNG, GIF, WebP)
    """
    import os
    import uuid
    from flask import current_app
    from werkzeug.utils import secure_filename
    
    if 'image' not in request.files:
        return error_response('No image file provided', status_code=400)
    
    file = request.files['image']
    
    if file.filename == '':
        return error_response('No selected file', status_code=400)
    
    # Check allowed extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    if not allowed_file(file.filename):
        return error_response('Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WebP', status_code=400)
    
    # Create room images directory if it doesn't exist
    # Save to frontend public folder for direct access
    frontend_images_dir = os.path.join(
        os.path.dirname(current_app.root_path),
        '..', 'serendib-frontend', 'public', 'images', 'rooms'
    )
    os.makedirs(frontend_images_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"room-new-{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(frontend_images_dir, filename)
    
    try:
        file.save(file_path)
        new_image_url = f'/images/rooms/{filename}'
        
        return success_response(
            data={'image_url': new_image_url},
            message='Image uploaded successfully'
        )
        
    except Exception as e:
        return error_response(f'Failed to upload image: {str(e)}', status_code=500)


@rooms_bp.route('/<int:room_id>/upload-image', methods=['POST'])
@jwt_required()
@admin_required
def upload_room_image(room_id):
    """
    Upload image for a room
    
    Request Body (multipart/form-data):
        image: Image file (JPEG, PNG, GIF, WebP)
    """
    import os
    from flask import current_app
    from werkzeug.utils import secure_filename
    
    room = Room.query.get_or_404(room_id)
    
    if 'image' not in request.files:
        return error_response('No image file provided', status_code=400)
    
    file = request.files['image']
    
    if file.filename == '':
        return error_response('No selected file', status_code=400)
    
    # Check allowed extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    if not allowed_file(file.filename):
        return error_response('Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WebP', status_code=400)
    
    # Create room images directory if it doesn't exist
    # Save to frontend public folder for direct access
    frontend_images_dir = os.path.join(
        os.path.dirname(current_app.root_path),
        '..', 'serendib-frontend', 'public', 'images', 'rooms'
    )
    os.makedirs(frontend_images_dir, exist_ok=True)
    
    # Generate unique filename
    import uuid
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"room-{room_id}-{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(frontend_images_dir, filename)
    
    try:
        file.save(file_path)
        
        # Update room image_urls
        import json
        current_images = room.image_urls
        if isinstance(current_images, str):
            try:
                current_images = json.loads(current_images)
            except:
                current_images = []
        elif current_images is None:
            current_images = []
        
        # Add new image URL
        new_image_url = f'/images/rooms/{filename}'
        if new_image_url not in current_images:
            current_images.append(new_image_url)
        
        room.image_urls = json.dumps(current_images)
        db.session.commit()
        
        # Log the action
        current_user = get_current_user()
        AuditLog.log_action(
            user_id=current_user.user_id,
            action='room_image_upload',
            table_name='Room',
            record_id=room_id,
            new_values={'image_url': new_image_url}
        )
        
        return success_response(
            data={'image_url': new_image_url, 'all_images': current_images},
            message='Image uploaded successfully'
        )
        
    except Exception as e:
        return error_response(f'Failed to upload image: {str(e)}', status_code=500)


@rooms_bp.route('/<int:room_id>/delete-image', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_room_image(room_id):
    """
    Delete an image from a room
    
    Query Parameters:
        image_url: URL of the image to delete
    """
    import os
    import json
    from flask import current_app
    
    room = Room.query.get_or_404(room_id)
    
    image_url = request.args.get('image_url')
    if not image_url:
        return error_response('Image URL required', status_code=400)
    
    # Parse current images
    current_images = room.image_urls
    if isinstance(current_images, str):
        try:
            current_images = json.loads(current_images)
        except:
            current_images = []
    elif current_images is None:
        current_images = []
    
    if image_url not in current_images:
        return error_response('Image not found', status_code=404)
    
    # Remove from list
    current_images.remove(image_url)
    room.image_urls = json.dumps(current_images)
    
    # Try to delete the file
    try:
        frontend_images_dir = os.path.join(
            os.path.dirname(current_app.root_path),
            '..', 'serendib-frontend', 'public'
        )
        file_path = os.path.join(frontend_images_dir, image_url.lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Could not delete file: {e}")
    
    db.session.commit()
    
    return success_response(
        data={'all_images': current_images},
        message='Image deleted successfully'
    )

