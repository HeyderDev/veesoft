import { Camera, Search, CheckCircle2, User, UserX } from 'lucide-react';
import { ToolDetailsModal } from '../components/ToolDetailsModal';
import { SupplyScannerModal } from '../components/SupplyScannerModal';
import { WebScanner } from '../components/WebScanner';
import { useScannerViewModel } from '../viewmodels/useScannerViewModel';
import { useState } from 'react';

export const ScannerPage = () => {
  const {
    isScanning,
    setIsScanning,
    manualCode,
    setManualCode,
    loadingCode,
    selectedTool,
    setSelectedTool,
    selectedSupply,
    setSelectedSupply,
    selectedStudent,
    setSelectedStudent,
    successMessage,
    setSuccessMessage,
    handleScan,
    handleManualSubmit,
    registerEvent,
    findStudent
  } = useScannerViewModel();

  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const handleStudentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentSearchTerm.trim()) {
      findStudent(studentSearchTerm.trim());
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-green-50 text-green-800 border border-green-200 shadow-lg px-6 py-3 rounded-full flex items-center gap-3 font-medium">
              <CheckCircle2 className="text-green-500" size={20} />
              {successMessage}
            </div>
          </div>
        )}

        {!selectedStudent ? (
          // Paso 1: Identificar al estudiante
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Identificar Estudiante</h3>
                <p className="text-sm text-gray-500">Busca por cédula para habilitar préstamos</p>
              </div>
            </div>
            
            <form onSubmit={handleStudentSearch} className="flex space-x-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ej: 1312345678"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                  value={studentSearchTerm}
                  maxLength={10}
                  onChange={(e) => setStudentSearchTerm(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={loadingCode || !studentSearchTerm.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loadingCode ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Buscar'}
              </button>
            </form>
          </div>
        ) : (
          // Paso 2: Escáner y código manual
          <>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                  <User className="text-emerald-700" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Estudiante Seleccionado</p>
                  <p className="font-semibold text-emerald-900">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <p className="text-xs text-emerald-700 font-mono">{selectedStudent.cedula}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <UserX size={16} /> Cambiar
              </button>
            </div>

            {/* Scanner Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {isScanning ? (
                <div className="p-4 relative flex flex-col items-center">
                  <WebScanner onScan={handleScan} />
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
                  >
                    Cancelar Escaneo
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsScanning(true)}
                  className="w-full h-64 flex flex-col items-center justify-center space-y-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera size={40} className="text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-green-600 font-bold text-lg">ACTIVAR CÁMARA ESCÁNER</p>
                    <p className="text-gray-400 text-sm mt-1">Escanea códigos QR o de barras</p>
                  </div>
                </button>
              )}
            </div>

            {/* Manual Entry Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 mb-4 tracking-wide">
                INGRESAR CÓDIGO MANUALMENTE
              </h3>
              <form onSubmit={handleManualSubmit} className="flex space-x-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Escribir código de herramienta..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingCode || !manualCode.trim()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loadingCode ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Loading Overlay */}
        {loadingCode && !selectedTool && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-gray-700">Buscando...</span>
            </div>
          </div>
        )}

        {/* Modal Tool Details */}
        {selectedTool && (
          <ToolDetailsModal 
            tool={selectedTool}
            onClose={() => setSelectedTool(null)}
            onRegisterEvent={registerEvent}
          />
        )}

        {/* Modal Supply Details */}
        <SupplyScannerModal
          isOpen={!!selectedSupply}
          onClose={() => setSelectedSupply(null)}
          onSuccess={() => {
            setSuccessMessage("Movimiento de insumo registrado exitosamente");
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          preloadedSupply={selectedSupply}
        />
      </div>
    </div>
  );
};
