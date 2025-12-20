"""
Staff Model
Represents staff member details
"""

from app import db
from datetime import datetime


class Staff(db.Model):
    __tablename__ = 'Staff'
    
    staff_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('User.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    branch_id = db.Column(db.Integer, db.ForeignKey('Branch.branch_id', ondelete='CASCADE'), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    department = db.Column(
        db.Enum('front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'management', 'security', name='department'),
        nullable=False
    )
    hire_date = db.Column(db.Date, nullable=False)
    schedule = db.Column(db.JSON)
    employee_id = db.Column(db.String(50), unique=True, index=True)
    salary = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)
    
    # Indexes
    __table_args__ = (
        db.Index('idx_branch', 'branch_id'),
        db.Index('idx_department', 'department'),
        db.Index('idx_employee_id', 'employee_id'),
    )
    
    def __repr__(self):
        return f'<Staff {self.employee_id} - {self.position}>'
    
    def to_dict(self, include_salary=False):
        """Serialize staff to dictionary"""
        data = {
            'staff_id': self.staff_id,
            'user_id': self.user_id,
            'branch_id': self.branch_id,
            'position': self.position,
            'department': self.department,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'schedule': self.schedule,
            'employee_id': self.employee_id,
            'is_active': self.is_active
        }
        
        if include_salary:
            data['salary'] = float(self.salary) if self.salary else None
        
        if self.user:
            data['full_name'] = self.user.full_name
            data['email'] = self.user.email
            data['phone'] = self.user.phone
        
        if self.branch:
            data['branch_name'] = self.branch.name
        
        return data
    
    @staticmethod
    def get_branch_staff(branch_id, department=None):
        """Get all staff for a branch"""
        query = Staff.query.filter_by(branch_id=branch_id, is_active=True)
        
        if department:
            query = query.filter_by(department=department)
        
        return query.all()
    
    @staticmethod
    def get_by_employee_id(employee_id):
        """Get staff by employee ID"""
        return Staff.query.filter_by(employee_id=employee_id).first()

