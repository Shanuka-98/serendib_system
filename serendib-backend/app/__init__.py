"""Flask Application Factory"""
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from flask_migrate import Migrate

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()
migrate = Migrate()

def create_app(config_name='development'):
    from app.config import config
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.url_map.strict_slashes = False
    
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    
    # Enable CORS - Allow localhost and ngrok for development/testing
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173", 
                "http://127.0.0.1:5173",
                "https://nigel-unstation-meaghan.ngrok-free.dev",
                # Allow any ngrok subdomain for flexibility
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With", "ngrok-skip-browser-warning"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })

    
    register_blueprints(app)
    register_error_handlers(app)
    register_jwt_callbacks(app)
    
    import os
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    return app

def register_blueprints(app):
    from app.routes.auth import auth_bp
    from app.routes.rooms import rooms_bp
    from app.routes.bookings import bookings_bp
    from app.routes.payments import payments_bp
    from app.routes.service_requests import service_requests_bp
    from app.routes.notifications import notifications_bp
    from app.routes.loyalty import loyalty_bp
    from app.routes.admin import admin_bp
    from app.routes.analytics import analytics_bp
    from app.routes.stripe_payments import stripe_bp
    from app.routes.promotions import promotions_bp
    from app.routes.shifts import shifts_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(rooms_bp, url_prefix='/api/rooms')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(service_requests_bp, url_prefix='/api/service-requests')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(loyalty_bp, url_prefix='/api/loyalty')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(stripe_bp, url_prefix='/api/stripe')
    app.register_blueprint(promotions_bp, url_prefix='/api/promotions')
    app.register_blueprint(shifts_bp, url_prefix='/api/shifts')
    
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'Serendib Hotels API', 'version': '1.0.0'}), 200
    
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Welcome to Serendib Smart Hotel Management System API',
            'version': '1.0.0',
            'docs': '/api/docs'
        }), 200

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': 'An error occurred'}), 500

def register_jwt_callbacks(app):
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token Expired', 'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid Token', 'message': 'Token verification failed'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization Required', 'message': 'No token provided'}), 401
