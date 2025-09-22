import os
from dotenv import load_dotenv

# Find the .env file in the current directory
load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'a_default_secret_key_for_development')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # --- API and Service Keys ---

    # Consolidated Gemini API Keys
    GEMINI_KEYS = [key.strip() for key in os.getenv('GEMINI_KEYS', '').split(',') if key.strip()]

    # OpenAI API Key
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Razorpay Keys
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')


# Dictionary to access config classes by name
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    # THIS LINE IS NOW FIXED
    'default': DevelopmentConfig 
}