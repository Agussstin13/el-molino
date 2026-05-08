import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductSection } from '../components/ProductSection';
import { Cart } from '../components/Cart';
import { Checkout } from '../components/Checkout';
import { useState, useEffect } from 'react';
import type { Product } from '../../lib/types';
import logo from "../../imports/image.png"

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

      <footer className="bg-secondary border-t-2 border-primary/20 mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="El Molino"
                className="h-10 w-10 object-contain"
              />
              <span
                className="text-muted-foreground text-sm"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                © 2026 El Molino — Tradición y calidad artesanal
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Envío gratis en compras +$5.000</span>
              <a
                href="/admin/login"
                className="hover:text-primary transition-colors"
              >
                Administración
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Cart />
      <Checkout />
    </div>
  );
}
