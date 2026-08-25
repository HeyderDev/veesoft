import React from 'react';
import { FaseModal } from '../components/FaseModal';
import { isGatedPhaseCode } from '../types';
import { useFasesViewModel } from '../viewmodels/useFasesViewModel';

interface FasesPageProps {
  viveroId: number;
}

export const FasesPage: React.FC<FasesPageProps> = ({ viveroId }) => {
  const {
    fasesData, editFase, setEditFase, hoveredFase, setHoveredFase,
    handleSaveFase, duracionActual, gatedPhases,
  } = useFasesViewModel(viveroId);

  const sortedFases = fasesData.slice().sort((a, b) => a.execution_order - b.execution_order);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Fases del Ciclo Productivo</h1>
          <p className="section-subtitle">Configuración del flujo de producción de plántulas de cacao</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm">
          <span className="text-slate-400">Duración calculada:</span>
          <span className="font-bold text-slate-800">{duracionActual} días</span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-600 font-semibold">~{Math.round(duracionActual / 30)} meses</span>
        </div>
      </div>

      {/* Alerta informativa */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
        <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
        <div>
          <p className="font-semibold text-amber-800">Configuración única para todos los lotes de este vivero</p>
          <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">
            Esta duración aplica a <strong>todos los lotes de este vivero</strong> — no existe configuración por
            lote. Al cambiarla, los lotes con un ciclo en curso se reprograman automáticamente desde la fase en la
            que se encuentran actualmente en adelante (lo ya transcurrido no se toca).
            {gatedPhases.length > 0 && (
              <> {gatedPhases.map(f => f.name).join(', ')} son actividades obligatorias del sistema: arrancan
              calculadas en 1 día, pero si la actividad asociada se confirma tarde en Tareas, esa fase se extiende
              hasta ese día y el resto del calendario se recalcula solo — su duración de catálogo no es editable.</>
            )}
          </p>
        </div>
      </div>

      {/* Timeline visual */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-700 mb-5 text-sm">Vista de proporciones (por duración)</h3>
        <div className="flex h-10 rounded-xl overflow-hidden gap-0.5 mb-3">
          {sortedFases.map((fase) => {
            const pct = (fase.estimated_duration_days / duracionActual) * 100;
            const isGated = isGatedPhaseCode(fase.code);
            return (
              <div
                key={fase.id}
                className="flex items-center justify-center text-white text-xs font-bold transition-all duration-300 cursor-pointer"
                style={{
                  width: `${pct}%`,
                  backgroundColor: fase.color_reference || '#10b981',
                  opacity: hoveredFase && hoveredFase !== fase.id ? 0.5 : 1,
                  filter: hoveredFase === fase.id ? 'brightness(1.1)' : 'none',
                  outline: isGated ? '1.5px dashed white' : 'none',
                  outlineOffset: -1,
                }}
                title={`${fase.name}: ${fase.estimated_duration_days} día(s) (${pct.toFixed(1)}%)${isGated ? ' — se extiende si la actividad se demora' : ''}`}
                onMouseEnter={() => setHoveredFase(fase.id)}
                onMouseLeave={() => setHoveredFase(null)}
              >
                {pct > 8 ? fase.execution_order : ''}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {fasesData.map(fase => (
            <div key={fase.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: fase.color_reference || '#10b981' }} />
              {fase.name}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline detallado */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-700 mb-6 text-sm">Detalle de cada fase</h3>
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-200" />

          <div className="space-y-6">
            {sortedFases.map((fase) => {
              const isHovered = hoveredFase === fase.id;
              const isGated = isGatedPhaseCode(fase.code);
              const pct = Math.round((fase.estimated_duration_days / duracionActual) * 100);

              return (
                <div key={fase.id}
                  className={`relative flex items-start gap-4 transition-all duration-200 ${isHovered ? 'translate-x-1' : ''}`}
                  onMouseEnter={() => setHoveredFase(fase.id)}
                  onMouseLeave={() => setHoveredFase(null)}
                >
                  {/* Circle */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative z-10 shadow-md"
                    style={{ backgroundColor: fase.color_reference || '#10b981' }}
                  >
                    {fase.execution_order}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{fase.execution_order}
                        </span>
                        <h4 className="font-bold text-slate-800">{fase.name}</h4>
                        {isGated && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold"
                            title="Actividad obligatoria del sistema: arranca en 1 día y se extiende sola si la actividad se confirma tarde en Tareas. Nombre, orden y duración no son editables."
                          >
                            🔒 obligatoria
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: fase.color_reference || '#10b981' }}>
                          {fase.estimated_duration_days} día{fase.estimated_duration_days === 1 ? '' : 's'}
                        </span>
                        <span className="text-xs text-slate-400">({pct}%)</span>
                        <button
                          id={`btn-editar-fase-${fase.id}`}
                          onClick={() => setEditFase(fase)}
                          className="btn-ghost text-xs py-1 px-2"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{fase.description}</p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: fase.color_reference || '#10b981' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {editFase && (
        <FaseModal fase={editFase} onClose={() => setEditFase(null)} onSave={handleSaveFase} />
      )}
    </div>
  );
};
