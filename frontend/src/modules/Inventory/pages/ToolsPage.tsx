import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useToolsViewModel } from '../viewmodels/useToolsViewModel';


export default function ToolsPage() {
  const { 
    tools, isLoading,
    loadTools, handleCreate, handleUpdate, handleDelete
  } = useToolsViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [editItem, setEditItem] = useState<{ id: number, data: any } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [generatedLabel, setGeneratedLabel] = useState<{code: string, name: string} | null>(null);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode'>('qr');
  const [labelSize, setLabelSize] = useState<'pequeno' | 'mediano' | 'grande'>('mediano');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (generatedLabel) {
      const qrSizes = { pequeno: 80, mediano: 120, grande: 180 };
      const barcodeSizes = {
        pequeno: { width: 1.2, height: 30, fontSize: 10 },
        mediano: { width: 1.5, height: 50, fontSize: 14 },
        grande: { width: 2.5, height: 80, fontSize: 18 }
      };
      
      if (labelFormat === 'qr' && qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, generatedLabel.code, { width: qrSizes[labelSize], margin: 1 }, (err: any) => { if (err) console.error(err); });
      }
      if (labelFormat === 'barcode' && barcodeSvgRef.current) {
        const bs = barcodeSizes[labelSize];
        JsBarcode(barcodeSvgRef.current, generatedLabel.code, { format: "CODE128", width: bs.width, height: bs.height, displayValue: true, fontSize: bs.fontSize, margin: 5 });
      }
    }
  }, [generatedLabel, labelFormat, labelSize]);

  useEffect(() => {
    // Debounce
    const timer = setTimeout(() => {
      loadTools(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadTools]);

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName) return;

    const result = await Swal.fire({
      title: '¿Registrar Herramienta?',
      text: `Se registrará la herramienta "${newToolName.trim()}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    const createdTool = await handleCreate({
      name: newToolName.trim(),
      description: newToolDesc.trim(),
      status: 'AVAILABLE',
      quantity: 1
    });

    if (createdTool) {
      setNewToolName('');
      setNewToolDesc('');
      setGeneratedLabel({ code: createdTool.code, name: createdTool.name });
      Swal.fire('¡Éxito!', 'Herramienta registrada correctamente.', 'success');
    } else {
      Swal.fire('Error', 'Ocurrió un error al registrar la herramienta.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    await handleUpdate(editItem.id, editItem.data);
    setEditItem(null);
    Swal.fire('¡Actualizado!', 'Herramienta actualizada correctamente.', 'success');
  };

  const handleDeleteTool = async (id: number, name: string) => {
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
      Swal.fire('Eliminado', 'La herramienta ha sido eliminada.', 'success');
    }
  };

  // Helper for statuses
  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    BORROWED: 'bg-amber-50 text-amber-600 border-amber-200',
    MAINTENANCE: 'bg-red-50 text-red-600 border-red-200',
    DAMAGED: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    BORROWED: 'Prestada',
    MAINTENANCE: 'Mantenimiento',
    DAMAGED: 'Dañada'
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Herramientas</h1>
          <p className="text-sm text-slate-500">Administra el inventario físico de herramientas y equipos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          <div className="lg:col-span-2 space-y-4">
            {/* Search tool input and view toggle */}
            <div className="flex gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1">
                <span className="text-slate-400">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar herramientas por nombre, código único o descripción..."
                  className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
              <button 
                onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                className="bg-white px-5 rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center font-semibold text-sm"
                title="Cambiar vista"
              >
                {viewMode === 'grid' ? '📄 Lista' : '📱 Tarjetas'}
              </button>
            </div>

            {/* List of tools */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition duration-200">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 font-mono">{tool.code}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[tool.status] || statusColors['DAMAGED']}`}>
                          {statusLabels[tool.status] || 'Desconocido'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{tool.name}</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{tool.description || 'Sin descripción.'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <button
                        onClick={() => handleDeleteTool(tool.id, tool.name)}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition rounded-lg font-semibold"
                      >
                        Eliminar
                      </button>
                      <button onClick={() => setEditItem({ id: tool.id, data: { name: tool.name, description: tool.description } })} className="px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition rounded-lg font-semibold">Editar</button>
                      <button
                        onClick={() => {
                          setGeneratedLabel({ code: tool.code, name: tool.name });
                        }}
                        className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition rounded-lg font-bold"
                      >
                        Generar QR/Barras
                      </button>
                    </div>
                  </div>
                ))}
                {tools.length === 0 && !isLoading && (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-sm">
                    No se encontraron herramientas en el catálogo.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Herramienta</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tools.map((tool) => (
                        <tr key={tool.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-5 py-3 text-xs font-mono text-slate-600">{tool.code}</td>
                          <td className="px-5 py-3 text-xs text-slate-800">
                            <p className="font-bold">{tool.name}</p>
                            <p className="text-[10px] text-slate-500">{tool.description || 'Sin descripción'}</p>
                          </td>
                          <td className="px-5 py-3 text-xs">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[tool.status] || statusColors['DAMAGED']}`}>
                              {statusLabels[tool.status] || 'Desconocido'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs flex gap-2">
                            <button onClick={() => setEditItem({ id: tool.id, data: { name: tool.name, description: tool.description } })} className="text-blue-600 hover:text-blue-900 font-semibold">Editar</button>
                            <button onClick={() => handleDeleteTool(tool.id, tool.name)} className="text-rose-600 hover:text-rose-900 font-semibold">Eliminar</button>
                            <button onClick={() => setGeneratedLabel({ code: tool.code, name: tool.name })} className="text-emerald-600 hover:text-emerald-900 font-semibold">QR/Barras</button>
                          </td>
                        </tr>
                      ))}
                      {tools.length === 0 && !isLoading && (
                        <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-xs">No se encontraron herramientas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Form to Register Tool */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Registrar Nueva Herramienta</h3>
              <p className="text-xs text-slate-400">Añade herramientas al inventario de bodega.</p>
            </div>

            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tijera de Ramas Altas"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPCIÓN (OPCIONAL)</label>
                <textarea
                  placeholder="Escribe detalles del uso o estado..."
                  rows={3}
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-xl font-bold text-sm shadow-md"
              >
                Añadir Herramienta
              </button>
            </form>
          </div>
        </div>

        {/* Edit Modal */}
        {editItem && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Editar Herramienta</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE</label>
                  <input type="text" required value={editItem.data.name} onChange={e => setEditItem({...editItem, data: {...editItem.data, name: e.target.value}})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPCIÓN</label>
                  <textarea rows={3} value={editItem.data.description || ''} onChange={e => setEditItem({...editItem, data: {...editItem.data, description: e.target.value}})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-xl font-bold text-xs">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-xl font-bold text-xs shadow-md">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generated Label Modal */}
        {generatedLabel && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 print:hidden overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-100 flex flex-col my-auto">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Identificación de Herramienta</h3>
                  <p className="text-xs text-slate-500">Impresión de etiqueta física vinculada.</p>
                </div>
                <button type="button" onClick={() => setGeneratedLabel(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 font-bold transition">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">TAMAÑO DE ETIQUETA</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl mb-4">
                      <button type="button" onClick={() => setLabelSize('pequeno')} className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 ${labelSize === 'pequeno' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        Pequeño<br/><span className="text-[9px] font-normal opacity-70">40x20 mm</span>
                      </button>
                      <button type="button" onClick={() => setLabelSize('mediano')} className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 ${labelSize === 'mediano' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        Mediano<br/><span className="text-[9px] font-normal opacity-70">50x30 mm</span>
                      </button>
                      <button type="button" onClick={() => setLabelSize('grande')} className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 ${labelSize === 'grande' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        Grande<br/><span className="text-[9px] font-normal opacity-70">70x50 mm</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">CÓDIGO ÚNICO</label>
                    <input type="text" value={generatedLabel.code} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE DE HERRAMIENTA</label>
                    <input type="text" value={generatedLabel.name} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div 
                    id="print-label-area" 
                    className="bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center print:border-none print:shadow-none print:m-0 print:p-0 overflow-hidden relative"
                    style={
                      labelSize === 'pequeno' ? { width: '40mm', height: '20mm', padding: '2mm' } :
                      labelSize === 'mediano' ? { width: '50mm', height: '30mm', padding: '3mm' } :
                      { width: '70mm', height: '50mm', padding: '4mm' }
                    }
                  >
                    <div className="w-full text-center border-b border-slate-200 flex flex-col items-center justify-center" style={{ marginBottom: labelSize === 'pequeno' ? '1mm' : '2mm', paddingBottom: labelSize === 'pequeno' ? '1mm' : '2mm' }}>
                      <span className="font-bold text-slate-800 leading-none" style={{ fontSize: labelSize === 'pequeno' ? '6pt' : labelSize === 'mediano' ? '8pt' : '12pt' }}>VIVERO ULEAM</span>
                    </div>
                    {labelFormat === 'qr' && (
                      <div className="flex flex-col items-center justify-center flex-1 w-full">
                        <canvas ref={qrCanvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></canvas>
                      </div>
                    )}
                    {labelFormat === 'barcode' && (
                      <div className="flex flex-col items-center justify-center flex-1 w-full">
                        <svg ref={barcodeSvgRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></svg>
                      </div>
                    )}
                    <div className="w-full text-center mt-auto" style={{ paddingTop: labelSize === 'pequeno' ? '1mm' : '2mm' }}>
                      <p className="font-bold text-slate-800 leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: labelSize === 'pequeno' ? '5pt' : labelSize === 'mediano' ? '6pt' : '9pt' }}>{generatedLabel.name}</p>
                      <p className="font-bold font-mono leading-none" style={{ fontSize: labelSize === 'pequeno' ? '4.5pt' : labelSize === 'mediano' ? '5.5pt' : '8pt' }}>{generatedLabel.code}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 w-full mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setGeneratedLabel(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition">Cerrar</button>
                <button type="button" onClick={() => {
                  const printContent = document.getElementById('print-label-area');
                  const originalContent = document.body.innerHTML;
                  document.body.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                      ${printContent?.outerHTML}
                    </div>
                  `;
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2">
                  <span>🖨️</span> Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
