import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../../pages/Login';

/**
 * Decide si mostrar el login o el resto de la app, según haya o no una sesión
 * activa. Va por fuera de ActiveViveroProvider/ActiveViveroGate — primero se
 * inicia sesión, después se elige el vivero.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
};
