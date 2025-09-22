import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Modal = ({ open, onClose, initialTab='signup' }) => {
  const [tab, setTab] = useState(initialTab);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(()=>{ setTab(initialTab); setEmail(''); setPassword(''); setMessage(''); setError(''); },[initialTab,open]);

  if(!open) return null;

  const submit = async (e)=>{
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      if(tab==='login'){
        await login(email,password);
        navigate('/dashboard');
        onClose();
      } else {
        const res = await api.post('/auth/register',{email,password});
        setMessage(res.data.message || 'Registration successful! Please verify your email.');
      }
    } catch (err){
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100, display:'grid', placeItems:'center',
      background:'rgba(0,0,0,.45)', backdropFilter:'blur(2px)'
    }} onClick={onClose}>
      <div className="card" style={{ width:'min(480px, 92vw)', padding:24 }} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight:800, letterSpacing:.3}}>Join AI Interview Coach</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'#cbd5e1',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{display:'flex', gap:8, marginBottom:16}}>
          <button className={`btn ${tab==='signup'?'':'secondary'}`} onClick={()=>setTab('signup')}>Sign Up</button>
          <button className={`btn ${tab==='login'?'':'secondary'}`} onClick={()=>setTab('login')}>Log In</button>
        </div>
        <form onSubmit={submit} style={{display:'grid', gap:12}}>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" required
                 style={{padding:12, borderRadius:10, border:'1px solid rgba(255,255,255,.14)', background:'#0f172a', color:'#fff'}}/>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (min 6 chars)" required
                 style={{padding:12, borderRadius:10, border:'1px solid rgba(255,255,255,.14)', background:'#0f172a', color:'#fff'}}/>
          <button className="btn" disabled={loading}>{loading ? 'Please wait...' : (tab==='login'?'Log In':'Create Account')}</button>
          {message && <div style={{color:'#22c55e', fontSize:14}}>{message}</div>}
          {error && <div style={{color:'#ef4444', fontSize:14}}>{error}</div>}
        </form>
        <div style={{marginTop:12, fontSize:14, color:'#94a3b8'}}>
          By continuing you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default function AuthModal(){
  const [open,setOpen] = useState(false);
  const [tab,setTab] = useState('signup');

  useEffect(()=>{
    const handleOpen = (e)=>{
      setTab(e.detail?.tab || 'signup');
      setOpen(true);
    };
    const handleClose = () => setOpen(false);
    window.addEventListener('open-auth-modal', handleOpen);
    window.addEventListener('close-auth-modal', handleClose);
    return ()=> {
      window.removeEventListener('open-auth-modal', handleOpen);
      window.removeEventListener('close-auth-modal', handleClose);
    }
  },[]);

  return <Modal open={open} onClose={()=>setOpen(false)} initialTab={tab} />;
}
