import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface ProductSectionProps {
  title: string;
  products: Product[];
  highlightDeals?: boolean;
  id?: string;
}

export function ProductSection({ title, products, highlightDeals, id }: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-8" id={id}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-2xl ${highlightDeals ? 'text-destructive' : 'text-foreground'}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {title}
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-secondary/30 rounded-2xl p-10 text-center border-2 border-dashed border-border">
            <p className="text-muted-foreground italic">Aún no hay productos disponibles en esta sección.</p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map(product => (
              <div key={product.id} className="flex-none w-64">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
