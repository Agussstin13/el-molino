import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../lib/types';
import { formatARS, getEffectivePrice, isWholesaleActive } from '../../lib/price';
import { useCart } from '../context/CartContext';

export type { Product };

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const effectivePrice = getEffectivePrice(product, quantity);
  const wholesale = isWholesaleActive(product, quantity);
  const isDiscounted = !!product.discount && !wholesale;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    setQuantity(1);
  };

  const handleQtyChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setQuantity(q => Math.max(1, q + delta));
  };

  return (
    <div
      className="bg-white rounded-md border border-border shadow-sm flex flex-col h-full hover:shadow-lg transition-all duration-300 group cursor-pointer relative"
      onClick={() => navigate(`/producto/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      {/* Etiqueta NUEVO */}
      <div className="absolute top-0 left-0 bg-[#1e88e5] text-white text-[11px] font-bold px-3 py-1 z-10 tracking-wide">
        NUEVO
      </div>

      {/* Imagen */}
      <div className="relative p-6 flex-1 flex items-center justify-center aspect-square bg-white">
        <img
          src={product.image || 'https://via.placeholder.com/300?text=Sin+Imagen'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Contenido */}
      <div className="px-5 pb-5 flex flex-col gap-4 text-center mt-auto">
        <h3 className="text-[#4a7c59] text-[13px] sm:text-sm font-medium uppercase line-clamp-2 min-h-[2.5rem] leading-snug">
          {product.name}
        </h3>
        
        <button
          onClick={handleAdd}
          className="w-full bg-[#4a7c59] hover:bg-[#3d6649] text-white py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-[18px] h-[18px]" />
          IR AL CARRITO
        </button>
      </div>
    </div>
  );
}
