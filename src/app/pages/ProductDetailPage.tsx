import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Minus, ShoppingCart, Heart, Home, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "../../lib/types";
import {
  formatARS,
  getEffectivePrice,
  isWholesaleActive,
} from "../../lib/price";
import { useCart } from "../context/CartContext";
import { Header } from "../components/Header";
import { Cart } from "../components/Cart";
import { Checkout } from "../components/Checkout";
import { Footer } from "../components/Footer";
const API_BASE = import.meta.env.VITE_API_BASE;
const imgUrl = (path: string) =>
  path ? (path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : '';

const RECENT_KEY = "el-molino-recently-viewed";

/* ─── Íconos SVG ─────────────────────────────────────────────────────────── */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function WhatsAppSvg({ large = false }: { large?: boolean }) {
  const cls = large ? "w-6 h-6" : "w-[18px] h-[18px]";
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.553 4.1 1.52 5.824L0 24l6.336-1.498A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.368l-.36-.214-3.726.88.936-3.622-.235-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}
function MailSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[18px] h-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/* ─── Tarjeta de producto pequeña ──────────────────────────────────────────── */

function SmallProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/producto/${product.id}`)}
      className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-left w-full"
    >
      <div className="relative aspect-square bg-secondary/20 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-muted-foreground">
            📦
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {product.name}
        </p>
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category}</p>
        )}
        {product.onOffer && product.offerPrice ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground/60 line-through">
              {formatARS(product.price)}
            </span>
            <span className="text-sm font-semibold text-accent">
              {formatARS(product.offerPrice)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-primary mt-1">
            {formatARS(product.price)}
          </p>
        )}
      </div>
    </button>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);
    setRelated([]);
    setQuantity(1);
    setAdded(false);

    fetch(`${API_BASE}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(async (p) => {
        const cur: Product = {
          id: p.id.toString(),
          name: p.name ?? p.nombre,
          price: p.price ?? p.precio,
          stock: p.stock,
          category: p.categoryName ?? p.description ?? "",
          categoryId: p.categoryId ?? p.categoriaId,
          image: imgUrl(p.imagePath ?? p.imageUrl ?? ''),
          onOffer: p.onOffer ?? false,
          offerPrice: p.offerPrice ?? null,
          discount: p.onOffer && p.offerPrice
            ? Math.round(((p.price - p.offerPrice) / p.price) * 100)
            : (p.discount ?? p.descuento ?? 0),
          wholesalePrice: p.wholesalePrice
            ? { quantity: p.wholesaleMinimumAmount ?? 10, price: p.wholesalePrice }
            : undefined,
        };
        setProduct(cur);

        // Relacionados y Vistos recientemente: misma categoría y validación de existencia
        const allRes = await fetch(`${API_BASE}/api/products`);
        if (!allRes.ok) return;
        const allData = await allRes.json();
        if (!Array.isArray(allData)) return;

        // Mapear los productos existentes en base de datos
        const activeDbProducts = allData.map((r: any) => ({
          id: r.id.toString(),
          name: r.name ?? r.nombre,
          price: r.price ?? r.precio,
          stock: r.stock,
          category: r.categoryName ?? r.description ?? "",
          categoryId: r.categoryId ?? r.categoriaId,
          image: imgUrl(r.imagePath ?? r.imageUrl ?? ''),
          onOffer: r.onOffer ?? false,
          offerPrice: r.offerPrice ?? null,
          discount: r.onOffer && r.offerPrice
            ? Math.round(((r.price - r.offerPrice) / r.price) * 100)
            : (r.discount ?? r.descuento ?? 0),
        }));

        setRelated(
          activeDbProducts
            .filter(
              (r: any) =>
                r.id.toString() !== id &&
                r.category === cur.category,
            )
            .slice(0, 4)
        );

        // Guardar en recientes y filtrar los que ya no existen en la base de datos
        try {
          const stored: Product[] = JSON.parse(
            localStorage.getItem(RECENT_KEY) || "[]",
          );
          // Crear un Set con los IDs existentes para búsqueda eficiente
          const activeIds = new Set(activeDbProducts.map(p => p.id));
          
          // Agregamos el producto actual y filtramos los previos que ya no existen en DB
          const next = [cur, ...stored.filter((r) => r.id !== cur.id && activeIds.has(r.id))].slice(
            0,
            8,
          );
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          setRecentlyViewed(next.filter((r) => r.id !== cur.id).slice(0, 4));
        } catch {
          /* noop */
        }
      })
      .catch((err) => console.error("Error fetching product:", err))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-4 w-64 bg-secondary rounded animate-pulse mb-6" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-secondary animate-pulse" />
              <div className="p-8 space-y-4">
                <div className="h-8 w-3/4 bg-secondary rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-secondary rounded animate-pulse" />
                <div className="h-10 w-1/3 bg-secondary rounded animate-pulse" />
                <div className="h-12 w-full bg-secondary rounded animate-pulse mt-6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">Producto no encontrado.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  /* ── Datos derivados ── */
  const effectivePrice = getEffectivePrice(product, quantity);
  const wholesale = isWholesaleActive(product, quantity);
  const isDiscounted = (product.onOffer || !!product.discount) && !wholesale;

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  // ⚠️ Reemplazá con el número real de WhatsApp (formato: código país + número, sin + ni espacios)
  const WA_NUMBER = "5491100000000";
  const waMsg = encodeURIComponent(
    `Hola! Me interesa el producto: *${product.name}* (${formatARS(effectivePrice)}). ¿Tienen stock?`,
  );
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(product.name);

  const shareLinks = [
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
      hover: "hover:text-[#1877F2]",
    },
    {
      label: "X",
      icon: <TwitterIcon />,
      href: `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageUrl}`,
      hover: "hover:text-foreground",
    },
    {
      label: "Pinterest",
      icon: <PinterestIcon />,
      href: `https://pinterest.com/pin/create/button/?url=${pageUrl}&description=${pageTitle}`,
      hover: "hover:text-[#E60023]",
    },
    {
      label: "LinkedIn",
      icon: <LinkedInIcon />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
      hover: "hover:text-[#0A66C2]",
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppSvg />,
      href: `https://wa.me/?text=${pageTitle}%20${pageUrl}`,
      hover: "hover:text-[#25D366]",
    },
    {
      label: "Email",
      icon: <MailSvg />,
      href: `mailto:?subject=${pageTitle}&body=${pageUrl}`,
      hover: "hover:text-primary",
    },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#4a7c59] mb-6 flex-wrap tracking-wide">
          <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <Home className="w-4 h-4 stroke-[1.75]" />
          </Link>
          <span className="text-border">/</span>
          <Link to="/" className="hover:text-primary transition-colors uppercase font-medium">
            TIENDA
          </Link>
          {product.category && (
            <>
              <span className="text-border">/</span>
              <Link
                to={`/?categoria=${product.categoryId}`}
                className="hover:text-primary transition-colors font-medium"
              >
                {product.category}
              </Link>
            </>
          )}
          <span className="text-border">/</span>
          <span className="text-[#333d36] font-bold">{product.name}</span>
        </nav>

        {/* ── Bloque principal ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="grid md:grid-cols-2">

            {/* ── Columna imagen ── */}
            <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-border">

              {/* Badges fuera de la imagen, en la parte superior del panel */}
              <div className="flex items-center gap-2 px-5 pt-5 pb-0 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                  NUEVO
                </span>
                {product.onOffer && product.offerPrice && (
                  <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                    -{Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                    Últimas {product.stock} unidades
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] font-semibold px-3 py-1 rounded-full border border-border">
                    Sin stock
                  </span>
                )}
              </div>

              {/* Contenedor imagen */}
              <div className="relative flex items-center justify-center p-8 flex-1 min-h-[340px] bg-secondary/10 overflow-hidden mx-5 my-4 rounded-2xl">
                {/* Ghost background blur */}
                {product.image && (
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-[0.07] blur-2xl scale-110 pointer-events-none"
                    style={{ backgroundImage: `url('${product.image}')` }}
                  />
                )}

                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="relative z-10 w-full max-w-[300px] aspect-square object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="text-8xl text-muted-foreground">📦</div>
                )}
              </div>

              {/* Compartir + Favorito */}
              <div className="flex flex-col items-center gap-3 px-5 pb-6">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Share2 className="w-3.5 h-3.5" /> Compartir:
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  {shareLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.label}
                      className={`text-muted-foreground transition-colors ${link.hover}`}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Columna info ── */}
            <div className="p-8 flex flex-col gap-5">
              {/* Nombre + Favorito */}
              <div className="flex items-start gap-3">
                <h1
                  className="flex-1 text-2xl md:text-3xl text-foreground leading-tight"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {product.name}
                </h1>
                <button
                  onClick={() => setFavorited((v) => !v)}
                  id="detail-favorite-btn"
                  className="flex-shrink-0 mt-1 p-2.5 rounded-full border border-border hover:bg-secondary transition-all shadow-sm"
                  title={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${favorited ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                  />
                </button>
              </div>

              <hr className="border-border" />

              {/* Categoría */}
              {product.category && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-muted-foreground">🏷 Categoría:</span>
                  <Link
                    to={`/?categoria=${product.categoryId}`}
                    className="text-primary font-medium uppercase text-xs tracking-wide bg-primary/10 px-2.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {product.category}
                  </Link>
                </div>
              )}

              {/* Precio */}
              <div className="flex flex-col gap-1">
                {isDiscounted && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatARS(product.price)}
                  </span>
                )}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className={`text-3xl font-bold ${isDiscounted ? "text-red-500" : "text-primary"}`}>
                    {formatARS(effectivePrice)}
                  </span>
                  {isDiscounted && (
                    <span className="text-sm bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                      -{product.discount}% OFF
                    </span>
                  )}
                  {wholesale && (
                    <span className="text-sm bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                      Precio mayorista
                    </span>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              )}

              <hr className="border-border" />

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                id="detail-whatsapp-btn"
                className="inline-flex items-center gap-3 self-start bg-[#25D366] hover:bg-[#20ba58] text-white px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <WhatsAppSvg large />
                Consultar por WhatsApp
              </a>

              <hr className="border-border" />

              {/* Cantidad */}
              {product.stock > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center border-2 border-border rounded-xl overflow-hidden bg-background">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      id="detail-qty-minus"
                      className="px-3 py-2.5 hover:bg-secondary transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 min-w-[3rem] text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      id="detail-qty-plus"
                      className="px-3 py-2.5 hover:bg-secondary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {product.wholesalePrice && quantity < product.wholesalePrice.quantity && (
                    <span className="text-xs text-muted-foreground">
                      ({product.wholesalePrice.quantity - quantity} más para precio mayorista)
                    </span>
                  )}
                </div>
              )}

              {/* Botón agregar */}
              <button
                onClick={handleAdd}
                disabled={product.stock === 0}
                id="detail-add-to-cart"
                className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium transition-all shadow-md text-base ${
                  product.stock === 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : added
                      ? "bg-emerald-500 text-white scale-[0.98]"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0
                  ? "Sin stock"
                  : added
                    ? "¡Agregado al carrito! ✓"
                    : "Agregar al carrito"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Productos relacionados ── */}
        {related.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Productos relacionados</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <SmallProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Vistos recientemente ── */}
        {recentlyViewed.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Vistos recientemente</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentlyViewed.map((p) => (
                <SmallProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <Cart />
      <Checkout />
    </div>
  );
}
