import os
import re
import json
import logging
import random
import requests
import base64
import tempfile
from difflib import SequenceMatcher
from flask import current_app

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
try:
    import speech_recognition as sr
except ImportError:
    sr = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INTERVIEWER_PERSONALITIES = {
  'priya': {'name': 'Priya', 'emoji': '👩🏽‍💼', 'style': 'empathetic and thoughtful','openers': ["Namaste, great to meet you.","Hi, thanks for joining.","Happy to connect today."], 'gender': 'female','accent': 'en-IN'},
  'arjun': {'name': 'Arjun', 'emoji': '👨🏽‍💼', 'style': 'calm and structured', 'openers': ["Hello, welcome.","Nice to meet you.","Thanks for joining in."], 'gender': 'male', 'accent': 'en-IN'},
  'sarah': {'name': 'Sarah', 'emoji': '👩‍💼', 'style': 'warm and encouraging', 'openers': ["Lovely to meet you.","Thanks for joining.","I’m glad you’re here."], 'gender': 'female', 'accent': 'en-US'},
  'john':  {'name': 'John', 'emoji': '👨‍💼', 'style': 'professional and direct', 'openers': ["Good to meet you.","Thanks for the time.","Appreciate you being here."], 'gender': 'male', 'accent': 'en-US'},
  'alex':  {'name': 'Alex', 'emoji': '🧑‍💼', 'style': 'casual and innovative', 'openers': ["Hey, welcome!","Great to see you.","Thanks for hopping on."], 'gender': 'male', 'accent': 'en-GB'},
}
LANGUAGES = {'English': 'en-US', 'Hindi': 'hi-IN', 'Spanish': 'es-ES', 'French': 'fr-FR'}
TECH_DOMAIN_LABELS = {'DSA':'Data Structures & Algorithms', 'OOP':'Object-Oriented Programming', 'OS':'Operating Systems', 'CN':'Computer Networks', 'DBMS':'Database Management Systems', 'SE':'Software Engineering'}
PHASE_FLOW = {"normal": ["welcome", "conversation", "closing"], "tech": ["welcome", "conversation", "closing"]}

def normalize_experience(exp):
    if not exp: return "Entry-level"
    e = exp.lower()
    if any(k in e for k in ["fresher", "campus", "intern", "entry"]): return "Entry-level"
    return "Experienced"

INTERVIEW_PHASES = {
    "welcome": {"questions": lambda exp: 1},
    "conversation": {"questions": lambda exp: 8 if normalize_experience(exp) == "Entry-level" else 12},
    "closing": {"questions": lambda exp: 1}
}

# --- Gemini rotation
paid_key_index = 0

def call_gemini(prompt: str, user, max_tokens: int = 600, temperature: float = 0.9):
    global paid_key_index
    is_paid_user = user.paid_interviews_remaining > 0 if user else False
    all_configured_keys = current_app.config.get('GEMINI_KEYS', [])
    if not all_configured_keys:
        raise RuntimeError("NO_SERVER_API_KEY: Gemini API keys are not configured in the .env file.")

    if is_paid_user:
        api_keys_to_try = all_configured_keys
    else:
        api_keys_to_try = [all_configured_keys[0]]

    for i in range(len(api_keys_to_try)):
        current_index = (paid_key_index + i) % len(api_keys_to_try) if is_paid_user else 0
        key_to_try = api_keys_to_try[current_index]

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key_to_try}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "topK": 40, "topP": 0.95, "maxOutputTokens": max_tokens}
        }

        try:
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=45)
            if response.status_code == 429:
                logger.warning(f"Rate limit hit for key index {current_index}. Rotating key.")
                if is_paid_user: paid_key_index = (paid_key_index + 1) % len(api_keys_to_try)
                continue
            response.raise_for_status()
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text'].strip()
        except requests.RequestException as e:
            logger.error(f"Gemini request failed idx {current_index}: {e}")
            if is_paid_user: paid_key_index = (paid_key_index + 1) % len(api_keys_to_try)
            continue
    raise RuntimeError("All Gemini API keys failed.")

def _clean_json_text(raw: str) -> str:
    txt = (raw or "").strip()
    txt = re.sub(r"^```(?:json)?\s*", "", txt, flags=re.IGNORECASE)
    txt = re.sub(r"\s*```$", "", txt)
    return txt

