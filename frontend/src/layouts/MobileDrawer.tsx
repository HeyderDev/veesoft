import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Clon de components/ui/SlideOver.tsx (mismo patrón de portal + backdrop con
 * blur + animación) pero deslizando desde la IZQUIERDA y sin header propio —
 * se usa exclusivamente para envolver <Sidebar forceVisible /> como menú
 * hamburguesa en mobile (ver AdminLayout.tsx). No se toca SlideOver.tsx
 * porque lo usan otras pantallas con el patrón "desde la derecha".
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, children }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let transitionTimer: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setShow(true);
      transitionTimer = setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      transitionTimer = setTimeout(() => setShow(false), 300);
    }

    return () => clearTimeout(transitionTimer);
  }, [isOpen]);

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 overflow-hidden lg:hidden">
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 flex max-w-full pr-10">
        <div
          className={`w-72 max-w-full transform transition-transform duration-300 ease-in-out ${animate ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
