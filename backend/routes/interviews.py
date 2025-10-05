# backend/routes/interviews.py
from flask import Blueprint, request, jsonify, current_app
from ..app import db
from ..models import User, Interview, InterviewTurn
from .auth import token_required
from .. import services
import uuid

interviews_bp = Blueprint('interviews', __name__)

DEFAULT_FREE_INTERVIEWS = 2

@interviews_bp.route('/create-session', methods=['POST'])
@token_required
def create_session(current_user):
    try:
        data = request.get_json() or {}
        new_interview = Interview(
            user_id=current_user.id,
            mode=data.get('mode', 'normal'),
            status='created'
        )
        db.session.add(new_interview)
        db.session.commit()
        return jsonify({'session_id': str(new_interview.id)}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating session: {e}")
        return jsonify({'error': 'Failed to create interview session.'}), 500

@interviews_bp.route('/prepare', methods=['POST'])
@token_required
def prepare_interview(current_user):
    """
    JD-aware preparation: Accepts jd_text or jd_url and returns:
    - extracted competencies & rubric
    - first 3 tailored questions
    """
    data = request.get_json() or {}
    jd_text = data.get('jd_text')
    jd_url = data.get('jd_url')
    role = data.get('role', 'Software Engineer')

    if not jd_text and not jd_url:
        return jsonify({'error': 'Provide jd_text or jd_url'}), 400

    try:
        rubric, first_questions = services.build_rubric_and_questions(
            current_user,
            jd_text=jd_text,
            jd_url=jd_url,
            role=role
        )
        return jsonify({'rubric': rubric, 'suggested_questions': first_questions}), 200
    except Exception as e:
        current_app.logger.exception("prepare_interview failed")
        return jsonify({'error': 'Failed to prepare JD-aware rubric.'}), 500

@interviews_bp.route('/start-interview', methods=['POST'])
@token_required
def start_interview(current_user):
    data = request.get_json() or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'error': 'Session ID is required.'}), 400

    try:
        interview = Interview.query.get(uuid.UUID(session_id))
    except Exception:
        interview = None

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    # deduct credits exactly once
    if interview.status == 'created':
        user = User.query.get(current_user.id)
        if user.free_interviews_remaining > 0:
            user.free_interviews_remaining -= 1
            interview.credit_type_used = 'free'
        elif user.paid_interviews_remaining > 0:
            user.paid_interviews_remaining -= 1
            interview.credit_type_used = 'paid'
        else:
            return jsonify({'error': 'No interview credits remaining. Please purchase more.'}), 402

    personality_key = data.get('interviewer_personality')
    interview.interviewer_personality = {'key': personality_key} if personality_key else {'key': 'sarah'}
    # always ensure it's a dict
    interview.user_data = data.get('user_data') or {}
    interview.status = 'started'

    first_question, topic = services.get_next_turn(interview)

    # persist turn 1
    turn = InterviewTurn(
        interview_id=interview.id,
        turn_no=1,
        question=first_question,
        topic=topic
    )
    db.session.add(turn)
    db.session.commit()

    return jsonify({
        'question': first_question,
        'phase': 'welcome',
        'question_counter': 1
    }), 200

@interviews_bp.route('/submit-answer', methods=['POST'])
@token_required
def submit_answer(current_user):
    data = request.get_json() or {}
    session_id = data.get('session_id')
    answer_text = data.get('answer')
    audio_data_url = data.get('audio_data')

    try:
        interview = Interview.query.get(uuid.UUID(session_id))
    except Exception:
        interview = None

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    # find current turn (last)
    last_turn = InterviewTurn.query.filter_by(interview_id=interview.id).order_by(InterviewTurn.turn_no.desc()).first()
    if not last_turn:
        return jsonify({'error': 'Interview has no active question.'}), 400

    if audio_data_url:
        transcript = services.transcribe_audio_data(audio_data_url)
        if transcript:
            answer_text = transcript

    # simple speaking metrics (fast win)
    wpm, fillers = services.quick_speaking_metrics(answer_text or "")

    # update last turn with answer and metrics
    last_turn.answer = answer_text
    last_turn.wpm = wpm
    last_turn.filler_count = fillers
    db.session.commit()

    # live feedback + pronunciation
    live_feedback = services.get_live_feedback(interview, answer_text)
    pronunciation_tips = services.analyze_pronunciation(answer_text or "")

    # ---- CHANGED (guard user_data) ----
    user_exp = (interview.user_data or {}).get("experience")
    total_turns = services.INTERVIEW_PHASES["conversation"]["questions"](user_exp)
    current_turn_no = last_turn.turn_no
    # -----------------------------------

    if current_turn_no >= total_turns:
        interview.status = 'completed'
        db.session.commit()
        return jsonify({
            'interview_complete': True,
            'feedback': live_feedback,
            'pronunciation_tips': pronunciation_tips
        }), 200

    next_question, topic = services.get_next_turn(interview)

    new_turn = InterviewTurn(
        interview_id=interview.id,
        turn_no=current_turn_no + 1,
        question=next_question,
        topic=topic
    )
    db.session.add(new_turn)
    db.session.commit()

    return jsonify({
        'question': next_question,
        'phase': 'conversation',
        'question_counter': current_turn_no + 1,
        'feedback': live_feedback,
        'pronunciation_tips': pronunciation_tips,
        'interview_complete': False
    }), 200

