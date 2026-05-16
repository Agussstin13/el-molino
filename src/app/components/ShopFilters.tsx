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
      <div className="bg-card border border-border rounded-xl shadow-sm p-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs md:text-sm font-medium tracking-wide">
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors flex items-center">
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-border">/</span>
          <Link to="/#productos-lista" className="text-primary hover:text-primary/80 transition-colors uppercase">
            Tienda Online
          </Link>
          {categoryName && (
            <>
              <span className="text-border">/</span>
              <span className="text-primary uppercase font-bold border-b-2 border-primary/30">
                {categoryName}
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {/* View Modes */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => onViewModeChange('list')}
              className={`transition-all ${viewMode === 'list' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Vista de lista"
            >
              <LayoutList className="w-6 h-6" />
            </button>
            <button
              onClick={() => onViewModeChange('grid-sm')}
              className={`transition-all ${viewMode === 'grid-sm' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Cuadrícula pequeña"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>
            <button
              onClick={() => onViewModeChange('grid-lg')}
              className={`transition-all ${viewMode === 'grid-lg' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Cuadrícula grande"
            >
              <Grid2X2 className="w-6 h-6" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative group min-w-[200px]">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full appearance-none bg-background border border-border rounded-full px-5 py-2.5 pr-10 text-sm font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:border-primary/50"
            >
              <option value="default">Orden: por defecto</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
