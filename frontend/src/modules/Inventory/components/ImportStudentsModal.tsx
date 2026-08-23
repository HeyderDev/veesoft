import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { studentService } from '../services/studentService';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportStudentsModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        Swal.fire('Error', 'Por favor selecciona un archivo CSV', 'error');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const expectedHeaders = ['nombre', 'apellido', 'cedula', 'carrera', 'semestre'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        Swal.fire('Error', `Faltan las siguientes columnas: ${missingHeaders.join(', ')}`, 'error');
        setFile(null);
        return;
      }

      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: any = {};
        headers.forEach((h, index) => {
          if (expectedHeaders.includes(h)) {
            rowData[h] = values[index];
          }
        });
        parsedData.push(rowData);
      }
      setPreview(parsedData);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (preview.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await studentService.importCsv(preview);
      setImportResult(result);
      if (result.imported > 0) {
        onSuccess();
      }
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Ocurrió un error al importar', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Importar Estudiantes (CSV)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!file && !importResult && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <FileSpreadsheet className="text-slate-400 mb-3" size={48} />
              <h3 className="font-semibold text-slate-700 text-lg">Haz clic para subir un archivo CSV</h3>
              <p className="text-slate-500 text-sm mt-1">El archivo debe contener las cabeceras: nombre, apellido, cedula, carrera, semestre</p>
            </div>
          )}

          {file && !importResult && preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200">
                <span className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Archivo cargado: {file.name} ({preview.length} registros encontrados)
                </span>
                <button 
                  onClick={() => { setFile(null); setPreview([]); }}
                  className="text-xs font-bold underline"
                >
                  Cambiar archivo
                </button>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-slate-700">Vista previa (Primeros 5 registros)</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Cédula</th>
                        <th className="px-4 py-2">Nombres</th>
                        <th className="px-4 py-2">Apellidos</th>
                        <th className="px-4 py-2">Carrera</th>
                        <th className="px-4 py-2">Semestre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-mono">{row.cedula}</td>
                          <td className="px-4 py-2">{row.nombre}</td>
                          <td className="px-4 py-2">{row.apellido}</td>
                          <td className="px-4 py-2">{row.carrera}</td>
                          <td className="px-4 py-2">{row.semestre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={24} />
                <div>
                  <h4 className="font-bold">Importación finalizada</h4>
                  <p className="text-sm">Se importaron {importResult.imported} estudiantes correctamente.</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> 
                    Errores encontrados ({importResult.errors.length} registros)
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-red-200 rounded-lg bg-red-50 p-2">
                    <ul className="space-y-2">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx} className="text-xs bg-white p-2 rounded border border-red-100 flex flex-col gap-1">
                          <span className="font-semibold text-red-700">Fila {err.fila} - Cédula: {err.cedula}</span>
                          <span className="text-slate-600">{err.error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {importResult ? 'Cerrar' : 'Cancelar'}
          </button>
          {!importResult && file && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isProcessing ? 'Procesando...' : 'Iniciar Importación'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
