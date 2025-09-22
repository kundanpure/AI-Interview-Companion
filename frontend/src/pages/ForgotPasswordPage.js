import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a202c', color: 'white', fontFamily: 'sans-serif' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', padding: '2rem', backgroundColor: '#2d3748', borderRadius: '8px' },
    input: { padding: '0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#4a5568', color: 'white' },
    button: { padding: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#3182ce', color: 'white', cursor: 'pointer', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 },
    error: { color: '#e53e3e', marginTop: '1rem', textAlign: 'center' },
    success: { color: '#38a169', marginTop: '1rem', textAlign: 'center' },
    linkContainer: { marginTop: '1rem' },
    link: { color: '#63b3ed' }
  };

  return (
    <div style={styles.container}>
      <h2>Forgot Password</h2>
      {message ? (
        <div style={{...styles.form, alignItems: 'center'}}>
          <p style={styles.success}>{message}</p>
          <Link to="/login" style={{...styles.button, textDecoration: 'none', textAlign: 'center'}}>
            Return to Login
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} style={styles.form}>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={styles.input}
            />
            <button 
              type="submit" 
              style={styles.button} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          {error && <p style={styles.error}>{error}</p>}
        </>
      )}
      <div style={styles.linkContainer}>
        <Link to="/login" style={styles.link}>Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;