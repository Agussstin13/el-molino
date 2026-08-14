import { Search, ShoppingCart, User, Menu, X, Home, Instagram, Phone, ChevronRight, List, ChevronDown, Package, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useCart } from "../context/CartContext";
import { categoryPath } from "../../lib/seo";
import { useAuth } from "../context/AuthContext";
import { ClientLoginModal } from "./ClientLoginModal";
import { ClientProfileModal } from "./ClientProfileModal";
const API_BASE = import.meta.env.VITE_API_BASE;
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER;

interface Category {
  id: number;
  name: string;
}

export function Header() {
  const navigate = useNavigate();
  const { cartCount, openCart } = useCart();
  const { isClientAuthenticated, clientUser } = useAuth();
  const [search, setSearch] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Error fetching categories for menu:", err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}#productos-lista`);
      setIsMenuOpen(false);
    } else {
      navigate(`/`);
    }
  };

  const hasOrdersAccess = isClientAuthenticated || JSON.parse(localStorage.getItem('guestOrderTokens') || '[]').length > 0;

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
                src="/logo.svg"
                alt="El Molino"
                width="48"
                height="48"
                className="h-12 w-12 object-contain"
              />
              <span
                className="hidden sm:block text-2xl text-primary font-bold italic tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                El Molino
              </span>
            </Link>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="search-input"
                type="text"
                aria-label="Buscar productos en El Molino"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm"
              />
            </div>
          </form>

          {/* User and Cart Group */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mis Pedidos (Desktop prominent) */}
            {hasOrdersAccess && (
              <Link
                to="/mis-pedidos"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors flex-shrink-0"
                aria-label="Mis Pedidos"
                title="Mis Pedidos"
              >
                <ClipboardList className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">Pedidos</span>
              </Link>
            )}

            {/* Client Auth */}
            <button
              onClick={() => isClientAuthenticated ? setIsProfileModalOpen(true) : setIsLoginModalOpen(true)}
              className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${isClientAuthenticated ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
              aria-label="Mi Perfil"
            >
              <User className="w-5 h-5" />
              {isClientAuthenticated && clientUser && (
                <span className="hidden lg:inline text-sm font-medium">
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
      <ClientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
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
              <span className="text-xl font-bold text-primary">Menú</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>
            
            <div className="menu-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto py-4">
              <nav className="min-w-0 space-y-1 px-3">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-foreground font-medium"
                >
                  <Home className="w-5 h-5 text-primary" />
                  Inicio
                </Link>
                
                <Link 
                  to="/productos" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-foreground font-medium"
                >
                  <Package className="w-5 h-5 text-primary" />
                  Todos los Productos
                </Link>

                {hasOrdersAccess && (
                  <Link
                    to="/mis-pedidos"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-foreground font-medium"
                  >
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Mis pedidos
                  </Link>
                )}
                
                <div className="pt-2 pb-2">
                  <button 
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-secondary transition-colors text-foreground font-medium"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <List className="w-5 h-5 flex-shrink-0 text-primary" />
                      <span className="min-w-0 whitespace-normal break-words">Categorías</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 opacity-70 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isCategoriesOpen && (
                    <div className="mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2 pl-11">No hay categorías</p>
                      ) : (
                        <div className="space-y-1">
                          {categories.map(cat => (
                            <Link 
                              key={cat.id} 
                              to={categoryPath(cat)}
                              onClick={() => setIsMenuOpen(false)}
                              className="flex min-w-0 items-center gap-3 pl-11 pr-3 py-2.5 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-sm"
                            >
                              <span className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]">
                                {cat.name}
                              </span>
                              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50" />
                            </Link>
                          ))}
                        </div>
                      )}
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
                <a href={`https://wa.me/${PHONE_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  +{PHONE_NUMBER}
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