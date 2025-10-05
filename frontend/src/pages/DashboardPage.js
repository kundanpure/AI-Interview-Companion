import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, CreditCard, User, CalendarDays, Trophy, Star, History } from 'lucide-react';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import HeaderBar from '../components/HeaderBar';
import { EmeraldButton } from '../components/Buttons';

function Stat({ icon: Icon, label, value, hint, gradient }) {
  return (
    <motion.div
      className={`rounded-2xl p-5 border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur`}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 180, damping: 16 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-black/20 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm text-white/70">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-3 text-xs text-white/70">{hint}</div>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const free = user?.free_interviews_remaining ?? user?.free_interviews ?? 0;
  const paid = user?.paid_interviews_remaining ?? user?.paid_interviews ?? 0;
  const total = free + paid;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/interviews/history');
        setHistory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const bestScore = useMemo(() => (history.length ? Math.max(...history.map(h => h.overall_score || 0)) : 0), [history]);
  const avgScore = useMemo(() => {
    const scores = history.map(h => h.overall_score).filter(Boolean);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [history]);

  const scoreTone = (s) => (s >= 8.5 ? 'text-emerald-300' : s >= 7 ? 'text-amber-300' : s >= 5 ? 'text-orange-300' : 'text-rose-300');

  return (
    <Page>
      <Container>
        <HeaderBar
          title={`Welcome, ${user?.name || user?.email}`}
          subtitle="Level up your interviews with targeted practice & instant feedback."
          onLogout={logout}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={CreditCard} label="Total Credits" value={total} hint={`${free} free • ${paid} paid`} gradient="from-[#3b82f6]/25 to-[#8b5cf6]/25" />
          <Stat icon={CalendarDays} label="Sessions Completed" value={history.length} hint="Practice makes perfect" gradient="from-[#10b981]/25 to-[#22d3ee]/25" />
          <Stat icon={Trophy} label="Best Score" value={`${bestScore ? bestScore.toFixed(1) : '—'}/10`} hint="Personal record" gradient="from-[#f59e0b]/25 to-[#ef4444]/25" />
          <Stat icon={Star} label="Avg Score" value={`${avgScore ? avgScore.toFixed(1) : '—'}/10`} hint="Last 30 days" gradient="from-[#f472b6]/25 to-[#22c55e]/25" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-black/20 rounded-xl"><Rocket className="w-5 h-5" /></div>
              <div className="font-semibold">Start New Interview</div>
            </div>
            <div className="text-sm text-white/70 mb-4">Practice with AI interviewer tailored to your role & experience.</div>
            <EmeraldButton onClick={() => navigate('/interview')}>Start Interview</EmeraldButton>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-black/20 rounded-xl"><User className="w-5 h-5" /></div>
              <div className="font-semibold">My Profile</div>
            </div>
            <div className="text-sm text-white/70 mb-4">Keep your target role & resume updated for spot-on questions.</div>
            <EmeraldButton onClick={() => navigate('/profile')}>Open Profile</EmeraldButton>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-black/20 rounded-xl"><CreditCard className="w-5 h-5" /></div>
              <div className="font-semibold">Buy Credits</div>
            </div>
            <div className="text-sm text-white/70 mb-4">Top up paid interviews. Secure checkout via Razorpay.</div>
            <EmeraldButton onClick={() => navigate('/pricing')}>Buy Credits</EmeraldButton>
          </GlassCard>
        </div>

        {/* History */}
        <GlassCard className="overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-white/10">
            <History className="w-5 h-5 text-white/80" />
            <h2 className="text-lg font-semibold">Interview History</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/70">Loading your sessions…</div>
          ) : history.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/70">
                  <tr className="text-left">
                    <th className="px-5 py-3 border-b border-white/10">Date</th>
                    <th className="px-5 py-3 border-b border-white/10">Role</th>
                    <th className="px-5 py-3 border-b border-white/10">Mode</th>
                    <th className="px-5 py-3 border-b border-white/10">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition cursor-pointer"
                      onClick={() => navigate(`/history/${item.id}`)}
                    >
                      <td className="px-5 py-3 border-b border-white/10">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3 border-b border-white/10">{item.user_data?.role || 'N/A'}</td>
                      <td className="px-5 py-3 border-b border-white/10">{item.mode || 'Standard'}</td>
                      <td className={`px-5 py-3 border-b border-white/10 font-semibold ${scoreTone(item.overall_score || 0)}`}>
                        {item.overall_score ? `${item.overall_score.toFixed(1)} / 10` : 'N/A'}
                      </td>
                    </tr>

                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="text-white/70 mb-3">No sessions yet.</div>
              <EmeraldButton onClick={() => navigate('/interview')}>Start your first interview 🚀</EmeraldButton>
            </div>
          )}
        </GlassCard>
      </Container>
    </Page>
  );
}
