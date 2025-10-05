import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';
import { Field, TextInput } from '../components/Fields';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Container className="flex items-center justify-center">
        <GlassCard className="w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-black/20 rounded-xl"><Shield className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold">Reset Password</h2>
          </div>

          {!message ? (
            <form onSubmit={submit} className="space-y-4">
              <Field label="New Password">
                <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required />
              </Field>
              <Field label="Confirm New Password">
                <TextInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
              </Field>
              <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Resetting…' : 'Reset Password'}
              </PrimaryButton>
              {error && <div className="text-rose-300 text-sm">{error}</div>}
            </form>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-emerald-300">{message}</div>
              <div className="text-white/70 text-sm">Redirecting to login…</div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sky-300 hover:underline mt-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          )}
        </GlassCard>
      </Container>
    </Page>
  );
}
