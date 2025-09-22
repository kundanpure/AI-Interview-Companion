import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authStyles } from '../styles/authStyles';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
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
    <div style={authStyles.container}>
      <div style={authStyles.logo}>AI Interview Coach</div>
      <div style={authStyles.card}>
        <h2 style={authStyles.title}>Log In</h2>
        <form onSubmit={handleSubmit} style={authStyles.form}>
          <div style={authStyles.inputGroup}>
            <label htmlFor="email" style={authStyles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={authStyles.input}
            />
          </div>
          <div style={authStyles.inputGroup}>
            <label htmlFor="password" style={authStyles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={authStyles.input}
            />
          </div>
          <div style={authStyles.forgotPassword}>
            <Link to="/forgot-password" style={authStyles.link}>Forgot Password?</Link>
          </div>
          <button 
            type="submit" 
            style={authStyles.button} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        {error && <p style={authStyles.error}>{error}</p>}
      </div>
      <div style={authStyles.linkContainer}>
        <span>Don't have an account? </span>
        <Link to="/signup" style={authStyles.link}>Sign Up</Link>
      </div>
    </div>
  );
}

export default LoginPage;