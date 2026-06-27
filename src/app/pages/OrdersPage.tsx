import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { formatARS } from '../../lib/price';
import {
  Package, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck,
  XCircle, AlertCircle, CreditCard, Banknote, Smartphone,
  MapPin, ShoppingBag, ArrowLeft, RefreshCw, X, Trash2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

// ── Status helpers ─────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pendiente:       { label: 'Pendiente',       color: 'text-amber-600',  bg: 'bg-amber-100',  icon: Clock },
  en_preparacion:  { label: 'En preparación',  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: RefreshCw },
  enviado:         { label: 'Enviado',          color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Truck },
  entregado:       { label: 'Entregado',        color: 'text-green-600',  bg: 'bg-green-100',  icon: CheckCircle2 },
  cancelado:       { label: 'Cancelado',        color: 'text-red-500',    bg: 'bg-red-100',    icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aprobado:    { label: 'Pagado',       color: 'text-green-700',  bg: 'bg-green-100' },
  pendiente:   { label: 'No pagado',    color: 'text-amber-700',  bg: 'bg-amber-100' },
  rechazado:   { label: 'Rechazado',    color: 'text-red-600',    bg: 'bg-red-100' },
  cancelado:   { label: 'Cancelado',    color: 'text-red-600',    bg: 'bg-red-100' },
  reembolsado: { label: 'Reembolsado',  color: 'text-purple-600', bg: 'bg-purple-100' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercado_pago:  'Mercado Pago',
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
};

function getPaymentStatus(status?: string) {
  return PAYMENT_STATUS_CONFIG[status ?? 'pendiente'] ?? { label: 'No pagado', color: 'text-amber-700', bg: 'bg-amber-100' };
}

function getOrderStatus(status?: string) {
  return ORDER_STATUS_CONFIG[status ?? 'pendiente'] ?? ORDER_STATUS_CONFIG.pendiente;
}

function mapOrder(o: any) {
  return {
    id: o.id?.toString(),
    buyerFirstName: o.buyerFirstName ?? '',
    buyerLastName: o.buyerLastName ?? '',
    total: o.total ?? 0,
    shippingCost: o.shippingCost ?? 0,
    orderStatus: o.orderStatus ?? 'pendiente',
    paymentStatus: o.paymentStatus ?? 'pendiente',
    paymentMethod: o.paymentMethod ?? '',
    createdAt: o.createdAt,
    shippingAddress: o.shippingAddress,
    orderInformation: o.orderInformation,
    guestToken: o.guestToken,
    cancelledAt: o.cancelledAt,
    items: Array.isArray(o.items) ? o.items : [],
  };
}

// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order, userToken, onOrderCancelled, onOrderHidden }: {
  order: ReturnType<typeof mapOrder>;
  userToken: string;
  onOrderCancelled: (id: string) => void;
  onOrderHidden?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [hiding, setHiding] = useState(false);
  const { showConfirm, showError, showSuccess } = useAlert();

  const orderStatusCfg = getOrderStatus(order.orderStatus);
  const paymentStatusCfg = getPaymentStatus(order.paymentStatus);
  const StatusIcon = orderStatusCfg.icon;

  const canCancel = (order.orderStatus === 'pendiente' || order.orderStatus === 'en_preparacion')
    && order.paymentStatus !== 'aprobado';

  const canGeneratePaymentLink = order.paymentMethod === 'mercado_pago'
    && order.paymentStatus !== 'aprobado'
    && order.orderStatus !== 'cancelado';

  const handleCancel = () => {
    showConfirm(
      '¿Cancelar pedido?',
      `¿Estás seguro de que querés cancelar el pedido #${order.id}? Esta acción no se puede deshacer.`,
      async () => {
        setCancelling(true);
        try {
          const res = await fetch(`${API_BASE}/api/orders/${order.id}/cancel`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${userToken}` },
          });
          if (res.ok) {
            showSuccess('Pedido cancelado', 'Tu pedido fue cancelado correctamente.');
            onOrderCancelled(order.id);
          } else {
            const err = await res.json().catch(() => null);
            showError('Error', err?.detail || err?.title || 'No se pudo cancelar el pedido.');
          }
        } catch {
          showError('Error de red', 'No se pudo conectar con el servidor.');
        } finally {
          setCancelling(false);
        }
      }
    );
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}/payment-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.paymentUrl, '_blank');
      } else {
        const err = await res.json().catch(() => null);
        showError('Error', err?.detail || err?.title || 'No se pudo generar el link de pago.');
      }
    } catch {
      showError('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleHide = async () => {
    if (!window.confirm('¿Seguro que deseas borrar este pedido de tu historial?')) return;
    setHiding(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}/hide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        showSuccess('Eliminado', 'El pedido fue borrado de tu historial.');
        onOrderHidden?.(order.id);
      } else {
        const err = await res.json().catch(() => null);
        showError('Error', err?.detail || err?.title || 'No se pudo borrar el pedido.');
      }
    } catch {
      showError('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setHiding(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <button
        className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Pedido</span>
            <span className="text-sm font-bold text-foreground">#{order.id}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Order status */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${orderStatusCfg.bg} ${orderStatusCfg.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {orderStatusCfg.label}
            </span>
            {/* Payment status */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${paymentStatusCfg.bg} ${paymentStatusCfg.color}`}>
              {order.paymentStatus === 'aprobado'
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <AlertCircle className="w-3.5 h-3.5" />
              }
              {paymentStatusCfg.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{formatARS(order.total)}</p>
          </div>
          {expanded
            ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-secondary/20 px-5 py-6 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Artículos del pedido
            </h4>
            <div className="bg-background rounded-xl border border-border/60 p-2 shadow-sm">
              <div className="space-y-1">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">
                        {item.quantity}x
                      </div>
                      <div>
                        <span className="font-medium text-foreground block">{item.productName}</span>
                        {item.gramageGrams && (
                          <span className="text-xs text-muted-foreground">{item.gramageGrams}g</span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-foreground whitespace-nowrap ml-4">
                      {formatARS(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment method */}
            <div className="bg-background rounded-xl border border-border/60 p-4 shadow-sm flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                {order.paymentMethod === 'mercado_pago'
                  ? <Smartphone className="w-4 h-4" />
                  : order.paymentMethod === 'transferencia'
                    ? <CreditCard className="w-4 h-4" />
                    : <Banknote className="w-4 h-4" />
                }
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Método de pago</p>
                <p className="text-sm font-medium text-foreground">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </p>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-background rounded-xl border border-border/60 p-4 shadow-sm flex items-start gap-3">
              <div className="mt-0.5 p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {order.shippingAddress ? 'Dirección de envío' : 'Modalidad'}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {order.shippingAddress ?? 'Retiro en el local'}
                </p>
                {order.shippingCost > 0 && (
                  <p className="text-xs font-medium text-muted-foreground mt-1">Costo de envío: {formatARS(order.shippingCost)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.orderInformation && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <span className="font-semibold text-blue-900 block mb-1">Notas del pedido</span>
                <span className="text-blue-800">{order.orderInformation}</span>
              </div>
            </div>
          )}

          {/* Cancelled at */}
          {order.cancelledAt && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-sm flex gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <span className="font-semibold text-red-900 block mb-1">Pedido cancelado</span>
                <span className="text-red-800">
                  Cancelado el {new Date(order.cancelledAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap sm:justify-end gap-3 pt-2">
            {canGeneratePaymentLink && (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm transition-all active:scale-95"
              >
                {generatingLink
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Smartphone className="w-4 h-4" />
                }
                Reintentar Pago
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-background text-red-600 border border-red-200 shadow-sm text-sm font-semibold hover:bg-red-50 disabled:opacity-60 transition-all active:scale-95"
              >
                {cancelling
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <X className="w-4 h-4" />
                }
                Cancelar pedido
              </button>
            )}
            {order.orderStatus === 'cancelado' && (
              <button
                onClick={handleHide}
                disabled={hiding}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-background text-red-600 border border-red-200 shadow-sm text-sm font-semibold hover:bg-red-50 disabled:opacity-60 transition-all active:scale-95"
              >
                {hiding
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
                Borrar historial
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { isClientAuthenticated, clientUser, logoutClient } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ReturnType<typeof mapOrder>[]>([]);
  const [loading, setLoading] = useState(true);

  const userToken = clientUser?.token ?? localStorage.getItem('userToken');

  useEffect(() => {
    document.title = 'El Molino - Mis Pedidos';

    if (!isClientAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders/my`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (res.status === 401) {
          // Token expired or invalid
          logoutClient();
          navigate('/', { replace: true });
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data.map(mapOrder) : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isClientAuthenticated, navigate, userToken, logoutClient]);

  const handleOrderCancelled = (id: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, orderStatus: 'cancelado', cancelledAt: new Date().toISOString() } : o
    ));
  };

  const handleOrderHidden = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis pedidos</h1>
            {clientUser?.nombre && (
              <p className="text-sm text-muted-foreground">
                {clientUser.nombre} {clientUser.apellido}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando tus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-1">Todavía no tenés pedidos</p>
              <p className="text-sm text-muted-foreground">Cuando realices una compra, aparecerá acá.</p>
            </div>
            <Link
              to="/"
              className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            </p>
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                userToken={userToken!}
                onOrderCancelled={handleOrderCancelled}
                onOrderHidden={handleOrderHidden}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
