import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface SavedAddress {
  id: string;
  label: string;        // dirección completa
  placeId: string;      // Google Places ID
  infoAdicional?: string;
  savedAt: string;      // ISO date
}

interface AuthContextType {
  isAdminAuthenticated: boolean;
  isClientAuthenticated: boolean;
  clientUser: any | null;
  adminToken: string | null;
  savedAddresses: SavedAddress[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginClient: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  registerClient: (
    userData: any,
  ) => Promise<{ success: boolean; error?: string }>;
  logoutClient: () => void;
  updateClientProfile: (updates: any) => void;
  saveAddress: (addr: Omit<SavedAddress, 'id' | 'savedAt'>) => boolean;
  removeAddress: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE;

/** Strip surrounding quotes if the server returned a JSON-encoded string */
function cleanToken(raw: string): string {
  return raw.trim().replace(/^\"|\"$/g, "");
}

/**
 * Persist extra profile fields (like fechaNacimiento) that are not included
 * in the JWT claims. Keyed by email so multiple accounts don't conflict.
 */
function saveExtraProfile(email: string, data: Record<string, any>) {
  try {
    const key = `clientProfile-${email}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  } catch { /* ignore */ }
}

function loadExtraProfile(email: string): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(`clientProfile-${email}`) || "{}");
  } catch {
    return {};
  }
}

const MAX_ADDRESSES = 10;

function addressesKey(email: string) {
  return `clientAddresses-${email}`;
}

function loadAddresses(email: string): SavedAddress[] {
  try {
    return JSON.parse(localStorage.getItem(addressesKey(email)) || "[]");
  } catch {
    return [];
  }
}

function persistAddresses(email: string, list: SavedAddress[]) {
  localStorage.setItem(addressesKey(email), JSON.stringify(list));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const t = localStorage.getItem("adminToken");
    return t ? cleanToken(t) : null;
  });

  const [clientUser, setClientUser] = useState<any | null>(() => {
    const stored = localStorage.getItem("clientUser");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const stored = localStorage.getItem("clientUser");
      const user = stored ? JSON.parse(stored) : null;
      return user?.email ? loadAddresses(user.email) : [];
    } catch {
      return [];
    }
  });

  const isAdminAuthenticated = !!adminToken;
  const isClientAuthenticated = !!clientUser;

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [adminToken]);

  useEffect(() => {
    if (clientUser) {
      localStorage.setItem("clientUser", JSON.stringify(clientUser));
      // Keep extra profile store in sync whenever clientUser changes
      if (clientUser.email && clientUser.fechaNacimiento) {
        saveExtraProfile(clientUser.email, {
          fechaNacimiento: clientUser.fechaNacimiento,
        });
      }
    } else {
      localStorage.removeItem("clientUser");
    }
  }, [clientUser]);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
      username = username.trim();
      const res = await fetch(`${API_BASE}/api/Auth/login/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setAdminToken(null);
  };

  const loginClient = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      email = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE}/api/Auth/login/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (res.ok) {
        const raw = await res.text();
        const token = cleanToken(raw);
        localStorage.setItem("userToken", token);

        // Decode JWT payload to get user id/name from claims
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );
          const payload = JSON.parse(jsonPayload);

          const userId =
            payload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ] || payload.sub;

          // Restore extra profile fields (e.g. fechaNacimiento) that are not
          // included in the JWT — they were saved on the previous session.
          const extra = loadExtraProfile(email);

          setClientUser({
            email,
            token,
            id: userId ? parseInt(userId, 10) : null,
            nombre: payload.nombre,
            apellido: payload.apellido,
            dni: payload.dni,
            telefono: payload.telefono,
            ...extra, // merges fechaNacimiento and any other saved fields
          });
          // Load saved addresses for this account
          setSavedAddresses(loadAddresses(email));
        } catch {
          setClientUser({ email, token });
          setSavedAddresses([]);
        }
        return { success: true };
      }

      const errData = await res.json().catch(() => null);
      const errorMsg =
        errData?.detail || errData?.title || "Credenciales incorrectas";
      return { success: false, error: errorMsg };
    } catch (error) {
      console.error("Client login error:", error);
      return { success: false, error: "Error al conectar con el servidor" };
    }
  };

  const registerClient = async (
    userData: any,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (userData.email) {
        userData.email = userData.email.trim().toLowerCase();
      }
      const res = await fetch(`${API_BASE}/api/clients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        // Registration succeeded — auto-login to get a JWT token
        return await loginClient(userData.email, userData.password);
      }

      const errData = await res.json().catch(() => null);
      const errorMsg =
        errData?.detail ||
        errData?.title ||
        "Error al registrarse. El email o DNI ya podrían estar en uso.";
      return { success: false, error: errorMsg };
    } catch (error) {
      console.error("Client register error:", error);
      return { success: false, error: "Error al conectar con el servidor" };
    }
  };

  const logoutClient = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("el-molino-checkout-form");
    setClientUser(null);
    setSavedAddresses([]);
    // Note: clientProfile-<email> and clientAddresses-<email> are intentionally
    // kept so data is restored on the next login.
  };

  const updateClientProfile = (updates: any) => {
    setClientUser((prev: any) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      // Persist extra fields immediately so they survive logout/login
      if (next.email) {
        saveExtraProfile(next.email, updates);
      }
      return next;
    });
  };

  // Returns false if the limit (10) is reached
  const saveAddress = (addr: Omit<SavedAddress, 'id' | 'savedAt'>): boolean => {
    const email = clientUser?.email;
    if (!email) return false;
    const current = loadAddresses(email);
    if (current.length >= MAX_ADDRESSES) return false;
    // Avoid exact duplicates by placeId
    if (current.some((a) => a.placeId === addr.placeId)) return true;
    const next: SavedAddress[] = [
      { ...addr, id: `${Date.now()}`, savedAt: new Date().toISOString() },
      ...current,
    ];
    persistAddresses(email, next);
    setSavedAddresses(next);
    return true;
  };

  const removeAddress = (id: string) => {
    const email = clientUser?.email;
    if (!email) return;
    const next = loadAddresses(email).filter((a) => a.id !== id);
    persistAddresses(email, next);
    setSavedAddresses(next);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdminAuthenticated,
        isClientAuthenticated,
        clientUser,
        adminToken,
        savedAddresses,
        login,
        logout,
        loginClient,
        registerClient,
        logoutClient,
        updateClientProfile,
        saveAddress,
        removeAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
