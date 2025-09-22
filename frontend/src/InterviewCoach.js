import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Mic, MicOff, SkipForward, RotateCcw, Download, LogOut,
  Clock, Star, User, Briefcase, Link as LinkIcon, FileText, CheckCircle2
} from 'lucide-react';
import api from './api';

// --- Constants ---
const INTERVIEWER_PERSONALITIES = {
  priya: { name: 'Priya', emoji: '👩🏽‍💼', style: 'empathetic and thoughtful', color: 'from-rose-500 to-orange-600', gender: 'female', accent: 'en-IN' },
  arjun: { name: 'Arjun', emoji: '👨🏽‍💼', style: 'calm and structured',       color: 'from-amber-500 to-red-600',  gender: 'male',   accent: 'en-IN' },
  sarah: { name: 'Sarah', emoji: '👩‍💼',  style: 'warm and encouraging',        color: 'from-pink-500 to-purple-600', gender: 'female', accent: 'en-US' },
  john:  { name: 'John',  emoji: '👨‍💼',  style: 'professional and direct',     color: 'from-blue-500 to-indigo-600', gender: 'male',   accent: 'en-US' },
  alex:  { name: 'Alex',  emoji: '🧑‍💼',  style: 'casual and innovative',       color: 'from-green-500 to-teal-600',  gender: 'male',   accent: 'en-GB' },
};
const LANGUAGES = { English: 'en-US', Hindi: 'hi-IN', Spanish: 'es-ES', French: 'fr-FR' };

const isAndroid = /Android/i.test(navigator.userAgent);
const isChromeLike = /Chrome/i.test(navigator.userAgent) && !/Edg|OPR|SamsungBrowser|YaBrowser/i.test(navigator.userAgent);
const forceBackendSTTOnAndroid = isAndroid && isChromeLike;

