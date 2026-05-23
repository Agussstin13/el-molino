import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ProductSection } from '../components/ProductSection';
import { Footer } from '../components/Footer';
import { Cart } from '../components/Cart';
import { ShopFilters } from '../components/ShopFilters';
import type { Product } from '../../lib/types';

const API_BASE = import.meta.env.VITE_API_BASE;
const imgUrl = (path: string) =>
  path ? (path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : '';

export function ShopPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoria');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid-sm' | 'grid-lg'>('grid-sm');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    fetch(`${API_BASE}/api/categories?onlyActive=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    setLoading(true);

    fetch(`${API_BASE}/api/products`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("Respuesta inesperada:", data);
          setProducts([]);
          return;
        }

        const mapped = data.map((p: any) => ({
          id: p.id.toString(),
          name: p.name ?? p.nombre,
          price: p.price ?? p.precio,
          stock: p.stock,
          category: p.categoryName ?? p.description ?? "",
          image: imgUrl(p.imagePath ?? p.imageUrl ?? ''),
          categoryId: p.categoryId ?? p.categoriaId,
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

        if (categoryId) {
          setProducts(mapped.filter((p: any) => p.categoryId?.toString() === categoryId));
        } else {
          setProducts(mapped);
        }
      })
      .catch(err => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, [categoryId]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const y = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for fixed header
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      }
    } else if (!loading && !categoryId) {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, categoryId, window.location.hash]);

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

  const offers = sortedProducts.filter(p => p.discount && p.discount > 0);
  const others = sortedProducts.filter(p => !p.discount || p.discount <= 0);

  const categoryName = useMemo(() => {
    if (!categoryId || categories.length === 0) return undefined;
    const cat = categories.find(c => c.id.toString() === categoryId);
    return cat ? cat.name : undefined;
  }, [categoryId, categories]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {!categoryId && <HeroSection />}
        
        {categoryId && (
          <div className="pt-8 pb-4" id="productos-lista">
            <ShopFilters 
              categoryName={categoryName}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        )}

        {categoryId ? (
          <ProductSection 
            title={categoryName || "Productos"}
            products={sortedProducts} 
            viewMode={viewMode}
          />
        ) : (
          <div className="space-y-0">
            <ProductSection 
              title="Ofertas del Día" 
              products={offers} 
              highlightDeals
              id="ofertas"
              viewMode={viewMode}
            />
            <ProductSection 
              title="Productos Destacados" 
              products={others} 
              id="productos-lista"
              viewMode={viewMode}
            />
          </div>
        )}
      </main>
      <Footer />
      <Cart />
    </div>
  );
}
