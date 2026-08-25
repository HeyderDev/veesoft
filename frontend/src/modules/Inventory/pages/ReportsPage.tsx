import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useToolsViewModel } from '../viewmodels/useToolsViewModel';
import { useSuppliesViewModel } from '../viewmodels/useSuppliesViewModel';
import { useMovementsViewModel } from '../viewmodels/useMovementsViewModel';
import { useStudentsViewModel } from '../viewmodels/useStudentsViewModel';

type ReportTab = 'estudiantes' | 'herramientas' | 'insumos' | 'movimientos';

const reportTabLabels: Record<ReportTab, string> = {
  estudiantes: 'Estudiantes',
  herramientas: 'Herramientas',
  insumos: 'Insumos',
  movimientos: 'Movimientos',
};

export default function ReportsPage() {
  const { tools, loadTools } = useToolsViewModel();
  const { supplies, loadSupplies } = useSuppliesViewModel();
  const { movements, pagination, loadMovements } = useMovementsViewModel();
  const { students, loadStudents } = useStudentsViewModel();

  const [activeTab, setActiveTab] = useState<ReportTab>('herramientas');

  // Herramientas Filters
  const [hSearch, setHSearch] = useState('');
  const [hasSearchedHerramientas, setHasSearchedHerramientas] = useState(false);

  // Insumos Filters
  const [iSearch, setISearch] = useState('');
  const [iAlertOnly, setIAlertOnly] = useState(false);
  const [hasSearchedInsumos, setHasSearchedInsumos] = useState(false);

  const [sSearch, setSSearch] = useState('');
  const [hasSearchedEstudiantes, setHasSearchedEstudiantes] = useState(false);
  // Movimientos Filters
  const [mTipo, setMTipo] = useState('');
  const [mUsuario, setMUsuario] = useState('');
  const [mStartDate, setMStartDate] = useState('');
  const [mEndDate, setMEndDate] = useState('');
  const [hasSearchedMovimientos, setHasSearchedMovimientos] = useState(false);

  useEffect(() => {
    loadTools();
    loadSupplies();
    loadMovements();
    loadStudents();
  }, [loadTools, loadSupplies, loadMovements, loadStudents]);

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleFilterMovimientos = (page: number = 1) => {
    setHasSearchedMovimientos(true);
    loadMovements(page, mTipo || undefined, mUsuario || undefined, mStartDate || undefined, mEndDate || undefined);
  };

  const clearMovimientosFilters = () => {
    setMTipo('');
    setMUsuario('');
    setMStartDate('');
    setMEndDate('');
    setHasSearchedMovimientos(false);
    loadMovements(1);
  };

  // --- Loan calculations per student ---
  const now = new Date();
  const borrowedUnits: Record<number, { studentId: number; date: Date }> = {};
  movements.forEach(ev => {
    if (ev.type === 'BORROWED' || ev.type === 'BORROW') {
      if (ev.tool_unit?.id) {
        borrowedUnits[ev.tool_unit.id] = {
          studentId: ev.student?.id,
          date: new Date(ev.created_at),
        };
      }
    } else if (ev.type === 'RETURN') {
      if (ev.tool_unit?.id) {
        delete borrowedUnits[ev.tool_unit.id];
      }
    }
  });

  // Reset counters
  let totalActiveLoans = 0;
  let totalPendingLoans = 0;
  students.forEach(s => {
    (s as any).active_loans = 0;
    (s as any).pending_loans = 0;
  });

  Object.values(borrowedUnits).forEach(({ studentId, date }) => {
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      totalActiveLoans++;
      const s = students.find(st => st.id === studentId);
      if (s) (s as any).active_loans++;
    } else if (diffDays > 1) {
      totalPendingLoans++;
      const s = students.find(st => st.id === studentId);
      if (s) (s as any).pending_loans++;
    }
  });

  // Historic total remains as sum of all borrows
  let totalHistoricLoans = 0;
  students.forEach(s => {
    totalHistoricLoans += s.total_borrows || 0;
  });

  // Use these totals in UI below (replace previous totalActiveLoans variable usage)
  const totalStudents = students.length;
  // Filtered students based on search input
  const filteredStudents = students.filter(s => {
    if (!sSearch) return true;
    const term = sSearch.toLowerCase();
    return (
      (s.first_name?.toLowerCase().includes(term)) ||
      (s.last_name?.toLowerCase().includes(term)) ||
      (s.cedula?.toString().includes(term)) ||
      (s.career?.toLowerCase().includes(term)) ||
      (s.semester?.toString().includes(term))
    );
  });
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
    const isCritical = i.current_stock <= (i.min_stock ?? 0);
    const matchAlert = iAlertOnly ? isCritical : true;
    return matchSearch && matchAlert;
  });

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

  return (
    <div id="report-content">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 print:p-0 print:m-0 print:border-none print:shadow-none min-h-[500px] m-4 md:m-6 lg:m-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Reportes del Sistema</h3>
            <p className="text-xs text-slate-400">Reportes detallados y estadísticas por módulo.</p>
          </div>
          <button onClick={handleDownloadPdf} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm print:hidden">
            <Download size={14} />
            Descargar PDF
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6 print:hidden overflow-x-auto">
          <button onClick={() => setActiveTab('estudiantes')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'estudiantes' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Estudiantes</button>
          <button onClick={() => setActiveTab('herramientas')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'herramientas' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Herramientas</button>
          <button onClick={() => setActiveTab('insumos')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'insumos' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Insumos</button>
          <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${activeTab === 'movimientos' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Movimientos</button>
        </div>

        {/* Encabezado de impresión (solo visible al imprimir/exportar) */}
        <div className="hidden print:block pb-4 mb-6 border-b-2 border-double border-slate-800">
          <div className="flex items-baseline justify-between">
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">Vivero de Cacao ULEAM — El Carmen</h1>
            <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString('es-EC')} {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">Reporte de Inventario — {reportTabLabels[activeTab]}</p>
        </div>

        {/* --- ESTUDIANTES TAB --- */}
        {activeTab === 'estudiantes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
              <div>
                <p className="text-[10px] text-indigo-500 uppercase tracking-wider font-semibold">Total Estudiantes</p>
                <p className="text-2xl font-extrabold text-indigo-900">{totalStudents}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold">Préstamos Activos (Mismo día)</p>
                <p className="text-2xl font-extrabold text-amber-600">{totalActiveLoans}</p>
              </div>
              <div>
                <p className="text-[10px] text-red-500 uppercase tracking-wider font-semibold">Préstamos Pendientes (&gt; 1 día)</p>
                <p className="text-2xl font-extrabold text-red-600">{totalPendingLoans}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">Préstamos Históricos Totales</p>
                <p className="text-2xl font-extrabold text-emerald-600">{totalHistoricLoans}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR ESTUDIANTE</label>
                <input type="text" placeholder="Nombre, apellido o cédula..." value={sSearch} onChange={e => setSSearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <button onClick={() => setHasSearchedEstudiantes(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition">Filtrar / Buscar</button>
              <button
                onClick={() => { setSSearch(''); setHasSearchedEstudiantes(false); }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition"
              >
                Limpiar
              </button>
            </div>

            {!hasSearchedEstudiantes ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-slate-100 rounded-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="text-slate-800 font-bold text-lg mb-2">Busca estudiantes</h4>
                <p className="text-slate-500 text-sm max-w-md">
                  Ingresa un término de búsqueda y presiona "Filtrar / Buscar" para ver los resultados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-bold text-slate-500">Estudiante</th>
                      <th className="px-5 py-3 font-bold text-slate-500">Cédula</th>
                      <th className="px-5 py-3 font-bold text-slate-500">Carrera</th>
                      <th className="px-5 py-3 font-bold text-slate-500">Semestre</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Préstamos Activos</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Préstamos Pendientes</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Total Préstamos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(s => {
                      const active = (s as any).active_loans || 0;
                      const pending = (s as any).pending_loans || 0;
                      const total = s.total_borrows || 0;
                      return (
                        <tr key={s.id}>
                          <td className="px-5 py-3 font-bold text-slate-800">{s.first_name} {s.last_name}</td>
                          <td className="px-5 py-3 font-mono text-slate-500">{s.cedula}</td>
                          <td className="px-5 py-3 text-slate-600">{s.career || '-'}</td>
                          <td className="px-5 py-3 text-slate-600">{s.semester || '-'}</td>
                          <td className="px-5 py-3 text-center">
                            {active > 0 ? <span className="inline-block px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded font-bold">{active} Hoy</span> : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {pending > 0 ? <span className="inline-block px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded font-bold">{pending} {'>'}1d</span> : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-600">{total}</td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No hay estudiantes que coincidan con la búsqueda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
)}


        {/* Alert for pending loans */}
        {/* Alert for pending loans removed per user request */}


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
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR HERRAMIENTA</label>
                <input type="text" placeholder="Nombre de herramienta..." value={hSearch} onChange={e => setHSearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <button onClick={() => setHasSearchedHerramientas(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition">Filtrar / Buscar</button>
              <button
                onClick={() => { setHSearch(''); setHasSearchedHerramientas(false); }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition"
              >
                Limpiar
              </button>
            </div>

            {!hasSearchedHerramientas ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-slate-100 rounded-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="text-slate-800 font-bold text-lg mb-2">Busca herramientas</h4>
                <p className="text-slate-500 text-sm max-w-md">
                  Ingresa un término de búsqueda y presiona "Filtrar / Buscar" para ver los resultados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-bold text-slate-500">Conjunto / Herramienta</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Unidades Totales</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Disponibles</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Prestadas</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Mantenimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTools.map(t => (
                      <tr key={t.id}>
                        <td className="px-5 py-3 font-bold text-slate-800">{t.name}</td>
                        <td className="px-5 py-3 text-center text-slate-600 font-bold">{t.units_count || 0}</td>
                        <td className="px-5 py-3 text-center"><span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">{t.available_units_count || 0}</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded">{t.borrowed_units_count || 0}</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">{t.maintenance_units_count || 0}</span></td>
                      </tr>
                    ))}
                    {filteredTools.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No hay herramientas que coincidan con la búsqueda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                <p className="text-2xl font-extrabold text-rose-600">{supplies.filter(i => i.current_stock <= (i.min_stock ?? 0)).length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BUSCAR INSUMO</label>
                <input type="text" placeholder="Nombre o SKU..." value={iSearch} onChange={e => setISearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <input type="checkbox" id="criticalOnly" checked={iAlertOnly} onChange={e => setIAlertOnly(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="criticalOnly" className="text-xs font-bold text-slate-600">Solo Stock Crítico</label>
              </div>
              <button onClick={() => setHasSearchedInsumos(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition">Filtrar / Buscar</button>
              <button
                onClick={() => { setISearch(''); setIAlertOnly(false); setHasSearchedInsumos(false); }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition"
              >
                Limpiar
              </button>
            </div>

            {!hasSearchedInsumos ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-slate-100 rounded-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="text-slate-800 font-bold text-lg mb-2">Busca insumos</h4>
                <p className="text-slate-500 text-sm max-w-md">
                  Ingresa un término de búsqueda o selecciona "Solo Stock Crítico" y presiona "Filtrar / Buscar".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-bold text-slate-500">Insumo</th>
                      <th className="px-5 py-3 font-bold text-slate-500">SKU</th>
                      <th className="px-5 py-3 font-bold text-slate-500">Categoría</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Total Entradas</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Stock Actual</th>
                      <th className="px-5 py-3 font-bold text-slate-500 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInsumos.map(i => {
                      const isCritical = i.current_stock <= (i.min_stock ?? 0);
                      return (
                        <tr key={i.id}>
                          <td className="px-5 py-3 font-bold text-slate-800">{i.name}</td>
                          <td className="px-5 py-3 font-mono text-slate-500">{i.sku}</td>
                          <td className="px-5 py-3 text-slate-600">{i.category || '-'}</td>
                          <td className="px-5 py-3 text-center text-slate-600">{i.total_stock} {i.unit}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`font-bold px-2 py-1 rounded ${isCritical ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {i.current_stock} {i.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {isCritical ? <span className="text-[10px] uppercase font-bold text-red-500">Crítico</span> : <span className="text-[10px] uppercase font-bold text-emerald-500">Óptimo</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInsumos.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No hay insumos que coincidan con la búsqueda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- MOVIMIENTOS TAB --- */}
        {activeTab === 'movimientos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 print:hidden">
              <div className="flex-1 min-w-[150px]"><label className="block text-[10px] font-bold text-slate-500 mb-1">TIPO EVENTO</label><select value={mTipo} onChange={e => setMTipo(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs"><option value="">Todos</option><option value="BORROWED">Préstamo</option><option value="RETURN">Devolución</option><option value="MAINTENANCE">Mantenimiento</option><option value="ADJUSTMENT">Ajuste</option><option value="CREATED">Registrado</option><option value="DELETED">Eliminado</option><option value="CONSUMPTION">Consumo</option></select></div>
              <div className="flex-1 min-w-[150px]"><label className="block text-[10px] font-bold text-slate-500 mb-1">OPERARIO / USUARIO</label><input type="text" value={mUsuario} onChange={e => setMUsuario(e.target.value)} placeholder="Nombre o email" className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <div className="w-full sm:w-auto"><label className="block text-[10px] font-bold text-slate-500 mb-1">DESDE</label><input type="date" value={mStartDate} onChange={e => setMStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <div className="w-full sm:w-auto"><label className="block text-[10px] font-bold text-slate-500 mb-1">HASTA</label><input type="date" value={mEndDate} onChange={e => setMEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" /></div>
              <button onClick={() => handleFilterMovimientos(1)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm">Filtrar</button>
              <button onClick={clearMovimientosFilters} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition">Limpiar</button>
            </div>

            {!hasSearchedMovimientos ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-slate-100 rounded-2xl">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="text-slate-800 font-bold text-lg mb-2">Busca en el historial</h4>
                <p className="text-slate-500 text-sm max-w-md">
                  Ingresa un término o utiliza los filtros para cargar el historial de movimientos.
                </p>
              </div>
            ) : (
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
                        {ev.details?.usuario || 'Sistema'}
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
            )}

            {movements.length > 0 && (
              <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 rounded-xl border border-slate-100 print:hidden">
                <span className="text-xs text-slate-500 font-medium">
                  Mostrando página {pagination.current_page} de {pagination.last_page} - Total: {pagination.total} registros
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.current_page <= 1}
                    onClick={() => handleFilterMovimientos(pagination.current_page - 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => handleFilterMovimientos(pagination.current_page + 1)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
