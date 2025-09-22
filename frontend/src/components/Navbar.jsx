import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './navbar.css';

export default function Navbar(){
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const openAuthModal = () => {
    const evt = new CustomEvent('open-auth-modal', { detail: { tab: 'signup' } });
    window.dispatchEvent(evt);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/">AI Interview Coach</Link>
        <div className="spacer" />
        <div className="links">
          <Link className={`link ${location.pathname==='/'?'active':''}`} to="/">Home</Link>
          {isAuthenticated && <Link className={`link ${location.pathname.startsWith('/dashboard')?'active':''}`} to="/dashboard">Dashboard</Link>}
          <Link className={`link ${location.pathname.startsWith('/pricing')?'active':''}`} to="/pricing">Pricing</Link>
          {!isAuthenticated ? (
            <>
              <button className="nav-btn" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail:{tab:'login'} }))}>Log in</button>
              <button className="nav-btn primary" onClick={openAuthModal}>Get Free Interview</button>
            </>
          ) : (
            <>
              <span className="user-chip">👋 {user?.name || user?.email}</span>
              <button className="nav-btn" onClick={() => navigate('/profile')}>Profile</button>
              <button className="nav-btn danger" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
