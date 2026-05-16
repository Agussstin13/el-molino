import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ProductSection } from '../components/ProductSection';
import { Footer } from '../components/Footer';
import { Cart } from '../components/Cart';
import type { Product } from '../../lib/types';

const API_BASE = import.meta.env.VITE_API_BASE;
const imgUrl = (path: string) =>
  path ? (path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : '';

export function ShopPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoria');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
          discount: p.discount ?? p.descuento ?? 0,
          wholesalePrice: p.wholesalePrice
            ? { quantity: p.wholesaleMinimumAmount ?? 10, price: p.wholesalePrice }
            : p.precioMayorista
            ? { quantity: p.montoMinimoMayorista ?? 10, price: p.precioMayorista }
            : undefined,
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
  }, [loading, categoryId]);

  const offers = products.filter(p => p.discount && p.discount > 0);
  const others = products.filter(p => !p.discount || p.discount <= 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!categoryId && <HeroSection />}
        
        {categoryId ? (
          <ProductSection 
            title={products.length > 0 && products[0].category ? products[0].category : "Productos"}
            products={products} 
            id="productos-lista"
          />
        ) : (
          <>
            <ProductSection 
              title="Ofertas del Día" 
              products={offers} 
              highlightDeals
              id="ofertas"
            />
            <ProductSection 
              title="Productos Destacados" 
              products={others} 
              id="productos-lista"
            />
          </>
        )}
      </main>
      <Footer />
      <Cart />
    </div>
  );
}
