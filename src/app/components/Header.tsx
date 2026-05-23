import { Search, ShoppingCart, User, Menu, X, Home, Instagram, Phone, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ClientLoginModal } from "./ClientLoginModal";
import logo from "../../imports/image.png";
const API_BASE = import.meta.env.VITE_API_BASE;

interface Category {
  id: number;
  name: string;
}

export function Header() {
  const { cartCount, openCart } = useCart();
  const { isClientAuthenticated, clientUser } = useAuth();
  const [search, setSearch] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories?onlyActive=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Error fetching categories for menu:", err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar con backend/filtrado
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f0e0cb]/80 backdrop-blur-md border-b-2 border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Hamburger + Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <img
                src={logo}
                alt="El Molino"
                className="h-12 w-12 object-contain"
              />
              <span
                className="hidden sm:block text-xl text-primary font-medium"
                style={{ fontFamily: "Georgia, serif" }}
              >
                El Molino
              </span>
            </Link>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm"
              />
            </div>
          </form>

          {/* User and Cart Group */}
          <div className="flex items-center gap-2">
            {/* Client Auth */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${isClientAuthenticated ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
              aria-label="Mi Perfil"
            >
              <User className="w-5 h-5" />
              {isClientAuthenticated && clientUser && (
                <span className="hidden sm:inline text-sm font-medium">
                  {clientUser.nombre && clientUser.apellido 
                    ? `${clientUser.nombre} ${clientUser.apellido}` 
                    : clientUser.nombre || clientUser.email?.split('@')[0] || 'Mi cuenta'}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="cart-btn"
              onClick={openCart}
              className="relative p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <ClientLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Mobile Menu Overlay */}
      {isMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <span className="text-xl font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>Menú</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-foreground font-medium"
                >
                  <Home className="w-5 h-5 text-primary" />
                  Inicio
                </Link>
                
                <div className="pt-4 pb-2 px-3">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categorías</p>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No hay categorías</p>
                  ) : (
                    <div className="space-y-1">
                      {categories.map(cat => (
                        <Link 
                          key={cat.id} 
                          to={`/?categoria=${cat.id}#productos-lista`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-sm"
                        >
                          {cat.name}
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="p-4 border-t border-border bg-secondary/10 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contacto</p>
              
              <div className="space-y-3">
                <a href="https://instagram.com/elmolinomdp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-4 h-4 text-primary" />
                  </div>
                  @elmolinomdp
                </a>
                <a href="https://wa.me/5492236927799" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  +54 9 223 6927799
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
