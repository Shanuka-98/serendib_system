"""
PropertyConfig Model
Represents branch-specific configurations
"""

from app import db
from datetime import datetime


class PropertyConfig(db.Model):
    __tablename__ = 'PropertyConfig'
    
    config_id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'))
    config_key = db.Column(db.String(100), nullable=False)
    config_value = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes and constraints
    __table_args__ = (
        db.UniqueConstraint('branch_id', 'config_key', name='unique_branch_key'),
        db.Index('idx_branch_key', 'branch_id', 'config_key'),
    )
    
    def __repr__(self):
        branch_name = self.branch.name if self.branch else 'Global'
        return f'<PropertyConfig {self.config_key} for {branch_name}>'
    
    def to_dict(self):
        """Serialize property config to dictionary"""
        return {
            'config_id': self.config_id,
            'branch_id': self.branch_id,
            'branch_name': self.branch.name if self.branch else 'Global',
            'config_key': self.config_key,
            'config_value': self.config_value,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_config(branch_id, config_key, default=None):
        """
        Get configuration value
        
        Args:
            branch_id: Branch ID (None for global config)
            config_key: Configuration key
            default: Default value if not found
        
        Returns:
            Configuration value or default
        """
        config = PropertyConfig.query.filter_by(
            branch_id=branch_id,
            config_key=config_key
        ).first()
        
        if config:
            return config.config_value
        
        # Try global config if branch-specific not found
        if branch_id is not None:
            global_config = PropertyConfig.query.filter_by(
                branch_id=None,
                config_key=config_key
            ).first()
            
            if global_config:
                return global_config.config_value
        
        return default
    
    @staticmethod
    def set_config(branch_id, config_key, config_value, description=None):
        """Set or update configuration"""
        config = PropertyConfig.query.filter_by(
            branch_id=branch_id,
            config_key=config_key
        ).first()
        
        if config:
            config.config_value = config_value
            if description:
                config.description = description
            config.updated_at = datetime.utcnow()
        else:
            config = PropertyConfig(
                branch_id=branch_id,
                config_key=config_key,
                config_value=config_value,
                description=description
            )
            db.session.add(config)
        
        db.session.commit()
        return config
    
    @staticmethod
    def get_branch_configs(branch_id):
        """Get all configurations for a branch"""
        return PropertyConfig.query.filter_by(branch_id=branch_id).all()
    
    @staticmethod
    def get_global_configs():
        """Get all global configurations"""
        return PropertyConfig.query.filter_by(branch_id=None).all()

