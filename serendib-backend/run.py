"""Application Entry Point"""
import os
from app import create_app, db

env = os.getenv('FLASK_ENV', 'development')
app = create_app(env)

@app.shell_context_processor
def make_shell_context():
    from app.models.user import User
    from app.models.branch import Branch
    from app.models.room import Room
    from app.models.booking import Booking
    
    return {'db': db, 'User': User, 'Branch': Branch, 'Room': Room, 'Booking': Booking}

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
