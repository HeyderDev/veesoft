import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { MOBILE_AUTH_TOKEN_STORAGE_KEY } from '../constants/auth';

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: { id: number; name: string; description: string | null } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  /** No-null solo cuando GET /user falló por red (backend inalcanzable, sin
   * conexión) en vez de por sesión inválida — ver AuthGate.tsx. */
  connectionError: boolean;
  retryCheckSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Sesión real vía Sanctum SPA (cookie, no token). Al montar intenta restaurar
 * la sesión con GET /user; si el backend devuelve 401 en cualquier momento
 * (axiosClient dispara el evento 'auth:unauthorized'), se limpia el usuario y
 * AuthGate vuelve a mostrar el login.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setConnectionError(false);
    authService.me()
      .then((res: any) => setUser(res.data))
      .catch((err) => {
        setUser(null);
        // Sin response = nunca llegó a hablarle al servidor (timeout, DNS,
        // conexión rechazada) — distinto de un 401 (sesión inválida, normal
        // la primera vez que se abre la app). Ver axiosClient.ts `timeout`.
        setConnectionError(!err?.response);
      })
      .finally(() => setIsLoading(false));
  }, [retryNonce]);

  const retryCheckSession = () => setRetryNonce(n => n + 1);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(MOBILE_AUTH_TOKEN_STORAGE_KEY);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    await authService.getCsrfCookie();
    const res: any = await authService.login(email, password);
    // La app móvil recibe un token Bearer (web recibe null) — ver
    // AuthController::login(). Se guarda aparte del resto de campos del
    // usuario, que es lo único que necesita el estado `user`.
    const { token, ...userFields } = res.data;
    if (token) {
      localStorage.setItem(MOBILE_AUTH_TOKEN_STORAGE_KEY, token);
    }
    setUser(userFields);
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem(MOBILE_AUTH_TOKEN_STORAGE_KEY);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role?.name === 'Admin',
    connectionError,
    retryCheckSession,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
