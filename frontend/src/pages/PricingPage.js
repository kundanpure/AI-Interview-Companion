import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { loadScript } from '../utils/loadScript';

function PricingPage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePurchase = async () => {
    setLoading(true);
    setError('');
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      const { data: order } = await api.post('/payments/create-order');
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AI Interview Coach",
        description: "Interview Credits",
        order_id: order.order_id,
        handler: async function (response) {
          try {
            await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // simple: re-fetch /auth/login style user (or just bump paid)
            const updated = {...user, paid_interviews: (user?.paid_interviews || 0) + 2};
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            alert('Payment successful! Credits added.');
            navigate('/dashboard');
          } catch {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#5b8cff' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError('Failed to create payment order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0b1220', color: 'white' },
    card: { backgroundColor: '#0f172a', padding: '2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,.1)' },
    button: { padding: '0.9rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(90deg,#5b8cff,#9b5bff)', color: 'white', cursor: 'pointer', fontSize: '1.05rem', marginTop: '1rem' },
    error: { color: '#f87171', marginTop: '1rem' },
    backLink: { color: '#93c5fd', marginTop: '2rem', textDecoration: 'none' }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <h2>Purchase Credits</h2>
        <p>Get 2 more interview credits to practice.</p>
        <h3>₹199</h3>
        <button onClick={handlePurchase} disabled={loading} style={styles.button}>
          {loading ? 'Processing...' : 'Buy Now'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
      <a href="/dashboard" style={styles.backLink}>← Back to Dashboard</a>
    </div>
  );
}

export default PricingPage;
