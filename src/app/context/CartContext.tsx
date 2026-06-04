import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../../lib/types';
import {
  getEffectivePrice,
  isWholesaleActive,
  SHIPPING_COST,
  type ShippingRate,
} from '../../lib/price';

const API_BASE = import.meta.env.VITE_API_BASE;

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  cartCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  shippingRates: ShippingRate[];
  freeShippingThreshold: number;
  addToCart: (product: Product, quantity: number, selectedGramage?: any) => void;
  updateQuantity: (id: string, quantity: number, selectedGramageId?: number) => void;
  removeItem: (id: string, selectedGramageId?: number) => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  clearCart: () => void;
  isWholesaleForItem: (item: CartItem) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'el-molino-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error loading cart from local storage", e);
      return [];
    }
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(5000);

  // Cargar tarifas de envío desde el backend al iniciar
  useEffect(() => {
    const loadShippingConfig = async () => {
      try {
        const [ratesRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/api/shipping`),
          fetch(`${API_BASE}/api/shipping/config`),
        ]);
        if (ratesRes.ok) {
          const data: ShippingRate[] = await ratesRes.json();
          setShippingRates(data);
        }
        if (configRes.ok) {
          const config = await configRes.json();
          setFreeShippingThreshold(config.umbralEnvioGratis ?? 5000);
        }
      } catch (e) {
        console.error("Error loading shipping config:", e);
      }
    };
    loadShippingConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const addToCart = (product: Product, quantity: number, selectedGramage?: any) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedGramage?.id === selectedGramage?.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.selectedGramage?.id === selectedGramage?.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedGramage }];
    });
  };

  const updateQuantity = (id: string, quantity: number, selectedGramageId?: number) => {
    if (quantity <= 0) {
      removeItem(id, selectedGramageId);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id && item.selectedGramage?.id === selectedGramageId ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string, selectedGramageId?: number) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.selectedGramage?.id === selectedGramageId)));
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + getEffectivePrice(item, item.quantity) * item.quantity,
    0
  );

  // El costo base de envío usa el primer tramo (distancia mínima) como fallback en el carrito.
  // El costo real se calcula en el Checkout una vez que el cliente ingresa su dirección.
  const shipping =
    subtotal === 0 ? 0
    : subtotal >= freeShippingThreshold ? 0
    : shippingRates.length > 0
      ? shippingRates.filter(r => r.activo).sort((a, b) => a.desdeKm - b.desdeKm)[0]?.precio ?? SHIPPING_COST
      : SHIPPING_COST;

  const total = subtotal + shipping;

  const isWholesaleForItem = (item: CartItem) =>
    isWholesaleActive(item, item.quantity);

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        isCheckoutOpen,
        cartCount,
        subtotal,
        shipping,
        total,
        shippingRates,
        freeShippingThreshold,
        addToCart,
        updateQuantity,
        removeItem,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        openCheckout: () => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        },
        closeCheckout: () => setIsCheckoutOpen(false),
        clearCart,
        isWholesaleForItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
