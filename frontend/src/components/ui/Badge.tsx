import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', title }) => {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';

  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-800 border border-slate-200',
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} title={title}>
      {children}
    </span>
  );
};
