import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useStudentsViewModel } from '../viewmodels/useStudentsViewModel';
import { Search, Plus, GraduationCap, Edit, Trash2, Printer, Upload, Download } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function StudentsPage() {
  const { 
    students, isLoading,
    loadStudents, handleCreate, handleUpdate, handleDelete, handleImportCsv, validateEcuadorianCedula
  } = useStudentsViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Create form
  const [newCedula, setNewCedula] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCareer, setNewCareer] = useState('');
  const [newSemester, setNewSemester] = useState('');
  
  // Edit form
  const [editItem, setEditItem] = useState<{ id: number, data: any } | null>(null);

  // Printing
  const [generatedLabel, setGeneratedLabel] = useState<{code: string, name: string} | null>(null);
  const [labelFormat, setLabelFormat] = useState<'qr' | 'barcode'>('barcode');
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
      loadStudents(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadStudents]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const success = await handleImportCsv(e.target.files[0]);
      if (success && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nombre,Apellido,Cedula,Carrera,Semestre\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_estudiantes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCedula || !newFirstName || !newLastName) return;

    if (!validateEcuadorianCedula(newCedula)) {
      Swal.fire('Cédula Inválida', 'La cédula ingresada no es válida para Ecuador.', 'warning');
      return;
    }

    const created = await handleCreate({
      cedula: newCedula.trim(),
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      career: newCareer.trim(),
      semester: newSemester.trim()
    });

    if (created) {
      setNewCedula('');
      setNewFirstName('');
      setNewLastName('');
      setNewCareer('');
      setNewSemester('');
      Swal.fire('¡Éxito!', 'Estudiante registrado correctamente.', 'success');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    await handleUpdate(editItem.id, editItem.data);
    setEditItem(null);
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar a ${name}?`,
      text: "Se eliminará el estudiante del sistema.",
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

  const executePrint = async () => {
    if (!generatedLabel) return;
    setIsPrinting(true);
    try {
      await inventoryService.printLabel(generatedLabel.name, generatedLabel.code, labelFormat);
      Swal.fire({
        title: 'Impresión enviada correctamente',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      setGeneratedLabel(null);
    } catch (error: any) {
      Swal.fire('Error al enviar trabajo', error.response?.data?.message || error.message, 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Estudiantes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de estudiantes y generación de credenciales.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadTemplate} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> Plantilla
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Upload size={16} /> Importar CSV
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
          
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none bg-white shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <GraduationCap className="text-white" size={20} />
              </div>
              <h2 className="font-bold text-emerald-900">Registrar Estudiante</h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1727559229"
                  maxLength={10}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  value={newCedula}
                  onChange={(e) => setNewCedula(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                    value={newCareer}
                    onChange={(e) => setNewCareer(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!newCedula || !newFirstName || !newLastName}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Registrar
              </button>
            </form>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="overflow-auto flex-1 p-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <GraduationCap size={48} className="mb-4 opacity-50" />
                  <p>No se encontraron estudiantes.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {students.map(student => (
                    <div key={student.id} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-md transition-all bg-white group">
                      
                      {editItem?.id === student.id ? (
                        <form onSubmit={handleEditSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Nombre</label>
                                <input
                                  type="text" required
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-50 focus:bg-white outline-none"
                                  value={editItem.data.first_name || ''}
                                  onChange={e => setEditItem({...editItem, data: {...editItem.data, first_name: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Apellido</label>
                                <input
                                  type="text" required
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-50 focus:bg-white outline-none"
                                  value={editItem.data.last_name || ''}
                                  onChange={e => setEditItem({...editItem, data: {...editItem.data, last_name: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Carrera</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-50 focus:bg-white outline-none"
                                  value={editItem.data.career || ''}
                                  onChange={e => setEditItem({...editItem, data: {...editItem.data, career: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Semestre</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-50 focus:bg-white outline-none"
                                  value={editItem.data.semester || ''}
                                  onChange={e => setEditItem({...editItem, data: {...editItem.data, semester: e.target.value}})}
                                />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditItem(null)} className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">Cancelar</button>
                            <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors">Guardar</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                              {student.first_name} {student.last_name}
                            </h3>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                C.I: {student.cedula}
                              </span>
                              {student.career && <span className="text-sm text-gray-500">{student.career}</span>}
                              {student.semester && <span className="text-sm text-gray-500">Semestre {student.semester}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setGeneratedLabel({ code: student.cedula, name: `${student.first_name} ${student.last_name}` })}
                              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Imprimir Credencial"
                            >
                              <Printer size={18} />
                            </button>
                            <button
                              onClick={() => setEditItem({ id: student.id, data: { first_name: student.first_name, last_name: student.last_name, career: student.career, semester: student.semester } })}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Impresión */}
      {generatedLabel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Imprimir Credencial</h3>
              <p className="text-sm text-gray-500 mb-6">{generatedLabel.name}</p>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLabelFormat('barcode')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${labelFormat === 'barcode' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Código Barras
                </button>
                <button
                  onClick={() => setLabelFormat('qr')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${labelFormat === 'qr' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  Código QR
                </button>
              </div>

              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 min-h-[140px] border border-gray-100">
                {labelFormat === 'qr' ? (
                  <canvas ref={qrCanvasRef}></canvas>
                ) : (
                  <svg ref={barcodeSvgRef}></svg>
                )}
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex gap-3">
              <button
                onClick={() => setGeneratedLabel(null)}
                className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executePrint}
                disabled={isPrinting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPrinting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Printer size={18} />}
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
