import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Wallet, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loadScript } from '../utils/loadScript';
import { Page, Container } from '../components/Page';
import GlassCard from '../components/GlassCard';
import { PrimaryButton } from '../components/Buttons';

export default function PricingPage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePurchase = async () => {
    setLoading(true); setError('');
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const { data: order } = await api.post('/payments/create-order');

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Interview Coach',
        description: 'Interview Credits',
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // IMPORTANT: get the real counts from backend (no hardcoding credits)
            const { data: me } = await api.get('/user/me');
            setUser((prev) => ({ ...prev, ...me }));
            localStorage.setItem('user', JSON.stringify({ ...(user || {}), ...me }));

            navigate('/dashboard');
          } catch {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#6366f1' },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setError('Failed to create payment order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Container className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Plan */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-black/20 rounded-xl"><Wallet className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold">Practice Pack</h2>
          </div>
          <div className="text-4xl font-extrabold">₹199</div>
          <div className="text-white/70 text-sm mb-5">Interview credits to prep on demand.</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> AI interviewer with live feedback</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Detailed final report + score</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Resume-aware & JD-aware prompts</li>
          </ul>
          <PrimaryButton onClick={handlePurchase} disabled={loading} className="w-full mt-6">
            {loading ? 'Processing…' : 'Buy Now'}
          </PrimaryButton>
          {error && <div className="text-rose-300 text-sm mt-3">{error}</div>}
        </GlassCard>

        {/* Security / trust */}
        <GlassCard className="p-6 bg-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-black/20 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            <div className="text-lg font-semibold">Secure Checkout</div>
          </div>
          <p className="text-white/70 text-sm">
            Payments are processed by Razorpay. We do not store card details. GST-compliant invoices available.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
            <div className="text-white/80 font-semibold mb-1">Need more credits?</div>
            <p className="text-white/60">Contact support for team plans and campus bundles.</p>
          </div>
        </GlassCard>
      </Container>
    </Page>
  );
}
