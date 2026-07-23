import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Define auth state structure
interface AuthState {
  isAuthenticated: boolean;
  user: any | null; // Tipar esto apropiadamente después
}

interface AuthContextType extends AuthState {
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const login = (userData: any) => {
    setAuthState({ isAuthenticated: true, user: userData });
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
