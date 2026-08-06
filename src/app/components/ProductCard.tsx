import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../../lib/types";
import { productPath } from "../../lib/seo";
import {
  formatARS,
  getEffectivePrice,
  getEffectiveGramagePrice,
  isWholesaleActive,
} from "../../lib/price";
import { useCart } from "../context/CartContext";

export type { Product };

interface ProductCardProps {
  product: Product;
  viewMode?: "list" | "grid-sm" | "grid-lg";
}

export function ProductCard({
  product,
  viewMode = "grid-sm",
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [quantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const detailPath = productPath(product);

  const isWholesale = isWholesaleActive(product, quantity);
  const effectivePrice = getEffectivePrice(product, quantity);
  const isGramProduct = product.measurementUnit === "gramo";
  const smallestGramage =
    isGramProduct && product.gramages && product.gramages.length > 0
      ? product.gramages.reduce(
        (smallest, gramage) =>
          gramage.grams < smallest.grams ? gramage : smallest,
      )
      : undefined;
  const displayPrice = smallestGramage
    ? getEffectiveGramagePrice(smallestGramage)
    : effectivePrice;
  const originalDisplayPrice = smallestGramage
    ? smallestGramage.price
    : product.price;
  const hasOffer = smallestGramage
    ? displayPrice < originalDisplayPrice
    : !isWholesale
    && product.onOffer === true
    && displayPrice < originalDisplayPrice;
  const discountPct = hasOffer
    ? Math.round(
      ((originalDisplayPrice - displayPrice) / originalDisplayPrice) * 100,
    )
    : 0;
  const displayPresentation = smallestGramage
    ? smallestGramage.grams >= 1000
      ? `${(smallestGramage.grams / 1000).toLocaleString("es-AR", {
        maximumFractionDigits: 2,
      })} kg`
      : `${smallestGramage.grams} g`
    : null;

  const currentUsedInCart = items
    .filter((i) => i.id === product.id)
    .reduce((acc, i) => {
      if (i.measurementUnit === "gramo" && i.selectedGramage)
        return acc + i.quantity * i.selectedGramage.grams;
      return acc + i.quantity;
    }, 0);

  const canAddMore = product.stock > currentUsedInCart;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGramProduct) {
      navigate(detailPath);
      return;
    }
    if (!canAddMore) return;

    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const isList = viewMode === "list";

  /* ─────────────────────────── VISTA LISTA ─────────────────────────────── */
  if (isList) {
    return (
      <div
        className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-3 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 h-[140px]"
        onClick={() => navigate(detailPath)}
        id={`product-card-${product.id}`}
      >
        {/* Imagen */}
        <Link
          to={detailPath}
          onClick={(event) => event.stopPropagation()}
          className="block relative w-[116px] h-[116px] flex-shrink-0 bg-secondary/30 rounded-xl overflow-hidden"
          aria-label={`Ver ${product.name}`}
        >
          {product.image && (
            <img
              src={product.image}
              alt={`${product.name} en El Molino`}
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
              className="w-full h-full object-cover"
            />
          )}
          {hasOffer && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-tight">
              -{discountPct}%
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 h-full py-1 justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground line-clamp-1 leading-tight">
              <Link
                to={detailPath}
                onClick={(event) => event.stopPropagation()}
                className="text-inherit"
              >
                {product.name}
              </Link>
            </h3>
          </div>

          <div className="flex flex-col">
            <div className="flex items-end gap-2 mb-0.5 min-h-[22px]">
              <span className="text-[22px] font-black text-black leading-none">
                {formatARS(displayPrice)}
              </span>
              {hasOffer ? (
                <div className="flex items-center gap-1.5 pb-0.5">
                  <span className="text-[11px] text-muted-foreground line-through font-medium">
                    {formatARS(originalDisplayPrice)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="min-h-[16px] flex items-end justify-between mt-1 gap-2 w-full">
              {/* Formato de Venta (Izquierda) y Stock */}
              <span className="text-[10px] text-muted-foreground font-medium flex items-center shrink-0">
                {displayPresentation
                  ? `Precio por ${displayPresentation}`
                  : isGramProduct
                    ? "Por peso"
                    : "Por unidad"}
                <span className="mx-1.5 text-border">•</span>
                Stock: {isGramProduct ? (product.stock >= 1000 ? `${(product.stock / 1000).toFixed(2).replace(/\.00$/, '')} kg` : `${product.stock} g`) : product.stock}
              </span>

              {/* Mayorista (Derecha) */}
              {product.wholesalePrice && (
                <div className="flex justify-end text-right min-w-0">
                  {isGramProduct ? (
                    <span className="text-[10px] text-amber-600/90 font-medium truncate">
                      Mayorista desde{" "}
                      {product.wholesalePrice.quantity >= 1000
                        ? `${product.wholesalePrice.quantity / 1000} kg.`
                        : `${product.wholesalePrice.quantity} gr.`}
                    </span>
                  ) : isWholesale ? (
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      ✓ Mayorista
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600/90 font-medium truncate">
                      Mayorista desde {product.wholesalePrice.quantity} u.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón List View */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 w-[140px] active:scale-95 ${!isGramProduct && !canAddMore
            ? "bg-muted/50 text-muted-foreground border border-border/50 cursor-not-allowed"
            : justAdded
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
            }`}
        >
          {!isGramProduct && <ShoppingCart className="w-3.5 h-3.5" />}
          {isGramProduct
            ? "Ver opciones"
            : product.stock === 0
              ? "Sin stock"
              : !canAddMore
                ? "Max stock"
                : justAdded
                  ? "Listo ✓"
                  : "Agregar"}
        </button>
      </div>
    );
  }

  /* ─────────────────────────── VISTA GRID ──────────────────────────────── */
  return (
    <div
      className="relative bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm cursor-pointer flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 h-full"
      onClick={() => navigate(detailPath)}
      id={`product-card-${product.id}`}
    >
      {/* ── Imagen ─────────────────────────────────────────────────────────── */}
      <Link
        to={detailPath}
        onClick={(event) => event.stopPropagation()}
        className="block relative w-full aspect-square bg-secondary/20 overflow-hidden flex-shrink-0"
        aria-label={`Ver ${product.name}`}
      >
        {/* Fondo fantasma */}
        {product.image && (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-10 blur-xl scale-110 pointer-events-none"
            style={{ backgroundImage: `url('${product.image}')` }}
          />
        )}

        {product.image && (
          <img
            src={product.image}
            alt={`${product.name} en El Molino`}
            loading="lazy"
            decoding="async"
            width="400"
            height="400"
            className="relative z-0 w-full h-full object-cover"
          />
        )}
      </Link>

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-4 pt-2.5 pb-4">
        {/* Separador */}
        <div className="w-full h-px bg-border/60 mb-2.5" />

        {/* Nombre */}
        <h3 className="text-[14px] font-semibold text-foreground line-clamp-2 leading-tight mb-2">
          <Link
            to={detailPath}
            onClick={(event) => event.stopPropagation()}
            className="text-inherit"
          >
            {product.name}
          </Link>
        </h3>

        {/* Precios y Tags (Flex grow para empujar hacia abajo) */}
        <div className="flex flex-col mt-auto">
          {/* Precio efectivo y Oferta en la misma línea */}
          <div className="flex items-end gap-2 mb-2 min-h-[26px]">
            <span className="text-[26px] font-black text-black leading-none">
              {formatARS(displayPrice)}
            </span>
            {hasOffer ? (
              <div className="flex items-center gap-1.5 pb-0.5">
                <span className="text-[12px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
                  {formatARS(originalDisplayPrice)}
                </span>
                <span className="text-[10px] bg-destructive text-white font-bold px-1.5 py-0.5 rounded-sm leading-none tracking-wide">
                  {discountPct}% OFF
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-medium mb-3">
            <span className="text-primary/80">
              {displayPresentation
                ? `Precio por ${displayPresentation}`
                : isGramProduct
                  ? "Por peso"
                  : "Por unidad"}
            </span>
            <span className="whitespace-nowrap">
              Stock: {isGramProduct ? (product.stock >= 1000 ? `${(product.stock / 1000).toFixed(2).replace(/\.00$/, '')} kg` : `${product.stock} g`) : `${product.stock} u.`}
            </span>
          </div>
        </div>

        {/* Botón Grid View */}
        <button
          onClick={handleAdd}
          disabled={!isGramProduct && !canAddMore}
          className={`mt-2 w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97] ${!isGramProduct && !canAddMore
            ? "bg-muted/50 text-muted-foreground border border-border/50 cursor-not-allowed"
            : justAdded
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
            }`}
        >
          {!isGramProduct && <ShoppingCart className="w-4 h-4" />}
          {isGramProduct
            ? "Ver opciones"
            : product.stock === 0
              ? "Sin stock"
              : !canAddMore
                ? "Stock máximo"
                : justAdded
                  ? "¡Agregado! ✓"
                  : "Agregar al carrito"}
        </button>
      </div>

      {/* Sin stock overlay */}
      {product.stock === 0 && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center z-20">
          <span className="bg-foreground text-background text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
            Agotado
          </span>
        </div>
      )}
    </div>
  );
}
