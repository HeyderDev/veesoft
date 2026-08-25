import React from 'react';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../../pages/Login';

/**
 * Decide si mostrar el login o el resto de la app, según haya o no una sesión
 * activa. Va por fuera de ActiveViveroProvider/ActiveViveroGate — primero se
 * inicia sesión, después se elige el vivero.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, connectionError, retryCheckSession } = useAuth();

  // Antes esto devolvía null mientras isLoading — en la app móvil, si el
  // backend es inalcanzable (IP LAN vieja, firewall, servidor caído), eso se
  // veía como pantalla en blanco permanente sin ningún indicio del problema.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm text-center space-y-4">
          <WifiOff className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No se pudo conectar al servidor</h2>
          <p className="text-sm text-slate-500">
            Verifica tu conexión y que el servidor esté disponible en la dirección configurada.
          </p>
          <button
            type="button"
            onClick={retryCheckSession}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
};
