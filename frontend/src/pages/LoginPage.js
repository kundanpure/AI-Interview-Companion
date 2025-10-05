import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LockKeyhole, Mail, LogIn } from 'lucide-react';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';
import { Field, TextInput } from '../components/Fields';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Container className="flex items-center justify-center">
        <GlassCard className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              <LockKeyhole />
            </div>
            <h2 className="text-2xl font-bold mt-3">Log In</h2>
            <p className="text-white/60 text-sm mt-1">Welcome back! Let’s keep improving.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" icon={<Mail className="w-4 h-4 text-white/70" />}>
              <TextInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password">
              <TextInput
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-sky-300 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Logging in…' : 'Log In'}
            </PrimaryButton>

            {error && <div className="text-rose-300 text-sm">{error}</div>}
          </form>

          <div className="text-center text-sm text-white/70 mt-5">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-sky-300 hover:underline">Sign Up</Link>
          </div>
        </GlassCard>
      </Container>
    </Page>
  );
}
