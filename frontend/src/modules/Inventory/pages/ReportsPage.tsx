// ReportsPage.tsx - Fixed JSX structure
import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToolsViewModel } from '../viewmodels/useToolsViewModel';
import { useSuppliesViewModel } from '../viewmodels/useSuppliesViewModel';
import { useMovementsViewModel } from '../viewmodels/useMovementsViewModel';
import { useInventoryDashboardViewModel } from '../viewmodels/useInventoryDashboardViewModel';
import { useStudentsViewModel } from '../viewmodels/useStudentsViewModel';

type ReportTab = 'herramientas' | 'insumos' | 'estudiantes' | 'movimientos';

export default function ReportsPage() {
  const { tools, loadTools } = useToolsViewModel();
  const { supplies, loadSupplies } = useSuppliesViewModel();
  const { movements, loadMovements } = useMovementsViewModel();
  const { metrics } = useInventoryDashboardViewModel();
  const { students, refreshData: loadStudents } = useStudentsViewModel();

  const [activeTab, setActiveTab] = useState<ReportTab>('herramientas');

  // Herramientas Filters
  const [hSearch, setHSearch] = useState('');
  const [hState, setHState] = useState('');

  // Insumos Filters
  const [iSearch, setISearch] = useState('');
  const [iAlertOnly, setIAlertOnly] = useState(false);

  // Estudiantes Filters
  const [sSearch, setSSearch] = useState('');
  const [sWithLoans, setSWithLoans] = useState(false);
  const [sWithAlerts, setSWithAlerts] = useState(false);

  // Movimientos Filters
  const [mTipo, setMTipo] = useState('');
  const [mStudent, setMStudent] = useState('');
  const [mStartDate, setMStartDate] = useState('');
  const [mEndDate, setMEndDate] = useState('');

  useEffect(() => {
    loadTools();
    loadSupplies();
    loadMovements();
    loadStudents();
  }, [loadTools, loadSupplies, loadMovements, loadStudents]);

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleFilterMovimientos = () => {
    loadMovements(mTipo || undefined, mStudent || undefined, mStartDate || undefined, mEndDate || undefined);
  };

  const clearMovimientosFilters = () => {
    setMTipo('');
    setMStudent('');
    setMStartDate('');
    setMEndDate('');
    loadMovements();
  };

  // --- Filtered Data ---

  // Herramientas
  const filteredTools = tools.filter(t => {
    const matchSearch = hSearch === '' || t.name.toLowerCase().includes(hSearch.toLowerCase()) || t.description?.toLowerCase().includes(hSearch.toLowerCase());
    return matchSearch;
  });

  const availableToolsCount = tools.reduce((acc, t) => acc + (t.available_units_count || 0), 0);
  const lentToolsCount = tools.reduce((acc, t) => acc + (t.borrowed_units_count || 0), 0);
  const maintToolsCount = tools.reduce((acc, t) => acc + (t.maintenance_units_count || 0), 0);

  // Insumos
  const filteredInsumos = supplies.filter(i => {
    const matchSearch = iSearch === '' || i.name.toLowerCase().includes(iSearch.toLowerCase()) || i.sku.toLowerCase().includes(iSearch.toLowerCase());
    const isCritical = i.current_stock <= i.min_stock;
    const matchAlert = iAlertOnly ? isCritical : true;
    return matchSearch && matchAlert;
  });

  // Estudiantes (derived from useStudentsViewModel)
  const getStudentActiveLoans = (studentId: number, fullName: string) => {
    return movements.filter(e =>
      (e.type === 'BORROW' || e.type === 'BORROWED') &&
      (e.student_id === studentId || e.details?.usuario === fullName) &&
      !movements.some(de => de.type === 'RETURN' && de.tool?.id === e.tool?.id && (de.student_id === studentId || de.details?.usuario === fullName) && new Date(de.created_at) > new Date(e.created_at))
    );
  };

  const filteredStudents = students.filter(st => {
    if (!st) return false;
    const fullName = `${st.first_name} ${st.last_name}`;
    const matchSearch = sSearch === '' || fullName.toLowerCase().includes(sSearch.toLowerCase()) || st.cedula.includes(sSearch);
    const activeLoans = getStudentActiveLoans(st.id, fullName);
    const hasLoans = activeLoans.length > 0;
    const hasAlerts = metrics?.overdueTools?.some((ot: any) => ot.student_id === st.id || ot.details?.usuario === fullName);
    const matchLoans = sWithLoans ? hasLoans : true;
    const matchAlerts = sWithAlerts ? hasAlerts : true;
    return matchSearch && matchLoans && matchAlerts;
  });

  const typeLabels: Record<string, string> = {
    BORROW: 'Préstamo',
    BORROWED: 'Préstamo',
    RETURN: 'Devolución',
    MAINTENANCE: 'Mantenimiento',
    ADJUSTMENT: 'Ajuste',
    CONSUMPTION: 'Consumo',
    decommissioned: 'Dado de baja'
  };

  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    BORROWED: 'Prestada',
    MAINTENANCE: 'Mantenimiento',
    DAMAGED: 'Dañada'
  };

  return (
    <div id="report-content">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 print:p-0 print:m-0 print:border-none print:shadow-none min-h-[500px] m-4 md:m-6 lg:m-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Reportes del Sistema</h3>
            <p className="text-xs text-slate-400">Genera reportes detallados y estadísticas por módulos.</p>
          </div>
          <button onClick={handleDownloadPdf} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm print:hidden">
            📥 Descargar PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 print:hidden overflow-x-auto">
          <button onClick={() => setActiveTab('herramientas')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'herramientas' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Herramientas</button>
          <button onClick={() => setActiveTab('insumos')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'insumos' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Insumos</button>
          <button onClick={() => setActiveTab('estudiantes')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'estudiantes' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Usuarios</button>
          <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'movimientos' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Movimientos</button>
        </div>

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:flex flex-col items-center text-center pb-4 border-b border-dashed border-slate-200 mb-6">
          <span className="text-4xl">🌿</span>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-wide uppercase mt-2">Vivero de Cacao ULEAM El Carmen</h1>
          <p className="text-xs text-slate-500">Reporte del Módulo: {activeTab.toUpperCase()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Generado en: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>

        {/* --- HERRAMIENTAS TAB --- */}
        {activeTab === 'herramientas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Totales</p>
                <p className="text-2xl font-extrabold text-slate-800">{tools.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Disponibles</p>
                <p className="text-2xl font-extrabold text-emerald-600">{availableToolsCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">En Préstamo</p>
                <p className="text-2xl font-extrabold text-amber-500">{lentToolsCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mantenimiento</p>
                <p className="text-2xl font-extrabold text-slate-500">{maintToolsCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR ENTIDAD</label>
                <input type="text" placeholder="Nombre o descripción..." value={hSearch} onChange={e => setHSearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Entidad</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Unidades Totales</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Disponibles</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">En Préstamo</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Baja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTools.map(t => (
                    <tr key={t.id}>
                      <td className="px-5 py-2.5 font-bold text-slate-800">
                        {t.name}
                        <p className="text-[10px] font-normal text-slate-500 truncate max-w-xs">{t.description}</p>
                      </td>
                      <td className="px-5 py-2.5 text-center font-bold text-slate-600">{t.units_count || 0}</td>
                      <td className="px-5 py-2.5 text-center font-bold text-emerald-600">{t.available_units_count || 0}</td>
                      <td className="px-5 py-2.5 text-center font-bold text-amber-600">{t.borrowed_units_count || 0}</td>
                      <td className="px-5 py-2.5 text-center font-bold text-slate-400">{t.out_of_service_units_count || 0}</td>
                    </tr>
                  ))}
                  {filteredTools.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No hay herramientas que coincidan con la búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- INSUMOS TAB --- */}
        {activeTab === 'insumos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Insumos</p>
                <p className="text-2xl font-extrabold text-slate-800">{supplies.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">En Alerta (Bajo Stock)</p>
                <p className="text-2xl font-extrabold text-rose-600">{supplies.filter(i => i.current_stock <= i.min_stock).length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR INSUMO</label>
                <input type="text" placeholder="Nombre o código..." value={iSearch} onChange={e => setISearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" id="chkAlert" checked={iAlertOnly} onChange={e => setIAlertOnly(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                <label htmlFor="chkAlert" className="text-xs font-bold text-slate-600 cursor-pointer">Solo mostrar insumos en alerta crítica</label>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Insumo</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Código (SKU)</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Stock Actual</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Stock Mínimo</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInsumos.map(i => {
                    const isCritical = i.current_stock <= i.min_stock;
                    return (
                      <tr key={i.id} className={isCritical ? 'bg-rose-50/30' : ''}>
                        <td className="px-5 py-2.5 font-bold text-slate-800">{i.name}</td>
                        <td className="px-5 py-2.5 font-mono text-slate-500">{i.sku}</td>
                        <td className={`px-5 py-2.5 text-center font-bold ${isCritical ? 'text-rose-700' : 'text-slate-700'}`}>{i.current_stock}</td>
                        <td className="px-5 py-2.5 text-center text-slate-500">{i.min_stock}</td>
                        <td className="px-5 py-2.5 text-center">
                          {isCritical ? <span className="text-[10px] font-bold text-rose-600 px-2 py-1 bg-rose-100 rounded">⚠️ REABASTECER</span> : <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-100 rounded">✓ NORMAL</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInsumos.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No hay insumos que coincidan con la búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ESTUDIANTES TAB --- */}
        {activeTab === 'estudiantes' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR USUARIO</label>
                <input type="text" placeholder="Nombre..." value={sSearch} onChange={e => setSSearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" id="chkLoans" checked={sWithLoans} onChange={e => setSWithLoans(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                <label htmlFor="chkLoans" className="text-xs font-bold text-slate-600 cursor-pointer">Con préstamos pendientes</label>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" id="chkAlerts" checked={sWithAlerts} onChange={e => setSWithAlerts(e.target.checked)} className="w-4 h-4 text-rose-600 rounded" />
                <label htmlFor="chkAlerts" className="text-xs font-bold text-rose-600 cursor-pointer">Con préstamos demorados (Alerta)</label>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Usuario</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Préstamos Activos</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-center">Alertas de Demora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(st => {
                    const fullName = `${st.first_name} ${st.last_name}`;
                    const activeLoans = getStudentActiveLoans(st.id, fullName);
                    const overdueCount = metrics?.overdueTools?.filter((ot: any) => ot.student_id === st.id || ot.details?.usuario === fullName).length || 0;
                    return (
                      <tr key={st.id} className={overdueCount > 0 ? 'bg-amber-50/40' : ''}>
                        <td className="px-5 py-3 font-bold text-slate-800">
                          {fullName}
                          <p className="text-[10px] font-normal text-slate-500">C.I: {st.cedula} • {st.career}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {activeLoans.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{activeLoans.length}</span>
                              <span className="text-[9px] text-slate-500 truncate max-w-[120px]" title={activeLoans.map(l => l.tool?.name).join(', ')}>
                                {activeLoans.map(l => l.tool?.name).join(', ')}
                              </span>
                            </div>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {overdueCount > 0 ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded shadow-sm border border-amber-200 inline-flex items-center gap-1">
                              ⚠️ {overdueCount} {overdueCount === 1 ? 'Demorado' : 'Demorados'}
                            </span>
                          ) : <span className="text-slate-400">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">No hay estudiantes que coincidan con la búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MOVIMIENTOS TAB --- */}
        {activeTab === 'movimientos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[150px]"><label className="block text-[10px] font-bold text-slate-500 mb-1">TIPO EVENTO</label><select value={mTipo} onChange={e => setMTipo(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs"><option value="">Todos</option><option value="BORROWED">Préstamo</option><option value="RETURN">Devolución</option><option value="MAINTENANCE">Mantenimiento</option><option value="ADJUSTMENT">Ajuste</option><option value="CONSUMPTION">Consumo</option></select></div>
              <div className="flex-1 min-w-[150px]"><label className="block text-[10px] font-bold text-slate-500 mb-1">OPERARIO / USUARIO</label><input type="text" value={mStudent} onChange={e => setMStudent(e.target.value)} placeholder="Nombre o email" className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <div className="w-full sm:w-auto"><label className="block text-[10px] font-bold text-slate-500 mb-1">DESDE</label><input type="date" value={mStartDate} onChange={e => setMStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <div className="w-full sm:w-auto"><label className="block text-[10px] font-bold text-slate-500 mb-1">HASTA</label><input type="date" value={mEndDate} onChange={e => setMEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <button onClick={handleFilterMovimientos} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm">Filtrar</button>
              <button onClick={clearMovimientosFilters} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition">Limpiar</button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Fecha / Hora</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Herramienta / Insumo (Unidad)</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Tipo</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Usuario</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-slate-600 font-medium whitespace-nowrap">{new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString()}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">
                        {ev.tool?.name || ev.tool_unit?.tool?.name || ev.supply?.name || 'Desconocida'}
                        <br/><span className="text-[10px] font-mono text-slate-500 font-normal">{ev.tool_unit?.code || ev.tool?.code || ev.supply?.sku || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          (ev.type === 'BORROW' || ev.type === 'BORROWED') ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          ev.type === 'RETURN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          ev.type === 'MAINTENANCE' ? 'bg-red-50 text-red-600 border border-red-200' :
                          ev.type === 'decommissioned' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {typeLabels[ev.type] || ev.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 text-xs">
                        {ev.student_id ? `Estudiante ID: ${ev.student_id}` : (ev.details?.usuario || 'Sistema')}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 italic max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span className="truncate" title={ev.details?.detalles || ''}>{ev.details?.detalles || '-'}</span>
                          {ev.observations && <span className="text-[10px] text-emerald-600 truncate" title={ev.observations}>Obs: {ev.observations}</span>}
                          {ev.operational_task_id && <span className="text-[10px] text-amber-600">Actividad ID: {ev.operational_task_id}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No hay movimientos que mostrar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
