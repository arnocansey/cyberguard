"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertOctagon, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, "success", dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, "error", dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, "info", dur), [addToast]);
  const warn = useCallback((msg, dur) => addToast(msg, "warning", dur), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warn, remove: removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 md:p-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const { id, message, type } = toast;

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
  };

  const glowEffects = {
    success: "border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
    error: "border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.15)]",
    info: "border-sky-500/40 shadow-[0_4px_20px_rgba(14,165,233,0.15)]",
    warning: "border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
  };

  return (
    <div
      className={`glass rounded-xl p-4 text-sm flex items-start gap-3 transition-all duration-300 animate-slide-in pointer-events-auto max-w-sm w-full ${glowEffects[type]}`}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1 font-medium select-none break-words text-slate-100 light:text-slate-900">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-200 light:hover:text-slate-700 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
