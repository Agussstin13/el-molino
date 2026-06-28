import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../../lib/types';
import {
  getEffectivePrice,
  getEffectiveGramagePrice,
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

  // Sincronizar carrito con el backend al iniciar para actualizar precios y stock
  useEffect(() => {
    const syncCart = async () => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (!stored) return;
        const parsedItems = JSON.parse(stored) as CartItem[];
        if (parsedItems.length === 0) return;

        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) return;
        const allData = await res.json();

        const activeDbProducts = new Map<string, any>(allData.map((r: any) => [
          r.id.toString(),
          {
            stock: r.stock,
            price: r.price ?? r.precio,
            offerPrice: r.offerPrice ?? null,
            discount: r.offerPrice != null && (r.price ?? r.precio)
              ? Math.round((((r.price ?? r.precio) - r.offerPrice) / (r.price ?? r.precio)) * 100)
              : (r.discount ?? r.descuento ?? 0),
            wholesalePrice: r.wholesalePrice
              ? { quantity: r.minimumWholesaleAmount ?? 10, price: r.wholesalePrice }
              : undefined,
            active: r.active ?? true,
            gramages: Array.isArray(r.gramages) ? r.gramages : [],
          }
        ]));

        setItems(prevItems => {
          let hasChanges = false;
          const usedStockMap = new Map<string, number>();

          const newItems = prevItems.map(item => {
            const dbData = activeDbProducts.get(item.id);
            if (!dbData || !dbData.active) {
              hasChanges = true;
              return null; // Producto ya no existe o está inactivo
            }

            let updatedItem = {
              ...item,
              stock: dbData.stock,
              price: dbData.price,
              offerPrice: dbData.offerPrice,
              discount: dbData.discount,
              wholesalePrice: dbData.wholesalePrice,
              gramages: dbData.gramages,
            };

            if (updatedItem.selectedGramage) {
              const updatedGramage = dbData.gramages.find((g: any) => g.id === updatedItem.selectedGramage?.id);
              if (updatedGramage) {
                updatedItem.selectedGramage = updatedGramage;
              }
            }

            const requiredGrams = updatedItem.measurementUnit === 'gramo' && updatedItem.selectedGramage
              ? updatedItem.selectedGramage.grams
              : 1;

            const alreadyUsed = usedStockMap.get(updatedItem.id) || 0;
            const remainingStock = updatedItem.stock - alreadyUsed;

            const maxAllowedForThisItem = Math.floor(remainingStock / requiredGrams);

            if (updatedItem.quantity > maxAllowedForThisItem) {
              updatedItem.quantity = Math.max(0, maxAllowedForThisItem);
              hasChanges = true;
            }

            if (
              item.stock !== updatedItem.stock ||
              item.price !== updatedItem.price ||
              item.offerPrice !== updatedItem.offerPrice ||
              item.discount !== updatedItem.discount ||
              JSON.stringify(item.wholesalePrice) !== JSON.stringify(updatedItem.wholesalePrice) ||
              JSON.stringify(item.gramages) !== JSON.stringify(updatedItem.gramages) ||
              JSON.stringify(item.selectedGramage) !== JSON.stringify(updatedItem.selectedGramage)
            ) {
              hasChanges = true;
            }

            if (updatedItem.quantity > 0) {
              usedStockMap.set(updatedItem.id, alreadyUsed + (updatedItem.quantity * requiredGrams));
              return updatedItem;
            }

            hasChanges = true;
            return null;
          }).filter(Boolean) as CartItem[];

          return hasChanges ? newItems : prevItems;
        });
      } catch (err) {
        console.error("Error al sincronizar el carrito:", err);
      }
    };

    syncCart();
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

  const getTotalForWholesale = (targetItem: CartItem, cartItems: CartItem[]) => {
    return cartItems
      .filter(item => item.id === targetItem.id)
      .reduce((acc, item) => {
        if (item.measurementUnit === 'gramo' && item.selectedGramage) {
          return acc + item.quantity * item.selectedGramage.grams;
        }

        return acc + item.quantity;
      }, 0);
  };

  const getCartItemUnitPrice = (item: CartItem, cartItems: CartItem[]) => {
    const totalForWholesale = getTotalForWholesale(item, cartItems);
    const wholesale = isWholesaleActive(item, totalForWholesale);

    if (item.measurementUnit === 'gramo' && item.selectedGramage) {
      if (wholesale && item.wholesalePrice) {
        return item.wholesalePrice.price * (item.selectedGramage.grams / 1000);
      }

      return getEffectiveGramagePrice(item.selectedGramage);
    }

    return getEffectivePrice(item, totalForWholesale);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item, items) * item.quantity,
    0
  );

  // El costo base de envío usa el primer tramo (distancia mínima) como fallback en el carrito.
  // El costo real se calcula en el Checkout una vez que el cliente ingresa su dirección.
  const shipping =
    subtotal === 0 ? 0
      : subtotal >= freeShippingThreshold ? 0
        : shippingRates.length > 0
          ? shippingRates.filter(r => r.activo).sort((a, b) => a.hastaKm - b.hastaKm)[0]?.precio ?? SHIPPING_COST
          : SHIPPING_COST;

  const total = subtotal + shipping;

  const isWholesaleForItem = (item: CartItem) =>
    isWholesaleActive(item, getTotalForWholesale(item, items));

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
