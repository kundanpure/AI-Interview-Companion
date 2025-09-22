import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'a_default_secret_key_for_development')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # App URLs
    FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:3000')

    # CORS
    CORS_ALLOW_ORIGINS = [o.strip() for o in os.getenv('CORS_ALLOW_ORIGINS', '*').split(',') if o.strip()]

    # Mail
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME')

    # API Keys
    GEMINI_KEYS = [key.strip() for key in os.getenv('GEMINI_KEYS', '').split(',') if key.strip()]
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    # Razorpay
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

    # Uploads / Storage
    MAX_UPLOAD_MB = int(os.getenv('MAX_UPLOAD_MB', '5'))
    USE_GCS = os.getenv('USE_GCS', 'false').lower() in ('true', '1', 'yes')
    GCS_BUCKET = os.getenv('GCS_BUCKET')
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    # Observability (optional)
    SENTRY_DSN = os.getenv('SENTRY_DSN')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
