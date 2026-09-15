import { Home, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ShopFiltersProps {
  categoryName?: string;
  viewMode: 'list' | 'grid-sm' | 'grid-lg';
  onViewModeChange: (mode: 'list' | 'grid-sm' | 'grid-lg') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function ShopFilters({ 
  categoryName, 
  viewMode, 
  onViewModeChange, 
  sortBy, 
  onSortChange 
}: ShopFiltersProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-0">
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        {/* Breadcrumbs */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[#4a7c59] tracking-wide">
          <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <Home className="w-4 h-4 stroke-[1.75]" />
          </Link>
          <span className="text-border">/</span>
          <Link to="/" className="hover:text-primary transition-colors uppercase font-medium">
            TIENDA
          </Link>
          {categoryName && (
            <>
              <span className="text-border">/</span>
              <span className="min-w-0 break-words font-medium text-[#4a7c59]">
                {categoryName}
              </span>
            </>
          )}
        </nav>

        <div className="flex min-w-0 items-center justify-between gap-4 self-stretch sm:self-auto sm:justify-end">

          {/* Sort Dropdown */}
          <div className="group relative min-w-0 flex-1 sm:min-w-[180px] sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full appearance-none bg-white border border-border/80 rounded-full px-4 py-2 pr-9 text-xs font-semibold text-[#4a7c59] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:border-primary/50"
            >
              <option value="default">Orden: por defecto</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a7c59] pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
