import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { categoryPath } from "../../lib/seo";

const API_BASE = import.meta.env.VITE_API_BASE;

export interface ShopCategory {
  id: number;
  name: string;
  imagePath?: string | null;
  displayOrder?: number;
}

// imagePath viene como "/images/categories/filename.jpg" del backend
const imgUrl = (path?: string | null) =>
  path ? (path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : "";

interface CategoryItemProps {
  category: ShopCategory;
  hiddenFromNavigation: boolean;
  eager: boolean;
}

function CategoryItem({ category, hiddenFromNavigation, eager }: CategoryItemProps) {
  return (
    <Link
      to={categoryPath(category)}
      tabIndex={hiddenFromNavigation ? -1 : undefined}
      aria-hidden={hiddenFromNavigation || undefined}
      className="category-marquee__item group"
    >
      <span className="category-marquee__image-frame">
        {category.imagePath ? (
          <img
            src={imgUrl(category.imagePath)}
            alt={hiddenFromNavigation ? "" : `${category.name} en El Molino`}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            width="112"
            height="112"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-secondary text-primary/65">
            <Leaf className="h-8 w-8" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="category-marquee__label">{category.name}</span>
    </Link>
  );
}

interface CategoryGridProps {
  categories: ShopCategory[];
  loading?: boolean;
}

export function CategoryGrid({ categories, loading = false }: CategoryGridProps) {
  if (!loading && categories.length === 0) return null;

  const sortedCategories = [...categories].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const repetitions = sortedCategories.length > 0
    ? Math.max(1, Math.ceil(10 / sortedCategories.length))
    : 0;
  const loopCategories = Array.from({ length: repetitions }, (_, repetition) =>
    sortedCategories.map((category) => ({ category, repeated: repetition > 0 })),
  ).flat();
  const marqueeStyle = {
    "--category-marquee-duration": `${Math.max(28, loopCategories.length * 3.8)}s`,
  } as CSSProperties;

  return (
    <section className="border-y border-border/60 bg-card/55 py-5 sm:py-6" id="categorias" aria-labelledby="categories-title">
      <div className="mb-4 px-4 text-center sm:mb-5">
        <h2 id="categories-title" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Encontrá tu sección favorita
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center gap-5 overflow-hidden px-4 sm:gap-8" aria-busy="true" aria-label="Cargando categorías">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="flex w-[5.5rem] flex-none flex-col items-center gap-2.5" aria-hidden="true">
              <span className="block aspect-square w-[5.25rem] animate-pulse rounded-full bg-secondary sm:w-24" />
              <span className="block h-3 w-16 animate-pulse rounded-full bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <div className="category-marquee" style={marqueeStyle}>
          <div className="category-marquee__track">
            <div className="category-marquee__group">
              {loopCategories.map(({ category, repeated }, index) => (
                <CategoryItem
                  key={`primary-${category.id}-${index}`}
                  category={category}
                  hiddenFromNavigation={repeated}
                  eager={!repeated && index < 4}
                />
              ))}
            </div>
            <div className="category-marquee__group category-marquee__group--duplicate" aria-hidden="true">
              {loopCategories.map(({ category }, index) => (
                <CategoryItem
                  key={`duplicate-${category.id}-${index}`}
                  category={category}
                  hiddenFromNavigation
                  eager={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
