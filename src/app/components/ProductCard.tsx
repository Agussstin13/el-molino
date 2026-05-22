import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../lib/types';
import { formatARS, getEffectivePrice, isWholesaleActive } from '../../lib/price';
import { useCart } from '../context/CartContext';

export type { Product };

interface ProductCardProps {
  product: Product;
  viewMode?: 'list' | 'grid-sm' | 'grid-lg';
}

export function ProductCard({ product, viewMode = 'grid-sm' }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isWholesale = isWholesaleActive(product, quantity);
  const effectivePrice = getEffectivePrice(product, quantity);
  const hasOffer = product.onOffer && product.offerPrice;
  const discountPct = hasOffer
    ? Math.round(((product.price - product.offerPrice!) / product.price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const isList = viewMode === 'list';

  if (isList) {
    return (
      <div
        className="group flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-3 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/producto/${product.id}`)}
        id={`product-card-${product.id}`}
      >
        {/* Imagen */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-secondary/30 rounded-xl overflow-hidden">
          <img
            src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
          {hasOffer && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
              -{discountPct}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1">
            {product.name}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-bold text-base">{formatARS(effectivePrice)}</span>
            {hasOffer && (
              <span className="text-muted-foreground/50 text-xs line-through">{formatARS(product.price)}</span>
            )}
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-[10px] text-amber-600 mt-0.5">⚡ Últimas {product.stock} unidades</p>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          className="flex-shrink-0 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 hover:border-primary px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {justAdded ? '✓ Listo' : 'Agregar'}
        </button>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => navigate(`/producto/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      {/* Badges — sobre la imagen, nunca tapados */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        {/* Badge izquierda: NUEVO */}
        <span className="inline-flex items-center bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          NUEVO
        </span>

        {/* Badge derecha: % OFF */}
        {hasOffer && (
          <span className="inline-flex items-center bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Imagen */}
      <div className="relative bg-secondary/20 aspect-square overflow-hidden">
        {/* Ghost blur background */}
        {product.image && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-10 blur-xl scale-110"
            style={{ backgroundImage: `url('${product.image}')` }}
          />
        )}
        <img
          src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
          alt={product.name}
          className="relative z-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
        {/* Overlay sutil al hover */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Nombre */}
        <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Precio */}
        <div className="flex flex-col gap-0.5">
          {hasOffer ? (
            <>
              <span className="text-muted-foreground/50 text-[11px] line-through leading-none">
                {formatARS(product.price)}
              </span>
              <span className="text-red-500 font-bold text-lg leading-tight">
                {formatARS(product.offerPrice!)}
              </span>
            </>
          ) : (
            <span className="text-primary font-bold text-lg leading-tight">
              {formatARS(effectivePrice)}
            </span>
          )}
          {isWholesale && (
            <span className="text-[10px] text-amber-600 font-medium">Precio mayorista activo</span>
          )}
        </div>

        {/* Stock low warning */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit font-medium">
            ⚡ Últimas {product.stock} unidades
          </p>
        )}

        {/* Botón */}
        <button
          onClick={handleAdd}
          className={`mt-auto w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm active:scale-[0.97] ${
            justAdded
              ? 'bg-emerald-500 text-white border border-emerald-400'
              : 'bg-white border border-primary/40 text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-md'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {justAdded ? '¡Agregado! ✓' : 'Añadir al carrito'}
        </button>
      </div>

      {/* Sin stock overlay */}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
          <span className="bg-muted text-muted-foreground text-xs font-semibold px-4 py-2 rounded-full border border-border">
            Sin stock
          </span>
        </div>
      )}
    </div>
  );
}