def extract_json_object(raw: str):
    cleaned = _clean_json_text(raw)
    m = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not m: return None
    try: return json.loads(m.group(0))
    except json.JSONDecodeError: return None

def too_similar(q1, q2):
    if not q1 or not q2: return False
    return SequenceMatcher(None, q1.lower(), q2.lower()).ratio() > 0.85

def _get_conversation_tail(interview, length=4):
    from .models import InterviewTurn
    turns = InterviewTurn.query.filter_by(interview_id=interview.id)\
            .order_by(InterviewTurn.turn_no.desc()).limit(length).all()
    recent = list(reversed(turns))
    return "\n".join([f"Q: {t.question}\nA: {t.answer or '[no answer]'}" for t in recent])

def get_next_turn(interview, force_rephrase=False):
    personality_key = interview.interviewer_personality['key']
    p = INTERVIEWER_PERSONALITIES.get(personality_key, INTERVIEWER_PERSONALITIES['sarah'])
    user_name = (interview.user_data or {}).get('name', 'Candidate')
    user_role = (interview.user_data or {}).get('role', 'Software Engineer')
    user_exp = normalize_experience((interview.user_data or {}).get('experience', 'Entry-level'))

    from .models import InterviewTurn
    first_turn = InterviewTurn.query.filter_by(interview_id=interview.id).count() == 0
    conversation_tail = _get_conversation_tail(interview)

    if first_turn:
        prompt = f"""You are {p['name']} ({p['style']}). Start a job interview with {user_name} for a {user_role} role. Greet them warmly and ask for a brief self-introduction. Keep it to 1-2 friendly sentences. Return JSON with a "message" key."""
    else:
        prompt = f"""You are {p['name']}, continuing an interview with {user_name}. Recent conversation: {conversation_tail}. Ask a natural, conversational follow-up question. Avoid repeating topics. If rephrasing, simplify. Return JSON with "message" and "topic" keys."""

    for _ in range(3):
        raw_response = call_gemini(prompt, user=interview.user, max_tokens=200, temperature=0.85)
        response_obj = extract_json_object(raw_response)
        if response_obj and 'message' in response_obj:
            question_text = response_obj['message'].strip()
            # ensure non-duplicate
            if not conversation_tail or question_text not in conversation_tail:
                return question_text, response_obj.get('topic', 'general')
    return ("So, tell me about a time you faced a challenge at work.", "problem-solving")

def get_live_feedback(interview, answer: str):
    if not answer or not answer.strip(): return "It's okay, take a moment to think. Try to structure your answer."
    length = len(answer.strip())
    if length < 50: return "Good start. Could you elaborate on that with a specific example?"
    elif length > 800: return "That's a very detailed response, thank you. Try to summarize the key takeaway next time."
    else: return "Good, that's a well-paced answer."

def analyze_pronunciation(text: str):
    feedback, tech_terms = [], {'algorithm': 'AL-guh-rith-um', 'api': 'AY-pee-eye', 'scalability': 'skay-luh-BIL-i-tee'}
    if text:
        words = set(re.findall(r"\b[\w']+\b", text.lower()))
        for term, pronunciation in tech_terms.items():
            if term in words: feedback.append(f"Practice '{term}': say {pronunciation}.")
        if 'um' in words or 'uh' in words or 'like' in words:
            feedback.append("Confident speaking tip: Try a brief pause instead of filler words.")
    return feedback

def generate_final_feedback(interview):
    from .models import InterviewTurn
    turns = InterviewTurn.query.filter_by(interview_id=interview.id).order_by(InterviewTurn.turn_no.asc()).all()
    qa_pairs = "\n".join([f"Q: {t.question}\nA: {t.answer or ''}" for t in turns if (t.answer and t.answer != "(Question Skipped)")])
    user_data = interview.user_data or {}
    prompt = f"""As an expert career coach, provide a concise, actionable report in markdown for a mock interview for a {user_data.get('role', 'Software Engineer')} role. Based ONLY on the transcript, include sections for Overall Summary, Strengths (2-3 bullets), and Areas for Improvement (2-3 bullets). End with a single line: 'Final Score: X.X/10'.\n\nTranscript:\n---\n{qa_pairs}\n---"""
    feedback_text = call_gemini(prompt, user=interview.user, max_tokens=1000, temperature=0.7)
    score = 7.5
    score_match = re.search(r'Final Score:\s*(\d+(\.\d+)?)\s*/\s*10', feedback_text)
    if score_match:
        score = float(score_match.group(1))
        feedback_text = feedback_text[:score_match.start()].strip()
    return feedback_text, score

