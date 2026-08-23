import { useEffect, useState } from 'react';
import { X, CheckCircle, Package } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import Swal from 'sweetalert2';

interface SupplyScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preloadedSupply?: any;
}

export function SupplyScannerModal({ isOpen, onClose, onSuccess, preloadedSupply }: SupplyScannerModalProps) {
  const [supply, setSupply] = useState<any | null>(null);
  
  const [type, setType] = useState('SALIDA');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('Consumo en vivero');
  const [observation, setObservation] = useState('');
  
  useEffect(() => {
    if (isOpen && preloadedSupply) {
      setSupply(preloadedSupply);
    } else {
      resetState();
    }
  }, [isOpen, preloadedSupply]);

  const resetState = () => {
    setSupply(null);
    setType('SALIDA');
    setQuantity('');
    setReason('Consumo en vivero');
    setObservation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supply || !quantity || quantity <= 0) return;
    
    try {
      await inventoryService.registerSupplyMovement(
        supply.id,
        type,
        Number(quantity),
        reason,
        observation,
        supply.sku
      );
      
      Swal.fire({
        title: 'Movimiento registrado',
        text: 'El inventario se ha actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Hubo un error al registrar el movimiento';
      Swal.fire({
        title: 'Error',
        html: msg.replace(/\n/g, '<br/>'),
        icon: 'error'
      });
    }
  };

  const reasons = [
    'Consumo en vivero',
    'Aplicación de fertilizante',
    'Control fitosanitario',
    'Preparación de sustrato',
    'Siembra',
    'Mantenimiento',
    'Entrega',
    'Merma',
    'Otro'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Registrar Movimiento
              </h2>
              <p className="text-sm text-slate-500">
                Completa los datos del movimiento
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {supply ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Supply Info Card */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{supply.name}</h3>
                  <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                    {supply.sku}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div className="flex flex-col">
                    <span className="text-slate-500">Stock actual</span>
                    <span className="font-medium text-slate-800">{supply.current_stock} {supply.unit}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">Capacidad máxima</span>
                    <span className="font-medium text-slate-800">{supply.max_stock} {supply.unit}</span>
                  </div>
                  <div className="flex flex-col col-span-2 border-t border-slate-200 pt-2 mt-1">
                    <span className="text-slate-500">Categoría</span>
                    <span className="font-medium text-slate-800">{supply.category || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Movement Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('ENTRADA')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      type === 'ENTRADA' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('SALIDA')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      type === 'SALIDA' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Salida
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('AJUSTE')}
                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                      type === 'AJUSTE' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Ajuste
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {type === 'AJUSTE' ? 'Nuevo Stock Físico' : 'Cantidad'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={supply.unit === 'und' ? '1' : '0.01'}
                    step={supply.unit === 'und' ? '1' : '0.01'}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder={supply.unit === 'und' ? '0' : '0.00'}
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400 text-sm">
                    {supply.unit}
                  </div>
                </div>
              </div>

              {/* Reason */}
              {type === 'SALIDA' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {/* Observation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observación (Opcional)</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={2}
                  placeholder="Detalles adicionales..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Confirmar
                </button>
              </div>

            </form>
          ) : (
            <div className="py-8 text-center text-slate-500">Cargando datos...</div>
          )}
        </div>
      </div>
    </div>
  );
}
