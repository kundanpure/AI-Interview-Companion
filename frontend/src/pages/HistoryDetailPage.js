import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';
import { ArrowLeft, LockKeyhole, MessageSquare, Target, ListChecks } from 'lucide-react';

export default function HistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [paywalled, setPaywalled] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/interviews/detail', { params: { session_id: id } });
        setData(res.data);
        setPaywalled(null);
      } catch (err) {
        if (err?.response?.status === 402) {
          setPaywalled(err.response.data || { error: 'Upgrade required.' });
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) {
    return (
      <Page><Container><div className="p-10 text-center text-white/70">Loading…</div></Container></Page>
    );
  }

  if (paywalled) {
    return (
      <Page>
        <Container className="max-w-2xl mx-auto">
          <GlassCard className="p-6 text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-white/5">
              <LockKeyhole className="w-6 h-6 text-amber-300" />
            </div>
            <div className="text-xl font-semibold">{paywalled?.cta?.title || 'Unlock Transcript & Pro Suggestions'}</div>
            <p className="text-white/70">{paywalled?.cta?.desc || 'See full Q&A and tailored drills.'}</p>
            <div className="flex items-center gap-3 justify-center">
              <PrimaryButton onClick={() => navigate('/pricing')}>Upgrade</PrimaryButton>
              <button className="text-sky-300 hover:underline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </GlassCard>
        </Container>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page><Container><div className="p-10 text-center text-rose-300">Not found.</div></Container></Page>
    );
  }

  const { created_at, overall_score, mode, transcript, suggestions } = data;

  return (
    <Page>
      <Container className="space-y-6">
        <div className="flex items-center justify-between">
          <button className="inline-flex items-center gap-2 text-sky-300 hover:underline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-white/60 text-sm">
            {new Date(created_at).toLocaleString()} • {mode || 'Standard'} • Score: {overall_score ?? '—'}
          </div>
        </div>

        {/* Transcript */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-white/80" />
            <div className="text-lg font-semibold">Conversation Transcript</div>
          </div>
          <div className="space-y-4">
            {transcript?.map((t) => (
              <div key={t.turn_no} className="rounded-xl border border-white/10 p-4 bg-white/5">
                <div className="text-xs text-white/50 mb-1">Turn {t.turn_no} {t.topic ? `• ${t.topic}` : ''}</div>
                <div className="text-white/90"><b>Q:</b> {t.question}</div>
                <div className="text-white/80 mt-1"><b>A:</b> {t.answer || <span className="text-white/50">[no answer]</span>}</div>
                <div className="text-xs text-white/50 mt-2">
                  WPM: {t.wpm ?? '—'} • Filler: {t.filler_count ?? '—'} {typeof t.score === 'number' && <>• Score: {t.score}</>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-5 h-5 text-white/80" />
              <div className="text-lg font-semibold">Drills</div>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm">
              {(suggestions?.drills || []).map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-white/80" />
              <div className="text-lg font-semibold">Likely Follow-ups</div>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-white/80 text-sm">
              {(suggestions?.follow_ups || []).map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-white/80" />
              <div className="text-lg font-semibold">7-Day Plan</div>
            </div>
            <div className="prose prose-invert text-sm max-w-none"
                 dangerouslySetInnerHTML={{ __html: (suggestions?.learning_plan || '').replace(/\n/g, '<br/>') }} />
          </GlassCard>
        </div>
      </Container>
    </Page>
  );
}
