import React from 'react';
import { useActiveVivero } from '../context/ActiveViveroContext';
import { ViveroGate } from './ViveroGate';

/**
 * Decide si mostrar la pantalla de selección de vivero (ViveroGate) o el
 * resto de la app, según haya o no un vivero activo válido.
 */
export const ActiveViveroGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeVivero, isLoading } = useActiveVivero();

  if (isLoading) return null;
  if (!activeVivero) return <ViveroGate />;

  return <>{children}</>;
};
