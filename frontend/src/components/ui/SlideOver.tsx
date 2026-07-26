import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300); // transition duration
    }
  }, [isOpen]);

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        
        {/* Panel container */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div 
            className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out ${animate ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex h-full flex-col bg-white shadow-2xl">
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                  {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                </div>
                <button 
                  onClick={onClose}
                  className="ml-3 flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <span className="sr-only">Cerrar panel</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="relative flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
