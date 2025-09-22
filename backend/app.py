# backend/app.py

import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_migrate import Migrate
from .config import config_by_name

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()
mail = Mail()
migrate = Migrate()

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_CONFIG', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Add Mail configuration from environment variables
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

    # Initialize extensions with the app instance
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # --- START OF CHANGES ---
    # Import and register blueprints
    from .routes.auth import auth_bp
    from .routes.payments import payments_bp
    from .routes.interviews import interviews_bp
    from .routes.user import user_bp # <-- 1. IMPORT THE NEW USER BLUEPRINT

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(interviews_bp, url_prefix='/api/interviews')
    app.register_blueprint(user_bp, url_prefix='/api/user') # <-- 2. REGISTER THE BLUEPRINT
    # --- END OF CHANGES ---

    # A simple health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy'}), 200
        
    with app.app_context():
        from . import models
        # Using db.create_all() is okay for development, but migrations are better
        # For this to work with migrations, you might want to comment this out
        # and rely on 'flask db upgrade'
        # db.create_all() 
        pass

    return app