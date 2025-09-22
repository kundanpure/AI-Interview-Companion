import React from 'react';

export default function Footer(){
  return (
    <footer style={{
      borderTop:'1px solid rgba(255,255,255,.08)',
      background:'rgba(11,18,32,.6)',
      marginTop:60
    }}>
      <div className="section" style={{display:'flex',gap:16,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{opacity:.75}}>© {new Date().getFullYear()} AI Interview Coach</div>
        <div style={{display:'flex',gap:16,opacity:.8}}>
          <a href="mailto:support@example.com" style={{color:'#dbeafe',textDecoration:'none'}}>Support</a>
          <a href="/terms" style={{color:'#dbeafe',textDecoration:'none'}}>Terms</a>
          <a href="/privacy" style={{color:'#dbeafe',textDecoration:'none'}}>Privacy</a>
        </div>
      </div>
    </footer>
  );
}
