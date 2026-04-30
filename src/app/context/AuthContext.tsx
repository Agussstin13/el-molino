import { createContext, useContext, useState, type ReactNode } from 'react';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'molino2024';
const STORAGE_KEY = 'el-molino-admin-auth';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAdminAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAdminAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
