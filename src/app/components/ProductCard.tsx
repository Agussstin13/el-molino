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
        className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-3 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20"
        onClick={() => navigate(`/producto/${product.id}`)}
        id={`product-card-${product.id}`}
      >
        {/* Imagen */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-secondary/30 rounded-xl overflow-hidden">
          <img
            src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {hasOffer && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
              -{discountPct}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-normal text-foreground truncate mb-1">
            {product.name}
          </p>
          <div className="flex flex-col mb-1">
            {hasOffer && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-muted-foreground/70 text-[12px] line-through font-medium">{formatARS(product.price)}</span>
                <span className="text-[10px] bg-destructive text-white font-bold px-1.5 py-0.5 rounded-sm tracking-wide">
                  {discountPct}% OFF
                </span>
              </div>
            )}
            <span className="text-black font-black text-xl">{formatARS(effectivePrice)}</span>
          </div>
          <div className="mt-0.5">
            {isWholesale ? (
              <p className="text-[10px] text-amber-600/90 font-medium">✓ Precio mayorista activo</p>
            ) : product.wholesalePrice && !isGramProduct ? (
              <p className="text-[10px] text-amber-600/90 font-medium">Venta mayorista a partir de {product.wholesalePrice.quantity} u.</p>
            ) : isGramProduct ? (
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                ⚖️ Se vende por peso
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                📦 Se vende por unidad
              </p>
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

        {/* Botón List View */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore && product.stock > 0}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 active:scale-95 ${
            !isGramProduct && !canAddMore && product.stock > 0
              ? 'bg-muted/50 text-muted-foreground border border-border/50 cursor-not-allowed'
              : justAdded
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20'
          }`}
        >
          {!isGramProduct && <ShoppingCart className="w-3.5 h-3.5" />}
          {isGramProduct 
            ? 'Ver opciones' 
            : !canAddMore && product.stock > 0
              ? 'Max stock'
              : justAdded ? 'Listo ✓' : 'Agregar'}
        </button>
      </div>
    );
  }

  /* ─────────────────────────── VISTA GRID ──────────────────────────────── */
  return (
    <div
      className="relative bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm cursor-pointer flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
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
          className="relative z-0 w-full h-full object-cover"
        />

        {/* Badge descuento (movido al precio) */}
      </div>

      {/* ── Separador decorativo ────────────────────────────────────────────── */}
      <div className="h-px bg-border/40 mx-4" />

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-1">

        {/* Nombre */}
        <h3 className="text-[14px] font-normal text-foreground truncate mb-1">
          {product.name}
        </h3>

        {/* Precio y Mayorista agrupados */}
        <div className="flex flex-col">
          {hasOffer && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[13px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
                {formatARS(product.price)}
              </span>
              <span className="text-[11px] bg-destructive text-white font-bold px-1.5 py-0.5 rounded-sm leading-none tracking-wide">
                {discountPct}% OFF
              </span>
            </div>
          )}
          <span className="text-2xl font-black text-black leading-none">{formatARS(effectivePrice)}</span>
          
          <div className="flex flex-col mt-0.5">
            {isWholesale ? (
              <span className="text-[10px] text-amber-600 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded-sm self-start">
                Precio mayorista activo
              </span>
            ) : product.wholesalePrice && !isGramProduct ? (
              <span className="text-[11px] text-amber-600/90 font-medium">
                Venta mayorista a partir de {product.wholesalePrice.quantity} u.
              </span>
            ) : isGramProduct ? (
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                ⚖️ Se vende por peso
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                📦 Se vende por unidad
              </span>
            )}
          </div>
        </div>

        {/* Stock bajo (oculto si no aplica para reducir padding muerto) */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="mt-1">
            <span className="text-[10px] text-amber-600 font-medium">⚡ Solo {product.stock} disponibles</span>
          </div>
        )}

        {/* Botón Grid View */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore && product.stock > 0}
          className={`mt-2.5 w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] ${
            !isGramProduct && !canAddMore && product.stock > 0
              ? 'bg-muted/50 text-muted-foreground border border-border/50 cursor-not-allowed'
              : justAdded
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-md'
          }`}
        >
          {!isGramProduct && <ShoppingCart className="w-4 h-4" />}
          {isGramProduct
            ? 'Ver opciones'
            : !canAddMore && product.stock > 0
              ? 'Stock máximo'
              : justAdded ? '¡Agregado! ✓' : 'Agregar al carrito'}
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
