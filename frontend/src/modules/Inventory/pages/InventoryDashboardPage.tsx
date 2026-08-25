import { useInventoryDashboardViewModel } from '../viewmodels/useInventoryDashboardViewModel';

export default function InventoryDashboardPage() {
  const { metrics, recentMovements, isLoading } = useInventoryDashboardViewModel();

  const typeLabels: Record<string, string> = {
    BORROW: 'Préstamo',
    BORROWED: 'Préstamo',
    RETURN: 'Devolución',
    MAINTENANCE: 'Mantenimiento',
    ADJUSTMENT: 'Ajuste',
    CONSUMPTION: 'Consumo',
    decommissioned: 'Dado de baja',
    CREATED: 'Registrado',
    DELETED: 'Eliminado'
  };

  const typeColors: Record<string, string> = {
    BORROW: 'bg-amber-50 text-amber-600 border-amber-200',
    BORROWED: 'bg-amber-50 text-amber-600 border-amber-200',
    RETURN: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    MAINTENANCE: 'bg-red-50 text-red-600 border-red-200',
    ADJUSTMENT: 'bg-slate-50 text-slate-600 border-slate-200',
    CONSUMPTION: 'bg-blue-50 text-blue-600 border-blue-200',
    decommissioned: 'bg-slate-50 text-slate-600 border-slate-200',
    CREATED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    DELETED: 'bg-red-50 text-red-600 border-red-200',
  };

  const setActiveTab = (tab: string) => {
    // Para simplificar la navegación podemos simplemente usar window.location
    if (tab === 'tools') {
      window.location.hash = '#/inventory/tools';
    }
  };

  return (
    <div className="space-y-6 print:hidden p-4 md:p-6 lg:p-8">
      {/* Metrics summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Herramientas Totales</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{isLoading ? '...' : metrics.totalTools}</span>
            <span className="text-xs text-slate-500">unidades</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Disponibles: <span className="font-semibold text-emerald-600">{metrics.availableTools}</span> • En mant.: <span className="font-semibold text-slate-500">{metrics.maintTools}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Insumos Registrados</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{isLoading ? '...' : metrics.totalSupplies}</span>
            <span className="text-xs text-slate-500">categorías</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Bajo stock crítico: <span className="font-semibold text-rose-500">{metrics.criticalSupplies}</span> insumos
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Movimientos Recientes</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-teal-600">{isLoading ? '...' : metrics.totalMovements}</span>
            <span className="text-xs text-slate-500">eventos</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Préstamos, Devoluciones y Mant.</div>
        </div>
      </div>

      {/* Welcome visual card & quick overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-6 rounded-3xl shadow-sm lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 text-[180px] opacity-15 select-none pointer-events-none">🌿</div>
          <div className="space-y-4 max-w-xl">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-300">Administración de Vivero</div>
            <h2 className="text-2xl font-bold leading-tight">Consola de Control del Vivero El Carmen</h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Bienvenido al panel centralizado. Desde aquí puedes catalogar herramientas de vivero e insumos de cultivo, gestionar mantenimientos de herramientas, e imprimir etiquetas de identificación en formato QR o código de barras.
            </p>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={() => setActiveTab('tools')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 transition text-white border border-white/20 rounded-xl font-semibold text-xs relative z-10">Inventario Herramientas</button>
          </div>
        </div>

        {/* Quick list of recent events */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-slate-800 font-bold text-base">Últimos Movimientos</h3>
          <div className="flow-root">
            <ul className="divide-y divide-slate-100">
              {recentMovements.map((ev) => (
                <li key={ev.id} className="py-3 flex justify-between items-center gap-2">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-bold text-slate-800 truncate">{ev.tool?.name || ev.supply?.name || 'Item'}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] text-slate-500 italic truncate mt-0.5">{ev.details?.detalles || '-'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${typeColors[ev.type] || typeColors['ADJUSTMENT']}`}>
                      {typeLabels[ev.type] || ev.type}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 font-semibold truncate">{ev.details?.usuario || 'Sistema'}</p>
                  </div>
                </li>
              ))}
              {recentMovements.length === 0 && !isLoading && (
                <li className="py-6 text-center text-slate-400 text-xs">No hay eventos recientes registrados.</li>
              )}
            </ul>
          </div>
        </div>

        {metrics.overdueTools?.length > 0 && (
          <div className="mt-6 col-span-1 lg:col-span-3">
            <h4 className="text-sm font-bold text-slate-800 mb-3 border-l-4 border-amber-500 pl-2">Alertas de Herramientas Atrasadas (&gt; 1 día)</h4>
            <div className="overflow-hidden border border-amber-200 rounded-2xl bg-amber-50">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-amber-100/50 border-b border-amber-200">
                    <th className="px-5 py-3 font-bold text-amber-800">Usuario</th>
                    <th className="px-5 py-3 font-bold text-amber-800">Herramienta</th>
                    <th className="px-5 py-3 font-bold text-amber-800">Fecha Préstamo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {metrics.overdueTools.map((ot) => (
                    <tr key={ot.id}>
                      <td className="px-5 py-2.5 font-bold text-amber-900">{ot.details?.usuario || 'Sistema'}</td>
                      <td className="px-5 py-2.5 text-amber-800">{ot.tool?.name || '-'} ({ot.tool?.code || '-'})</td>
                      <td className="px-5 py-2.5 text-amber-800">{new Date(ot.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
