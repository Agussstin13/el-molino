import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ProductSection } from '../components/ProductSection';
import { Seo } from '../components/Seo';
import { Footer } from '../components/Footer';
import { Cart } from '../components/Cart';
import { Checkout } from '../components/Checkout';
import { ShopFilters } from '../components/ShopFilters';
import { useSignalR } from '../context/SignalRContext';
import type { Product } from '../../lib/types';
import { getCategorySeo } from '../../lib/categorySeo';
import { categoryPath, compactDescription, SITE_URL } from '../../lib/seo';

const API_BASE = import.meta.env.VITE_API_BASE;
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER;
const imgUrl = (path: string) =>
  path ? (path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : '';

export function ShopPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { categoryId: routeCategoryId } = useParams<{ categoryId: string }>();
  const categoryId = routeCategoryId ?? searchParams.get('categoria');
  const searchQuery = searchParams.get('q');
  const seccion = location.pathname === '/productos-destacados' || location.pathname === '/products/top-selling' ? 'destacados'
    : location.pathname === '/productos' ? 'todos'
      : searchParams.get('seccion');
  const [products, setProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid-sm' | 'grid-lg'>('grid-sm');
  const [sortBy, setSortBy] = useState('default');
  const { lastProductsUpdate, lastCategoriesUpdate } = useSignalR();

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, [lastCategoriesUpdate]);

  useEffect(() => {
    setLoading(true);

    const fetchProducts = fetch(`${API_BASE}/api/products`).then(res => res.ok ? res.json() : []);
    const fetchTopSelling = fetch(`${API_BASE}/api/Products/top-selling`).then(res => res.ok ? res.json() : []).catch(() => []);

    Promise.all([fetchProducts, fetchTopSelling])
      .then(([productsData, topSellingData]) => {
        const mapProducts = (data: any[]) => {
          if (!Array.isArray(data)) return [];
          return data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name ?? p.nombre,
            price: p.price ?? p.precio,
            stock: p.stock,
            categories: Array.isArray(p.categories) ? p.categories : [],
            category: Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories.map((c: any) => c.name ?? c.nombre).join(", ")
              : (p.categoryName ?? p.description ?? ""),
            image: imgUrl(p.imagePath ?? p.imageUrl ?? ''),
            categoryId: Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories[0].id
              : (p.categoryId ?? p.categoriaId),
            onOffer: p.offerPrice != null,
            offerPrice: p.offerPrice ?? null,
            discount: p.offerPrice != null && p.price
              ? Math.round(((p.price - p.offerPrice) / p.price) * 100)
              : (p.discount ?? p.descuento ?? 0),
            wholesalePrice: p.wholesalePrice
              ? { quantity: p.minimumWholesaleAmount ?? 10, price: p.wholesalePrice }
              : undefined,
            measurementUnit: p.measurementUnit ?? "unidad",
            gramages: Array.isArray(p.gramages) ? p.gramages : [],
            imagePath: p.imagePath ?? "",
            description: p.description ?? "",
            active: p.active ?? true,
          }));
        };

        const mappedProducts = mapProducts(productsData);
        const mappedTopSelling = mapProducts(topSellingData);

        setTopSellingProducts(mappedTopSelling);

        if (categoryId) {
          setProducts(mappedProducts.filter((p: any) => {
            if (Array.isArray(p.categories) && p.categories.length > 0) {
              return p.categories.some((c: any) => c.id?.toString() === categoryId);
            }
            return p.categoryId?.toString() === categoryId;
          }));
        } else if (searchQuery) {
          const normalize = (t: string) => t ? t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
          const queryWords = normalize(searchQuery).split(/\s+/).map(w => w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w);

          setProducts(mappedProducts.filter((p: any) => {
            const searchableText = normalize(`${p.name} ${p.description || ""} ${Array.isArray(p.categories) && p.categories.length > 0
                ? p.categories.map((c: any) => c.name ?? c.nombre ?? "").join(" ")
                : (p.category || "")
              }`);
            return queryWords.every(qw => searchableText.includes(qw));
          }));
        } else {
          setProducts(mappedProducts);
        }
      })
      .catch(err => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, [categoryId, searchQuery, lastProductsUpdate]);

  useEffect(() => {
    if (loading) return;

    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const y = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for fixed header
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      }
    } else if (categoryId || searchQuery || seccion) {
      const el = document.getElementById('productos-lista');
      if (el) {
        setTimeout(() => {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, categoryId, searchQuery, seccion, window.location.hash]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, sortBy]);

  const sortedTopSelling = useMemo(() => {
    const list = [...topSellingProducts];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [topSellingProducts, sortBy]);

  const offers = sortedProducts.filter(p => p.discount && p.discount > 0);
  const others = sortedTopSelling.length > 0
    ? sortedTopSelling
    : sortedProducts.filter(p => !p.discount || p.discount <= 0);

  const categoryName = useMemo(() => {
    if (!categoryId || categories.length === 0) return undefined;
    const cat = categories.find(c => c.id.toString() === categoryId);
    return cat ? cat.name : undefined;
  }, [categoryId, categories]);

  const categorySeo = useMemo(() => {
    if (!categoryId || !categoryName) return null;
    return getCategorySeo(Number(categoryId), categoryName);
  }, [categoryId, categoryName]);

  const displayProducts = seccion === 'ofertas' ? offers : seccion === 'destacados' ? others : sortedProducts;
  const isFilteredView = categoryId || searchQuery || seccion;
  const sectionTitle = seccion === 'ofertas' ? 'Ofertas del Día' : seccion === 'destacados' ? 'Productos Destacados' : 'Todos los Productos';

  const isSearchOrOfferView = Boolean(searchQuery || seccion === 'ofertas');
  const canonicalPath = categoryId && categoryName
    ? categoryPath({ id: categoryId, name: categoryName })
    : seccion === 'destacados'
      ? '/productos-destacados'
      : seccion === 'todos'
        ? '/productos'
        : '/';
  const seoTitle = categorySeo
    ? `${categorySeo.title} | El Molino`
    : searchQuery
      ? `Resultados para ${searchQuery} | El Molino`
      : seccion === 'destacados'
        ? 'Productos destacados | Dietética El Molino'
        : seccion === 'todos'
          ? 'Productos de dietética en Mar del Plata | El Molino'
          : 'Dietética en Mar del Plata | El Molino';
  const seoDescription = categorySeo?.description ?? (
    seccion === 'destacados'
      ? 'Descubrí productos destacados de El Molino, tu dietética en Mar del Plata. Comprá online con envío local o retiro por Bolívar 2342.'
      : seccion === 'todos'
        ? 'Explorá el catálogo de El Molino: alimentos saludables, productos naturales, sin TACC, frutos secos y suplementos en Mar del Plata.'
        : searchQuery
          ? `Resultados del catálogo de El Molino para ${searchQuery}.`
          : 'Comprá alimentos saludables, productos naturales, sin TACC, frutos secos y suplementos en El Molino, dietética en Mar del Plata.'
  );

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GroceryStore',
        '@id': `${SITE_URL}/#store`,
        name: 'El Molino',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.svg`,
        image: `${SITE_URL}/og-image.png`,
        description: 'Dietética y tienda de productos saludables en Mar del Plata.',
        telephone: PHONE_NUMBER ? `+${PHONE_NUMBER}` : undefined,
        currenciesAccepted: 'ARS',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Bolívar 2342',
          addressLocality: 'Mar del Plata',
          addressRegion: 'Buenos Aires',
          addressCountry: 'AR',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -38.0040339,
          longitude: -57.5469972,
        },
        areaServed: {
          '@type': 'City',
          name: 'Mar del Plata',
        },
        sameAs: [
          'https://instagram.com/elmolinomdp',
          'https://maps.app.goo.gl/7PYu5S649M96pi5WA',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'El Molino',
        inLanguage: 'es-AR',
        publisher: { '@id': `${SITE_URL}/#store` },
      },
    ],
  };

  const categoryStructuredData = categorySeo && categoryName && categoryId
    ? {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: categorySeo.title,
          description: categorySeo.description,
          url: `${SITE_URL}${canonicalPath}`,
          inLanguage: 'es-AR',
          isPartOf: { '@id': `${SITE_URL}/#website` },
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
            {
              '@type': 'ListItem',
              position: 2,
              name: categoryName,
              item: `${SITE_URL}${canonicalPath}`,
            },
          ],
        },
      ],
    }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo
        title={seoTitle}
        description={compactDescription(seoDescription)}
        canonicalPath={canonicalPath}
        robots={isSearchOrOfferView ? 'noindex, follow' : undefined}
        structuredData={categoryStructuredData ?? (!isFilteredView ? homeStructuredData : undefined)}
      />
      <Header />
      <main className="flex-1">
        {!isFilteredView && <HeroSection />}
        {isFilteredView && (
          <div className="pt-8 pb-0" id="productos-lista">
            <ShopFilters
              categoryName={categoryId ? categoryName : searchQuery ? `Resultados para "${searchQuery}"` : sectionTitle}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        )}

        {isFilteredView ? (
          <ProductSection
            title={categoryId ? (categoryName || "Productos") : searchQuery ? `Búsqueda: ${searchQuery}` : sectionTitle}
            products={displayProducts}
            viewMode={viewMode}
            paginated={!!seccion}
            headingLevel="h1"
          />
        ) : (
          <div className="space-y-0">
            <ProductSection
              title="Ofertas del Día"
              products={offers}
              highlightDeals
              id="ofertas"
              viewMode={viewMode}
              viewAllLink="/?seccion=ofertas"
            />
            <ProductSection
              title="Productos Destacados"
              products={others}
              id="productos-lista"
              viewMode={viewMode}
              viewAllLink="/productos-destacados"
            />
          </div>
        )}
      </main>
      <Footer />
      <Cart />
      <Checkout />
    </div>
  );
}
