import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/lib/types';
import { formatARS, getEffectivePrice, isWholesaleActive } from '@/lib/price';
import { useCart } from '../context/CartContext';

export type { Product };

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const effectivePrice = getEffectivePrice(product, quantity);
  const wholesale = isWholesaleActive(product, quantity);
  const isDiscounted = !!product.discount && !wholesale;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    setQuantity(1);
  };

  const handleQtyChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setQuantity(q => Math.max(1, q + delta));
  };

  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/producto/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.discount && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
            -{product.discount}%
          </div>
        )}
        {wholesale && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
            Mayorista
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="text-sm mb-2 line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.name}
        </h3>

        {/* Precios */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-primary">
              {formatARS(effectivePrice)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-muted-foreground line-through">
                {formatARS(product.price)}
              </span>
            )}
          </div>
          {product.wholesalePrice && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="text-accent font-medium">
                {formatARS(product.wholesalePrice.price)}
              </span>{' '}
              c/u llevando {product.wholesalePrice.quantity}+
            </p>
          )}
        </div>

        {/* Controles de cantidad + botón */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
            <button
              onClick={e => handleQtyChange(e, -1)}
              className="p-2 hover:bg-secondary transition-colors"
              aria-label="Reducir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 min-w-[2rem] text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={e => handleQtyChange(e, 1)}
              className="p-2 hover:bg-secondary transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
              justAdded
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {justAdded ? '¡Listo!' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
