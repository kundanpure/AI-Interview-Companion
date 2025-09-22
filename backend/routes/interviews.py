from flask import Blueprint, request, jsonify, current_app
from ..app import db
from ..models import User, Interview
from .auth import token_required
from .. import services
import uuid

interviews_bp = Blueprint('interviews', __name__)

DEFAULT_FREE_INTERVIEWS = 2 

@interviews_bp.route('/create-session', methods=['POST'])
@token_required
def create_session(current_user):
    # THIS ENDPOINT NO LONGER DEDUCTS CREDITS.
    # It only creates a placeholder session.
    try:
        data = request.get_json()
        new_interview = Interview(
            user_id=current_user.id,
            mode=data.get('mode', 'normal'),
            status='created' # Status is 'created', not 'started'
        )
        db.session.add(new_interview)
        db.session.commit()
        return jsonify({'session_id': str(new_interview.id)}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating session: {e}")
        return jsonify({'error': 'Failed to create interview session.'}), 500

@interviews_bp.route('/start-interview', methods=['POST'])
@token_required
def start_interview(current_user):
    data = request.get_json()
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({'error': 'Session ID is required.'}), 400

    interview = Interview.query.get(uuid.UUID(session_id))

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404
    
    # --- THIS IS THE NEW, SAFER LOGIC ---
    # Only check for credits and deduct them right before starting.
    if interview.status == 'created':
        user = User.query.get(current_user.id)
        if user.free_interviews_remaining > 0:
            user.free_interviews_remaining -= 1
        elif user.paid_interviews_remaining > 0:
            user.paid_interviews_remaining -= 1
        else:
            return jsonify({'error': 'No interview credits remaining. Please purchase more.'}), 402
    # --- END OF NEW LOGIC ---

    personality_key = data.get('interviewer_personality')
    interview.interviewer_personality = {'key': personality_key}
    interview.user_data = data.get('user_data')
    interview.status = 'started'
    
    first_question, topic = services.get_next_turn(interview)

    interview.conversation_history = [{'q': first_question, 'a': None, 'topic': topic}]
    
    db.session.commit()
    
    return jsonify({
        'question': first_question,
        'phase': 'welcome',
        'question_counter': 1
    }), 200

# --- The rest of the file remains the same ---
@interviews_bp.route('/submit-answer', methods=['POST'])
@token_required
def submit_answer(current_user):
    data = request.get_json()
    session_id = data.get('session_id')
    answer_text = data.get('answer')
    audio_data_url = data.get('audio_data')

    interview = Interview.query.get(uuid.UUID(session_id))
    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    if audio_data_url:
        answer_text = services.transcribe_audio_data(audio_data_url)

    history = list(interview.conversation_history)
    history[-1]['a'] = answer_text
    interview.conversation_history = history
    
    live_feedback = services.get_live_feedback(interview, answer_text)
    pronunciation_tips = services.analyze_pronunciation(answer_text)

    total_turns = services.INTERVIEW_PHASES["conversation"]["questions"](interview.user_data.get("experience"))
    current_turn = len(history)

    if current_turn >= total_turns:
        interview.status = 'completed'
        db.session.commit()
        return jsonify({
            'interview_complete': True,
            'feedback': live_feedback,
            'pronunciation_tips': pronunciation_tips
        })

    next_question, topic = services.get_next_turn(interview)
    history.append({'q': next_question, 'a': None, 'topic': topic})
    interview.conversation_history = history
    db.session.commit()

    return jsonify({
        'question': next_question,
        'phase': 'conversation',
        'question_counter': current_turn + 1,
        'feedback': live_feedback,
        'pronunciation_tips': pronunciation_tips,
        'interview_complete': False
    })

@interviews_bp.route('/skip-question', methods=['POST'])
@token_required
def skip_question(current_user):
    data = request.get_json()
    session_id = data.get('session_id')
    interview = Interview.query.get(uuid.UUID(session_id))

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    history = list(interview.conversation_history)
    history[-1]['a'] = "(Question Skipped)"
    history[-1]['skipped'] = True
    interview.conversation_history = history

    total_turns = services.INTERVIEW_PHASES["conversation"]["questions"](interview.user_data.get("experience"))
    current_turn = len(history)

    if current_turn >= total_turns:
        interview.status = 'completed'
        db.session.commit()
        return jsonify({'interview_complete': True})

    next_question, topic = services.get_next_turn(interview, force_rephrase=True)
    history.append({'q': next_question, 'a': None, 'topic': topic})
    interview.conversation_history = history
    db.session.commit()

    return jsonify({
        'question': next_question,
        'question_counter': current_turn + 1,
        'interview_complete': False
    })

@interviews_bp.route('/cancel-interview', methods=['POST'])
@token_required
def cancel_interview(current_user):
    data = request.get_json()
    session_id = data.get('session_id')
    interview = Interview.query.get(uuid.UUID(session_id))

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    if interview.status not in ['created', 'started']:
        return jsonify({'error': 'Cannot cancel a completed interview.'}), 400

    # We only refund if the credit was already deducted (i.e., status was 'started')
    if interview.status == 'started':
        user = User.query.get(current_user.id)
        if user.free_interviews_remaining < DEFAULT_FREE_INTERVIEWS:
            user.free_interviews_remaining += 1
        else:
            user.paid_interviews_remaining += 1

    interview.status = 'cancelled'
    db.session.commit()

    return jsonify({'message': 'Interview cancelled and credit refunded.'}), 200

@interviews_bp.route('/get-feedback', methods=['POST'])
@token_required
def get_feedback(current_user):
    data = request.get_json()
    session_id = data.get('session_id')

    interview = Interview.query.get(uuid.UUID(session_id))
    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    if not interview.detailed_feedback:
        detailed_feedback, overall_score = services.generate_final_feedback(interview)
        interview.detailed_feedback = detailed_feedback
        interview.overall_score = overall_score
        interview.status = 'completed'
        db.session.commit()

    return jsonify({
        'detailed_feedback': interview.detailed_feedback,
        'overall_score': interview.overall_score
    })

@interviews_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    interviews = Interview.query.filter_by(user_id=current_user.id)\
                                .filter(Interview.status == 'completed')\
                                .order_by(Interview.created_at.desc()).all()

    history_data = [{
        'id': str(interview.id),
        'created_at': interview.created_at.isoformat(),
        'user_data': interview.user_data,
        'mode': interview.mode,
        'overall_score': interview.overall_score,
    } for interview in interviews]
    
    return jsonify(history_data), 200