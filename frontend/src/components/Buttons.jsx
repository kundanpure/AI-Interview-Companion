import React from 'react';

export function PrimaryButton({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function EmeraldButton({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 ${className}`}
    >
      {children}
    </button>
  );
}
