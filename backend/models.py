import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from .app import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    # secure password reset
    reset_token_hash = db.Column(db.String(64), nullable=True)  # SHA256 hex
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    name = db.Column(db.String(100), nullable=True)
    target_role = db.Column(db.String(100), nullable=True)
    experience_level = db.Column(db.String(50), nullable=True)
    resume_filename = db.Column(db.String(255), nullable=True)

    free_interviews_remaining = db.Column(db.Integer, nullable=False, default=2)
    paid_interviews_remaining = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    interviews = db.relationship('Interview', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>'

class Interview(db.Model):
    __tablename__ = 'interviews'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    mode = db.Column(db.String(50), nullable=False)  # 'normal' or 'tech'
    status = db.Column(db.String(50), nullable=False, default='created')

    user_data = db.Column(JSONB)
    interviewer_personality = db.Column(JSONB)
    conversation_history = db.Column(JSONB)  # legacy; keep for backward compat
    live_feedback = db.Column(JSONB)
    pronunciation_feedback = db.Column(JSONB)

    # which bucket was consumed on start
    credit_type_used = db.Column(db.String(10), nullable=True)  # 'free' | 'paid'

    overall_score = db.Column(db.Float, nullable=True)
    detailed_feedback = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    turns = db.relationship('InterviewTurn', backref='interview', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Interview {self.id} for User {self.user_id}>'

class InterviewTurn(db.Model):
    __tablename__ = 'interview_turns'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    interview_id = db.Column(UUID(as_uuid=True), db.ForeignKey('interviews.id'), nullable=False, index=True)
    turn_no = db.Column(db.Integer, nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=True)
    topic = db.Column(db.String(100), nullable=True)
    wpm = db.Column(db.Float, nullable=True)
    filler_count = db.Column(db.Integer, nullable=True)
    duration_ms = db.Column(db.Integer, nullable=True)
    score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    razorpay_order_id = db.Column(db.String(64), unique=True, nullable=False)
    razorpay_payment_id = db.Column(db.String(64), nullable=True)
    amount = db.Column(db.Integer, nullable=False)  # paise
    currency = db.Column(db.String(8), nullable=False, default='INR')
    status = db.Column(db.String(32), nullable=False, default='created')  # created|paid|failed
    signature_ok = db.Column(db.Boolean, nullable=True)
    raw_payload = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
