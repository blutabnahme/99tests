'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-[#E6F7F5] border-[#008085]',
      text: 'text-[#005C5F]',
      icon: <Check className="w-4 h-4 text-[#008085]" />,
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      text: 'text-red-700',
      icon: <X className="w-4 h-4 text-red-500" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-500',
      text: 'text-amber-700',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      text: 'text-blue-700',
      icon: <Info className="w-4 h-4 text-blue-500" />,
    },
  };

  const s = styles[type];

  return (
    <div className={`fixed top-6 right-6 z-[100] transition-colors duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-lg border-l-[3px] shadow-lg bg-white ${s.bg}`}>
        <div className="flex-shrink-0">{s.icon}</div>
        <p className={`text-sm font-medium ${s.text}`}>{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
