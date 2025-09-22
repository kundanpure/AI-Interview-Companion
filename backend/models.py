import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from .app import db # Import the 'db' instance from our app

# backend/models.py

class User(db.Model):
    """
    User model for storing user accounts and their interview credits.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Email verification status
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    
    # --- NEW PROFILE FIELDS ---
    name = db.Column(db.String(100), nullable=True)
    target_role = db.Column(db.String(100), nullable=True)
    experience_level = db.Column(db.String(50), nullable=True)
    resume_filename = db.Column(db.String(255), nullable=True) # To store the path to the resume file
    # --- END OF NEW FIELDS ---
    
    # Interview credits
    free_interviews_remaining = db.Column(db.Integer, nullable=False, default=2)
    paid_interviews_remaining = db.Column(db.Integer, nullable=False, default=0)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    interviews = db.relationship('Interview', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>'


class Interview(db.Model):
    """
    Interview model for storing each interview session and its results.
    """
    __tablename__ = 'interviews'

    # Using UUID for the primary key to make it URL-safe and non-sequential
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    mode = db.Column(db.String(50), nullable=False) # 'normal' or 'tech'
    status = db.Column(db.String(50), nullable=False, default='created') # 'created', 'started', 'completed'
    
    # Store dynamic data like user inputs and conversation history
    # JSONB is a high-performance JSON data type in PostgreSQL
    user_data = db.Column(JSONB)
    interviewer_personality = db.Column(JSONB)
    conversation_history = db.Column(JSONB)
    live_feedback = db.Column(JSONB)
    pronunciation_feedback = db.Column(JSONB)
    
    # Store final results
    overall_score = db.Column(db.Float, nullable=True)
    detailed_feedback = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Interview {self.id} for User {self.user_id}>'