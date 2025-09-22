import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function VerificationPage() {
    const { token } = useParams();
    const [message, setMessage] = useState('Verifying your account, please wait...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const verifyEmailToken = async () => {
            if (!token) {
                setMessage('Verification token is missing. The link may be broken.');
                setError(true);
                return;
            }
            try {
                // Call the backend endpoint to verify the token
                const response = await api.get(`/auth/verify-email/${token}`);
                setMessage(response.data.message);
                setError(false);
            } catch (err) {
                setMessage(err.response?.data?.error || 'Verification failed. The link may have expired or is invalid.');
                setError(true);
            }
        };
        verifyEmailToken();
    }, [token]);
    
    const styles = {
        container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a202c', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
        card: { backgroundColor: '#2d3748', padding: '2rem 3rem', borderRadius: '8px', textAlign: 'center' },
        message: { fontSize: '1.2rem', color: error ? '#e53e3e' : '#38a169' },
        link: { color: '#63b3ed', marginTop: '1.5rem', display: 'inline-block', textDecoration: 'none', fontWeight: 'bold' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>Email Verification</h2>
                <p style={styles.message}>{message}</p>
                {!error && (
                    <Link to="/login" style={styles.link}>
                        Proceed to Login
                    </Link>
                )}
            </div>
        </div>
    );
}

export default VerificationPage;