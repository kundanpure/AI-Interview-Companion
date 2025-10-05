import React from 'react';
import { motion } from 'framer-motion';

export function Page({ children, className = '' }) {
  return (
    <div className={`min-h-screen relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#0f1530] to-[#141a38]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,_#fff_1px,_transparent_0)] [background-size:24px_24px]" />
        <div className="absolute -inset-20 bg-[conic-gradient(from_180deg_at_50%_50%,_rgba(99,102,241,0.2),_rgba(236,72,153,0.2),_rgba(34,197,94,0.2),_rgba(99,102,241,0.2))] blur-3xl opacity-30" />
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        {children}
      </motion.div>
    </div>
  );
}

export function Container({ children, className = '' }) {
  return <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>{children}</div>;
}
