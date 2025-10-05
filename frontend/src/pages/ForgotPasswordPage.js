import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';
import { Field, TextInput } from '../components/Fields';


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
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
            <div className="p-2 bg-black/20 rounded-xl"><Mail className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold">Forgot Password</h2>
          </div>

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-white/70">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <Field label="Email">
                <TextInput
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </PrimaryButton>
              {error && <div className="text-rose-300 text-sm">{error}</div>}
            </form>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-emerald-300">{message}</div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sky-300 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          )}
        </GlassCard>
      </Container>
    </Page>
  );
}