@interviews_bp.route('/skip-question', methods=['POST'])
@token_required
def skip_question(current_user):
    data = request.get_json() or {}
    session_id = data.get('session_id')

    try:
        interview = Interview.query.get(uuid.UUID(session_id))
    except Exception:
        interview = None

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    last_turn = InterviewTurn.query.filter_by(interview_id=interview.id).order_by(InterviewTurn.turn_no.desc()).first()
    if not last_turn:
        return jsonify({'error': 'Interview has no active question.'}), 400

    last_turn.answer = "(Question Skipped)"
    db.session.commit()

    # ---- CHANGED (guard user_data) ----
    user_exp = (interview.user_data or {}).get("experience")
    total_turns = services.INTERVIEW_PHASES["conversation"]["questions"](user_exp)
    current_turn_no = last_turn.turn_no
    # -----------------------------------

    if current_turn_no >= total_turns:
        interview.status = 'completed'
        db.session.commit()
        return jsonify({'interview_complete': True}), 200

    next_question, topic = services.get_next_turn(interview, force_rephrase=True)
    new_turn = InterviewTurn(
        interview_id=interview.id,
        turn_no=current_turn_no + 1,
        question=next_question,
        topic=topic
    )
    db.session.add(new_turn)
    db.session.commit()

    return jsonify({
        'question': next_question,
        'question_counter': current_turn_no + 1,
        'interview_complete': False
    }), 200

@interviews_bp.route('/cancel-interview', methods=['POST'])
@token_required
def cancel_interview(current_user):
    data = request.get_json() or {}
    session_id = data.get('session_id')

    try:
        interview = Interview.query.get(uuid.UUID(session_id))
    except Exception:
        interview = None

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    if interview.status not in ['created', 'started']:
        return jsonify({'error': 'Cannot cancel a completed interview.'}), 400

    # refund exactly the credit used
    if interview.status == 'started' and interview.credit_type_used:
        user = User.query.get(current_user.id)
        if interview.credit_type_used == 'free':
            user.free_interviews_remaining += 1
        elif interview.credit_type_used == 'paid':
            user.paid_interviews_remaining += 1

    interview.status = 'cancelled'
    db.session.commit()

    return jsonify({'message': 'Interview cancelled and credit refunded.'}), 200

@interviews_bp.route('/get-feedback', methods=['POST'])
@token_required
def get_feedback(current_user):
    data = request.get_json() or {}
    session_id = data.get('session_id')

    try:
        interview = Interview.query.get(uuid.UUID(session_id))
    except Exception:
        interview = None

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
    }), 200

@interviews_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    interviews = (Interview.query
                  .filter_by(user_id=current_user.id)
                  .filter(Interview.status == 'completed')
                  .order_by(Interview.created_at.desc())
                  .all())

    history_data = []
    for interview in interviews:
        turns = (InterviewTurn.query
                 .filter_by(interview_id=interview.id)
                 .order_by(InterviewTurn.turn_no.asc())
                 .all())
        history_data.append({
            'id': str(interview.id),
            'created_at': interview.created_at.isoformat(),
            'user_data': interview.user_data,
            'mode': interview.mode,
            'overall_score': interview.overall_score,
            'turns': [{
                'turn_no': t.turn_no,
                'q': t.question,
                'a': t.answer,
                'topic': t.topic,
                'wpm': t.wpm,
                'filler_count': t.filler_count,
                'score': t.score
            } for t in turns]
        })
    return jsonify(history_data), 200

@interviews_bp.route('/detail', methods=['GET'])
@token_required
def get_detail(current_user):
    """
    Returns the full transcript and 'pro suggestions' for a given interview.
    Gated: only for interviews that consumed a PAID credit.
    Query: /api/interviews/detail?session_id=<uuid>
    """
    from ..models import InterviewTurn
    import uuid as _uuid

    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'session_id is required'}), 400

    try:
        interview = Interview.query.get(_uuid.UUID(session_id))
    except Exception:
        interview = None

    if not interview or interview.user_id != current_user.id:
        return jsonify({'error': 'Interview session not found or unauthorized.'}), 404

    # Paywall: only interviews that used a paid credit can view transcript + suggestions
    if interview.credit_type_used != 'paid':
        return jsonify({
            'error': 'This feature is available for paid sessions only.',
            'reason': 'paywall',
            'cta': {
                'title': 'Unlock Transcript & Pro Suggestions',
                'desc': 'See the full Q&A, get drills, follow-ups, and a mini learning plan.',
                'action': 'upgrade'
            }
        }), 402

    turns = (InterviewTurn.query
             .filter_by(interview_id=interview.id)
             .order_by(InterviewTurn.turn_no.asc())
             .all())

    transcript = [{
        'turn_no': t.turn_no,
        'question': t.question,
        'answer': t.answer,
        'topic': t.topic,
        'wpm': t.wpm,
        'filler_count': t.filler_count,
        'score': t.score
    } for t in turns]

    suggestions = services.generate_post_session_suggestions(interview, transcript)

    return jsonify({
        'id': str(interview.id),
        'created_at': interview.created_at.isoformat(),
        'mode': interview.mode,
        'overall_score': interview.overall_score,
        'user_data': interview.user_data,
        'transcript': transcript,
        'suggestions': suggestions
    }), 200