const InterviewCoach = () => {
  const navigate = useNavigate();

  // Core interview state
  const [sessionId, setSessionId] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionCounter, setQuestionCounter] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]); // local mirror for download
  const [liveFeedback, setLiveFeedback] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  const [detailedFeedback, setDetailedFeedback] = useState('');

  // UI & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Speech / Audio
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timer
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Media
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);

  // Configs
  const [useBackendSTT] = useState(forceBackendSTTOnAndroid);
  const [interviewerPersonality, setInterviewerPersonality] = useState('priya');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [userData, setUserData] = useState({ name: '', role: 'Software Engineer', experience: 'Fresher' });
  const totalTurns = /fresher|intern|entry/i.test(userData.experience) ? 8 : 12;

  // JD-aware prep (NEW)
  const [jdText, setJdText] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [prepError, setPrepError] = useState('');
  const [rubric, setRubric] = useState(null); // {competencies, rubric, questions}
  const [suggestedQs, setSuggestedQs] = useState([]);

  const handleApiError = (err) => {
    const errorMessage = err?.response?.data?.error || 'An unexpected error occurred.';
    setError(errorMessage);
    if (err?.response?.status === 402) {
      // No credits → nudge to pricing
      setTimeout(() => navigate('/pricing'), 1800);
    }
  };

  const prepareJD = async () => {
    if (!jdText && !jdUrl) {
      setPrepError('Please paste a JD or provide a URL.');
      return;
    }
    setPreparing(true);
    setPrepError('');
    try {
      const { data } = await api.post('/interviews/prepare', {
        jd_text: jdText || undefined,
        jd_url: jdUrl || undefined,
        role: userData.role || 'Software Engineer'
      });
      setRubric(data.rubric || null);
      setSuggestedQs(data.suggested_questions || []);
    } catch (e) {
      setPrepError(e?.response?.data?.error || 'Failed to prepare JD-aware rubric.');
    } finally {
      setPreparing(false);
    }
  };

  const startInterview = async () => {
    if (!userData.name || !userData.role) {
      setError("Please enter your name and target role.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const sessionRes = await api.post('/interviews/create-session', { mode: 'normal' });
      const newSessionId = sessionRes.data.session_id;
      setSessionId(newSessionId);

      const startRes = await api.post('/interviews/start-interview', {
        session_id: newSessionId,
        user_data: userData,
        interviewer_personality: interviewerPersonality
      });

      setCurrentQuestion(startRes.data.question);
      setQuestionCounter(startRes.data.question_counter || 1);
      setConversationHistory([{ q: startRes.data.question, a: null }]);
      setInterviewStarted(true);

      if (startRes.data.question) {
        speakQuestion(startRes.data.question);
      } else {
        setError("No question received from the server. Please try again.");
      }
    } catch (err) { handleApiError(err); }
    finally { setLoading(false); }
  };

  const handleTurnResponse = (data) => {
    if (data.feedback) {
      setLiveFeedback(prev => [...prev, data.feedback]);
    }
    if (data.interview_complete) {
      setInterviewComplete(true);
      getFeedback(sessionId);
    } else {
      setCurrentQuestion(data.question);
      setQuestionCounter(data.question_counter);
      setConversationHistory(prev => [...prev, { q: data.question, a: null }]);
      speakQuestion(data.question);
    }
  };

  const submitAnswer = async (answer) => {
    setLoading(true);
    setFinalTranscript(''); setLiveTranscript('');
    const updatedHistory = [...conversationHistory];
    if (updatedHistory.length > 0) updatedHistory[updatedHistory.length - 1].a = answer;
    setConversationHistory(updatedHistory);
    try {
      const res = await api.post('/interviews/submit-answer', { session_id: sessionId, answer });
      handleTurnResponse(res.data);
    } catch (err) { handleApiError(err); }
    finally { setLoading(false); }
  };

  const submitAnswerAudio = async (audioDataUrl) => {
    setLoading(true);
    const updatedHistory = [...conversationHistory];
    if (updatedHistory.length > 0) updatedHistory[updatedHistory.length - 1].a = '(Audio Answer)';
    setConversationHistory(updatedHistory);
    try {
      const res = await api.post('/interviews/submit-answer', { session_id: sessionId, audio_data: audioDataUrl });
      handleTurnResponse(res.data);
    } catch (err) { handleApiError(err); }
    finally { setLoading(false); }
  };

  const handleSkip = async () => {
    setLoading(true);
    stopListening();
    window.speechSynthesis?.cancel();
    try {
      const res = await api.post('/interviews/skip-question', { session_id: sessionId });
      const { question, question_counter, interview_complete } = res.data;

      const updatedHistory = [...conversationHistory];
      if (updatedHistory.length > 0) {
        updatedHistory[updatedHistory.length - 1].a = "(Question Skipped)";
        updatedHistory[updatedHistory.length - 1].skipped = true;
      }

      if (interview_complete) {
        setConversationHistory(updatedHistory);
        setInterviewComplete(true);
        getFeedback(sessionId);
      } else {
        setConversationHistory([...updatedHistory, { q: question, a: null }]);
        setCurrentQuestion(question);
        setQuestionCounter(question_counter);
        speakQuestion(question);
      }
    } catch (err) { handleApiError(err); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to end this interview? Your credit will be refunded.")) {
      setLoading(true);
      stopListening();
      window.speechSynthesis?.cancel();
      try {
        await api.post('/interviews/cancel-interview', { session_id: sessionId });
        navigate('/dashboard');
      } catch (err) { handleApiError(err); }
      finally { setLoading(false); }
    }
  };

  const getFeedback = async (sid) => {
    setLoading(true);
    try {
      const res = await api.post('/interviews/get-feedback', { session_id: sid || sessionId });
      setOverallScore(res.data.overall_score);
      setDetailedFeedback(res.data.detailed_feedback);
    } catch (err) { handleApiError(err); }
    finally { setLoading(false); }
  };

  // Speech
  const initializeSpeechRecognition = () => {
    if (useBackendSTT) return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = LANGUAGES[selectedLanguage] || 'en-US';
    rec.onresult = (e) => {
      let interim = '', fin = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript; else interim += e.results[i][0].transcript;
      }
      setLiveTranscript(interim); if (fin) setFinalTranscript(prev => prev + fin);
    };
    rec.onerror = (e) => { setError(`Speech error: ${e.error}`); setIsListening(false); };
    rec.onend = () => setIsListening(false);
    return rec;
  };

  const startListening = async () => {
    setFinalTranscript(''); setLiveTranscript('');
    if (useBackendSTT) await startMediaRecorder();
    else {
      const rec = speechRecognition || initializeSpeechRecognition();
      if (rec) { setSpeechRecognition(rec); try { rec.start(); setIsListening(true); } catch {} }
    }
    startTimer();
  };

  const stopListening = () => {
    if (useBackendSTT) stopMediaRecorder();
    else if (speechRecognition) speechRecognition.stop();
    setIsListening(false);
    stopTimer();
    if (!useBackendSTT) {
      setTimeout(() => {
        const complete = (finalTranscript + liveTranscript).trim();
        if (complete) submitAnswer(complete);
      }, 450);
    }
  };

  // Media Recorder (backend STT)
  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr; mediaChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) mediaChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => submitAnswerAudio(reader.result);
        reader.readAsDataURL(blob);
      };
      mr.start(); setIsListening(true);
    } catch (err) { setError("Microphone access denied or not available."); }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    setIsListening(false);
  };

  // TTS
  const speakQuestion = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    try {
      setIsPlaying(true);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGUAGES[selectedLanguage] || 'en-US';
      u.onend = () => setIsPlaying(false);
      u.onerror = () => setIsPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { setIsPlaying(false); }
  };

  // Timer
  const startTimer = () => {
    stopTimer(); setTimer(120); setTimerActive(true);
    timerRef.current = setInterval(() => setTimer(prev => {
      if (prev <= 1) { stopTimer(); if (isListening) stopListening(); return 0; }
      return prev - 1;
    }), 1000);
  };
  const stopTimer = () => { clearInterval(timerRef.current); setTimerActive(false); };
  const formatTimer = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Cleanup
  useEffect(() => {
    return () => { stopTimer(); window.speechSynthesis?.cancel(); mediaStreamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Download report
  const downloadTranscript = () => {
    const header = `Interview Report - ${new Date().toLocaleString()}\n\nScore: ${overallScore?.toFixed?.(1) || 'N/A'}/10\n\n`;
    const qa = conversationHistory.map((h, i) => `Q${i+1}: ${h.q}\nA${i+1}: ${h.a || ''}\n`).join('\n');
    const feedback = `\n---\nDetailed Feedback:\n${detailedFeedback}\n`;
    const report = header + qa + feedback;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `interview_report.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const resetToDashboard = () => {
    window.speechSynthesis?.cancel();
    stopMediaRecorder();
    stopTimer();
    navigate('/dashboard');
  };

  // --- Renders ---
  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🎉 Interview Complete!</h1>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                ⭐ {overallScore.toFixed(1)}/10
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Detailed Feedback</h2>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm opacity-90">{detailedFeedback}</div>
          </div>
          <div className="mt-8 text-center space-x-4">
            <button onClick={downloadTranscript} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center gap-2"><Download /> Download</button>
            <button onClick={resetToDashboard} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center gap-2"><RotateCcw /> New Interview</button>
          </div>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="text-center mb-8"><h1 className="text-5xl font-bold">🎤 AI Interview Coach</h1></div>
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">📋 Interview Setup</h2>

          {/* Candidate Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2"><User className="inline -mt-1 mr-1" /> Full Name *</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 rounded-lg"
                placeholder="Kundan Kumar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><Briefcase className="inline -mt-1 mr-1" /> Target Role *</label>
              <select
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 rounded-lg text-white [&>option]:!text-black"
              >
                <option>Software Engineer</option><option>Data Scientist</option><option>Product Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Experience *</label>
              <select
                value={userData.experience}
                onChange={(e) => setUserData({ ...userData, experience: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 rounded-lg text-white [&>option]:!text-black"
              >
                <option value="Fresher">Fresher</option><option value="Experienced">Experienced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Interviewer</label>
              <select
                value={interviewerPersonality}
                onChange={(e) => setInterviewerPersonality(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 rounded-lg text-white [&>option]:!text-black"
              >
                {Object.entries(INTERVIEWER_PERSONALITIES).map(([key, p]) => (
                  <option key={key} value={key}>{p.name} ({p.style})</option>
                ))}
              </select>
            </div>
          </div>

          {/* JD-aware prep (optional) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-gray-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><FileText size={18}/> <span className="font-semibold">Paste Job Description (optional)</span></div>
              <textarea
                value={jdText}
                onChange={(e)=>setJdText(e.target.value)}
                placeholder="Paste the JD here to generate a tailored rubric and first questions…"
                className="w-full h-36 p-3 rounded-lg bg-white/10"
              />
              <div className="flex items-center gap-2 mt-3">
                <LinkIcon size={18}/>
                <input
                  type="url"
                  value={jdUrl}
                  onChange={(e)=>setJdUrl(e.target.value)}
                  placeholder="or paste a JD URL (optional)"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10"
                />
                <button
                  onClick={prepareJD}
                  disabled={preparing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {preparing ? 'Preparing…' : 'Prepare'}
                </button>
              </div>
              {prepError && <div className="text-red-200 mt-2 text-sm">{prepError}</div>}
            </div>

            <div className="bg-gray-900/40 rounded-xl p-4">
              <div className="font-semibold mb-2">Language</div>
              <select
                value={selectedLanguage}
                onChange={(e)=>setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10"
              >
                {Object.keys(LANGUAGES).map(l => <option key={l}>{l}</option>)}
              </select>
              <div className="mt-4 text-sm opacity-80">
                {useBackendSTT
                  ? 'Using server speech-to-text (best for Android Chrome).'
                  : 'Using browser speech-to-text.'}
              </div>
            </div>
          </div>

          {rubric && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-green-300" /> <div className="font-semibold">JD-aware rubric prepared</div>
              </div>
              {rubric.competencies?.length > 0 && (
                <div className="mb-3">
                  <div className="font-medium mb-1">Competencies</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rubric.competencies.slice(0,6).map((c, i)=>(
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <div className="font-semibold">{c.name || c.title || `Competency ${i+1}`}</div>
                        {c.indicators && <div className="text-sm opacity-80 mt-1">{Array.isArray(c.indicators) ? c.indicators.join(', ') : String(c.indicators)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {suggestedQs?.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Suggested Opening Questions</div>
                  <ul className="list-disc pl-5 opacity-90 text-sm">
                    {suggestedQs.map((q,i)=><li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-lg mb-4">{error}</div>}
          <div className="text-center">
            <button
              onClick={startInterview}
              disabled={loading || !userData.name}
              className="bg-green-500 disabled:bg-gray-500 text-white font-bold py-4 px-8 rounded-lg"
            >
              {loading ? 'Starting...' : '🚀 Start Interview'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live interview
  const personality = INTERVIEWER_PERSONALITIES[interviewerPersonality];
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold">Interview with {personality.name}</h1>
          <p className="opacity-80">Turn: {questionCounter} / {totalTurns}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">💬 Interviewer says:</h2>
            <div className={`bg-gradient-to-r ${personality.color} rounded-lg p-4`}>
              <p className="text-lg">{currentQuestion}</p>
            </div>
            <button
              onClick={() => speakQuestion(currentQuestion)}
              disabled={isPlaying}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-lg flex items-center gap-1 disabled:bg-gray-500"
            >
              <Play size={14} /> {isPlaying ? 'Playing…' : 'Play Again'}
            </button>
          </div>

          <div className="bg-gray-800/60 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">🎤 Your Answer</h3>

            {!useBackendSTT && (
              <div className="bg-gray-700/60 rounded-lg p-4 mb-4 min-h-[80px]">
                <div className="text-sm opacity-70 mb-1">Live Transcript:</div>
                <div>
                  <span className="text-blue-300">{finalTranscript}</span>
                  <span className="text-gray-400 italic">{liveTranscript}</span>
                  {isListening && <span className="animate-pulse">|</span>}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {timerActive && <div className="text-2xl font-bold flex items-center gap-2"><Clock /> {formatTimer(timer)}</div>}
              {!isListening ? (
                <button onClick={startListening} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2">
                  <Mic /> Start Speaking
                </button>
              ) : (
                <button onClick={stopListening} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 animate-pulse">
                  <MicOff /> Stop & Submit
                </button>
              )}
            </div>
          </div>

          {liveFeedback.length > 0 && (
            <div className="bg-blue-500/20 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Star /> Live Feedback</h3>
              <p className="text-sm opacity-90">{liveFeedback[liveFeedback.length - 1]}</p>
            </div>
          )}
        </div>

        {error && (<div className="bg-red-500/20 text-red-100 px-4 py-3 rounded-lg mt-4">{error}</div>)}

        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <SkipForward size={16} /> Skip Question
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <LogOut size={16} /> Cancel Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCoach;
