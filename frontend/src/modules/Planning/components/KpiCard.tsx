import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  isLoading?: boolean;
}

const colorMap = {
  emerald: { bg: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200' },
  blue: { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
  amber: { bg: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-200' },
  rose: { bg: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-200' },
  violet: { bg: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-200' },
};

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, color, icon: Icon, trend, isLoading }) => {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-white shadow-lg ${c.shadow}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <span>{trend.up ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </>
      )}
    </div>
  );
};
