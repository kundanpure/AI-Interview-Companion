import React from 'react';
import { GhostButton } from './Buttons';
import { LogOut, Sparkles } from 'lucide-react';

export default function HeaderBar({ title, subtitle, onLogout, right }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1" />
      {right}
      {onLogout && (
        <GhostButton onClick={onLogout} className="ml-3">
          <LogOut className="w-4 h-4" /> Logout
        </GhostButton>
      )}
    </div>
  );
}
