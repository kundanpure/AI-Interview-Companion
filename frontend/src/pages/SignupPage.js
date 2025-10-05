import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock } from 'lucide-react';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { EmeraldButton } from '../components/Buttons';
import { Field, TextInput } from '../components/Fields';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register', { email, password });
      setSuccess(res.data.message || 'Registration successful! Check your email to verify.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Container className="flex items-center justify-center">
        <GlassCard className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500">
              <UserPlus />
            </div>
            <h2 className="text-2xl font-bold mt-3">Create Account</h2>
            <p className="text-white/60 text-sm mt-1">Get started with AI-powered interview practice.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" icon={<Mail className="w-4 h-4 text-white/70" />}>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>
            <Field label="Password" icon={<Lock className="w-4 h-4 text-white/70" />}>
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </Field>
            <EmeraldButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating…' : 'Sign Up'}
            </EmeraldButton>
            {error && <div className="text-rose-300 text-sm">{error}</div>}
            {success && <div className="text-emerald-300 text-sm">{success}</div>}
          </form>

          <div className="text-center text-sm text-white/70 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-300 hover:underline">Log In</Link>
          </div>
        </GlassCard>
      </Container>
    </Page>
  );
}
