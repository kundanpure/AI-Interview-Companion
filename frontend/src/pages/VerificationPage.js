import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BadgeCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';

export default function VerificationPage() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your account, please wait...');
  const [error, setError] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setMessage('Verification token is missing. The link may be broken.');
        setError(true);
        return;
      }
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setError(false);
      } catch (err) {
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired or is invalid.');
        setError(true);
      }
    };
    verify();
  }, [token]);

  return (
    <Page>
      <Container className="flex items-center justify-center">
        <GlassCard className="w-full max-w-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-2xl ${error ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
              {error ? <AlertTriangle className="w-6 h-6 text-rose-300" /> : <BadgeCheck className="w-6 h-6 text-emerald-300" />}
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Email Verification</h2>
          <p className={error ? 'text-rose-300' : 'text-emerald-300'}>{message}</p>
          {!error && (
            <Link to="/login">
              <PrimaryButton className="mt-5">
                Proceed to Login <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </Link>
          )}
        </GlassCard>
      </Container>
    </Page>
  );
}
