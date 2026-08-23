import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useToolsViewModel } from '../viewmodels/useToolsViewModel';
import type { ToolUnit } from '../types';

export default function ToolsPage() {
  const { 
    tools, isLoading,
    loadTools, handleCreate, handleUpdate, handleDelete, handlePrintLabel
  } = useToolsViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolQty, setNewToolQty] = useState(1);
  const [editItem, setEditItem] = useState<{ id: number, data: any } | null>(null);
  
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null);

  const [generatedLabel, setGeneratedLabel] = useState<{code: string, name: string} | null>(null);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode'>('qr');
  const [isPrinting, setIsPrinting] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (generatedLabel) {
      if (labelFormat === 'qr' && qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, generatedLabel.code, { width: 140, margin: 1 }, (err: any) => { if (err) console.error(err); });
      }
      if (labelFormat === 'barcode' && barcodeSvgRef.current) {
        JsBarcode(barcodeSvgRef.current, generatedLabel.code, { format: "CODE128", width: 1.5, height: 60, displayValue: true, fontSize: 14, margin: 5 });
      }
    }
  }, [generatedLabel, labelFormat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTools(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadTools]);

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName || newToolQty < 1) return;

    const result = await Swal.fire({
      title: '¿Registrar Herramienta?',
      text: `Se registrará la entidad "${newToolName.trim()}" con ${newToolQty} unidades iniciales.`,
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
      quantity: newToolQty // Sent to backend to generate N ToolUnits
    });

    if (createdTool) {
      setNewToolName('');
      setNewToolDesc('');
      setNewToolQty(1);
      Swal.fire('¡Éxito!', 'Entidad registrada y unidades creadas.', 'success');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    await handleUpdate(editItem.id, editItem.data);
    setEditItem(null);
  };

  const handleDeleteTool = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar ${name}?`,
      text: "Esto dará de baja lógicamente la entidad y su historial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      await handleDelete(id);
    }
  };

  // Helper for statuses
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

  const handleDecommissionUnit = async (unit: ToolUnit) => {
    // Para dar de baja, necesitamos redirigir a un modal o pedir el motivo con SweetAlert
    const { value: motivo } = await Swal.fire({
      title: 'Dar de baja unidad',
      input: 'textarea',
      inputLabel: 'Motivo de la baja',
      inputPlaceholder: 'Ej: Herramienta rota, perdida, fin de vida útil...',
      showCancelButton: true,
      confirmButtonText: 'Dar de baja',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un motivo'
        }
      }
    });

    if (motivo) {
       import('../services/inventoryService').then(({ inventoryService }) => {
          inventoryService.deleteToolUnit(unit.id, motivo).then(() => {
            Swal.fire('Unidad eliminada', '', 'success');
            loadTools(searchQuery);
          }).catch(() => {
            Swal.fire('Error', 'No se pudo eliminar la unidad', 'error');
          });
       });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Herramientas</h1>
          <p className="text-sm text-slate-500">Administra las entidades de herramientas y sus unidades físicas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <span className="text-slate-400">🔍</span>
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
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">Prest: {tool.borrowed_units_count || 0}</span>
                        <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">Mant: {tool.maintenance_units_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                       <button onClick={() => setSelectedToolId(selectedToolId === tool.id ? null : tool.id)} className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 transition text-slate-700 rounded-xl font-bold">
                          {selectedToolId === tool.id ? 'Ocultar Unidades' : 'Ver Unidades'}
                       </button>
                       <div className="flex gap-2">
                         <button onClick={() => setEditItem({ id: tool.id, data: { name: tool.name, description: tool.description } })} className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition rounded-lg font-semibold">Editar Entidad</button>
                         <button onClick={() => handleDeleteTool(tool.id, tool.name)} className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition rounded-lg font-semibold">Eliminar</button>
                       </div>
                    </div>
                  </div>

                  {/* UNIDADES ACCORDION */}
                  {selectedToolId === tool.id && (
                    <div className="bg-slate-50 p-5 border-t border-slate-100">
                       <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-sm text-slate-700">Unidades Físicas Registradas</h4>
                         <button onClick={async () => {
                            const { value: confirm } = await Swal.fire({
                              title: 'Añadir nueva unidad',
                              text: `Se generará un nuevo código único para ${tool.name}.`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonText: 'Añadir',
                              cancelButtonText: 'Cancelar'
                            });
                            if (confirm) {
                               import('../services/inventoryService').then(({ inventoryService }) => {
                                  inventoryService.createToolUnit(tool.id).then(() => {
                                    Swal.fire('Unidad añadida', '', 'success');
                                    loadTools(searchQuery);
                                  }).catch(() => {
                                    Swal.fire('Error', 'No se pudo añadir la unidad', 'error');
                                  });
                               });
                            }
                         }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">+ Añadir Unidad</button>
                       </div>
                       
                       {(!tool.units || tool.units.length === 0) ? (
                          <p className="text-xs text-slate-400 text-center py-4">No se han cargado las unidades o no existen.</p>
                       ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {tool.units.map(unit => (
                              <div key={unit.id} className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col justify-between hover:border-emerald-200 transition">
                                 <div className="flex justify-between items-start mb-2">
                                   <span className="font-mono text-xs font-bold text-slate-700">{unit.code}</span>
                                   <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[unit.status]}`}>{statusLabels[unit.status]}</span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                                   {unit.status !== 'out_of_service' ? (
                                      <button onClick={() => handleDecommissionUnit(unit)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition">Dar de baja</button>
                                   ) : <span className="text-[10px] text-slate-400 font-bold">Dada de baja</span>}
                                   
                                   <button onClick={() => setGeneratedLabel({code: unit.code, name: tool.name})} className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition">Imprimir</button>
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
                  No se encontraron herramientas en el catálogo.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Registrar Nueva Entidad</h3>
              <p className="text-xs text-slate-400">Añade un nuevo tipo de herramienta al catálogo.</p>
            </div>

            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE DE HERRAMIENTA</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tijera de Ramas Altas"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">CANTIDAD INICIAL DE UNIDADES</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newToolQty}
                  onChange={(e) => setNewToolQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPCIÓN (OPCIONAL)</label>
                <textarea
                  placeholder="Escribe detalles del uso o estado general..."
                  rows={3}
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-xl font-bold text-sm shadow-md"
              >
                Añadir al Catálogo
              </button>
            </form>
          </div>
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Editar Entidad</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE</label>
                <input type="text" required value={editItem.data.name} onChange={e => setEditItem({...editItem, data: {...editItem.data, name: e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '')}})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPCIÓN</label>
                <textarea rows={3} value={editItem.data.description || ''} onChange={e => setEditItem({...editItem, data: {...editItem.data, description: e.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '')}})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none" />
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
                <h3 className="font-bold text-slate-800 text-lg">Identificación de Unidad</h3>
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
                  <label className="block text-xs font-bold text-slate-500 mb-1">CÓDIGO ÚNICO</label>
                  <input type="text" value={generatedLabel.code} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE DE ENTIDAD</label>
                  <input type="text" value={generatedLabel.name} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div 
                  id="print-label-area" 
                  className="bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center print:border-none print:shadow-none print:m-0 print:p-0 overflow-hidden relative"
                  style={{ width: '48mm', height: '48mm', padding: '3mm' }}
                >
                  <div className="w-full text-center border-b border-slate-200 flex flex-col items-center justify-center mb-[2mm] pb-[1mm]">
                    <span className="font-bold text-slate-800 leading-none text-[8pt]">VIVERO CACAO</span>
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
                  <div className="w-full text-center mt-auto pt-[2mm]">
                    <p className="font-bold text-slate-800 leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-[7pt]">{generatedLabel.name}</p>
                    <p className="font-bold font-mono leading-none text-[6pt]">{generatedLabel.code}</p>
                  </div>
                </div>
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
                  <span>🖨️</span>
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
