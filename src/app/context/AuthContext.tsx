import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'el-molino-admin-auth';
const API_URL = 'http://localhost:5001';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: username, password }),
      });

      if (response.ok) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsAdminAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
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
