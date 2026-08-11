import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '../../lib/types';

const PAGE_SIZE = 25;

interface ProductSectionProps {
  title: string;
  products: Product[];
  highlightDeals?: boolean;
  id?: string;
  viewMode?: 'list' | 'grid-sm' | 'grid-lg';
  hideTitle?: boolean;
  viewAllLink?: string;
  paginated?: boolean;
  showAllProducts?: boolean;
  headingLevel?: 'h1' | 'h2';
}

export function ProductSection({
  title,
  products,
  id,
  viewMode,
  hideTitle,
  viewAllLink,
  paginated,
  showAllProducts,
  headingLevel = 'h2',
}: ProductSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

  // Reset page when products change
  useEffect(() => {
    setPage(1);
  }, [products.length]);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const visibleProducts = showAllProducts
    ? products
    : paginated
      ? products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      : showAll
        ? products
        : products.slice(0, PAGE_SIZE);
  const shouldShowViewAll = !showAllProducts
    && !paginated
    && !showAll
    && products.length > 0
    && (Boolean(viewAllLink) || products.length > PAGE_SIZE);
  const Heading = headingLevel;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const el = document.getElementById(id || 'productos-lista');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8" id={id}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideTitle && (
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/80"></div>
            </div>
            <div className="relative flex justify-center">
              <Heading className="bg-background px-6 text-xl md:text-2xl font-semibold text-[#4a7c59] uppercase tracking-wider">
                {title}
              </Heading>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-secondary/30 rounded-2xl p-10 text-center border-2 border-dashed border-border">
            <p className="text-muted-foreground italic">Aún no hay productos disponibles en esta sección.</p>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-6 ${viewMode === 'list'
                ? 'grid-cols-1'
                : viewMode === 'grid-lg'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                }`}
            >
              {visibleProducts.map(product => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>

            {/* Paginación */}
            {paginated && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${p === page
                      ? 'bg-primary text-primary-foreground shadow-md scale-110'
                      : 'border border-border text-foreground hover:bg-secondary/50'
                      }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </div>
            )}

            {/* Botón "Ver todos" para la home */}
            {shouldShowViewAll && (
              <div className="mt-10 flex justify-center">
                {viewAllLink ? (
                  <Link
                    to={viewAllLink}
                    className="px-8 py-3 border-2 border-primary text-primary font-bold rounded-full shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95 inline-block text-center"
                  >
                    Ver todos
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowAll(true)}
                    className="px-8 py-3 border-2 border-primary text-primary font-bold rounded-full shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                  >
                    Ver todos
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
