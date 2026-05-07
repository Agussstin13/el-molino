import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientLoginModal({ isOpen, onClose }: ClientLoginModalProps) {
  const { isClientAuthenticated, clientUser, loginClient, registerClient, logoutClient } = useAuth();
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

    if (isRegistering) {
      if (!email || !password || !nombre || !apellido || !dni || !fechaNacimiento || !telefono) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }
      const success = await registerClient({
        email, password, nombre, apellido, dni, fechaNacimiento: new Date(fechaNacimiento).toISOString(), telefono
      });
      if (success) {
        onClose();
      } else {
        setError('Error al registrarse. El email o DNI ya podrían estar en uso.');
      }
    } else {
      if (!email || !password) {
        setError('Por favor ingresa tu email y contraseña');
        setLoading(false);
        return;
      }
      const success = await loginClient(email, password);
      if (success) {
        onClose();
      } else {
        setError('Credenciales incorrectas');
      }
    }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden border-2 border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl" style={{ fontFamily: 'Georgia, serif' }}>
            {isClientAuthenticated ? 'Mi Perfil' : 'Ingresar'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isClientAuthenticated && clientUser ? (
          <div className="space-y-4">
            <div className="bg-secondary/30 p-4 rounded-xl border border-border">
              <p className="font-medium text-lg">{clientUser.nombre} {clientUser.apellido}</p>
              <p className="text-muted-foreground">{clientUser.email}</p>
            </div>
            <button
              onClick={() => {
                logoutClient();
                onClose();
              }}
              className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 py-2.5 rounded-xl transition-colors font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1.5">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5">Apellido</label>
                    <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1.5">DNI</label>
                    <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5">Teléfono</label>
                    <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1.5">Fecha de Nacimiento</label>
                  <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl transition-colors font-medium mt-2 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : isRegistering ? 'Registrarse' : 'Ingresar'}
            </button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-primary hover:underline ml-1 font-medium"
              >
                {isRegistering ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
