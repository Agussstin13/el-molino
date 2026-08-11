import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  Home,
  ChevronRight,
  Share2,
  Package,
} from "lucide-react";
import type { Product, ProductGramage } from "../../lib/types";
import {
  formatARS,
  getEffectivePrice,
  getEffectiveGramagePrice,
  isWholesaleActive,
} from "../../lib/price";
import { useCart } from "../context/CartContext";
import { Header } from "../components/Header";
import { Cart } from "../components/Cart";
import { Checkout } from "../components/Checkout";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { NoIndexSeo, Seo } from "../components/Seo";
import {
  absoluteUrl,
  categoryPath,
  compactDescription,
  productPath,
  SITE_URL,
} from "../../lib/seo";

const API_BASE = import.meta.env.VITE_API_BASE;
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER;
const imgUrl = (path: string) =>
  path
    ? path.startsWith("/")
      ? `${API_BASE}${path}`
      : `${API_BASE}/images/${path}`
    : "";

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
function WhatsAppSvg({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
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

/* ─── ShareButton: tooltip en position:fixed para escapar de cualquier overflow ─── */

interface ShareLink {
  label: string;
  icon: React.ReactNode;
  href: string;
  hover: string;
}

function ShareButton({
  shareLinks,
  show,
  onToggle,
  onClose,
}: {
  shareLinks: ShareLink[];
  show: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
    onToggle();
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={handleClick}
        onBlur={() => setTimeout(onClose, 150)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all bg-secondary/60 hover:bg-secondary border border-border/50 px-4 py-2 rounded-full"
        title="Compartir"
      >
        <Share2 className="w-4 h-4" />
        Compartir
      </button>

      {show && (
        <div
          className="fixed z-[9998] bg-card border border-border shadow-2xl rounded-2xl p-3.5 flex items-center gap-4 -translate-x-1/2"
          style={{ top: pos.top, left: pos.left }}
        >
          {shareLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              className={`text-muted-foreground transition-all hover:scale-110 ${link.hover}`}
              onClick={onClose}
            >
              {link.icon}
            </a>
          ))}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-t border-l border-border rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedGramage, setSelectedGramage] = useState<ProductGramage | null>(
    null,
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);
    setRelated([]);
    setQuantity(1);
    setAdded(false);
    window.scrollTo(0, 0);

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
          categories: Array.isArray(p.categories) ? p.categories : [],
          category:
            Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories
                .map((c: any) => c.name ?? c.nombre ?? "")
                .join(", ")
              : (p.categoryName ?? p.description ?? ""),
          categoryId:
            Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories[0].id
              : (p.categoryId ?? p.categoriaId),
          image: imgUrl(p.imagePath ?? p.imageUrl ?? ""),
          imagePath: p.imagePath ?? "",
          description: p.description ?? "",
          onOffer: p.offerPrice != null,
          offerPrice: p.offerPrice ?? null,
          discount:
            p.offerPrice != null && p.price
              ? Math.round(((p.price - p.offerPrice) / p.price) * 100)
              : (p.discount ?? p.descuento ?? 0),
          wholesalePrice: p.wholesalePrice
            ? {
              quantity: p.minimumWholesaleAmount ?? 10,
              price: p.wholesalePrice,
            }
            : undefined,
          measurementUnit: p.measurementUnit ?? "unidad",
          gramages: Array.isArray(p.gramages) ? p.gramages : [],
          active: p.active ?? true,
        };
        setProduct(cur);
        if (
          cur.measurementUnit === "gramo" &&
          cur.gramages &&
          cur.gramages.length > 0
        ) {
          setSelectedGramage(cur.gramages[0]);
        }

        const categoryIds: string[] = cur.categories?.map(category => category.id.toString()) ?? [];

        if (categoryIds.length === 0 && cur.categoryId) {
          categoryIds.push(cur.categoryId.toString());
        }

        if (categoryIds.length > 0) {
          const params = new URLSearchParams();
          categoryIds.forEach(categoryId => params.append("categoryIds", categoryId));
          params.set("page", "1");

          const relatedRes = await fetch(`${API_BASE}/api/products/filtered?${params.toString()}`);

          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            const relatedProducts = Array.isArray(relatedData.items)
              ? relatedData.items.map((r: any) => ({
                id: r.id.toString(),
                name: r.name ?? r.nombre,
                price: r.price ?? r.precio,
                stock: r.stock,
                categories: Array.isArray(r.categories) ? r.categories : [],
                category: Array.isArray(r.categories) && r.categories.length > 0
                  ? r.categories.map((c: any) => c.name ?? c.nombre ?? "").join(", ")
                  : (r.categoryName ?? r.description ?? ""),
                categoryId: Array.isArray(r.categories) && r.categories.length > 0
                  ? r.categories[0].id
                  : (r.categoryId ?? r.categoriaId),
                image: imgUrl(r.imagePath ?? r.imageUrl ?? ""),
                onOffer: r.offerPrice != null,
                offerPrice: r.offerPrice ?? null,
                discount: r.offerPrice != null && r.price
                  ? Math.round(((r.price - r.offerPrice) / r.price) * 100)
                  : (r.discount ?? r.descuento ?? 0),
                wholesalePrice: r.wholesalePrice
                  ? {
                    quantity: r.minimumWholesaleAmount ?? 10,
                    price: r.wholesalePrice,
                  }
                  : undefined,
                measurementUnit: r.measurementUnit ?? "unidad",
                gramages: Array.isArray(r.gramages) ? r.gramages : [],
                active: r.active ?? true,
              }))
              : [];

            setRelated(
              relatedProducts
                .filter((relatedProduct: Product) => relatedProduct.id !== cur.id && relatedProduct.active)
                .slice(0, 4),
            );
          }
        }

        try {
          const stored: Product[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
          const next = [cur, ...stored.filter(recentProduct => recentProduct.id !== cur.id)].slice(0, 8);

          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          setRecentlyViewed(next.filter(recentProduct => recentProduct.id !== cur.id).slice(0, 4));
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
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-3 w-12 bg-secondary/80 rounded-full animate-pulse" />
            <div className="h-3 w-3 bg-secondary/60 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-secondary/80 rounded-full animate-pulse" />
            <div className="h-3 w-3 bg-secondary/60 rounded-full animate-pulse" />
            <div className="h-3 w-32 bg-secondary rounded-full animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-0 bg-card rounded-3xl overflow-hidden border border-border/40 shadow-sm">
            <div className="aspect-square bg-secondary/50 animate-pulse" />
            <div className="p-8 space-y-5">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-secondary/60 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-secondary/60 rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-4/5 bg-secondary rounded-xl animate-pulse" />
              <div className="h-5 w-2/3 bg-secondary/70 rounded-xl animate-pulse" />
              <div className="h-12 w-2/5 bg-secondary rounded-xl animate-pulse mt-2" />
              <div className="h-px w-full bg-border/50 my-2" />
              <div className="flex gap-3">
                <div className="h-9 w-9 bg-secondary/70 rounded-xl animate-pulse" />
                <div className="h-9 w-9 bg-secondary/70 rounded-xl animate-pulse" />
                <div className="h-9 w-9 bg-secondary/70 rounded-xl animate-pulse" />
              </div>
              <div className="h-12 w-full bg-secondary rounded-2xl animate-pulse mt-4" />
              <div className="h-12 w-full bg-secondary/60 rounded-2xl animate-pulse" />
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
        <NoIndexSeo
          title="Producto no encontrado | El Molino"
          description="El producto solicitado no está disponible en El Molino."
        />
        <Package className="w-16 h-16 text-muted-foreground/40" />
        <p className="text-xl text-muted-foreground font-medium">
          Producto no encontrado.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  /* ── Datos derivados ── */
  const isGramProduct = product.measurementUnit === "gramo";

  const currentUsedInCart = items
    .filter((i) => i.id === product.id)
    .reduce((acc, i) => {
      if (i.measurementUnit === "gramo" && i.selectedGramage) {
        return acc + i.quantity * i.selectedGramage.grams;
      }
      return acc + i.quantity;
    }, 0);

  const remainingStock = product.stock - currentUsedInCart;
  let maxQtyAllowed = remainingStock;
  if (isGramProduct && selectedGramage) {
    maxQtyAllowed = Math.floor(remainingStock / selectedGramage.grams);
  }
  maxQtyAllowed = Math.max(0, maxQtyAllowed);

  const totalForWholesale =
    isGramProduct && selectedGramage
      ? currentUsedInCart + quantity * selectedGramage.grams
      : currentUsedInCart + quantity;

  const wholesale = isWholesaleActive(product, totalForWholesale);

  const displayPrice =
    isGramProduct && selectedGramage
      ? wholesale && product.wholesalePrice
        ? product.wholesalePrice.price * (selectedGramage.grams / 1000)
        : getEffectiveGramagePrice(selectedGramage)
      : getEffectivePrice(product, totalForWholesale);

  const effectivePrice = displayPrice;
  const isDiscounted = isGramProduct
    ? !!(
      selectedGramage?.offerPrice != null &&
      selectedGramage.offerPrice > 0 &&
      !wholesale
    )
    : !!(product.offerPrice != null && product.offerPrice > 0 && !wholesale);

  const discountPct =
    isGramProduct && selectedGramage && selectedGramage.price > 0
      ? Math.round(
        ((selectedGramage.price - getEffectiveGramagePrice(selectedGramage)) /
          selectedGramage.price) *
        100,
      )
      : (product.discount ?? 0);

  const handleAdd = () => {
    if (quantity > maxQtyAllowed) return;
    addToCart(
      product,
      quantity,
      isGramProduct ? (selectedGramage ?? undefined) : undefined,
    );
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2500);
  };

  const waMsg = encodeURIComponent(
    `Hola! Me interesa el producto: *${product.name}* (${formatARS(effectivePrice)}). ¿Tienen stock?`,
  );
  const canonicalPath = productPath(product);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const pageUrl = encodeURIComponent(canonicalUrl);
  const pageTitle = encodeURIComponent(product.name);

  const primaryCategory = product.categories?.[0];
  const primaryCategoryName = primaryCategory
    ? primaryCategory.nombre ?? (primaryCategory as any).name ?? ""
    : product.category ?? "";
  const primaryCategoryId = primaryCategory?.id ?? product.categoryId;
  const productDescription = compactDescription(
    `${product.name} disponible en El Molino, dietética en Mar del Plata. ${product.description ||
    "Consultá precio, presentación y stock para comprar online con envío local o retiro en tienda."
    }`,
  );
  const seoPrice = isGramProduct && selectedGramage
    ? getEffectiveGramagePrice(selectedGramage)
    : product.offerPrice && product.offerPrice > 0
      ? product.offerPrice
      : product.price;
  const productStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${canonicalUrl}#product`,
        name: product.name,
        description: product.description || productDescription,
        image: product.image ? [absoluteUrl(product.image)] : undefined,
        sku: product.id,
        category: primaryCategoryName || undefined,
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'ARS',
          price: seoPrice,
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'GroceryStore',
            name: 'El Molino',
            url: SITE_URL,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: SITE_URL,
          },
          ...(primaryCategoryId && primaryCategoryName
            ? [{
              '@type': 'ListItem',
              position: 2,
              name: primaryCategoryName,
              item: `${SITE_URL}${categoryPath({ id: primaryCategoryId, name: primaryCategoryName })}`,
            }]
            : []),
          {
            '@type': 'ListItem',
            position: primaryCategoryId && primaryCategoryName ? 3 : 2,
            name: product.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

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

  const stockLabel = isGramProduct
    ? product.stock >= 1000
      ? `${(product.stock / 1000).toFixed(2).replace(/\.00$/, "")} kg`
      : `${product.stock} g`
    : `${product.stock} unidades`;

  const isOutOfStock = product.stock === 0;
  const isMaxReached = maxQtyAllowed === 0;
  const isOverMax = quantity > maxQtyAllowed;
  const addDisabled = isOutOfStock || isMaxReached || isOverMax;

  /* ── Render ── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        title={`${compactDescription(product.name, 52)} | El Molino`}
        description={productDescription}
        canonicalPath={canonicalPath}
        image={product.image || undefined}
        imageAlt={product.name}
        type="product"
        structuredData={productStructuredData}
      />
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Breadcrumb ── */}
        <nav
          className="flex items-center gap-2 text-sm text-[#4a7c59] mb-6 flex-wrap tracking-wide"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className="hover:text-primary transition-colors flex items-center"
          >
            <Home className="w-4 h-4 stroke-[1.75]" />
          </Link>
          <span className="text-border">/</span>
          <Link
            to="/"
            className="hover:text-primary transition-colors uppercase font-medium"
          >
            TIENDA
          </Link>
          {product.categories && product.categories.length > 0 ? (
            product.categories.map((cat) => {
              const catName = cat.nombre ?? (cat as any).name ?? "";
              if (!catName) return null;
              return (
                <React.Fragment key={cat.id}>
                  <span className="text-border">/</span>
                  <Link
                    to={categoryPath({ id: cat.id, name: catName })}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    {catName}
                  </Link>
                </React.Fragment>
              );
            })
          ) : product.category ? (
            <>
              <span className="text-border">/</span>
              <Link
                to={categoryPath({ id: product.categoryId ?? '', name: product.category })}
                className="hover:text-primary transition-colors font-medium"
              >
                {product.category}
              </Link>
            </>
          ) : null}
          <span className="text-border">/</span>
          <span className="text-[#333d36] font-bold">{product.name}</span>
        </nav>

        {/* ── Bloque principal ── */}
        <div className="grid md:grid-cols-2 gap-0 bg-card rounded-3xl border border-border/40 shadow-md mb-10">
          {/* ── Columna izquierda: Imagen ── */}
          <div className="relative flex flex-col bg-white border-b md:border-b-0 md:border-r border-border/40 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {isDiscounted && (
                <span className="bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg">
                  -{discountPct}% OFF
                </span>
              )}
              {wholesale && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg">
                  Mayorista ✓
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-foreground/80 text-background text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg backdrop-blur-sm uppercase tracking-wide">
                  Agotado
                </span>
              )}
            </div>

            {/* Imagen principal */}
            <div className="relative flex-1 flex items-center justify-center min-h-[320px] md:min-h-[420px]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={`${product.name} en El Molino`}
                  width="640"
                  height="640"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: "420px" }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                  <Package className="w-24 h-24" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Compartir: debajo de la imagen */}
            <div className="px-6 pb-5 flex justify-center">
              <ShareButton
                shareLinks={shareLinks}
                show={showShareTooltip}
                onToggle={() => setShowShareTooltip(!showShareTooltip)}
                onClose={() => setShowShareTooltip(false)}
              />
            </div>
          </div>

          {/* ── Columna derecha: Info ── */}
          <div className="flex flex-col p-7 md:p-9 gap-0 rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none">
            {/* Categorías */}
            {((product.categories && product.categories.length > 0) ||
              product.category) && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {product.categories && product.categories.length > 0 ? (
                    product.categories.map((cat) => {
                      const catName = cat.nombre ?? (cat as any).name ?? "";
                      if (!catName) return null;
                      return (
                        <Link
                          key={cat.id}
                          to={categoryPath({ id: cat.id, name: catName })}
                          className="text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors border border-primary/15"
                        >
                          {catName}
                        </Link>
                      );
                    })
                  ) : (
                    <Link
                      to={categoryPath({ id: product.categoryId ?? '', name: product.category ?? '' })}
                      className="text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors border border-primary/15"
                    >
                      {product.category}
                    </Link>
                  )}
                </div>
              )}

            {/* Nombre */}
            <h1 className="text-2xl md:text-[1.75rem] text-foreground leading-tight font-semibold mb-1">
              {product.name}
            </h1>

            {/* Descripción */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-1 mb-0">
                {product.description}
              </p>
            )}

            {/* Separador */}
            <div className="h-px bg-border/60 my-5" />

            {/* Bloque de precio */}
            <div className="flex flex-col gap-1 mb-5">
              {isDiscounted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">
                    {isGramProduct && selectedGramage
                      ? formatARS(selectedGramage.price)
                      : formatARS(product.price)}
                  </span>
                  <span className="text-[11px] bg-destructive text-white font-bold px-2 py-0.5 rounded-lg">
                    -{discountPct}% OFF
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-[2.4rem] font-black text-foreground leading-none tracking-tight">
                  {formatARS(effectivePrice)}
                </span>
              </div>

              {/* Tags de precio */}
              <div className="flex flex-wrap gap-2 mt-2">
                {wholesale ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Precio mayorista activo
                  </span>
                ) : product.wholesalePrice ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    Mayorista desde{" "}
                    {isGramProduct
                      ? product.wholesalePrice.quantity >= 1000
                        ? `${product.wholesalePrice.quantity / 1000} kg`
                        : `${product.wholesalePrice.quantity} g`
                      : `${product.wholesalePrice.quantity} u.`}
                  </span>
                ) : null}

                {isGramProduct && !product.wholesalePrice && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary/80 font-medium bg-primary/8 border border-primary/15 px-3 py-1 rounded-full">
                    Precio según peso
                  </span>
                )}

                {!isGramProduct && !product.wholesalePrice && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary/60 px-3 py-1 rounded-full">
                    Por unidad
                  </span>
                )}
              </div>
            </div>

            {/* Stock */}
            {product.stock > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Stock disponible:{" "}
                    <span className="text-foreground font-semibold">
                      {stockLabel}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Separador */}
            <div className="h-px bg-border/60 mb-5" />

            {/* Selector de presentación (gramajes) */}
            {product.stock > 0 &&
              isGramProduct &&
              product.gramages &&
              product.gramages.length > 0 && (
                <div className="flex flex-col gap-2.5 mb-5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Seleccioná presentación
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.gramages.map((g) => {
                      const isSelected = selectedGramage?.id === g.id;
                      const gPrice = getEffectiveGramagePrice(g);
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGramage(g)}
                          className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 min-w-[72px]
                          ${isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.03]"
                              : "border-border text-foreground bg-background hover:border-primary/50 hover:bg-secondary/40"
                            }`}
                        >
                          <span>
                            {g.grams >= 1000
                              ? `${g.grams / 1000} kg`
                              : `${g.grams} g`}
                          </span>
                          <span
                            className={`text-[11px] font-medium mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                          >
                            {formatARS(gPrice)}
                          </span>
                          {g.offerPrice != null && g.offerPrice > 0 && (
                            <span className="text-[9px] font-bold text-red-400 uppercase mt-0.5">
                              oferta
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Selector de cantidad */}
            {product.stock > 0 && (
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cantidad
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className={`inline-flex items-center rounded-xl overflow-hidden border-2 border-border bg-background ${maxQtyAllowed === 0 ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      id="detail-qty-minus"
                      disabled={maxQtyAllowed === 0}
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-base">
                      {maxQtyAllowed === 0 ? 0 : quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(maxQtyAllowed, q + 1))
                      }
                      id="detail-qty-plus"
                      disabled={maxQtyAllowed === 0}
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progreso mayorista */}
                  {product.wholesalePrice && !wholesale && (
                    <span className="text-xs text-amber-600 font-medium">
                      Faltan{" "}
                      {isGramProduct
                        ? `${product.wholesalePrice.quantity - totalForWholesale} g`
                        : `${product.wholesalePrice.quantity - totalForWholesale} u.`}{" "}
                      para mayorista
                    </span>
                  )}
                  {product.wholesalePrice && wholesale && (
                    <span className="text-xs text-emerald-600 font-semibold">
                      ✓ Precio mayorista alcanzado
                    </span>
                  )}
                  {isMaxReached && (
                    <span className="text-xs text-destructive font-medium">
                      Stock máximo en carrito
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 mt-auto">
              {/* Botón agregar al carrito */}
              <button
                onClick={handleAdd}
                disabled={addDisabled}
                id="detail-add-to-cart"
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-semibold text-[15px] transition-all duration-300 active:scale-[0.98]
                  ${addDisabled
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : added
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20"
                  }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock
                  ? "Agotado"
                  : isMaxReached || isOverMax
                    ? "Stock máximo alcanzado"
                    : added
                      ? "¡Agregado al carrito! ✓"
                      : "Agregar al carrito"}
              </button>

              {/* Botón WhatsApp */}
              <a
                href={`https://wa.me/${PHONE_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                id="detail-whatsapp-btn"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-semibold text-[15px] border-2 border-[#25D366]/40 text-[#1a9e4a] bg-[#25D366]/8 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300 active:scale-[0.98]"
              >
                <WhatsAppSvg size="lg" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Productos relacionados ── */}
        {related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-base font-semibold text-foreground">
                Productos relacionados
              </h2>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} viewMode="grid-sm" />
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
