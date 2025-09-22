import React from 'react';
import { motion } from 'framer-motion';
import '../styles/landing.css';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function HomePage(){
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCTA = ()=>{
    if(isAuthenticated) navigate('/interview');
    else window.dispatchEvent(new CustomEvent('open-auth-modal', { detail:{ tab:'signup' } }));
  };

  return (
    <>
      <section className="hero">
        <div className="hero-gradient" />
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />

        <div className="section hero-inner">
          <div style={{maxWidth:720}}>
            <div className="kicker">🚀 Job-ready practice • Voice coaching • JD-aware</div>
            <h1 className="shimmer">Ace your next interview with an AI panel that probes like the real thing.</h1>
            <p>Get tailored questions from the actual job description, live feedback on your structure and delivery, and a transparent scorecard aligned with how real teams hire.</p>
            <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:22}}>
              <button className="btn" onClick={handleCTA}>Get Free Interview</button>
              <a className="btn secondary" href="#features">See how it works</a>
            </div>
            <div className="trust-row">
              <span className="badge">✨ JD-aware rubric</span>
              <span className="badge">🎙️ Filler-word tracking</span>
              <span className="badge">🧠 Story Bank (STAR)</span>
              <span className="badge">🛡️ Secure & private</span>
            </div>
          </div>
          <motion.div
            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:.7, delay:.15}}
            className="card"
            style={{padding:18, width:420, maxWidth:'92vw'}}
          >
            <div style={{fontWeight:700, marginBottom:8}}>Live Interview Preview</div>
            <div style={{border:'1px solid rgba(255,255,255,.08)', borderRadius:12, overflow:'hidden'}}>
              <div style={{padding:12, background:'rgba(255,255,255,.04)'}}>👩🏽‍💼 Priya</div>
              <div style={{padding:16, color:'#cbd5e1'}}>
                “Walk me through a recent project that best maps to this role. What was your specific impact?”
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10}}>
              <div className="card" style={{padding:12}}>
                <div style={{fontSize:12, color:'#94a3b8'}}>Speaking Pace</div>
                <div style={{fontWeight:800}}>132 WPM</div>
              </div>
              <div className="card" style={{padding:12}}>
                <div style={{fontSize:12, color:'#94a3b8'}}>Filler Words</div>
                <div style={{fontWeight:800}}>2 / min</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="section">
        <h2 style={{marginTop:0}}>What makes it different</h2>
        <div className="feature-grid">
          {[
            {ico:'🧭', title:'JD-aware plan', desc:'Paste a job description or URL. We auto-extract competencies and build a tailored rubric + first questions.'},
            {ico:'📊', title:'Transparent scorecards', desc:'You see the exact rubric and why a score was given. Improve with clarity, not guesswork.'},
            {ico:'🎙️', title:'Voice coaching', desc:'Track pace, filler words, pauses; get quick tips to sound confident and concise.'},
            {ico:'🧩', title:'Story Bank (STAR)', desc:'Turn your resume into reusable STAR stories; we suggest the best story per question.'},
            {ico:'👥', title:'Panel mode', desc:'Practice with HR + Hiring Manager personas who probe from different angles.'},
            {ico:'🛡️', title:'Privacy-first', desc:'Delete data anytime. Resumes stored securely with size/type checks and optional GCS.'},
          ].map((f,i)=>(
            <motion.div
              key={i} className="card feature"
              initial={{opacity:0, y:18}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
              transition={{duration:.5, delay:i*.05}}
            >
              <div className="ico">{f.ico}</div>
              <div>
                <div style={{fontWeight:700}}>{f.title}</div>
                <div style={{color:'#94a3b8', marginTop:6}}>{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex', justifyContent:'space-between', gap:20, alignItems:'center', flexWrap:'wrap'}}>
            <div>
              <div className="kicker">Real outcomes</div>
              <h3 style={{margin:'10px 0'}}>Built to get you hired, not just “practice”.</h3>
              <p style={{color:'#94a3b8', maxWidth:680}}>
                Every session ends with a learning plan and email draft, aligned to the competencies in your JD. You’ll know exactly what to say next time.
              </p>
            </div>
            <button className="btn" onClick={handleCTA}>Try a Free Interview</button>
          </div>
          <div className="testi" style={{marginTop:16}}>
            {[
              '“The JD-aware questions felt eerily accurate.”',
              '“The speaking tips helped me cut my answer from 3:00 to 1:15.”',
              '“Score transparency is 🔥 — I knew what actually mattered.”',
            ].map((t,i)=>(
              <div key={i} className="t">{t}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <h2 style={{marginTop:0, marginBottom:10}}>Ready to feel confident?</h2>
        <p style={{color:'#94a3b8'}}>Spin up a free interview in seconds — no credit card.</p>
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:10}}>
          <button className="btn" onClick={handleCTA}>Get Free Interview</button>
          <a className="btn ghost" href="/pricing">See Pricing</a>
        </div>
      </section>
    </>
  );
}
