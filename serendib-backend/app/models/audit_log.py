"""
AuditLog Model
Represents system audit trail
"""

from app import db
from datetime import datetime


class AuditLog(db.Model):
    __tablename__ = 'AuditLog'
    
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='SET NULL'))
    action = db.Column(db.String(100), nullable=False)
    table_name = db.Column(db.String(50), nullable=False)
    record_id = db.Column(db.Integer)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_user', 'user_id'),
        db.Index('idx_timestamp', 'timestamp'),
        db.Index('idx_table_record', 'table_name', 'record_id'),
    )
    
    def __repr__(self):
        return f'<AuditLog #{self.log_id} - {self.action} on {self.table_name}>'
    
    def to_dict(self):
        """Serialize audit log to dictionary"""
        data = {
            'log_id': self.log_id,
            'user_id': self.user_id,
            'action': self.action,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }
        
        if self.user:
            data['user_email'] = self.user.email
            data['user_name'] = self.user.full_name
        
        return data
    
    @staticmethod
    def log_action(user_id, action, table_name, record_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None):
        """Create an audit log entry"""
        log = AuditLog(
            user_id=user_id,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log)
        db.session.commit()
        return log
    
    @staticmethod
    def get_user_logs(user_id, limit=100):
        """Get audit logs for a specific user"""
        return AuditLog.query.filter_by(user_id=user_id).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    @staticmethod
    def get_table_logs(table_name, record_id=None):
        """Get audit logs for a specific table"""
        query = AuditLog.query.filter_by(table_name=table_name)
        
        if record_id:
            query = query.filter_by(record_id=record_id)
        
        return query.order_by(AuditLog.timestamp.desc()).all()
    
    @staticmethod
    def get_recent_logs(limit=100):
        """Get recent audit logs"""
        return AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

