import { useState, useEffect } from 'react';
import { X, User as UserIcon, Phone, Calendar, LogOut, Edit2, CheckCircle2, ShieldCheck, ArrowLeft, MapPin, Trash2, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useCart } from '../context/CartContext';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'perfil' | 'direcciones';

const API_BASE = import.meta.env.VITE_API_BASE;

export function ClientProfileModal({ isOpen, onClose }: ClientProfileModalProps) {
  const { clientUser, logoutClient, updateClientProfile, savedAddresses, removeAddress } = useAuth();
  const { showConfirm, showSuccess } = useAlert();
  const { items, clearCart } = useCart();

  const [tab, setTab] = useState<Tab>('perfil');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (clientUser && isOpen) {
      setNombre(clientUser.nombre || '');
      setApellido(clientUser.apellido || '');
      setTelefono(clientUser.telefono || '');
      if (clientUser.fechaNacimiento) {
        setFechaNacimiento(clientUser.fechaNacimiento.split('T')[0]);
      }
      setIsEditing(false);
      setError('');
      setTab('perfil');
    }
  }, [clientUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!nombre || !apellido || !fechaNacimiento || !telefono) {
        setError('Por favor completa todos los campos.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/clients/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, apellido, telefono, fechaNacimiento })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateClientProfile(updatedUser);
        showSuccess('Perfil actualizado', 'Tus datos se guardaron correctamente.');
        setIsEditing(false);
      } else {
        const errData = await response.json().catch(() => null);
        setError(errData?.detail || errData?.title || 'Error al actualizar el perfil.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (items.length > 0) {
      showConfirm(
        '¿Cerrar sesión?',
        'Tenés productos en tu carrito. Si cerrás sesión ahora, tu carrito se vaciará.',
        () => { clearCart(); logoutClient(); onClose(); }
      );
    } else {
      logoutClient();
      onClose();
    }
  };

  const displayDate = clientUser?.fechaNacimiento
    ? (() => {
        const parts = clientUser.fechaNacimiento.split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return clientUser.fechaNacimiento;
      })()
    : '—';

  const initials = `${clientUser?.nombre?.[0] ?? ''}${clientUser?.apellido?.[0] ?? ''}`.toUpperCase() || '?';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">

        {/* ── VISTA PERFIL ──────────────────────────────────────────── */}
        {!isEditing ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/20">
              <h2 className="text-base font-semibold text-foreground">Mi Perfil</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar + nombre */}
            <div className="px-5 pt-5 pb-3 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{clientUser?.nombre} {clientUser?.apellido}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{clientUser?.email}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mx-5 mb-0 flex border border-border rounded-xl overflow-hidden bg-secondary/20">
              <button
                onClick={() => setTab('perfil')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'perfil' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mis datos
              </button>
              <button
                onClick={() => setTab('direcciones')}
                className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === 'direcciones' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Direcciones
                {savedAddresses.length > 0 && (
                  <span className="bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {savedAddresses.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab content */}
            <div className="px-5 pb-5 pt-4">
              {tab === 'perfil' ? (
                <div className="space-y-4">
                  <div className="w-full h-px bg-border/60" />

                  <div className="grid grid-cols-2 gap-2.5">
                    <DataRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label="DNI" value={clientUser?.dni ?? '—'} />
                    <DataRow icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={clientUser?.telefono ?? '—'} />
                    <div className="col-span-2">
                      <DataRow icon={<Calendar className="w-3.5 h-3.5" />} label="Fecha de nacimiento" value={displayDate} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20 font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar mis datos
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl bg-transparent text-muted-foreground border border-border font-medium text-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                /* ── TAB DIRECCIONES ── */
                <div className="space-y-3">
                  <div className="w-full h-px bg-border/60" />

                  {savedAddresses.length === 0 ? (
                    <div className="py-8 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Sin direcciones guardadas</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Al finalizar una compra podés guardar tu dirección aquí.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
                      <p className="text-xs text-muted-foreground">
                        {savedAddresses.length} de 10 guardadas
                      </p>
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="flex items-start gap-3 bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 group"
                        >
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate leading-snug">{addr.label}</p>
                            {addr.infoAdicional && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{addr.infoAdicional}</p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              showConfirm(
                                'Eliminar dirección',
                                `¿Eliminar "${addr.label}"?`,
                                () => removeAddress(addr.id)
                              )
                            }
                            className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl bg-transparent text-muted-foreground border border-border font-medium text-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── VISTA EDICIÓN ─────────────────────────────────────────── */
          <>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/20">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setError(''); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-foreground">Editar datos</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs font-medium text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre" icon={<UserIcon className="w-4 h-4" />} type="text" value={nombre} onChange={setNombre} required />
                <FormField label="Apellido" icon={<UserIcon className="w-4 h-4" />} type="text" value={apellido} onChange={setApellido} required />
              </div>

              <FormField label="Teléfono" hint="Sin 0 y sin 15" icon={<Phone className="w-4 h-4" />} type="tel" value={telefono} onChange={setTelefono} placeholder="Ej: 1123456789" required />

              <FormField label="Fecha de nacimiento" icon={<Calendar className="w-4 h-4" />} type="date" value={fechaNacimiento} onChange={setFechaNacimiento} max={new Date().toISOString().split('T')[0]} required isDate />

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setError(''); }}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-secondary/50 text-foreground border border-border font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[1.4] py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" />Guardar</>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {icon}{label}
      </span>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function FormField({ label, hint, icon, type, value, onChange, placeholder, required, max, isDate = false }: {
  label: string; hint?: string; icon: React.ReactNode; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; max?: string; isDate?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between text-xs font-semibold text-foreground px-0.5">
        <span>{label}</span>
        {hint && <span className="text-muted-foreground font-normal">{hint}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} max={max}
          className={`w-full pl-9 pr-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${isDate ? '[&::-webkit-calendar-picker-indicator]:opacity-40' : ''}`}
        />
      </div>
    </div>
  );
}
