import { useState, useEffect } from 'react';

import Swal from 'sweetalert2';
import { CheckCircle2, Search, Wrench } from 'lucide-react';
import { useToolsViewModel } from '../viewmodels/useToolsViewModel';
import type { ToolUnit } from '../types';

export default function MaintenancePage() {
  const { tools, isLoading, loadTools, handleUpdateUnitStatus } = useToolsViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTools(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadTools]);

  const handleSendToMaintenance = async (unit: ToolUnit, toolName: string) => {
    if (unit.status !== 'available') {
      await Swal.fire({
        icon: 'error',
        title: 'No disponible',
        text: 'La herramienta está prestada y no puede enviarse a mantenimiento.'
      });
      return;
    }
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Enviar a Mantenimiento',
      html: `
        <div class="text-left space-y-3">
          <p class="text-sm text-slate-600">Herramienta: <strong>${toolName}</strong></p>
          <p class="text-sm text-slate-600">Unidad: <strong class="font-mono text-emerald-700">${unit.code}</strong></p>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Descripción del Mantenimiento',
      inputPlaceholder: 'Ej: Desgaste en cuchilla, revisión preventiva...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Enviar a Mantenimiento',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar una descripción';
        }
      }
    });

    if (isConfirmed && notes) {
      const details = {
        usuario: 'Administrador',
        detalles: notes
      };
      await handleUpdateUnitStatus(unit.id, 'maintenance', details);
    }
  };

  const handleLiftMaintenance = async (unit: ToolUnit, toolName: string) => {
    const { value: notes, isConfirmed } = await Swal.fire({
      title: 'Levantar Mantenimiento',
      html: `
        <div class="text-left space-y-3">
          <p class="text-sm text-slate-600">Herramienta: <strong>${toolName}</strong></p>
          <p class="text-sm text-slate-600">Unidad: <strong class="font-mono text-emerald-700">${unit.code}</strong></p>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Descripción del trabajo realizado',
      inputPlaceholder: 'Ej: Se afiló la cuchilla, cambio de aceite...',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Liberar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar el trabajo realizado';
        }
      }
    });

    if (isConfirmed && notes) {
      const details = {
        usuario: 'Administrador',
        detalles: notes
      };
      await handleUpdateUnitStatus(unit.id, 'available', details);
    }
  };

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    borrowed: 'bg-amber-50 text-amber-600 border-amber-200',
    maintenance: 'bg-orange-50 text-orange-600 border-orange-200',
    out_of_service: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    borrowed: 'Prestada',
    maintenance: 'Mantenimiento',
    out_of_service: 'Baja'
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimiento de Herramientas</h1>
          <p className="text-sm text-slate-500">Gestión de revisiones técnicas y reparaciones por unidad física.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 print:hidden">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar entidad por nombre o descripción..."
                className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-4">
              {tools.map((tool) => (
                <div key={tool.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{tool.name}</h3>
                      <p className="text-slate-500 text-xs mt-1 max-w-lg">{tool.description || 'Sin descripción.'}</p>
                      
                      <div className="flex gap-4 mt-3 text-[11px] font-semibold">
                        <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded">Total: {tool.units_count || 0}</span>
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Disp: {tool.available_units_count || 0}</span>
                        <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">En Mantenimiento: {tool.maintenance_units_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                       <button onClick={() => setSelectedToolId(selectedToolId === tool.id ? null : tool.id)} className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-xl font-bold">
                          {selectedToolId === tool.id ? 'Ocultar Unidades' : 'Ver Unidades'}
                       </button>
                    </div>
                  </div>

                  {/* UNIDADES ACCORDION */}
                  {selectedToolId === tool.id && (
                    <div className="bg-slate-50 p-5 border-t border-slate-100">
                       <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-sm text-slate-700">Unidades Físicas</h4>
                       </div>
                       
                       {(!tool.units || tool.units.length === 0) ? (
                          <p className="text-xs text-slate-400 text-center py-4">No se han cargado las unidades o no existen.</p>
                       ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {tool.units.map(unit => (
                              <div key={unit.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between transition hover:shadow-md hover:border-slate-300">
                                 <div className="flex justify-between items-start mb-3">
                                   <span className="font-mono text-sm font-bold text-slate-700">{unit.code}</span>
                                   <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${statusColors[unit.status] || statusColors.available}`}>{statusLabels[unit.status] || unit.status}</span>
                                 </div>
                                 
                                 <div className="flex justify-center items-center mt-2 pt-3 border-t border-slate-50">
                                   {unit.status === 'available' && (
                                     <button onClick={() => handleSendToMaintenance(unit, tool.name)} className="w-full text-xs font-bold bg-orange-50 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-100 transition shadow-sm border border-orange-100">
                                       <Wrench className="w-3.5 h-3.5 inline mr-1" /> Enviar a Mantenimiento
                                     </button>
                                   )}
                                   {(unit.status === 'maintenance' || unit.status === 'damaged') && (
                                     <button onClick={() => handleLiftMaintenance(unit, tool.name)} className="w-full text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 transition shadow-sm border border-emerald-100 print:hidden">
                                       <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Levantar Mantenimiento
                                     </button>
                                   )}
                                   {unit.status === 'out_of_service' && (
                                     <span className="text-[11px] text-slate-400 font-bold py-1">Unidad de baja</span>
                                   )}
                                 </div>
                              </div>
                            ))}
                          </div>
                       )}
                    </div>
                  )}
                </div>
              ))}
              {tools.length === 0 && !isLoading && (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-sm">
                  No se encontraron herramientas.
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
