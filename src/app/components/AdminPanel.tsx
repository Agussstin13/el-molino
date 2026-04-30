import { Package, Tag, ShoppingBag, Edit, Trash2, LogOut, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatARS } from '@/lib/price';
import type { Coupon, Order } from '@/lib/types';

type AdminView = 'products' | 'promotions' | 'orders';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Proteína Whey Chocolate 1kg', price: 4500, stock: 45, category: 'Suplementos', image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=80&q=80' },
  { id: '2', name: 'Mix de Frutos Secos 500g', price: 1200, stock: 120, category: 'Frutos Secos', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=80&q=80' },
  { id: '3', name: 'Harina de Almendras 500g', price: 2800, stock: 8, category: 'Harinas', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=80&q=80' },
  { id: '4', name: 'Mantequilla de Maní 350g', price: 980, stock: 55, category: 'Snacks', image: 'https://images.unsplash.com/photo-1588214190835-4b706d71f2e4?w=80&q=80' },
];

const MOCK_ORDERS: Order[] = [
  { id: '#1001', customer: 'Juan Pérez', total: 7500, status: 'procesando', date: '28/04/2026', metodo_pago: 'mercadopago' },
  { id: '#1002', customer: 'María González', total: 3200, status: 'enviado', date: '27/04/2026', metodo_pago: 'transferencia' },
  { id: '#1003', customer: 'Carlos Rodríguez', total: 12000, status: 'entregado', date: '25/04/2026', metodo_pago: 'mercadopago' },
  { id: '#1004', customer: 'Ana Martínez', total: 1680, status: 'pendiente', date: '28/04/2026', metodo_pago: 'mercadopago' },
];

const STATUS_LABELS: Record<Order['status'], string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<Order['status'], string> = {
  pendiente: 'bg-chart-4/20 text-chart-4',
  procesando: 'bg-chart-1/20 text-chart-1',
  enviado: 'bg-chart-2/20 text-chart-2',
  entregado: 'bg-accent/20 text-accent',
  cancelado: 'bg-destructive/20 text-destructive',
};

const EMPTY_COUPON: Omit<Coupon, 'id'> = {
  nombre: '',
  detalle: '',
  codigo: '',
  monto: null,
  porcentaje: null,
  tope: null,
  compra_minima: null,
  activo: true,
  valido_mayorista: false,
};

export function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('products');
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', nombre: 'Descuento Bienvenida', detalle: 'Descuento del 15% para nuevos clientes', codigo: 'BIENVENIDA15', monto: null, porcentaje: 15, tope: 2000, compra_minima: 3000, activo: true, valido_mayorista: false },
    { id: '2', nombre: 'Envío Gratis Extra', detalle: 'Cupón de monto fijo para envío', codigo: 'ENVIOGRATIS', monto: 500, porcentaje: null, tope: null, compra_minima: null, activo: true, valido_mayorista: true },
  ]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id'>>(EMPTY_COUPON);
  const [tipoDescuento, setTipoDescuento] = useState<'monto' | 'porcentaje'>('porcentaje');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleSaveCoupon = () => {
    const newCoupon: Coupon = {
      ...couponForm,
      id: Date.now().toString(),
      monto: tipoDescuento === 'monto' ? Number(couponForm.monto) : null,
      porcentaje: tipoDescuento === 'porcentaje' ? Number(couponForm.porcentaje) : null,
      tope: tipoDescuento === 'porcentaje' && couponForm.tope ? Number(couponForm.tope) : null,
    };
    setCoupons(prev => [...prev, newCoupon]);
    setCouponForm(EMPTY_COUPON);
    setShowCouponForm(false);
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const setCF = (field: keyof Omit<Coupon, 'id'>, value: unknown) => {
    setCouponForm(f => ({ ...f, [field]: value }));
  };

  const navItems = [
    { id: 'products' as AdminView, icon: Package, label: 'Productos' },
    { id: 'promotions' as AdminView, icon: Tag, label: 'Cupones' },
    { id: 'orders' as AdminView, icon: ShoppingBag, label: 'Pedidos' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <img src="/src/imports/image.png" alt="El Molino" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sidebar-foreground font-medium" style={{ fontFamily: 'Georgia, serif' }}>El Molino</p>
            <p className="text-xs text-muted-foreground">Panel Admin</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                currentView === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4 space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            Ver tienda
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">

          {/* PRODUCTOS */}
          {currentView === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: 'Georgia, serif' }}>Gestión de Productos</h1>
                <button
                  id="new-product-btn"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Producto</th>
                      <th className="text-left p-4 text-sm font-medium">Precio</th>
                      <th className="text-left p-4 text-sm font-medium">Stock</th>
                      <th className="text-right p-4 text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PRODUCTS.map(product => (
                      <tr key={product.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{formatARS(product.price)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.stock > 50
                              ? 'bg-accent/20 text-accent'
                              : product.stock > 20
                              ? 'bg-chart-4/20 text-chart-4'
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {product.stock} uds.
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 justify-end">
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Editar">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUPONES */}
          {currentView === 'promotions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: 'Georgia, serif' }}>Cupones de Descuento</h1>
                <button
                  id="new-coupon-btn"
                  onClick={() => setShowCouponForm(v => !v)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  {showCouponForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showCouponForm ? 'Cancelar' : 'Nuevo Cupón'}
                </button>
              </div>

              {/* Formulario nuevo cupón */}
              {showCouponForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="mb-5 text-base" style={{ fontFamily: 'Georgia, serif' }}>Crear cupón</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5">Nombre *</label>
                      <input value={couponForm.nombre} onChange={e => setCF('nombre', e.target.value)} placeholder="Ej: Verano 2026" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Código *</label>
                      <input value={couponForm.codigo} onChange={e => setCF('codigo', e.target.value.toUpperCase())} placeholder="VERANO2026" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Detalle / Descripción *</label>
                      <input value={couponForm.detalle} onChange={e => setCF('detalle', e.target.value)} placeholder="Descripción del cupón" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>

                    {/* Tipo de descuento */}
                    <div className="col-span-2">
                      <label className="block text-sm mb-2">Tipo de descuento *</label>
                      <div className="flex gap-3">
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm transition-colors ${tipoDescuento === 'porcentaje' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <input type="radio" name="tipo" value="porcentaje" checked={tipoDescuento === 'porcentaje'} onChange={() => setTipoDescuento('porcentaje')} className="accent-primary" />
                          Porcentaje (%)
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm transition-colors ${tipoDescuento === 'monto' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <input type="radio" name="tipo" value="monto" checked={tipoDescuento === 'monto'} onChange={() => setTipoDescuento('monto')} className="accent-primary" />
                          Monto fijo ($)
                        </label>
                      </div>
                    </div>

                    {tipoDescuento === 'porcentaje' ? (
                      <>
                        <div>
                          <label className="block text-sm mb-1.5">Porcentaje (1–100) *</label>
                          <input type="number" min={1} max={100} value={couponForm.porcentaje ?? ''} onChange={e => setCF('porcentaje', Number(e.target.value))} placeholder="15" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1.5">Tope máximo de descuento ($)</label>
                          <input type="number" min={0} value={couponForm.tope ?? ''} onChange={e => setCF('tope', e.target.value ? Number(e.target.value) : null)} placeholder="Opcional" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm mb-1.5">Monto fijo ($) *</label>
                        <input type="number" min={0} value={couponForm.monto ?? ''} onChange={e => setCF('monto', Number(e.target.value))} placeholder="500" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm mb-1.5">Compra mínima ($)</label>
                      <input type="number" min={0} value={couponForm.compra_minima ?? ''} onChange={e => setCF('compra_minima', e.target.value ? Number(e.target.value) : null)} placeholder="Opcional" className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={couponForm.activo} onChange={e => setCF('activo', e.target.checked)} className="accent-primary w-4 h-4" />
                        Activo
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={couponForm.valido_mayorista} onChange={e => setCF('valido_mayorista', e.target.checked)} className="accent-primary w-4 h-4" />
                        Válido para precio mayorista
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
                    <button onClick={() => setShowCouponForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm">
                      Cancelar
                    </button>
                    <button
                      id="save-coupon-btn"
                      onClick={handleSaveCoupon}
                      disabled={!couponForm.nombre || !couponForm.codigo}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm"
                    >
                      Guardar cupón
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de cupones */}
              <div className="space-y-3">
                {coupons.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay cupones creados.
                  </div>
                )}
                {coupons.map(coupon => (
                  <div key={coupon.id} className="bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex-shrink-0 ${coupon.activo ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                        {coupon.codigo}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{coupon.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{coupon.detalle}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {coupon.porcentaje ? `${coupon.porcentaje}% OFF` : `${formatARS(coupon.monto!)} de descuento`}
                          </span>
                          {coupon.tope && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">Tope: {formatARS(coupon.tope)}</span>}
                          {coupon.compra_minima && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">Mín: {formatARS(coupon.compra_minima)}</span>}
                          {coupon.valido_mayorista && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Válido mayorista</span>}
                          {!coupon.activo && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactivo</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PEDIDOS */}
          {currentView === 'orders' && (
            <div>
              <h1 className="mb-6" style={{ fontFamily: 'Georgia, serif' }}>Historial de Pedidos</h1>
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Pedido</th>
                      <th className="text-left p-4 text-sm font-medium">Cliente</th>
                      <th className="text-left p-4 text-sm font-medium">Total</th>
                      <th className="text-left p-4 text-sm font-medium">Pago</th>
                      <th className="text-left p-4 text-sm font-medium">Estado</th>
                      <th className="text-left p-4 text-sm font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ORDERS.map(order => (
                      <tr key={order.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                        <td className="p-4 text-sm font-mono">{order.id}</td>
                        <td className="p-4 text-sm">{order.customer}</td>
                        <td className="p-4 text-sm font-medium">{formatARS(order.total)}</td>
                        <td className="p-4 text-sm text-muted-foreground capitalize">{order.metodo_pago}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
