import { ShoppingCart, Tag } from 'lucide-react';
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
  const { addToCart, items } = useCart();
  const [quantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isWholesale = isWholesaleActive(product, quantity);
  const effectivePrice = getEffectivePrice(product, quantity);
  const hasOffer = product.onOffer && product.offerPrice;
  const discountPct = hasOffer
    ? Math.round(((product.price - product.offerPrice!) / product.price) * 100)
    : 0;

  const isGramProduct = product.measurementUnit === "gramo";

  const currentUsedInCart = items.filter(i => i.id === product.id).reduce((acc, i) => {
    if (i.measurementUnit === 'gramo' && i.selectedGramage) return acc + (i.quantity * i.selectedGramage.grams);
    return acc + i.quantity;
  }, 0);

  const canAddMore = product.stock > currentUsedInCart;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGramProduct) {
      navigate(`/producto/${product.id}`);
      return;
    }
    if (!canAddMore) return;
    
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const isList = viewMode === 'list';

  /* ─────────────────────────── VISTA LISTA ─────────────────────────────── */
  if (isList) {
    return (
      <div
        className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-3 transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/producto/${product.id}`)}
        id={`product-card-${product.id}`}
      >
        {/* Imagen */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-secondary/30 rounded-xl overflow-hidden">
          <img
            src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
          {hasOffer && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
              -{discountPct}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-1">
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
          {product.category && (
            <span className="inline-block mt-1 text-[10px] bg-secondary/60 text-secondary-foreground px-1.5 py-0.5 rounded-full font-medium">
              {product.category}
            </span>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore && product.stock > 0}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
            !isGramProduct && !canAddMore && product.stock > 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 hover:border-primary'
          }`}
        >
          {!isGramProduct && <ShoppingCart className="w-3.5 h-3.5" />}
          {isGramProduct 
            ? 'Ver opciones' 
            : !canAddMore && product.stock > 0
              ? 'Max stock'
              : justAdded ? '✓ Listo' : 'Agregar'}
        </button>
      </div>
    );
  }

  /* ─────────────────────────── VISTA GRID ──────────────────────────────── */
  return (
    <div
      className="relative bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm cursor-pointer flex flex-col"
      onClick={() => navigate(`/producto/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      {/* ── Imagen ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-square bg-secondary/20 overflow-hidden">
        {/* Fondo fantasma */}
        {product.image && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-10 blur-xl scale-110 pointer-events-none"
            style={{ backgroundImage: `url('${product.image}')` }}
          />
        )}

        <img
          src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
          alt={product.name}
          className="relative z-0 w-full h-full object-contain p-3"
        />

        {/* Badge descuento */}
        {hasOffer && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
            <Tag size={9} strokeWidth={2.5} />
            {discountPct}% OFF
          </div>
        )}

        {/* Badge mayorista */}
        {product.wholesalePrice && !hasOffer && (
          <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
            Mayorista
          </div>
        )}
      </div>

      {/* ── Separador decorativo ────────────────────────────────────────────── */}
      <div className="h-px bg-border/40 mx-4" />

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-2">

        {/* Categoría */}
        {product.category && (
          <span className="self-start text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}

        {/* Nombre */}
        <h3 className="text-[13px] font-bold text-foreground line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Precio */}
        <div className="flex items-baseline gap-2 mt-0.5">
          {hasOffer ? (
            <>
              <span className="text-lg font-bold text-red-500 leading-none">{formatARS(effectivePrice)}</span>
              <span className="text-[11px] text-muted-foreground/60 line-through leading-none">{formatARS(product.price)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary leading-none">{formatARS(effectivePrice)}</span>
          )}
        </div>

        {/* Info extra: mayorista activo / stock bajo */}
        <div className="flex flex-col gap-0.5 min-h-[1rem]">
          {isWholesale && (
            <span className="text-[10px] text-amber-600 font-medium">Precio mayorista activo</span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] text-amber-600 font-medium">⚡ Solo {product.stock} disponibles</span>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore && product.stock > 0}
          className={`mt-auto w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] ${
            !isGramProduct && !canAddMore && product.stock > 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : justAdded
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-md'
          }`}
        >
          {!isGramProduct && <ShoppingCart className="w-3.5 h-3.5" />}
          {isGramProduct
            ? 'Ver opciones'
            : !canAddMore && product.stock > 0
              ? 'Stock máximo en carrito'
              : justAdded ? '¡Agregado! ✓' : 'Añadir al carrito'}
        </button>
      </div>

      {/* Sin stock overlay */}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-3xl z-20">
          <span className="bg-foreground text-background text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Agotado
          </span>
        </div>
      )}
    </div>
  );
}
