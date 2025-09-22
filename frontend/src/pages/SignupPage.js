import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      const response = await api.post('/auth/register', { email, password });
      // Update the success message to what the backend sends
      setSuccess(response.data.message || 'Registration successful! Please check your email to verify.');
      // We no longer redirect to login automatically
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register.');
    }
  };
  
  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a202c', color: 'white', fontFamily: 'sans-serif' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', padding: '2rem', backgroundColor: '#2d3748', borderRadius: '8px' },
    input: { padding: '0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#4a5568', color: 'white' },
    button: { padding: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#3182ce', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
    error: { color: '#e53e3e', marginTop: '1rem', textAlign: 'center' },
    success: { color: '#38a169', marginTop: '1rem', textAlign: 'center' },
    linkContainer: { marginTop: '1rem' },
    link: { color: '#63b3ed' }
  };

  return (
    <div style={styles.container}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Sign Up</button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
      <div style={styles.linkContainer}>
        <span>Already have an account? </span>
        <Link to="/login" style={styles.link}>Log In</Link>
      </div>
    </div>
  );
}

export default SignupPage;