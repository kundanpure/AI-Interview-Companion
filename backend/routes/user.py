import os
import io
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from .auth import token_required
from ..app import db
from ..models import User

user_bp = Blueprint('user', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _is_pdf_signature(file_bytes: bytes) -> bool:
    # Simple magic check: PDF starts with '%PDF'
    return file_bytes[:4] == b'%PDF'

def _save_resume(file_storage, user_id) -> str:
    # Read bytes once (also used for signature/size check)
    file_bytes = file_storage.read()
    file_storage.stream.seek(0)

    max_size = current_app.config.get('MAX_UPLOAD_MB', 5) * 1024 * 1024
    if len(file_bytes) > max_size:
        raise ValueError('File too large')

    if not _is_pdf_signature(file_bytes):
        raise ValueError('Invalid PDF file')

    filename = secure_filename(f"user_{user_id}_{file_storage.filename}")

    if current_app.config.get('USE_GCS'):
        # Save to Google Cloud Storage
        from google.cloud import storage
        bucket_name = current_app.config['GCS_BUCKET']
        if not bucket_name:
            raise RuntimeError("GCS_BUCKET not configured")
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(f"resumes/{filename}")
        blob.upload_from_file(file_storage.stream, content_type='application/pdf')
        return f"gcs://{bucket_name}/resumes/{filename}"
    else:
        # Local fallback
        upload_folder = os.path.join(current_app.root_path, '..', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file_storage.save(file_path)
        return file_path

@user_bp.route('/profile', methods=['POST'])
@token_required
def update_profile(current_user):
    name = request.form.get('name')
    target_role = request.form.get('target_role')
    experience_level = request.form.get('experience_level')

    if not all([name, target_role, experience_level]):
        return jsonify({'error': 'Name, target role, and experience level are required.'}), 400

    user_to_update = User.query.get(current_user.id)
    if not user_to_update:
        return jsonify({'error': 'User not found.'}), 404

    user_to_update.name = name
    user_to_update.target_role = target_role
    user_to_update.experience_level = experience_level

    if 'resume' in request.files:
        file = request.files['resume']
        if file and allowed_file(file.filename):
            try:
                stored_path = _save_resume(file, current_user.id)
                user_to_update.resume_filename = stored_path
            except Exception as e:
                current_app.logger.warning(f"Resume upload failed: {e}")
                return jsonify({'error': str(e)}), 400
        elif file.filename != '':
            return jsonify({'error': 'Invalid file type. Only PDF is allowed.'}), 400

    db.session.commit()

    updated_user_data = {
        'email': user_to_update.email,
        'name': user_to_update.name,
        'target_role': user_to_update.target_role,
        'experience_level': user_to_update.experience_level,
        'free_interviews': user_to_update.free_interviews_remaining,
        'paid_interviews': user_to_update.paid_interviews_remaining
    }

    return jsonify({'message': 'Profile updated successfully!', 'user': updated_user_data}), 200
