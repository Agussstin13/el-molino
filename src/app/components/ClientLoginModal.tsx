import { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Lock, Phone, Calendar, Fingerprint } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAlert } from '../context/AlertContext';

interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSessionRenewal?: boolean;
  renewalEmail?: string;
}

export function ClientLoginModal({
  isOpen,
  onClose,
  isSessionRenewal = false,
  renewalEmail,
}: ClientLoginModalProps) {
  const { isClientAuthenticated, clientUser, loginClient, registerClient, logoutClient } = useAuth();
  const { items } = useCart();
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

  // Bloquear el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isSessionRenewal) return;

    setIsRegistering(false);
    setEmail(renewalEmail || clientUser?.email || '');
    setPassword('');
    setError('');
  }, [clientUser?.email, isOpen, isSessionRenewal, renewalEmail]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 transform scale-100 sm:max-h-[90dvh]">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary/10 p-4 sm:p-6">
          <h2 className="text-xl font-medium text-primary">
            {isSessionRenewal
              ? 'Renovar sesión'
              : isClientAuthenticated
                ? 'Mi Perfil'
                : isRegistering
                  ? 'Crear Cuenta'
                  : 'Ingresar'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {isClientAuthenticated && clientUser && !isSessionRenewal ? (
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
                      onClose();
                    };

                    if (items.length > 0) {
                      showConfirm(
                        "Carrito con productos",
                        "Tu carrito seguirá guardado en este dispositivo cuando cierres sesión. ¿Querés continuar?",
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
              {isSessionRenewal && (
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-sm text-muted-foreground">
                  Ingresá nuevamente tu contraseña para continuar sin interrupciones.
                </p>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              
              {isRegistering && (
                <div className="space-y-4">
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium px-1">Nombre</label>
                      <div className="relative min-w-0">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan" className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium px-1">Apellido</label>
                      <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Pérez" className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium px-1">DNI</label>
                      <div className="relative min-w-0">
                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12.345.678" className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium px-1">Teléfono</label>
                      <div className="relative min-w-0">
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
                    readOnly={isSessionRenewal}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all read-only:cursor-not-allowed read-only:opacity-70"
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
                ) : isRegistering ? 'Crear Cuenta' : isSessionRenewal ? 'Renovar Sesión' : 'Iniciar Sesión'}
              </button>

              {!isSessionRenewal && (
                <>
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
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

