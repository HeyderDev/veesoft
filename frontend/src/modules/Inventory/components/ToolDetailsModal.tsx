import { useState } from 'react';
// type import removed
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface Props {
  tool: any; // Acutally tool-unit returned from code search, which has .tool relation
  onClose: () => void;
  onRegisterEvent: (tipo: 'BORROWED' | 'RETURN', details: any) => void;
}

export const ToolDetailsModal = ({ tool, onClose, onRegisterEvent }: Props) => {
  const [confirmAction, setConfirmAction] = useState<'BORROWED' | 'RETURN' | null>(null);
  
  // For borrow/return details
  const [observations, setObservations] = useState<string>('');



  // Using the unit status
  const isDisponible = tool.status === 'available';
  const isPrestado = tool.status === 'borrowed';
  const isMantenimiento = tool.status === 'maintenance';

  const canReturn = isPrestado;

  const handleConfirm = () => {
    if (confirmAction) {
      onRegisterEvent(confirmAction, {
        operational_task_id: null,
        observaciones: observations,
        motivo: confirmAction === 'BORROWED' ? 'Préstamo' : 'Devolución'
      });
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
        case 'available': return 'DISPONIBLE';
        case 'borrowed': return 'PRESTADO';
        case 'maintenance': return 'MANTENIMIENTO';
        case 'out_of_service': return 'BAJA';
        default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        
        {confirmAction ? (
          <div className="animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Info size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">¿Confirmar {confirmAction === 'BORROWED' ? 'préstamo' : 'devolución'}?</h3>
            <p className="text-gray-500 mb-6 text-center">
              Registrar {confirmAction === 'BORROWED' ? 'un préstamo' : 'una devolución'} para la herramienta <span className="font-semibold text-gray-700">{tool.tool?.name}</span> (Unidad: {tool.code}).
            </p>



            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">OBSERVACIONES (OPCIONAL)</label>
                <textarea 
                  rows={2}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Estado en el que se entrega/recibe..."
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="secondary"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-xl font-medium"
              >
                Cancelar
              </Button>
              <button 
                onClick={handleConfirm}
                className={clsx(
                  "flex-1 text-white py-3 rounded-xl font-bold transition-colors shadow-sm",
                  confirmAction === 'BORROWED' ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30" : "bg-green-500 hover:bg-green-600 shadow-green-500/30"
                )}
              >
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{tool.tool?.name || 'Herramienta'}</h2>
            <p className="text-gray-500 mb-4">Unidad: {tool.code}</p>
            
            <div className="inline-block mb-4">
              <span className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2",
                isDisponible && "bg-green-100 text-green-800",
                isPrestado && "bg-orange-100 text-orange-800",
                isMantenimiento && "bg-red-100 text-red-800",
                (!isDisponible && !isPrestado && !isMantenimiento) && "bg-gray-100 text-gray-800"
              )}>
                {isMantenimiento && <AlertTriangle size={16} />}
                {isDisponible && <CheckCircle2 size={16} />}
                Estado: {getStatusText(tool.status)}
              </span>
            </div>

            {isMantenimiento ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mt-2 mb-4">
                Esta herramienta se encuentra en mantenimiento y no puede ser prestada ni devuelta en este momento.
              </div>
            ) : tool.status === 'out_of_service' ? (
              <div className="bg-slate-50 text-slate-600 p-4 rounded-xl text-sm font-medium border border-slate-200 mt-2 mb-4">
                Esta unidad ha sido dada de baja.
              </div>
            ) : (
              <>
                <div className="flex space-x-4 mt-6">
                  <button 
                    onClick={() => setConfirmAction('BORROWED')}
                    disabled={!isDisponible}
                    className={clsx(
                      "flex-1 py-3 rounded-xl font-semibold transition-all shadow-sm",
                      isDisponible 
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                    )}
                  >
                    Préstamo
                  </button>
                  <button 
                    onClick={() => setConfirmAction('RETURN')}
                    disabled={!canReturn}
                    className={clsx(
                      "flex-1 py-3 rounded-xl font-semibold transition-all shadow-sm",
                      canReturn 
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                    )}
                  >
                    Devolución
                  </button>
                </div>
              </>
            )}
            
            <button 
              onClick={onClose}
              className="w-full mt-4 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};
