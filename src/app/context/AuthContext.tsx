import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AuthContextType {
  isAdminAuthenticated: boolean;
  isClientAuthenticated: boolean;
  clientUser: any | null;
  adminToken: string | null;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_BASE;

/** Strip surrounding quotes if the server returned a JSON-encoded string */
function cleanToken(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "");
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
    } else {
      localStorage.removeItem("clientUser");
    }
  }, [clientUser]);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    try {
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
          const nombre = payload.nombre;
          const apellido = payload.apellido;
          const dni = payload.dni;
          const telefono = payload.telefono;
          setClientUser({
            email,
            token,
            id: userId ? parseInt(userId, 10) : null,
            nombre,
            apellido,
            dni,
            telefono,
          });
        } catch {
          setClientUser({ email, token });
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
  };

  const updateClientProfile = (updates: any) => {
    setClientUser((prev: any) => (prev ? { ...prev, ...updates } : prev));
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
        updateClientProfile,
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
