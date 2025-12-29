from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.service_type import ServiceType
from app.utils.helpers import success_response, error_response
from app.middleware.auth import role_required, get_current_user

services_bp = Blueprint('services', __name__)

@services_bp.route('', methods=['GET'])
@jwt_required()
def get_service_catalog():
    """Get list of active services (Admin sees all)"""
    current_user = get_current_user()
    if not current_user:
        return error_response('Unauthorized', 401)

    # Guests/Staff see active only, Admin sees all
    if current_user.role == 'admin':
        services = ServiceType.query.all()
    else:
        services = ServiceType.query.filter_by(is_active=True).all()
        
    return success_response(data={'services': [s.to_dict() for s in services]})

@services_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_service():
    """Create a new service type"""
    data = request.get_json()
    
    name = data.get('name')
    code = data.get('code')
    
    if not name or not code:
        return error_response('Name and Code are required', 400)
        
    # Check duplicate
    if ServiceType.query.filter((ServiceType.code == code) | (ServiceType.name == name)).first():
        return error_response('Service type with this code or name already exists', 400)
        
    try:
        new_service = ServiceType(
            name=name,
            code=code.lower().strip().replace(' ', '_'),
            description=data.get('description', ''),
            base_price=data.get('base_price', 0.00),
            is_chargeable=data.get('is_chargeable', False),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_service)
        db.session.commit()
        
        return success_response(data={'service': new_service.to_dict()}, message='Service type created successfully', status_code=201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@services_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_service(id):
    """Update existing service type"""
    service = ServiceType.query.get(id)
    if not service:
        return error_response('Service type not found', 404)
        
    data = request.get_json()
    
    try:
        if 'name' in data:
            service.name = data['name']
        if 'description' in data:
            service.description = data['description']
        if 'base_price' in data:
            service.base_price = data['base_price']
        if 'is_chargeable' in data:
            service.is_chargeable = data['is_chargeable']
        if 'is_active' in data:
            service.is_active = data['is_active']
            
        db.session.commit()
        return success_response(data={'service': service.to_dict()}, message='Service updated successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@services_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_service(id):
    """Soft delete service type (deactivate)"""
    service = ServiceType.query.get(id)
    if not service:
        return error_response('Service type not found', 404)
        
    # We soft delete by setting is_active = False to preserve history
    service.is_active = False
    db.session.commit()
    
    return success_response(message='Service deactivated successfully')
