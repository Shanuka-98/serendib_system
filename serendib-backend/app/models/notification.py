"""
Notification Model
Represents user notifications
"""

from app import db
from datetime import datetime


class Notification(db.Model):
    __tablename__ = 'Notification'
    
    notification_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(
        db.Enum('booking', 'payment', 'service', 'promotion', 'system', 'loyalty', 'sms', name='notification_type'),
        nullable=False
    )
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    related_id = db.Column(db.Integer)
    action_url = db.Column(db.String(255))
    
    # Indexes
    __table_args__ = (
        db.Index('idx_user_read', 'user_id', 'is_read'),
        db.Index('idx_sent_at', 'sent_at'),
        db.Index('idx_type', 'notification_type'),
    )
    
    def __repr__(self):
        return f'<Notification #{self.notification_id} - {self.notification_type}>'
    
    def to_dict(self):
        """Serialize notification to dictionary"""
        return {
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'related_id': self.related_id,
            'action_url': self.action_url
        }
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        db.session.commit()
    
    @staticmethod
    def create_notification(user_id, message, notification_type, related_id=None, action_url=None):
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            message=message,
            notification_type=notification_type,
            related_id=related_id,
            action_url=action_url
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    @staticmethod
    def get_user_notifications(user_id, unread_only=False):
        """Get all notifications for a user"""
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(Notification.sent_at.desc()).all()
    
    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications"""
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user"""
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()

