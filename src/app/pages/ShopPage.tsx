import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductSection } from '../components/ProductSection';
import { Cart } from '../components/Cart';
import { Checkout } from '../components/Checkout';
import { Footer } from '../components/Footer';
import { useState, useEffect } from 'react';
import type { Product } from '../../lib/types';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/products')
      .then(res => res.json())
      .then(data => {
        const mappedProducts = data.map((p: any) => ({
          id: p.id.toString(),
          name: p.nombre,
          price: p.precio,
          stock: p.stock,
          category: p.descripcion,
          image: p.imagenNombre ? `http://localhost:5001/images/${p.imagenNombre}` : '',
        }));
        setProducts(mappedProducts);
      })
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  const featuredProducts = products.slice(0, 5);
  const dailyDeals = products.slice(5, 10);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategoryGrid />
        <ProductSection title="Productos Destacados" products={featuredProducts} id="productos-destacados" />

        <ProductSection
          title="Ofertas del Día 🔥"
          products={dailyDeals}
          highlightDeals
        />
      </main>

      <Footer />

      <Cart />
      <Checkout />
    </div>
  );
}
