import React, { useState } from 'react';

import { useToolsViewModel } from '../viewmodels/useToolsViewModel';
import { useMovementsViewModel } from '../viewmodels/useMovementsViewModel';

export default function MaintenancePage() {
  const { tools, handleUpdateStatus } = useToolsViewModel();
  const { movements, loadMovements } = useMovementsViewModel(); // Optionally could use to show history, but we'll try to find the last maint event

  const [selectedMaintToolId, setSelectedMaintToolId] = useState<number | ''>('');
  const [maintNotes, setMaintNotes] = useState('');
  const [releasingToolId, setReleasingToolId] = useState<number | null>(null);
  const [releaseNotes, setReleaseNotes] = useState('');

  const toolsInMaintenance = tools.filter(t => t.status === 'MAINTENANCE' || t.status === 'DAMAGED');
  const availableTools = tools.filter(t => t.status === 'AVAILABLE');

  const handleSendToolToMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintToolId) return;
    const details = {
      usuario: 'Administrador',
      detalles: maintNotes || 'Enviado a mantenimiento preventivo/correctivo'
    };
    
    await handleUpdateStatus(Number(selectedMaintToolId), 'MAINTENANCE', details);
    setSelectedMaintToolId('');
    setMaintNotes('');
    loadMovements(); // refresh history
  };

  const handleReleaseTool = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!releasingToolId) return;
    const details = {
      usuario: 'Administrador',
      detalles: releaseNotes || 'Liberado de mantenimiento'
    };
    
    await handleUpdateStatus(releasingToolId, 'AVAILABLE', details);
    setReleasingToolId(null);
    setReleaseNotes('');
    loadMovements(); // refresh history
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Herramientas</h1>
          <p className="text-sm text-slate-500">Gestión de revisiones técnicas y reparaciones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Herramientas en Mantenimiento</h3>
              <p className="text-xs text-slate-400">Control de equipos bajo reparación o mantenimiento técnico.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toolsInMaintenance.map((tool) => {
                // Find the last maintenance event for this tool to show details
                const maintEvent = movements.find(e => e.type === 'MAINTENANCE' && e.tool?.id === tool.id);
                return (
                  <div key={tool.id} className="bg-red-50/20 border border-red-100 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-0.5 bg-red-100/50 rounded-md text-[10px] font-bold text-red-700 font-mono">{tool.code}</span>
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-bold uppercase animate-pulse">
                          En Mantenimiento
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{tool.name}</h4>
                      <p className="text-slate-500 text-xs mt-1 truncate">{tool.description || 'Sin descripción.'}</p>

                      {maintEvent && (
                        <div className="mt-3 bg-white p-2.5 rounded-xl border border-red-100/60 text-[11px] text-slate-600">
                          <p className="font-bold text-red-800">Detalles de Ingreso:</p>
                          <p className="mt-0.5 leading-relaxed">{maintEvent.details?.detalles}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-1">Registrado el {new Date(maintEvent.created_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100/80 flex justify-end">
                      {releasingToolId === tool.id ? (
                        <form onSubmit={handleReleaseTool} className="w-full space-y-2">
                          <textarea
                            required
                            placeholder="Describe el trabajo realizado o estado final..."
                            rows={2}
                            value={releaseNotes}
                            onChange={(e) => setReleaseNotes(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-white"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setReleasingToolId(null)}
                              className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                            >
                              Confirmar Liberación
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setReleasingToolId(tool.id);
                            setReleaseNotes('');
                          }}
                          className="px-3.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                        >
                          🔧 Liberar Herramienta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {toolsInMaintenance.length === 0 && (
                <div className="col-span-full bg-slate-50/50 p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No hay herramientas en mantenimiento en este momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form to send to maintenance */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Registrar Ingreso a Mantenimiento</h3>
            <p className="text-xs text-slate-400">Envía una herramienta disponible a revisión técnica.</p>
          </div>

          <form onSubmit={handleSendToolToMaintenance} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">SELECCIONAR HERRAMIENTA</label>
              <select
                required
                value={selectedMaintToolId}
                onChange={(e) => setSelectedMaintToolId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none bg-slate-50"
              >
                <option value="">-- Selecciona una Herramienta Disponible --</option>
                {availableTools.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">MOTIVO / DIAGNÓSTICO INICIAL</label>
              <textarea
                required
                placeholder="Detalla la avería, desgaste o motivo del mantenimiento..."
                rows={3}
                value={maintNotes}
                onChange={(e) => setMaintNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 transition text-white rounded-xl font-bold text-xs shadow-md"
            >
              Enviar a Mantenimiento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
