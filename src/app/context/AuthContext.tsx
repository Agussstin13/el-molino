import { createContext, useContext, useState, type ReactNode } from 'react';
import { API_BASE } from '../../lib/config';

const STORAGE_KEY = 'el-molino-admin-auth';
const API_URL = API_BASE;

interface ClientUser {
  nombre: string;
  apellido: string;
  email: string;
}

interface AuthContextType {
  isAdminAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  isClientAuthenticated: boolean;
  clientUser: ClientUser | null;
  loginClient: (email: string, password: string) => Promise<boolean>;
  registerClient: (data: any) => Promise<boolean>;
  logoutClient: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const [clientUser, setClientUser] = useState<ClientUser | null>(() => {
    try {
      const stored = localStorage.getItem('el-molino-client-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isClientAuthenticated = !!clientUser;

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login/admin`, {
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

  const loginClient = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('el-molino-client-user', JSON.stringify(data.user));
        localStorage.setItem('el-molino-client-token', data.token);
        setClientUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const registerClient = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/client/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('el-molino-client-user', JSON.stringify(data.user));
        localStorage.setItem('el-molino-client-token', data.token);
        setClientUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logoutClient = () => {
    localStorage.removeItem('el-molino-client-user');
    localStorage.removeItem('el-molino-client-token');
    setClientUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAdminAuthenticated, login, logout,
      isClientAuthenticated, clientUser, loginClient, registerClient, logoutClient
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
