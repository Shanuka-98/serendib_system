"""
Notification Management Routes
User notifications
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.notification import Notification
from app.middleware.auth import admin_required, get_current_user
from app.utils.helpers import success_response, error_response

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """
    Get user notifications
    
    Query Parameters:
        unread_only: Get only unread notifications (default: false)
    """
    current_user = get_current_user()
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    notifications = Notification.get_user_notifications(current_user.user_id, unread_only)
    unread_count = Notification.get_unread_count(current_user.user_id)
    
    return success_response(data={
        'notifications': [notif.to_dict() for notif in notifications],
        'count': len(notifications),
        'unread_count': unread_count
    })


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """
    Mark notification as read
    """
    current_user = get_current_user()
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return error_response('Notification not found', status_code=404)
    
    if notification.user_id != current_user.user_id:
        return error_response('You do not have permission to update this notification', status_code=403)
    
    notification.mark_as_read()
    
    return success_response(message='Notification marked as read')


@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_read():
    """
    Mark all notifications as read for current user
    """
    current_user = get_current_user()
    Notification.mark_all_as_read(current_user.user_id)
    
    return success_response(message='All notifications marked as read')


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """
    Delete notification
    """
    current_user = get_current_user()
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return error_response('Notification not found', status_code=404)
    
    if notification.user_id != current_user.user_id and current_user.role != 'admin':
        return error_response('You do not have permission to delete this notification', status_code=403)
    
    db.session.delete(notification)
    db.session.commit()
    
    return success_response(message='Notification deleted successfully')


@notifications_bp.route('/send', methods=['POST'])
@jwt_required()
@admin_required
def send_notification():
    """
    Send notification to user (Admin only)
    
    Request Body:
        user_id: User ID
        message: Notification message
        notification_type: Notification type
        action_url: Action URL (optional)
    """
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'message' not in data or 'notification_type' not in data:
        return error_response('user_id, message, and notification_type are required', status_code=400)
    
    notification = Notification.create_notification(
        user_id=data['user_id'],
        message=data['message'],
        notification_type=data['notification_type'],
        action_url=data.get('action_url')
    )
    
    return success_response(
        data={'notification': notification.to_dict()},
        message='Notification sent successfully'
    )

