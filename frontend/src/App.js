// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Import all our components
import InterviewCoach from './InterviewCoach';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import VerificationPage from './pages/VerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
// --- START: NEW CODE ---
import ProfilePage from './pages/ProfilePage'; // 1. IMPORT THE NEW PAGE
// --- END: NEW CODE ---

// A wrapper to protect routes that require a logged-in user
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} 
      />
      <Route path="/verify-email/:token" element={<VerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/interview" 
        element={<PrivateRoute><InterviewCoach /></PrivateRoute>} 
      />
      <Route 
        path="/dashboard" 
        element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
      />
      <Route 
        path="/pricing" 
        element={<PrivateRoute><PricingPage /></PrivateRoute>} 
      />

      {/* --- START: NEW CODE --- */}
      <Route 
        path="/profile" 
        element={<PrivateRoute><ProfilePage /></PrivateRoute>} 
      /> 
      {/* --- END: NEW CODE --- */}

      {/* Default route handles initial navigation */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;