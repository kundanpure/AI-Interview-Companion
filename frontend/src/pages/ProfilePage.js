// frontend/src/pages/ProfilePage.js

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    // Initialize state from user context or with empty strings
    const [name, setName] = useState(user?.name || '');
    const [role, setRole] = useState(user?.target_role || 'Software Engineer');
    const [experience, setExperience] = useState(user?.experience_level || 'Fresher');
    const [resume, setResume] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        setResume(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('target_role', role);
        formData.append('experience_level', experience);
        if (resume) {
            formData.append('resume', resume);
        }

        try {
            const response = await api.post('/user/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Update user in context with new details
            setUser(response.data.user); 
            setMessage('Profile updated successfully!');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Basic styling, can be moved to a separate file later
    const styles = {
        container: { padding: '2rem', maxWidth: '600px', margin: 'auto' },
        form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
        input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' },
        button: { padding: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#3498db', color: 'white', cursor: 'pointer' },
        message: { color: 'green', textAlign: 'center' },
        error: { color: 'red', textAlign: 'center' },
    };

    return (
        <div style={styles.container}>
            <h2>My Profile</h2>
            <p>Keep your details updated to get the most relevant interview questions.</p>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div>
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
                </div>
                <div>
                    <label>Target Role</label>
                     <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                        <option>Software Engineer</option>
                        <option>Data Scientist</option>
                        <option>Product Manager</option>
                     </select>
                </div>
                <div>
                    <label>Experience Level</label>
                    <select value={experience} onChange={(e) => setExperience(e.target.value)} style={styles.input}>
                        <option>Fresher</option>
                        <option>1-3 Years</option>
                        <option>3-5 Years</option>
                        <option>5+ Years</option>
                    </select>
                </div>
                <div>
                    <label>Upload Resume (PDF)</label>
                    <input type="file" onChange={handleFileChange} accept=".pdf" style={styles.input} />
                    <small>Uploading a new resume will replace the old one.</small>
                </div>
                <button type="submit" style={styles.button} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
            {message && <p style={styles.message}>{message}</p>}
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

export default ProfilePage;