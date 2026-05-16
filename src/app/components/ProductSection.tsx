import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/types';

interface ProductSectionProps {
  title: string;
  products: Product[];
  highlightDeals?: boolean;
  id?: string;
  viewMode?: 'list' | 'grid-sm' | 'grid-lg';
}

export function ProductSection({ title, products, highlightDeals, id, viewMode }: ProductSectionProps) {

  return (
    <section className="py-8" id={id}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border/80"></div>
          </div>
          <div className="relative flex justify-center">
            <h2 className="bg-background px-6 text-xl md:text-2xl font-semibold text-[#4a7c59] uppercase tracking-wider">
              {title}
            </h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-secondary/30 rounded-2xl p-10 text-center border-2 border-dashed border-border">
            <p className="text-muted-foreground italic">Aún no hay productos disponibles en esta sección.</p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === 'list' 
                ? 'grid-cols-1' 
                : viewMode === 'grid-lg'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}
          >
            {products.map(product => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
