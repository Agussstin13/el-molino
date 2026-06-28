import { useState } from 'react';
import { X, User as UserIcon, Mail, Lock, Phone, Calendar, Fingerprint } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAlert } from '../context/AlertContext';

interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientLoginModal({ isOpen, onClose }: ClientLoginModalProps) {
  const { isClientAuthenticated, clientUser, loginClient, registerClient, logoutClient } = useAuth();
  const { items, clearCart } = useCart();
  const { showConfirm } = useAlert();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!email || !password || !nombre || !apellido || !dni || !fechaNacimiento || !telefono) {
          setError('Por favor completa todos los campos');
          setLoading(false);
          return;
        }

        const result = await registerClient({
          email, password, nombre, apellido, dni, fechaNacimiento: new Date(fechaNacimiento).toISOString(), telefono
        });
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Error al registrarse. El email o DNI ya podrían estar en uso.');
        }
      } else {
        if (!email || !password) {
          setError('Por favor ingresa tu email y contraseña');
          setLoading(false);
          return;
        }
        const result = await loginClient(email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Credenciales incorrectas');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border transition-all duration-200 transform scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/10 flex-shrink-0">
          <h2 className="text-xl font-medium text-primary">
            {isClientAuthenticated ? 'Mi Perfil' : isRegistering ? 'Crear Cuenta' : 'Ingresar'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isClientAuthenticated && clientUser ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-6 bg-secondary/20 rounded-2xl border border-border/50">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-xl text-foreground">
                  {clientUser.nombre ? `${clientUser.nombre} ${clientUser.apellido}` : clientUser.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-muted-foreground text-sm">{clientUser.email}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const doLogout = () => {
                      logoutClient();
                      clearCart();
                      onClose();
                    };

                    if (items.length > 0) {
                      showConfirm(
                        "Carrito con productos",
                        "Tenés productos en el carrito. Si cerrás sesión los perderás. ¿Querés continuar?",
                        doLogout
                      );
                    } else {
                      doLogout();
                    }
                  }}
                  className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              
              {isRegistering && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium px-1">Nombre</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan" className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium px-1">Apellido</label>
                      <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Pérez" className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium px-1">DNI</label>
                      <div className="relative">
                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12.345.678" className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium px-1">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="11 1234 5678" className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium px-1">Fecha de Nacimiento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl transition-all font-medium mt-4 disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cargando...
                  </span>
                ) : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                  className="text-primary hover:underline ml-1 font-semibold"
                >
                  {isRegistering ? 'Inicia sesión' : 'Regístrate ahora'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

