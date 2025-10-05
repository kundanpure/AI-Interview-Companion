import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true }) {
  return (
    <motion.div
      className={`rounded-2xl border border-white/10 bg-white/10 backdrop-blur ${className}`}
      whileHover={hover ? { y: -3, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}
