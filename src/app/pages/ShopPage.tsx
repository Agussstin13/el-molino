import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { categoryId: routeCategoryId } = useParams<{ categoryId: string }>();
  const categoryId = routeCategoryId ?? searchParams.get('categoria');
  const searchQuery = searchParams.get('q');
  const requestedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const seccion = location.pathname === '/productos-destacados' || location.pathname === '/products/top-selling' ? 'destacados'
    : location.pathname === '/productos' ? 'todos'
      : searchParams.get('seccion');
  const [products, setProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid-sm' | 'grid-lg'>('grid-sm');
  const [sortBy, setSortBy] = useState('default');
  const requestScopeRef = useRef('');
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
    const controller = new AbortController();
    const requestScope = `${categoryId ?? ''}|${searchQuery ?? ''}|${seccion ?? ''}|${sortBy}`;
    const scopeChanged = requestScopeRef.current !== requestScope;
    requestScopeRef.current = requestScope;

    setLoading(true);

    if (scopeChanged) {
      setProducts([]);
      setTopSellingProducts([]);
      setTotalPages(0);
    }

    const mapProducts = (data: any[]): Product[] => {
      if (!Array.isArray(data)) return [];

      return data.map((p: any) => ({
        id: p.id.toString(),
        name: p.name ?? p.nombre,
        price: p.price ?? p.precio,
        stock: p.stock,
        categories: Array.isArray(p.categories) ? p.categories : [],
        category: Array.isArray(p.categories) && p.categories.length > 0
          ? p.categories.map((c: any) => c.name ?? c.nombre).join(', ')
          : (p.categoryName ?? p.description ?? ''),
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
          ? {
            quantity: p.minimumWholesaleAmount ?? 10,
            price: p.wholesalePrice
          }
          : undefined,
        measurementUnit: p.measurementUnit ?? 'unidad',
        gramages: Array.isArray(p.gramages) ? p.gramages : [],
        imagePath: p.imagePath ?? '',
        description: p.description ?? '',
        active: p.active ?? true
      }));
    };

    const loadProducts = async () => {
      try {
        const serverOrder = sortBy === 'default' ? 'newest' : sortBy;
        const applyPageMetadata = (data: any) => {
          setTotalPages(data.totalPages ?? 0);

          if (Number.isInteger(data.page) && data.page !== page) {
            setSearchParams(currentParams => {
              const nextParams = new URLSearchParams(currentParams);

              if (data.page <= 1) nextParams.delete('page');
              else nextParams.set('page', data.page.toString());

              return nextParams;
            }, { replace: true });
          }
        };

        if (!categoryId && !searchQuery && !seccion) {
          const [discountedResponse, topSellingResponse] = await Promise.all([
            fetch(`${API_BASE}/api/products/discounted?page=1`, { signal: controller.signal }),
            fetch(`${API_BASE}/api/products/top-selling?page=1`, { signal: controller.signal })
          ]);

          const discountedData = discountedResponse.ok
            ? await discountedResponse.json()
            : { items: [] };

          const topSellingData = topSellingResponse.ok
            ? await topSellingResponse.json()
            : { items: [] };

          setProducts(mapProducts(discountedData.items));
          setTopSellingProducts(mapProducts(topSellingData.items));
          setTotalPages(0);
          return;
        }

        if (seccion === 'ofertas') {
          const response = await fetch(
            `${API_BASE}/api/products/discounted?page=${page}`,
            { signal: controller.signal },
          );
          const data = response.ok
            ? await response.json()
            : { items: [], totalPages: 0 };

          setProducts(mapProducts(data.items));
          applyPageMetadata(data);
          return;
        }

        if (seccion === 'destacados' || seccion === 'todos') {
          const params = new URLSearchParams({
            page: page.toString(),
            order: serverOrder,
          });
          const response = await fetch(
            `${API_BASE}/api/products?${params.toString()}`,
            { signal: controller.signal },
          );

          const data = response.ok
            ? await response.json()
            : { items: [], totalPages: 0 };

          setProducts(mapProducts(data.items));
          applyPageMetadata(data);
          return;
        }

        const params = new URLSearchParams();
        params.set('page', page.toString());

        if (categoryId) params.append('categoryIds', categoryId);
        if (searchQuery) params.set('productName', searchQuery);
        params.set('order', serverOrder);

        const response = await fetch(
          `${API_BASE}/api/products/filtered?${params.toString()}`,
          { signal: controller.signal },
        );
        const data = response.ok
          ? await response.json()
          : { items: [], totalPages: 0 };

        setProducts(mapProducts(data.items));
        applyPageMetadata(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Error fetching products:', error);
        setProducts([]);
        setTopSellingProducts([]);
        setTotalPages(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadProducts();

    return () => controller.abort();
  }, [categoryId, searchQuery, seccion, page, sortBy, lastProductsUpdate, setSearchParams]);

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

  const displayProducts = seccion === 'ofertas' ? offers : sortedProducts;
  const isFilteredView = categoryId || searchQuery || seccion;
  const showPagination = totalPages > 1;

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return;

    const params = new URLSearchParams(searchParams);

    if (nextPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', nextPage.toString());
    }

    setSearchParams(params);
  };

  const getPageHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);

    if (nextPage <= 1) params.delete('page');
    else params.set('page', nextPage.toString());

    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ''}`;
  };

  const handleSortChange = (nextSort: string) => {
    setSortBy(nextSort);
    if (page > 1) changePage(1);
  };

  const sectionTitle = seccion === 'ofertas' ? 'Ofertas del Día' : 'Todos los Productos';

  const isSearchOrOfferView = Boolean(searchQuery || seccion === 'ofertas');
  const baseCanonicalPath = categoryId && categoryName
    ? categoryPath({ id: categoryId, name: categoryName })
    : seccion === 'destacados'
      ? '/productos-destacados'
      : seccion === 'todos'
        ? '/productos'
        : '/';
  const hasIndexablePagination = Boolean(
    categoryId || seccion === 'destacados' || seccion === 'todos',
  );
  const canonicalPath = page > 1 && hasIndexablePagination
    ? `${baseCanonicalPath}?page=${page}`
    : baseCanonicalPath;
  const seoPageSuffix = page > 1 ? ` - Página ${page}` : '';
  const seoTitle = categorySeo
    ? `${categorySeo.title}${seoPageSuffix} | El Molino`
    : searchQuery
      ? `Resultados para ${searchQuery} | El Molino`
      : seccion === 'destacados' || seccion === 'todos'
        ? `Productos de dietética en Mar del Plata${seoPageSuffix} | El Molino`
        : 'Dietética en Mar del Plata | El Molino';
  const seoDescription = categorySeo?.description ?? (
    seccion === 'destacados' || seccion === 'todos'
      ? 'Explorá el catálogo completo de El Molino: alimentos saludables, productos naturales, sin TACC, frutos secos y suplementos en Mar del Plata.'
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
              onSortChange={handleSortChange}
            />
          </div>
        )}

        {isFilteredView ? (
          <>
            <ProductSection
              title={categoryId ? (categoryName || 'Productos') : searchQuery ? `Búsqueda: ${searchQuery}` : sectionTitle}
              products={displayProducts}
              viewMode={viewMode}
              showAllProducts
              headingLevel="h1"
            />

            {showPagination && (
              <nav className="flex items-center justify-center gap-4 pb-10" aria-label="Paginación de productos">
                {page > 1 && !loading ? (
                  <Link
                    to={getPageHref(page - 1)}
                    rel="prev"
                    aria-label="Ir a la página anterior"
                    title="Página anterior"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-primary text-primary opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}

                <span className="min-w-32 text-center text-sm font-medium" aria-live="polite">
                  Página {page} de {totalPages}
                </span>

                {page < totalPages && !loading ? (
                  <Link
                    to={getPageHref(page + 1)}
                    rel="next"
                    aria-label="Ir a la página siguiente"
                    title="Página siguiente"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-primary text-primary opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
              </nav>
            )}
          </>
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
