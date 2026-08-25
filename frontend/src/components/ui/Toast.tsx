import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`animate-fade-in-up flex items-center px-4 py-3 rounded-lg shadow-lg border text-sm font-medium
              ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                t.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
                'bg-white text-slate-800 border-slate-200'}`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
