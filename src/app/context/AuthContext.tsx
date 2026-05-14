import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  isClientAuthenticated: boolean;
  clientUser: any | null;
  adminToken: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginClient: (email: string, password: string) => Promise<boolean>;
  registerClient: (userData: any) => Promise<boolean>;
  logoutClient: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE;

/** Strip surrounding quotes if the server returned a JSON-encoded string */
function cleanToken(raw: string): string {
  return raw.trim().replace(/^"|"$/g, '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const t = localStorage.getItem('adminToken');
    return t ? cleanToken(t) : null;
  });

  const [clientUser, setClientUser] = useState<any | null>(() => {
    const stored = localStorage.getItem('clientUser');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAdminAuthenticated = !!adminToken;
  const isClientAuthenticated = !!clientUser;

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [adminToken]);

  useEffect(() => {
    if (clientUser) {
      localStorage.setItem('clientUser', JSON.stringify(clientUser));
    } else {
      localStorage.removeItem('clientUser');
    }
  }, [clientUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/Auth/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ User: username, Password: password }),
      });

      if (res.ok) {
        const raw = await res.text();
        const token = cleanToken(raw);
        setAdminToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAdminToken(null);
  };

  const loginClient = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/Auth/login/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (res.ok) {
        const raw = await res.text();
        const token = cleanToken(raw);
        localStorage.setItem('userToken', token);
        setClientUser({ email, token }); // Minimal user object
        return true;
      }
      return false;
    } catch (error) {
      console.error('Client login error:', error);
      return false;
    }
  };

  const registerClient = async (userData: any): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/clients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        const user = await res.json();
        setClientUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Client register error:', error);
      return false;
    }
  };

  const logoutClient = () => {
    localStorage.removeItem('userToken');
    setClientUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdminAuthenticated,
        isClientAuthenticated,
        clientUser,
        adminToken,
        login,
        logout,
        loginClient,
        registerClient,
        logoutClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
