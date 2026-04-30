import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatARS, getEffectivePrice, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/price';

export function Cart() {
  const {
    items,
    isCartOpen,
    closeCart,
    openCheckout,
    updateQuantity,
    removeItem,
    subtotal,
    shipping,
    total,
    isWholesaleForItem,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeCart} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 style={{ fontFamily: 'Georgia, serif' }}>
              Carrito ({items.length} {items.length === 1 ? 'producto' : 'productos'})
            </h2>
          </div>
          <button
            id="cart-close"
            onClick={closeCart}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">Tu carrito está vacío</p>
              <button
                onClick={closeCart}
                className="text-primary hover:underline text-sm"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const unitPrice = getEffectivePrice(item, item.quantity);
                const wholesale = isWholesaleForItem(item);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-1">{item.name}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm text-primary font-semibold">
                          {formatARS(unitPrice)}
                        </span>
                        {wholesale && (
                          <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                            Mayorista
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-sm min-w-[1.75rem] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {formatARS(unitPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t-2 border-border p-4 space-y-4 bg-secondary/20">
            {/* Barra de progreso envío gratis */}
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Envío gratis a partir de {formatARS(FREE_SHIPPING_THRESHOLD)}</span>
                  <span>{formatARS(FREE_SHIPPING_THRESHOLD - subtotal)} restante</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span className={shipping === 0 ? 'text-accent font-medium' : ''}>
                  {shipping === 0 ? '¡Gratis!' : formatARS(SHIPPING_COST)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold">
                <span>Total</span>
                <span className="text-primary text-base">{formatARS(total)}</span>
              </div>
            </div>

            <button
              id="checkout-btn"
              onClick={openCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl transition-colors shadow-md font-medium"
            >
              Finalizar compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
