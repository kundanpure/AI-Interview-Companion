# backend/routes/user.py
from flask import Blueprint, request, jsonify
from ..app import db
from ..models import User
from .auth import token_required
from .. import services

user_bp = Blueprint("user", __name__)

@user_bp.get("/me")
@token_required
def get_me(current_user: User):
    return jsonify({
        "email": current_user.email,
        "name": current_user.name,
        "target_role": current_user.target_role,
        "experience_level": current_user.experience_level,
        "is_verified": current_user.is_verified,
        "free_interviews": current_user.free_interviews_remaining,
        "paid_interviews": current_user.paid_interviews_remaining,
    }), 200

@user_bp.put("/me")
@token_required
def update_me(current_user: User):
    data = request.get_json() or {}
    allowed = {"name", "target_role", "experience_level"}
    for key in allowed:
        if key in data:
            setattr(current_user, key, data[key])
    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200

@user_bp.post("/resume/extract")
@token_required
def extract_resume(current_user: User):
    """
    Turn raw resume text into a STAR story bank.
    Body: { "resume_text": "...." }
    """
    data = request.get_json() or {}
    resume_text = data.get("resume_text", "")
    if not resume_text or len(resume_text.strip()) < 30:
        return jsonify({"error": "Please provide resume_text with enough content."}), 400

    stories = services.extract_stories_from_resume(current_user, resume_text)
    return jsonify({"stories": stories}), 200
