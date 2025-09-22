from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from flask_mail import Message
from .app import mail

def generate_verification_token(email):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-verification-salt')

def confirm_verification_token(token, expiration=86400):  # 24h
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-verification-salt', max_age=expiration)
        return email
    except Exception:
        return None

def send_verification_email(user_email):
    token = generate_verification_token(user_email)
    frontend = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')
    verify_url = f"{frontend}/verify-email/{token}"

    html_body = f"""
    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to AI Interview Coach!</h2>
        <p>Thanks for signing up. Please click the button below to activate your account.</p>
        <a href="{verify_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Verify Your Email
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">
            If you did not sign up for this account, you can safely ignore this email.
        </p>
    </div>
    """

    msg = Message(subject="Confirm Your Email - AI Interview Coach", recipients=[user_email], html=html_body)
    mail.send(msg)

def send_password_reset_email(user_email, reset_token):
    frontend = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')
    reset_url = f"{frontend}/reset-password/{reset_token}"

    html_body = f"""
    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>AI Interview Coach Password Reset</h2>
        <p>You requested a password reset. Please click the button below to reset your password.</p>
        <a href="{reset_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Reset Password
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">
            If you didn't request this reset, you can safely ignore this email.
        </p>
    </div>
    """
    msg = Message(subject="Reset Your Password - AI Interview Coach", recipients=[user_email], html=html_body)
    mail.send(msg)
