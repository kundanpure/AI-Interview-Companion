import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { EmeraldButton, PrimaryButton } from '../components/Buttons';
import { Field, TextInput, Select } from '../components/Fields';
import { User, Briefcase, FileText, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.target_role || 'Software Engineer');
  const [experience, setExperience] = useState(user?.experience_level || 'Fresher');

  // Paste resume text
  const [resumeText, setResumeText] = useState('');
  const [stories, setStories] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const saveProfile = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true); setMessage(''); setError('');
    try {
      await api.put('/user/me', {
        name,
        target_role: role,
        experience_level: experience,
      });
      const { data: me } = await api.get('/user/me');
      setUser((prev) => ({ ...prev, ...me }));
      localStorage.setItem('user', JSON.stringify({ ...(user || {}), ...me }));
      setMessage('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const extractStories = async () => {
    setIsExtracting(true); setError(''); setStories([]);
    try {
      const { data } = await api.post('/user/resume/extract', { resume_text: resumeText });
      setStories(Array.isArray(data?.stories) ? data.stories : []);
      if (!Array.isArray(data?.stories) || !data.stories.length) {
        setMessage("No stories detected — try pasting more resume content.");
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extract stories.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Page>
      <Container className="flex items-start justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <GlassCard className="p-6 space-y-5">
            <div className="text-2xl font-bold">My Profile</div>
            <p className="text-white/70 text-sm">Keep your details updated to get the most relevant interview questions.</p>

            <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4">
              <Field label="Full Name" icon={<User className="w-4 h-4" />}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </Field>

              <Field label="Target Role" icon={<Briefcase className="w-4 h-4" />}>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Software Engineer</option>
                  <option>Data Scientist</option>
                  <option>Product Manager</option>
                </Select>
              </Field>

              <Field label="Experience Level">
                <Select value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option>Fresher</option>
                  <option>1-3 Years</option>
                  <option>3-5 Years</option>
                  <option>5+ Years</option>
                </Select>
              </Field>

              <EmeraldButton type="submit" disabled={isSaving} className="w-full">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save Profile'}
              </EmeraldButton>

              {message && <div className="text-emerald-300 text-sm">{message}</div>}
              {error && <div className="text-rose-300 text-sm">{error}</div>}
            </form>
          </GlassCard>

          {/* Resume → STAR Story Bank */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/20 rounded-xl"><FileText className="w-5 h-5" /></div>
              <div className="font-semibold">Build Story Bank (STAR) from resume</div>
            </div>
            <p className="text-white/70 text-sm">
              Paste your resume text below. We’ll convert it into concise STAR stories for quick recall during interviews.
            </p>

            <Field label="Resume Text">
              <textarea
                rows={10}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here…"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            <div className="flex gap-3">
              <PrimaryButton onClick={extractStories} disabled={!resumeText.trim() || isExtracting}>
                {isExtracting ? 'Extracting…' : 'Extract STAR Stories'}
              </PrimaryButton>
              <button
                type="button"
                className="text-sm text-white/70 hover:text-white"
                onClick={() => setResumeText('')}
              >
                Clear
              </button>
            </div>

            {stories?.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm text-white/80 font-semibold">Detected Stories</div>
                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {stories.map((s, i) => (
                    <div key={i} className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <div className="font-semibold">{s.title || `Story ${i + 1}`}</div>
                      <div className="text-xs text-white/60 mt-1"><b>Tags:</b> {(s.tags || []).join(', ') || '—'}</div>
                      <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-white/80">
                        {s.situation && <li><b>Situation:</b> {s.situation}</li>}
                        {s.task && <li><b>Task:</b> {s.task}</li>}
                        {s.action && <li><b>Action:</b> {s.action}</li>}
                        {s.result && <li><b>Result:</b> {s.result}</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </Container>
    </Page>
  );
}
