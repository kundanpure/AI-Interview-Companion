import React from 'react';

export function Field({ label, icon, children }) {
  return (
    <div>
      {label && (
        <label className="text-sm text-white/80 flex items-center gap-2">
          {icon} {label}
        </label>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className || ''}`}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&>option]:!text-black ${props.className || ''}`}
    />
  );
}

export function FileInput(props) {
  return (
    <input
      type="file"
      {...props}
      className={`block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 ${props.className || ''}`}
    />
  );
}
