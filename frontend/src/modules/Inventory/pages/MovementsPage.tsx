import { useState, useEffect } from 'react';
import { useMovementsViewModel } from '../viewmodels/useMovementsViewModel';

export default function MovementsPage() {
  const { movements, isLoading, loadMovements } = useMovementsViewModel();

  const [filterTipo, setFilterTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const handleFilterEvents = () => {
    loadMovements(
      filterTipo || undefined,
      searchTerm || undefined,
      filterStartDate || undefined,
      filterEndDate || undefined
    );
  };

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const typeLabels: Record<string, string> = {
    BORROW: 'Préstamo',
    BORROWED: 'Préstamo',
    RETURN: 'Devolución',
    MAINTENANCE: 'Mantenimiento',
    ADJUSTMENT: 'Ajuste',
    CONSUMPTION: 'Consumo',
    ENTRADA: 'Entrada',
    SALIDA: 'Salida',
    decommissioned: 'Dado de baja'
  };

  const typeColors: Record<string, string> = {
    BORROW: 'bg-amber-50 text-amber-600 border-amber-200',
    BORROWED: 'bg-amber-50 text-amber-600 border-amber-200',
    RETURN: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    MAINTENANCE: 'bg-red-50 text-red-600 border-red-200',
    ADJUSTMENT: 'bg-slate-50 text-slate-600 border-slate-200',
    CONSUMPTION: 'bg-blue-50 text-blue-600 border-blue-200',
    ENTRADA: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    SALIDA: 'bg-orange-50 text-orange-600 border-orange-200',
    decommissioned: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Historial de Movimientos de Bodega</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control y trazabilidad de los préstamos, devoluciones y mantenimientos.</p>
          </div>
        </div>

        <div className="px-6 pb-4 pt-4 border-b border-slate-100 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR EN HISTORIAL</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ej: nombre, herramienta..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">TIPO EVENTO</label>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none">
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada (Insumos)</option>
              <option value="SALIDA">Salida (Insumos)</option>
              <option value="BORROWED">Préstamo</option>
              <option value="RETURN">Devolución</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="ADJUSTMENT">Ajuste / Eliminación</option>
              <option value="CONSUMPTION">Consumo</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">DESDE</label>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">HASTA</label>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          </div>
          <button onClick={handleFilterEvents} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition">Filtrar</button>
          <button
            onClick={() => { setSearchTerm(''); setFilterTipo(''); setFilterStartDate(''); setFilterEndDate(''); loadMovements(); }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-xs text-slate-700 transition"
          >
            🔄 Limpiar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item (Herramienta/Insumo)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo Evento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cant / Stock (A → N)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles Adicionales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
                    {new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                    <div className="flex flex-col gap-1">
                      <span>{ev.tool?.name || ev.tool_unit?.tool?.name || ev.supply?.name || 'Item Desconocido'}</span>
                      {ev.tool_unit && <span className="text-[10px] text-slate-500 font-mono">U: {ev.tool_unit.code}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                    {ev.tool_unit?.code || ev.tool?.code || ev.supply?.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${typeColors[ev.type] || typeColors['ADJUSTMENT']}`}>
                      {typeLabels[ev.type] || ev.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                    {ev.supply_id ? (
                      <div className="flex flex-col">
                        <span className="font-bold">{ev.quantity} {ev.supply?.unit || ''}</span>
                        {ev.previous_stock !== null && ev.new_stock !== null && (
                           <span className="text-[10px] text-slate-500">{ev.previous_stock} → {ev.new_stock}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                    {ev.details?.usuario || 'Sistema'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 italic">
                     <div className="flex flex-col gap-1 max-w-xs">
                       <span className="truncate" title={ev.details?.detalles || ev.reason || ''}>{ev.details?.detalles || ev.reason || '-'}</span>
                       {ev.observations && <span className="text-[10px] text-emerald-600 truncate" title={ev.observations}>Obs: {ev.observations}</span>}
                       {ev.operational_task_id && <span className="text-[10px] text-amber-600">Actividad ID: {ev.operational_task_id}</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {movements.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No hay registros en el historial de eventos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
