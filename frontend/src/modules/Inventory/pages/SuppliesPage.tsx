import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { AlertTriangle, FileText, LayoutGrid, Printer, Search, X } from 'lucide-react';
import { useSuppliesViewModel } from '../viewmodels/useSuppliesViewModel';

const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'und', label: 'Unidad (und)' },
  { value: 'm', label: 'Metro (m)' },
];

export default function SuppliesPage() {
  const { 
    supplies, isLoading,
    loadSupplies, handleCreate, handleUpdate, handleDelete, handleAddStock, handlePrintLabel
  } = useSuppliesViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [newInsumoName, setNewInsumoName] = useState('');
  const [newInsumoDesc, setNewInsumoDesc] = useState('');
  const [newInsumoUnit, setNewInsumoUnit] = useState('');
  const [newInsumoInitialStock, setNewInsumoInitialStock] = useState(0);
  const [newInsumoMinStock, setNewInsumoMinStock] = useState(0);
  const [editItem, setEditItem] = useState<{ id: number, data: any } | null>(null);
  const [addStockItem, setAddStockItem] = useState<{ id: number, name: string, unit: string } | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState(0);
  const [addStockReason, setAddStockReason] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [generatedLabel, setGeneratedLabel] = useState<{code: string, name: string} | null>(null);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode'>('qr');
  const [isPrinting, setIsPrinting] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (generatedLabel) {
      if (labelFormat === 'qr' && qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, generatedLabel.code, { width: 95, margin: 0 }, (err: any) => { if (err) console.error(err); });
      }
      if (labelFormat === 'barcode' && barcodeSvgRef.current) {
        JsBarcode(barcodeSvgRef.current, generatedLabel.code, { format: "CODE128", width: 1.35, height: 36, displayValue: false, margin: 0 });
      }
    }
  }, [generatedLabel, labelFormat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSupplies(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadSupplies]);

  const handleCreateInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsumoName || newInsumoInitialStock < 0 || !newInsumoUnit) return;

    const result = await Swal.fire({
      title: '¿Registrar Insumo?',
      text: `Se registrará el insumo "${newInsumoName.trim()}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    const createdSupply = await handleCreate({
      name: newInsumoName.trim(),
      description: newInsumoDesc.trim(),
      current_stock: Number(newInsumoInitialStock),
      min_stock: Number(newInsumoMinStock),
      unit: newInsumoUnit,
    });

    if (createdSupply) {
      setNewInsumoName('');
      setNewInsumoDesc('');
      setNewInsumoUnit('');
      setNewInsumoInitialStock(0);
      setNewInsumoMinStock(0);
      setGeneratedLabel({ code: createdSupply.sku, name: createdSupply.name });
      Swal.fire('¡Éxito!', 'Insumo registrado correctamente.', 'success');
    } else {
      Swal.fire('Error', 'Ocurrió un error al registrar el insumo.', 'error');
    }
  };

  const handleSubmitAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockItem || addStockQuantity <= 0) return;
    
    await handleAddStock(addStockItem.id, addStockQuantity, addStockReason);
    setAddStockItem(null);
    setAddStockQuantity(0);
    setAddStockReason('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    await handleUpdate(editItem.id, editItem.data);
    setEditItem(null);
    Swal.fire('¡Actualizado!', 'Insumo actualizado correctamente.', 'success');
  };

  const handleDeleteInsumo = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar ${name}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      await handleDelete(id);
      Swal.fire('Eliminado', 'El insumo ha sido eliminado.', 'success');
    }
  };

  const checkIsCritical = (item: { current_stock: number; min_stock?: number | null }) => {
    const minStock = Number(item.min_stock ?? 0);
    return minStock > 0 ? Number(item.current_stock) <= minStock : Number(item.current_stock) <= 0;
  };

  const criticalSuppliesCount = supplies.filter(checkIsCritical).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Insumos</h1>
          <p className="text-sm text-slate-500">Administra insumos consumibles y controla el stock mínimo.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Tipos Insumos</p>
          <p className="text-2xl font-extrabold text-slate-800">{isLoading ? '...' : supplies.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-rose-500 uppercase tracking-wider font-semibold">En Alerta (Stock Bajo)</p>
          <p className="text-2xl font-extrabold text-rose-600">{isLoading ? '...' : criticalSuppliesCount}</p>
        </div>
      </div>

      {criticalSuppliesCount > 0 && !isLoading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-sm text-rose-900">
            <span className="font-bold">{criticalSuppliesCount} insumo(s)</span> tienen stock actual igual o menor al stock mínimo configurado.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar insumos por nombre..."
                className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <button 
              onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
              className="bg-white px-5 rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center font-semibold text-sm"
            >
              {viewMode === 'grid' ? <><FileText className="w-4 h-4 inline mr-1" /> Lista</> : <><LayoutGrid className="w-4 h-4 inline mr-1" /> Tarjetas</>}
            </button>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplies.map((item) => {
                const isCritical = checkIsCritical(item);
                return (
                  <div key={item.id} className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col justify-between hover:shadow-md transition duration-200 ${isCritical ? 'border-rose-300 bg-rose-50/20' : 'border-slate-100'}`}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isCritical ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                          STOCK: {item.current_stock} {item.unit} {item.min_stock ? `· MÍN: ${item.min_stock}` : ''}
                        </span>
                        {isCritical && (
                          <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold uppercase animate-pulse">
                            Bajo Stock
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {item.name}
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.sku}</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.description || 'Sin descripción.'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center gap-1 flex-wrap">
                      <button
                        onClick={() => handleDeleteInsumo(item.id, item.name)}
                        className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 transition rounded-lg font-semibold"
                      >
                        Eliminar
                      </button>
                      <button onClick={() => setEditItem({ id: item.id, data: { name: item.name, description: item.description, current_stock: item.current_stock, min_stock: item.min_stock ?? 0 } })} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition rounded-lg font-semibold">Editar</button>
                      <button onClick={() => setAddStockItem({ id: item.id, name: item.name, unit: item.unit })} className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition rounded-lg font-semibold">Agregar Stock</button>
                      <button
                        onClick={() => setGeneratedLabel({ code: item.sku, name: item.name })}
                        className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition rounded-lg font-bold"
                      >
                        QR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Insumo</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Actual</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Mínimo</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplies.map((item) => {
                      const isCritical = checkIsCritical(item);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/50 transition ${isCritical ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-5 py-3 text-xs text-slate-800">
                            <p className="font-bold flex items-center gap-2">
                              {item.name}
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.sku}</span>
                              {isCritical && (
                                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold uppercase animate-pulse">
                                  Bajo Stock
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">{item.description || 'Sin descripción'}</p>
                          </td>
                          <td className="px-5 py-3 text-xs">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block w-max font-mono ${isCritical ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                              {item.current_stock} {item.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs">
                            <span className="font-mono text-slate-600 font-semibold">
                              {item.min_stock ?? 0} {item.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs flex gap-2">
                            <button onClick={() => setAddStockItem({ id: item.id, name: item.name, unit: item.unit })} className="text-indigo-600 hover:text-indigo-900 font-semibold">Stock (+)</button>
                            <button onClick={() => setEditItem({ id: item.id, data: { name: item.name, description: item.description, current_stock: item.current_stock, min_stock: item.min_stock ?? 0 } })} className="text-blue-600 hover:text-blue-900 font-semibold">Editar</button>
                            <button onClick={() => handleDeleteInsumo(item.id, item.name)} className="text-rose-600 hover:text-rose-900 font-semibold">Eliminar</button>
                            <button onClick={() => setGeneratedLabel({ code: item.sku, name: item.name })} className="text-emerald-600 hover:text-emerald-900 font-semibold">QR/Barras</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit space-y-4">
          <h3 className="font-bold text-slate-800 text-base">Registrar Nuevo Insumo</h3>
          <form onSubmit={handleCreateInsumo} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Nombre del insumo</label>
              <input type="text" required value={newInsumoName} onChange={(e) => setNewInsumoName(e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, ''))} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Descripción</label>
              <textarea rows={2} value={newInsumoDesc} onChange={(e) => setNewInsumoDesc(e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, ''))} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Unidad de medida</label>
              <select value={newInsumoUnit} onChange={(e) => setNewInsumoUnit(e.target.value)} required className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="" disabled>Seleccionar unidad de medida</option>
                {UNIT_OPTIONS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {newInsumoUnit && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Cantidad inicial</label>
                  <div className="relative">
                    <input type="number" min="0" step={newInsumoUnit === 'und' ? '1' : '0.01'} required value={newInsumoInitialStock || ''} onChange={(e) => setNewInsumoInitialStock(Number(e.target.value))} className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <div className="absolute right-2.5 top-2 text-xs text-slate-400 font-medium">{newInsumoUnit}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Stock mín. alerta</label>
                  <div className="relative">
                    <input type="number" min="0" step={newInsumoUnit === 'und' ? '1' : '0.01'} required value={newInsumoMinStock || ''} onChange={(e) => setNewInsumoMinStock(Number(e.target.value))} className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                    <div className="absolute right-2.5 top-2 text-xs text-slate-400 font-medium">{newInsumoUnit}</div>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-2.5 mt-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition">Registrar Insumo</button>
          </form>
        </div>
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Editar Insumo</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold">NOMBRE</label>
                <input type="text" required value={editItem.data.name} onChange={e => setEditItem({...editItem, data: {...editItem.data, name: e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '')}})} className="w-full px-3.5 py-2 border rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">STOCK ACTUAL</label>
                  <input type="number" step="0.01" required value={editItem.data.current_stock} className="w-full px-3.5 py-2 border rounded-xl text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-mono" readOnly title="Para modificar el stock, utiliza la acción Agregar Stock" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">STOCK MÍN. ALERTA</label>
                  <input type="number" step="0.01" min="0" required value={editItem.data.min_stock ?? 0} onChange={e => setEditItem({...editItem, data: {...editItem.data, min_stock: Number(e.target.value)}})} className="w-full px-3.5 py-2 border rounded-xl text-xs font-mono" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addStockItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Agregar Stock</h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa la cantidad a añadir para <span className="font-bold text-slate-700">{addStockItem.name}</span>.</p>
            <form onSubmit={handleSubmitAddStock} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold">CANTIDAD A AGREGAR</label>
                <div className="relative">
                  <input type="number" min="0.01" step={addStockItem.unit === 'und' ? '1' : '0.01'} required value={addStockQuantity || ''} onChange={e => setAddStockQuantity(Number(e.target.value))} className="w-full pl-4 pr-12 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="absolute right-4 top-2 text-slate-400 font-medium text-sm">{addStockItem.unit}</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold">OBSERVACIÓN / MOTIVO (Opcional)</label>
                <input type="text" value={addStockReason} onChange={e => setAddStockReason(e.target.value)} placeholder="Ej: Compra directa, donación..." className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => { setAddStockItem(null); setAddStockQuantity(0); setAddStockReason(''); }} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition">Registrar Ingreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Label Modal - 25x35mm */}
      {generatedLabel && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 print:hidden overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-100 flex flex-col my-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Identificación de Insumo (25x35 mm)</h3>
                <p className="text-xs text-slate-500">Impresión de etiqueta física adaptada a 25mm × 35mm.</p>
              </div>
              <button type="button" onClick={() => setGeneratedLabel(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">FORMATO DE IDENTIFICACIÓN</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setLabelFormat('qr')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${labelFormat === 'qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Código QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelFormat('barcode')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${labelFormat === 'barcode' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Código de Barras
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CÓDIGO ÚNICO</label>
                  <input type="text" value={generatedLabel.code} readOnly className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE DE INSUMO</label>
                  <input type="text" value={generatedLabel.name} readOnly className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs focus:outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div 
                  id="print-label-area" 
                  className="bg-white border-2 border-dashed border-slate-300 flex flex-col items-end justify-start print:border-none print:shadow-none print:m-0 print:p-0 overflow-hidden relative shadow-sm"
                  style={{ width: '35mm', height: '25mm', padding: '1mm 1.5mm', boxSizing: 'border-box' }}
                >
                  <div className="w-full text-right overflow-hidden pb-0.5 border-b border-slate-100 pr-1">
                    <p className="font-semibold text-slate-800 leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-[5.5pt]">
                      {generatedLabel.name} - <span className="font-mono font-bold text-slate-900">{generatedLabel.code}</span>
                    </p>
                  </div>
                  {labelFormat === 'qr' && (
                    <div className="flex flex-col items-end justify-center flex-1 w-full my-auto py-0.5 pr-1">
                      <canvas ref={qrCanvasRef} style={{ maxWidth: '100%', maxHeight: '19mm' }}></canvas>
                    </div>
                  )}
                  {labelFormat === 'barcode' && (
                    <div className="flex flex-col items-end justify-center flex-1 w-full my-auto py-0.5 pr-1">
                      <svg ref={barcodeSvgRef} style={{ maxWidth: '100%', maxHeight: '19mm' }}></svg>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">Formato etiqueta: 25 mm × 35 mm</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 w-full mt-6 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setGeneratedLabel(null)} disabled={isPrinting} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50">Cerrar</button>
              <button type="button" onClick={async () => {
                setIsPrinting(true);
                await handlePrintLabel(generatedLabel.name, generatedLabel.code, labelFormat);
                setIsPrinting(false);
              }} disabled={isPrinting} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-75 disabled:cursor-wait">
                {isPrinting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
