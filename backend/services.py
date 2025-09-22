# backend/services.py

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

# Optional STT imports
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

# --- Constants ---
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

# --- Gemini API Call Service with Tiered Keys & Rotation ---
paid_key_index = 0

# --- START OF CODE CHANGE ---
def call_gemini(prompt: str, user, max_tokens: int = 600, temperature: float = 0.9):
    global paid_key_index
    
    # Determine if the user is on a paid or free tier
    is_paid_user = user.paid_interviews_remaining > 0
    all_configured_keys = current_app.config.get('GEMINI_KEYS', [])

    if not all_configured_keys:
        raise RuntimeError("NO_SERVER_API_KEY: Gemini API keys are not configured in the .env file.")

    # Select the appropriate keys based on user tier
    if is_paid_user:
        api_keys_to_try = all_configured_keys
        key_type = "PAID"
    else:
        # Free users only get to use the first key
        api_keys_to_try = [all_configured_keys[0]]
        key_type = "FREE"

    for i in range(len(api_keys_to_try)):
        current_index = (paid_key_index + i) % len(api_keys_to_try) if is_paid_user else 0
        key_to_try = api_keys_to_try[current_index]
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key_to_try}"
        payload = {"contents": [{"parts": [{"text": prompt}]}],"generationConfig": {"temperature": temperature, "topK": 40, "topP": 0.95, "maxOutputTokens": max_tokens}}
        
        try:
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=45)
            
            if response.status_code == 429:
                logger.warning(f"Rate limit hit for {key_type} key index {current_index}. Rotating key.")
                if is_paid_user: paid_key_index = (paid_key_index + 1) % len(api_keys_to_try)
                continue # Try the next key
            
            response.raise_for_status() # This will raise an exception for 4xx or 5xx errors
            
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text'].strip()
            
        except requests.RequestException as e:
            logger.error(f"Request failed for {key_type} key index {current_index}: {e}")
            if is_paid_user: paid_key_index = (paid_key_index + 1) % len(api_keys_to_try)
            continue # Try the next key
            
    # This line is reached only if all keys in the loop fail
    raise RuntimeError(f"All Gemini API keys for the {key_type} tier failed.")
# --- END OF CODE CHANGE ---

# --- Helper Functions ---
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
    history = interview.conversation_history or []
    recent = history[-length:]
    return "\n".join([f"Q: {x['q']}\nA: {x.get('a', '') or '[no answer]'}" for x in recent])

# --- Question Generation Logic ---
def get_next_turn(interview, force_rephrase=False):
    personality_key = interview.interviewer_personality['key']
    p = INTERVIEWER_PERSONALITIES.get(personality_key, INTERVIEWER_PERSONALITIES['sarah'])
    user_name = interview.user_data.get('name', 'Candidate')
    user_role = interview.user_data.get('role', 'Software Engineer')
    user_exp = normalize_experience(interview.user_data.get('experience', 'Entry-level'))
    is_opening = not (interview.conversation_history or [])
    conversation_tail = _get_conversation_tail(interview)

    if is_opening:
        prompt = f"""You are {p['name']} ({p['style']}). Start a job interview with {user_name} for a {user_role} role. Greet them warmly and ask for a brief self-introduction. Keep it to 1-2 friendly sentences. Return JSON with a "message" key."""
    else:
        prompt = f"""You are {p['name']}, continuing an interview with {user_name}. Recent conversation: {conversation_tail}. Ask a natural, conversational follow-up question. Avoid repeating topics. If rephrasing, simplify. Return JSON with "message" and "topic" keys."""
    
    for _ in range(3):
        raw_response = call_gemini(prompt, user=interview.user, max_tokens=200, temperature=0.85)
        response_obj = extract_json_object(raw_response)
        if response_obj and 'message' in response_obj:
            question_text = response_obj['message'].strip()
            if not any(too_similar(question_text, h['q']) for h in (interview.conversation_history or [])):
                return question_text, response_obj.get('topic', 'general')
    return ("So, tell me about a time you faced a challenge at work.", "problem-solving")

# --- Feedback and Analysis Logic ---
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
    history, user_data = interview.conversation_history, interview.user_data
    qa_pairs = "\n".join([f"Q: {h['q']}\nA: {h.get('a', '')}" for h in history if not h.get('skipped')])
    prompt = f"""As an expert career coach, provide a concise, actionable report in markdown for a mock interview for a {user_data.get('role', 'Software Engineer')} role. Based ONLY on the transcript, include sections for Overall Summary, Strengths (2-3 bullets), and Areas for Improvement (2-3 bullets). End with a single line: 'Final Score: X.X/10'.\n\nTranscript:\n---\n{qa_pairs}\n---"""
    feedback_text = call_gemini(prompt, user=interview.user, max_tokens=1000, temperature=0.7)
    score = 7.5
    score_match = re.search(r'Final Score:\s*(\d+(\.\d+)?)\s*/\s*10', feedback_text)
    if score_match:
        score = float(score_match.group(1))
        feedback_text = feedback_text[:score_match.start()].strip()
    return feedback_text, score

# --- Speech-to-Text Service with Switchable Provider ---
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