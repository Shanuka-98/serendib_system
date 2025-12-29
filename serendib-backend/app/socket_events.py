"""
Socket.IO Event Handlers
Real-time WebSocket events for notifications
"""

from flask import request
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token
from app.models.user import User


def register_socket_events(socketio):
    """Register all Socket.IO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection with JWT authentication"""
        try:
            # Get token from query params or auth header
            token = request.args.get('token')
            
            if not token:
                return False  # Reject connection
            
            # Decode and validate token
            decoded = decode_token(token)
            user_id = decoded.get('sub')
            
            if not user_id:
                return False
            
            user = User.query.get(user_id)
            if not user:
                return False
            
            # Join role-specific rooms for targeted notifications
            if user.role == 'admin':
                # Admins join admin room to see all branch notifications
                join_room('admin_notifications')
                join_room('staff_notifications')
                print(f"[Socket.IO] {user.full_name} (admin) connected to admin_notifications")
            elif user.role == 'staff':
                # Staff join their branch-specific room
                if user.branch_id:
                    # Join general branch room
                    join_room(f'branch_{user.branch_id}')
                    print(f"[Socket.IO] {user.full_name} (staff) connected to branch_{user.branch_id}")
                    
                    # Join role-specific branch room (e.g. branch_1_manager, branch_1_concierge)
                    if user.role_type:
                        room_name = f'branch_{user.branch_id}_{user.role_type}'
                        join_room(room_name)
                        print(f"[Socket.IO] User joined role room: {room_name}")
                else:
                    # Fallback if no branch assigned
                    join_room('staff_notifications')
                    print(f"[Socket.IO] {user.full_name} (staff) connected to staff_notifications (no branch)")
            
            # Join user-specific room for personal notifications
            join_room(f'user_{user_id}')
            print(f"[Socket.IO] User {user_id} joined personal room")
            
            return True
            
        except Exception as e:
            print(f"[Socket.IO] Connection error: {str(e)}")
            return False
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        print(f"[Socket.IO] Client disconnected: {request.sid}")
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Join a specific room"""
        room = data.get('room')
        if room:
            join_room(room)
            print(f"[Socket.IO] {request.sid} joined room: {room}")
    
    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Leave a specific room"""
        room = data.get('room')
        if room:
            leave_room(room)
            print(f"[Socket.IO] {request.sid} left room: {room}")
