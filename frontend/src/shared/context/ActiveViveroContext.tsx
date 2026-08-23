import React, { createContext, useContext, useEffect, useState } from 'react';
import { planningService } from '../../modules/Planning/services/planningService';
import type { Vivero } from '../../modules/Planning/types';
import { ACTIVE_VIVERO_STORAGE_KEY } from '../constants/vivero';

interface ActiveViveroContextValue {
  activeVivero: Vivero | null;
  viveros: Vivero[];
  isLoading: boolean;
  selectVivero: (id: number) => void;
  refreshViveros: () => Promise<void>;
}

const ActiveViveroContext = createContext<ActiveViveroContextValue | undefined>(undefined);

/**
 * Vivero activo como espacio de trabajo global (estilo Supabase): se elige una
 * vez y desde ahí todo el sistema —no solo Planificación— queda filtrado por
 * ese vivero. Persistido en localStorage; axiosClient lo adjunta como header
 * X-Vivero-Id en cada petición (ver shared/services/axiosClient.ts).
 */
export const ActiveViveroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viveros, setViveros] = useState<Vivero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeViveroId, setActiveViveroId] = useState<number | null>(() => {
    const stored = localStorage.getItem(ACTIVE_VIVERO_STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  const refreshViveros = async () => {
    setIsLoading(true);
    try {
      const res = await planningService.getViveros();
      setViveros(res.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshViveros();
  }, []);

  const selectVivero = (id: number) => {
    localStorage.setItem(ACTIVE_VIVERO_STORAGE_KEY, String(id));
    setActiveViveroId(id);
    // Recarga completa: hoy ningún viewmodel del resto de módulos reacciona en
    // caliente a un cambio de vivero (todos hacen fetch una vez al montar), así
    // que la forma segura de garantizar datos consistentes es recargar la app.
    window.location.reload();
  };

  const activeVivero = viveros.find(v => v.id === activeViveroId) ?? null;

  return (
    <ActiveViveroContext.Provider value={{ activeVivero, viveros, isLoading, selectVivero, refreshViveros }}>
      {children}
    </ActiveViveroContext.Provider>
  );
};

export function useActiveVivero(): ActiveViveroContextValue {
  const ctx = useContext(ActiveViveroContext);
  if (!ctx) throw new Error('useActiveVivero debe usarse dentro de <ActiveViveroProvider>');
  return ctx;
}
