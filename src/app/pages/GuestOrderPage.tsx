import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAlert } from '../context/AlertContext';
import { formatARS } from '../../lib/price';
import {
  Package, Clock, CheckCircle2, Truck, XCircle, AlertCircle,
  RefreshCw, X, MapPin, Smartphone, CreditCard, Banknote,
  ShoppingBag, ArrowLeft, Trash2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pendiente:      { label: 'Pendiente',       color: 'text-amber-600',  bg: 'bg-amber-100',  icon: Clock },
  en_preparacion: { label: 'En preparación',  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: RefreshCw },
  enviado:        { label: 'Enviado',          color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Truck },
  entregado:      { label: 'Entregado',        color: 'text-green-600',  bg: 'bg-green-100',  icon: CheckCircle2 },
  cancelado:      { label: 'Cancelado',        color: 'text-red-500',    bg: 'bg-red-100',    icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aprobado:   { label: 'Pagado',     color: 'text-green-700', bg: 'bg-green-100' },
  pendiente:  { label: 'No pagado',  color: 'text-amber-700', bg: 'bg-amber-100' },
  rechazado:  { label: 'Rechazado',  color: 'text-red-600',   bg: 'bg-red-100' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercado_pago:  'Mercado Pago',
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
};

export function GuestOrderPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showConfirm, showError, showSuccess } = useAlert();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    document.title = 'El Molino - Mi Pedido';
    if (!token) { setNotFound(true); setLoading(false); return; }

    fetch(`${API_BASE}/api/orders/token/${token}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => { if (data) setOrder(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 gap-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
            <Package className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Pedido no encontrado</h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              El link que usaste no es válido o ya expiró. Revisá el email de confirmación.
            </p>
          </div>
          <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            Volver a la tienda
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const orderStatusCfg = ORDER_STATUS_CONFIG[order.orderStatus] ?? ORDER_STATUS_CONFIG.pendiente;
  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] ?? PAYMENT_STATUS_CONFIG.pendiente;
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
          const res = await fetch(`${API_BASE}/api/orders/${order.id}/cancel?token=${token}`, {
            method: 'PATCH',
          });
          if (res.ok) {
            showSuccess('Pedido cancelado', 'Tu pedido fue cancelado correctamente.');
            setOrder({ ...order, orderStatus: 'cancelado', cancelledAt: new Date().toISOString() });
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
      const res = await fetch(`${API_BASE}/api/orders/${order.id}/payment-link?token=${token}`, {
        method: 'POST',
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
    if (!window.confirm('¿Seguro que deseas borrar este pedido? Ya no podrás acceder a él mediante este link.')) return;
    setHiding(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}/hide?token=${token}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        showSuccess('Eliminado', 'El pedido fue borrado exitosamente.');
        navigate('/', { replace: true });
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

  const items: any[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </button>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Tu pedido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pedido #{order.id} · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Status card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Estado del pedido</h2>

          {/* Status timeline */}
          <div className="flex items-center gap-2 flex-wrap">
            {['pendiente', 'en_preparacion', 'enviado', 'entregado'].map((step, idx) => {
              const stepCfg = ORDER_STATUS_CONFIG[step];
              const statuses = ['pendiente', 'en_preparacion', 'enviado', 'entregado', 'cancelado'];
              const currentIdx = statuses.indexOf(order.orderStatus);
              const stepIdx = statuses.indexOf(step);
              const isActive = currentIdx >= stepIdx && order.orderStatus !== 'cancelado';
              const isCurrent = order.orderStatus === step;
              const StepIcon = stepCfg.icon;

              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isCurrent
                      ? `${stepCfg.bg} ${stepCfg.color} ring-2 ring-current ring-offset-1`
                      : isActive
                        ? `${stepCfg.bg} ${stepCfg.color} opacity-80`
                        : 'bg-secondary text-muted-foreground'
                  }`}>
                    <StepIcon className="w-3.5 h-3.5" />
                    {stepCfg.label}
                  </div>
                  {idx < 3 && (
                    <div className={`hidden sm:block w-4 h-px ${isActive && currentIdx > stepIdx ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}

            {order.orderStatus === 'cancelado' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${ORDER_STATUS_CONFIG.cancelado.bg} ${ORDER_STATUS_CONFIG.cancelado.color}`}>
                <XCircle className="w-3.5 h-3.5" />
                Cancelado
              </span>
            )}
          </div>

          {/* Payment status */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-sm text-muted-foreground">Pago:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${paymentStatusCfg.bg} ${paymentStatusCfg.color}`}>
              {order.paymentStatus === 'aprobado'
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <AlertCircle className="w-3.5 h-3.5" />
              }
              {paymentStatusCfg.label}
            </span>
          </div>
        </div>

        {/* Products */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Productos
          </h2>
          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div className="text-sm">
                  <span className="font-medium text-foreground">{item.productName}</span>
                  {item.gramageGrams && (
                    <span className="text-muted-foreground ml-1">({item.gramageGrams}g)</span>
                  )}
                  <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatARS(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 space-y-1">
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Envío</span>
                <span>{formatARS(order.shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border">
              <span>Total</span>
              <span>{formatARS(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">Información de entrega</h2>

          <div className="flex items-center gap-2 text-sm">
            {order.paymentMethod === 'mercado_pago'
              ? <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
              : order.paymentMethod === 'transferencia'
                ? <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
                : <Banknote className="w-4 h-4 text-primary flex-shrink-0" />
            }
            <span className="text-muted-foreground">Método de pago:</span>
            <span className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground">
                {order.shippingAddress ? 'Dirección de envío: ' : 'Modalidad: '}
              </span>
              <span className="font-medium">{order.shippingAddress ?? 'Retiro en local'}</span>
            </div>
          </div>

          {order.orderInformation && (
            <div className="bg-secondary/40 rounded-xl p-3 text-sm">
              <span className="text-muted-foreground font-medium">Notas: </span>
              <span>{order.orderInformation}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(canGeneratePaymentLink || canCancel || order.orderStatus === 'cancelado') && (
          <div className="flex flex-col sm:flex-row gap-3">
            {canGeneratePaymentLink && (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm"
              >
                {generatingLink ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                Generar nuevo link de pago
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-60 transition-colors"
              >
                {cancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Cancelar pedido
              </button>
            )}
            {order.orderStatus === 'cancelado' && (
              <button
                onClick={handleHide}
                disabled={hiding}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-60 transition-colors"
              >
                {hiding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Borrar de mi historial
              </button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
