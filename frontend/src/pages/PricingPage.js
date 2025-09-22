// frontend/src/pages/PricingPage.js

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePurchase = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create an order on the backend
      const { data: order } = await api.post('/payments/create-order');

      // 2. Configure Razorpay options
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AI Interview Coach",
        description: "2 Interview Credits",
        order_id: order.order_id,
        handler: async function (response) {
          // 3. This function is called after successful payment
          try {
            await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert('Payment successful! Credits added.');
            // Note: In a real app, you would refresh the user context here
            // to show the updated credit count immediately.
            navigate('/dashboard');
          } catch (verifyError) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3182ce',
        },
      };

      // 4. Open the Razorpay checkout modal
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError('Failed to create payment order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    // Basic styling
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a202c', color: 'white' },
    card: { backgroundColor: '#2d3748', padding: '2rem', borderRadius: '8px', textAlign: 'center' },
    button: { padding: '0.75rem 1.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#38a169', color: 'white', cursor: 'pointer', fontSize: '1.1rem', marginTop: '1rem' },
    error: { color: '#e53e3e', marginTop: '1rem' },
    backLink: { color: '#63b3ed', marginTop: '2rem', textDecoration: 'none' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
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