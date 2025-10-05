# backend/app.py
import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_cors import CORS

from .config import config_by_name

db = SQLAlchemy()
bcrypt = Bcrypt()
mail = Mail()

def create_app(config_name: str = None):
    app = Flask(__name__)
    cfg_name = config_name or os.getenv("FLASK_CONFIG", "default")
    app.config.from_object(config_by_name[cfg_name])

    # Request size limit from env (MB)
    max_mb = app.config.get("MAX_UPLOAD_MB", 5)
    app.config["MAX_CONTENT_LENGTH"] = max_mb * 1024 * 1024

    # Extensions
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    # CORS
    origins = app.config.get("CORS_ALLOW_ORIGINS", ["*"])
    CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)

    # Blueprints
    with app.app_context():
        from .routes.auth import auth_bp
        from .routes.interviews import interviews_bp
        from .routes.payments import payments_bp
        from .routes.user import user_bp

        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        app.register_blueprint(interviews_bp, url_prefix="/api/interviews")
        app.register_blueprint(payments_bp, url_prefix="/api/payments")
        app.register_blueprint(user_bp, url_prefix="/api/user")

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True}), 200

    return app
