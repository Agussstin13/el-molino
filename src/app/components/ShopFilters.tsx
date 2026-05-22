import { Home, LayoutList, LayoutGrid, Grid2X2, ChevronDown } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border/40">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#4a7c59] tracking-wide">
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
              <span className="text-[#4a7c59] font-medium">
                {categoryName}
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* View Modes */}
          <div className="flex items-center gap-3.5 bg-[#f3efe9]/60 border border-border/50 rounded-full px-3 py-1.5">
            <button
              onClick={() => onViewModeChange('list')}
              className={`transition-colors p-0.5 rounded ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Vista de lista"
            >
              <LayoutList className="w-5 h-5 stroke-[1.75]" />
            </button>
            <button
              onClick={() => onViewModeChange('grid-sm')}
              className={`transition-colors p-0.5 rounded ${viewMode === 'grid-sm' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Cuadrícula pequeña"
            >
              <LayoutGrid className="w-5 h-5 stroke-[1.75]" />
            </button>
            <button
              onClick={() => onViewModeChange('grid-lg')}
              className={`transition-colors p-0.5 rounded ${viewMode === 'grid-lg' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Cuadrícula grande"
            >
              <Grid2X2 className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative group min-w-[180px]">
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
