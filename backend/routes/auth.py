import jwt
import secrets
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, Blueprint, current_app
from ..app import db, bcrypt
from ..models import User
from ..utils import send_verification_email
from ..utils import send_password_reset_email

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Malformed token header'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password_hash=hashed_password, is_verified=False)

    db.session.add(new_user)
    db.session.commit()

    try:
        send_verification_email(new_user.email)  # uses FRONTEND_BASE_URL internally
        return jsonify({'message': 'Registration successful! Please check your email to verify your account.'}), 201
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email to {new_user.email}: {e}")
        return jsonify({'error': 'User registered, but the verification email could not be sent. Please contact support.'}), 500

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    from ..utils import confirm_verification_token
    email = confirm_verification_token(token)
    if not email:
        return jsonify({'error': 'The verification link is invalid or has expired.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found for this verification token.'}), 404

    if user.is_verified:
        return jsonify({'message': 'Account already verified. Please log in.'}), 200
    else:
        user.is_verified = True
        db.session.commit()
        return jsonify({'message': 'You have successfully verified your account. You can now log in.'}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        if not user.is_verified:
            return jsonify({'error': 'Please verify your email address before logging in.'}), 403

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        user_data = {
            'email': user.email,
            'name': user.name,
            'target_role': user.target_role,
            'experience_level': user.experience_level,
            'free_interviews': user.free_interviews_remaining,
            'paid_interviews': user.paid_interviews_remaining
        }
        return jsonify({'token': token, 'user': user_data}), 200

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If your email is registered, you will receive a password reset link.'}), 200

    # secure token (store hash only)
    reset_token = secrets.token_urlsafe(32)
    reset_hash = hashlib.sha256(reset_token.encode('utf-8')).hexdigest()
    user.reset_token_hash = reset_hash
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    try:
        send_password_reset_email(user.email, reset_token)  # includes FRONTEND_BASE_URL
        return jsonify({'message': 'Password reset link has been sent to your email.'}), 200
    except Exception as e:
        current_app.logger.error(f"Failed to send password reset email to {user.email}: {e}")
        return jsonify({'error': 'Failed to send password reset email. Please try again later.'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    user = User.query.filter(User.reset_token_hash.isnot(None)).filter(User.reset_token_expires.isnot(None)).first()
    if not user:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    if user.reset_token_expires < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    # compare hashes
    provided_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    if provided_hash != user.reset_token_hash:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    # rotate token and set password
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({'message': 'Your password has been successfully reset. You can now log in with your new password.'}), 200
