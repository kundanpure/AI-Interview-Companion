// frontend/src/pages/DashboardPage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function DashboardPage() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/interviews/history');
        setHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch interview history:", error);
      }
    };
    if (user) { // Only fetch history if the user is logged in
      fetchHistory();
    }
  }, [user]);

  const styles = {
    container: { 
      padding: '2rem', 
      backgroundColor: '#f0f4f8', 
      color: '#333', 
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '2rem',
      borderBottom: '1px solid #e1e4e8',
      paddingBottom: '1rem'
    },
    welcomeText: {
      fontSize: '1.8rem',
      fontWeight: '600',
      color: '#2c3e50'
    },
    button: { 
      padding: '0.5rem 1rem', 
      borderRadius: '4px', 
      border: 'none', 
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    logoutBtn: { 
      backgroundColor: '#e74c3c', 
      color: 'white',
    },
    credits: { 
      backgroundColor: 'white', 
      padding: '1.5rem', 
      borderRadius: '8px', 
      margin: '2rem 0',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e1e4e8'
    },
    creditsHeader: {
      color: '#2c3e50',
      marginTop: 0,
      borderBottom: '1px solid #e1e4e8',
      paddingBottom: '0.5rem'
    },
    creditInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0'
    },
    creditLabel: {
      fontWeight: '500'
    },
    creditValue: {
      fontWeight: '600',
      color: '#3498db'
    },
    actions: { 
      display: 'flex', 
      gap: '1rem', 
      marginTop: '1.5rem',
      flexWrap: 'wrap'
    },
    interviewBtn: { 
      backgroundColor: '#27ae60', 
      color: 'white', 
      fontSize: '1.1rem', 
      padding: '0.75rem 1.5rem',
    },
    buyBtn: { 
      backgroundColor: '#3498db', 
      color: 'white',
    },
    historySection: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e1e4e8'
    },
    historyHeader: {
      color: '#2c3e50',
      marginTop: 0,
      borderBottom: '1px solid #e1e4e8',
      paddingBottom: '0.5rem'
    },
    historyTable: { 
      width: '100%', 
      marginTop: '1rem', 
      borderCollapse: 'collapse' 
    },
    th: { 
      borderBottom: '1px solid #e1e4e8', 
      padding: '0.75rem', 
      textAlign: 'left',
      color: '#7f8c8d'
    },
    td: { 
      borderBottom: '1px solid #e1e4e8', 
      padding: '0.75rem' 
    },
    scoreCell: {
      fontWeight: '600',
      color: score => score >= 7 ? '#27ae60' : score >= 5 ? '#f39c12' : '#e74c3c'
    },
    emptyHistory: {
      textAlign: 'center',
      padding: '2rem',
      color: '#7f8c8d',
      fontStyle: 'italic'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.welcomeText}>
          Welcome, {user?.name || user?.email}
        </h1>
        <button 
          onClick={logout} 
          style={{...styles.button, ...styles.logoutBtn}}
        >
          Logout
        </button>
      </header>
  
      <div style={styles.credits}>
        <h3 style={styles.creditsHeader}>Your Interview Credits</h3>
        <div style={styles.creditInfo}>
          <span style={styles.creditLabel}>Free Interviews:</span>
          <span style={styles.creditValue}>{user?.free_interviews_remaining || user?.free_interviews || 0}</span>
        </div>
        <div style={styles.creditInfo}>
          <span style={styles.creditLabel}>Paid Interviews:</span>
          <span style={styles.creditValue}>{user?.paid_interviews_remaining || user?.paid_interviews || 0}</span>
        </div>
        <div style={styles.actions}>
          <button 
            onClick={() => navigate('/interview')} 
            style={{...styles.button, ...styles.interviewBtn}}
          >
            🚀 Start New Interview
          </button>
          
          <button 
            onClick={() => navigate('/profile')} 
            style={{...styles.button, backgroundColor: '#f39c12', color: 'white'}}
          >
            👤 My Profile
          </button>

          <button 
            onClick={() => navigate('/pricing')} 
            style={{...styles.button, ...styles.buyBtn}}
          >
            💳 Buy More Credits
          </button>
        </div>
      </div>
      
      <div style={styles.historySection}>
        <h2 style={styles.historyHeader}>Interview History</h2>
        {history.length > 0 ? (
          <table style={styles.historyTable}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Mode</th>
                <th style={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td style={styles.td}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>{item.user_data?.role || 'N/A'}</td>
                  <td style={styles.td}>{item.mode || 'Standard'}</td>
                  
                  {/* --- START OF FIX --- */}
                  <td style={{
                    ...styles.td, // Apply base td styles
                    fontWeight: styles.scoreCell.fontWeight, // Apply bold font weight
                    color: styles.scoreCell.color(item.overall_score || 0) // Call the inner color function
                  }}>
                  {/* --- END OF FIX --- */}
                    {item.overall_score ? `${item.overall_score.toFixed(1)} / 10` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={styles.emptyHistory}>You have no interview history yet. Start your first interview!</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;