from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from flask_mail import Message
from .app import mail

def generate_verification_token(email):
    """Generates a secure, timed token for email verification."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-verification-salt')

def confirm_verification_token(token, expiration=3600):
    """Confirms the verification token. Returns the email if valid, otherwise None."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(
            token,
            salt='email-verification-salt',
            max_age=expiration  # Token is valid for 1 hour
        )
        return email
    except Exception:
        return None

def send_verification_email(user_email):
    """Sends the verification email to the new user."""
    token = generate_verification_token(user_email)
    
    # IMPORTANT: In production, change 'http://localhost:3000' to your frontend's domain
    # e.g., f"https://your-app-name.netlify.app/verify-email/{token}"
    verify_url = f"http://localhost:3000/verify-email/{token}"
    
    # Simple HTML content for the email
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
    
    msg = Message(
        subject="Confirm Your Email - AI Interview Coach",
        recipients=[user_email],
        html=html_body
    )
    
    mail.send(msg)

# THIS IS THE CORRECTED CODE
def send_password_reset_email(user_email, reset_token):
    """Sends the password reset email to the user."""
    reset_url = f"http://localhost:3000/reset-password/{reset_token}"
    
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
    
    # Corrected logic starts here
    msg = Message(
        subject="Reset Your Password - AI Interview Coach",
        recipients=[user_email],
        html=html_body
    )
    
    mail.send(msg)