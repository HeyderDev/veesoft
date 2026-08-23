import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { EstadoMeta, MetaProduccion, Vivero } from '../types';

const metaStatusConfig: Record<EstadoMeta, { label: string; variant: 'neutral' | 'success' | 'info' }> = {
  not_started: { label: 'No iniciada', variant: 'neutral' },
  active: { label: 'Activa', variant: 'success' },
  completed: { label: 'Completada', variant: 'info' },
};

interface ViveroCardProps {
  vivero: Vivero;
  meta?: MetaProduccion;
  /** Si se omite, no se muestra el botón de editar (ej. pantalla de selección). */
  onEditVivero?: () => void;
  /** Si se omite, no se muestra la sección de meta (ej. pantalla de selección). */
  onConfigureMeta?: () => void;
  onEnter: () => void;
}

export const ViveroCard: React.FC<ViveroCardProps> = ({ vivero, meta, onEditVivero, onConfigureMeta, onEnter }) => {
  const progress = meta && meta.target_seedlings > 0
    ? Math.min(100, Math.round((0 / meta.target_seedlings) * 100))
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{vivero.name}</h3>
          <p className="text-xs text-slate-500 mt-1">📍 {vivero.location}</p>
          <p className="text-xs text-slate-500">👤 {vivero.responsible}</p>
        </div>
        {onEditVivero && (
          <Button variant="ghost" onClick={onEditVivero} className="h-8 w-8 p-0 rounded-full shrink-0">✏️</Button>
        )}
      </div>

      {onConfigureMeta && (
        <div className="border-t border-slate-100 pt-4">
          {meta ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 truncate pr-2">{meta.title}</p>
                <Badge variant={metaStatusConfig[meta.status].variant}>{metaStatusConfig[meta.status].label}</Badge>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Avance</span>
                  <span>0 / {meta.target_seedlings.toLocaleString('es')} plántulas</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <Button variant="secondary" onClick={onConfigureMeta} className="w-full">
                Configurar Meta
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-slate-400 mb-3">Este vivero no tiene una meta en curso.</p>
              <Button onClick={onConfigureMeta} className="w-full">
                Nueva Meta
              </Button>
            </div>
          )}
        </div>
      )}

      <Button variant="primary" onClick={onEnter} className="w-full">
        Entrar al vivero →
      </Button>
    </div>
  );
};
