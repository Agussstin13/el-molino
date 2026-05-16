import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../lib/types';
import { formatARS, getEffectivePrice, isWholesaleActive } from '../../lib/price';
import { useCart } from '../context/CartContext';

export type { Product };

interface ProductCardProps {
  product: Product;
  viewMode?: 'list' | 'grid-sm' | 'grid-lg';
}

export function ProductCard({ product, viewMode = 'grid-sm' }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    setQuantity(1);
  };

  const isList = viewMode === 'list';

  return (
    <div
      className={`bg-white rounded-md border border-border shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden ${
        isList ? 'flex flex-row items-center gap-4 p-4' : 'flex flex-col h-full'
      }`}
      onClick={() => navigate(`/producto/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      {/* Etiqueta NUEVO */}
      <div className="absolute top-0 left-0 bg-[#1e88e5] text-white text-[11px] font-bold px-3 py-1 z-10 tracking-wide">
        NUEVO
      </div>

      {/* Imagen */}
      <div className={`relative flex items-center justify-center bg-white ${
        isList ? 'w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0' : 'p-6 flex-1 aspect-square'
      }`}>
        <img
          src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Contenido */}
      <div className={`flex flex-col gap-3 ${
        isList ? 'flex-1 text-left pr-4' : 'px-5 pb-5 text-center mt-auto'
      }`}>
        <div className="flex flex-col gap-1">
          <h3 className="text-[#4a7c59] text-[13px] sm:text-sm font-medium uppercase line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <p className="text-primary font-bold text-base sm:text-lg">
            {formatARS(product.price)}
          </p>
        </div>
        
        <div className={`flex items-center gap-4 ${isList ? 'justify-start' : 'justify-center'}`}>
          <button
            onClick={handleAdd}
            className={`${
              isList ? 'w-auto px-6' : 'w-full'
            } bg-[#4a7c59] hover:bg-[#3d6649] text-white py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap shadow-sm hover:shadow-md transition-all`}
          >
            <ShoppingCart className="w-[18px] h-[18px]" />
            {isList ? 'AGREGAR' : 'IR AL CARRITO'}
          </button>
        </div>
      </div>
    </div>
  );
}