def _transcribe_openai(audio_bytes):
    if not OpenAI or not current_app.config.get('OPENAI_API_KEY'):
        logger.warning("OpenAI library or API key not available for STT.")
        return None
    try:
        with tempfile.NamedTemporaryFile(delete=True, suffix=".webm") as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file.seek(0)
            client = OpenAI(api_key=current_app.config['OPENAI_API_KEY'])
            transcript = client.audio.transcriptions.create(model="whisper-1", file=tmp_file)
            return transcript.text.strip()
    except Exception as e:
        logger.error(f"OpenAI STT failed: {e}")
        return None

def _transcribe_google(audio_bytes):
    if not sr:
        logger.warning("SpeechRecognition library not available.")
        return ""
    r = sr.Recognizer()
    try:
        with tempfile.NamedTemporaryFile(delete=True, suffix=".wav") as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file.seek(0)
            with sr.AudioFile(tmp_file.name) as source:
                audio = r.record(source)
        return r.recognize_google(audio)
    except Exception as e:
        logger.error(f"Google STT failed: {e}")
        return ""

def transcribe_audio_data(audio_data_url: str):
    try:
        header, b64_data = audio_data_url.split(',', 1)
        audio_bytes = base64.b64decode(b64_data)
        provider = os.getenv('STT_PROVIDER', 'google').lower()

        if provider == 'openai':
            result = _transcribe_openai(audio_bytes)
            if result is not None: return result
            logger.warning("OpenAI STT failed, falling back to Google.")

        return _transcribe_google(audio_bytes)
    except Exception as e:
        logger.error(f"Audio transcription failed in the main function: {e}")
        return ""

# ---------- Differentiators ----------

def quick_speaking_metrics(text: str):
    """Very simple WPM + filler count for fast win."""
    words = len(re.findall(r"\b[\w']+\b", text))
    # assume ~60s answer when no audio duration available
    wpm = words  # ~words per minute proxy
    fillers = len(re.findall(r"\b(um|uh|like)\b", text.lower()))
    return float(wpm), int(fillers)

def _fetch_url_text(jd_url: str) -> str:
    try:
        r = requests.get(jd_url, timeout=15)
        r.raise_for_status()
        # naive extraction, better: use readability
        return re.sub(r'<[^>]+>', ' ', r.text)
    except Exception:
        return ""

def build_rubric_and_questions(user, jd_text: str = None, jd_url: str = None, role: str = 'Software Engineer'):
    if not jd_text and jd_url:
        jd_text = _fetch_url_text(jd_url)
    jd_text = (jd_text or '')[:20000]

    prompt = f"""
You are a hiring expert. From the Job Description below, extract:
1) top 6 competencies (name + behavioral & technical indicators),
2) a scoring rubric (criteria with 1-5 anchors),
3) 3 tailored opening questions.

Return strict JSON with keys: competencies (list), rubric (list of {{criterion, anchors:[1..5]}}), questions (list).
JD:
{jd_text}
"""
    raw = call_gemini(prompt, user=user, max_tokens=900, temperature=0.4)
    obj = extract_json_object(raw)
    if not obj:
        obj = {"competencies": [], "rubric": [], "questions": [
            f"Walk me through a recent project relevant to {role}.",
            "Describe a challenging problem you solved and your impact.",
            "How do you prioritize tasks when everything is urgent?"
        ]}
    return obj, obj.get('questions', [])[:3]

def extract_stories_from_resume(user, resume_text: str):
    prompt = f"""
Turn the resume text below into a STAR Story Bank. For each story, include:
- title
- situation
- task
- action
- result (with metrics if present)
- tags (skills/competencies)
Return JSON: stories: [ ... ].
Resume:
{resume_text}
"""
    raw = call_gemini(prompt, user=user, max_tokens=1000, temperature=0.5)
    obj = extract_json_object(raw)
    if not obj: obj = {"stories": []}
    return obj.get('stories', [])
