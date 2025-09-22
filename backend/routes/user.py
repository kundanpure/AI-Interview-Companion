# backend/routes/user.py

import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from .auth import token_required
from ..app import db
from ..models import User

# Create a Blueprint for user-related routes
user_bp = Blueprint('user', __name__)

# Define allowed file extensions for resumes
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/profile', methods=['POST'])
@token_required
def update_profile(current_user):
    """
    Handles user profile updates, including resume upload.
    Expects multipart/form-data.
    """
    # 1. Get Text Data from Form
    name = request.form.get('name')
    target_role = request.form.get('target_role')
    experience_level = request.form.get('experience_level')

    if not all([name, target_role, experience_level]):
        return jsonify({'error': 'Name, target role, and experience level are required.'}), 400

    # 2. Update User Model in Database
    user_to_update = User.query.get(current_user.id)
    if not user_to_update:
        return jsonify({'error': 'User not found.'}), 404

    user_to_update.name = name
    user_to_update.target_role = target_role
    user_to_update.experience_level = experience_level

    # 3. Handle Resume File Upload
    if 'resume' in request.files:
        file = request.files['resume']
        if file and allowed_file(file.filename):
            # Create a secure, unique filename to prevent conflicts
            filename = secure_filename(f"user_{current_user.id}_{file.filename}")
            
            # This creates an 'uploads' folder in your project's root directory
            upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # Save the filename to the database
            user_to_update.resume_filename = filename
        elif file.filename != '':
            return jsonify({'error': 'Invalid file type. Only PDF is allowed.'}), 400

    # 4. Commit Changes and Return Updated User Data
    db.session.commit()
    
    # Prepare the updated user data to send back to the frontend
    updated_user_data = {
        'email': user_to_update.email,
        'name': user_to_update.name,
        'target_role': user_to_update.target_role,
        'experience_level': user_to_update.experience_level,
        'free_interviews': user_to_update.free_interviews_remaining,
        'paid_interviews': user_to_update.paid_interviews_remaining
    }

    return jsonify({'message': 'Profile updated successfully!', 'user': updated_user_data}), 200