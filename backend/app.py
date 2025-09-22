import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from .config import config_by_name

db = SQLAlchemy()
bcrypt = Bcrypt()
mail = Mail()
migrate = Migrate()
limiter = None  # initialize later with app

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_CONFIG', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Extensions
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # Sentry (optional)
    if app.config.get('SENTRY_DSN'):
        try:
            import sentry_sdk
            from sentry_sdk.integrations.flask import FlaskIntegration
            sentry_sdk.init(dsn=app.config['SENTRY_DSN'], integrations=[FlaskIntegration()])
        except Exception:
            app.logger.warning("Sentry not initialized; missing package or DSN.")

    # Logging
    logging.basicConfig(level=logging.INFO)
    app.logger.setLevel(logging.INFO)

    # CORS (tighten if origins provided)
    origins = app.config.get('CORS_ALLOW_ORIGINS', ['*'])
    CORS(app, resources={r"/api/*": {"origins": origins}})

    # Rate limit
    global limiter
    limiter = Limiter(key_func=get_remote_address, default_limits=["200 per hour"], storage_uri="memory://")
    limiter.init_app(app)

    # Blueprints
    from .routes.auth import auth_bp
    from .routes.payments import payments_bp
    from .routes.interviews import interviews_bp
    from .routes.user import user_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(interviews_bp, url_prefix='/api/interviews')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy'}), 200

    with app.app_context():
        from . import models
        # use alembic migrations in prod
        pass

    return app
