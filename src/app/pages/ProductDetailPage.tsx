import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Star, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Product } from '../../lib/types';
import { formatARS, getEffectivePrice, isWholesaleActive } from '../../lib/price';
import { useCart } from '../context/CartContext';
import { ProductSection } from '../components/ProductSection';
import { Header } from '../components/Header';
import { Cart } from '../components/Cart';
import { Checkout } from '../components/Checkout';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch product details
    fetch(`http://localhost:5001/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(p => {
        setProduct({
          id: p.id.toString(),
          name: p.nombre,
          price: p.precio,
          stock: p.stock,
          category: p.descripcion,
          image: p.imagenNombre ? `http://localhost:5001/images/${p.imagenNombre}` : '',
        } as Product);
        
        // Fetch related products (for simplicity just getting all and filtering)
        return fetch(`http://localhost:5001/api/products`);
      })
      .then(res => res.json())
      .then(data => {
        if (!product) return;
        const mappedRelated = data
          .filter((p: any) => p.id.toString() !== id && p.descripcion === product.category)
          .map((p: any) => ({
            id: p.id.toString(),
            name: p.nombre,
            price: p.precio,
            stock: p.stock,
            category: p.descripcion,
            image: p.imagenNombre ? `http://localhost:5001/images/${p.imagenNombre}` : '',
          }))
          .slice(0, 5);
        setRelated(mappedRelated);
      })
      .catch(err => console.error("Error fetching product:", err))
      .finally(() => setLoading(false));
  }, [id, product?.category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">Producto no encontrado.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product, quantity);
  const wholesale = isWholesaleActive(product, quantity);
  const isDiscounted = !!product.discount && !wholesale;

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const priceRows = [
    { label: 'Precio unitario', qty: 1, price: product.price, discount: product.discount },
    ...(product.wholesalePrice
      ? [{ label: `Precio mayorista (${product.wholesalePrice.quantity}+ unidades)`, qty: product.wholesalePrice.quantity, price: product.wholesalePrice.price, discount: null }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </button>

        <div className="grid md:grid-cols-2 gap-10 mb-16">
          {/* Imagen */}
          <div className="relative">
            {product.discount && (
              <div className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium shadow">
                -{product.discount}% OFF
              </div>
            )}
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product.category && (
              <span className="text-xs uppercase tracking-widest text-accent font-medium">
                {product.category}
              </span>
            )}

            <h1 className="text-3xl text-foreground" style={{ fontFamily: 'Georgia, serif' }}>
              {product.name}
            </h1>

            {/* Precio actual */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl text-primary font-semibold">
                {formatARS(effectivePrice)}
              </span>
              {isDiscounted && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatARS(product.price)}
                </span>
              )}
              {wholesale && (
                <span className="text-sm bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                  Precio mayorista activo
                </span>
              )}
            </div>

            {/* Tabla de precios */}
            {product.wholesalePrice && (
              <div className="bg-secondary/40 rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2 bg-secondary/60 border-b border-border">
                  <p className="text-sm font-medium">Precios por cantidad</p>
                </div>
                <div className="divide-y divide-border">
                  {priceRows.map((row, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 text-sm ${i === 1 ? 'bg-accent/5' : ''}`}
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-medium ${i === 1 ? 'text-accent' : 'text-foreground'}`}>
                        {formatARS(row.discount ? row.price * (1 - row.discount / 100) : row.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Cantidad */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center border-2 border-border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  id="detail-qty-minus"
                  className="p-2.5 hover:bg-secondary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 min-w-[3rem] text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  id="detail-qty-plus"
                  className="p-2.5 hover:bg-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {product.wholesalePrice && quantity < product.wholesalePrice.quantity && (
                <span className="text-xs text-muted-foreground">
                  ({product.wholesalePrice.quantity - quantity} más para precio mayorista)
                </span>
              )}
            </div>

            {/* Botón agregar */}
            <button
              onClick={handleAdd}
              id="detail-add-to-cart"
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all shadow-md ${
                added
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {added ? '¡Agregado al carrito!' : 'Agregar al carrito'}
            </button>

            {/* Envío */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-3 rounded-lg">
              <Truck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Envío gratis en compras mayores a <strong className="text-foreground">$5.000</strong></span>
            </div>

            {/* Rating decorativo */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">Producto certificado</span>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {related.length > 0 && (
          <ProductSection title="Productos Relacionados" products={related} />
        )}
      </main>

      <Cart />
      <Checkout />
    </div>
  );
}
