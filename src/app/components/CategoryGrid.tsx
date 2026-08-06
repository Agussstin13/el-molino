import { Link } from 'react-router-dom';
import { categoryPath } from '../../lib/seo';

const API_BASE = import.meta.env.VITE_API_BASE;

export interface ShopCategory {
  id: number;
  name: string;
  imagePath?: string | null;
  displayOrder?: number;
}

// imagePath viene como "/images/categories/filename.jpg" del backend
const imgUrl = (path?: string | null) =>
  path ? (path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : '';

export function CategoryGrid({ categories }: { categories: ShopCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-12 bg-secondary/20" id="categorias">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl mb-8 text-center">
          Explorar Categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...categories]
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((category, index) => (
            <Link
              key={category.id}
              to={categoryPath(category)}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary transition-colors shadow-sm">
                {category.imagePath ? (
                  <img
                    src={imgUrl(category.imagePath)}
                    alt={`${category.name} en El Molino`}
                    loading={index < 2 ? "eager" : "lazy"}
                    fetchPriority={index < 2 ? "high" : "auto"}
                    decoding="async"
                    width="240"
                    height="240"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-2xl opacity-20">🏷️</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}