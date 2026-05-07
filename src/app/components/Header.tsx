import { Search, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ClientLoginModal } from "./ClientLoginModal";

export function Header() {
  const { cartCount, openCart } = useCart();
  const { isClientAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: conectar con backend/filtrado
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b-2 border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/src/imports/image.png"
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
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isClientAuthenticated ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
              aria-label="Mi Perfil"
            >
              <User className="w-6 h-6" />
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
    </header>
  );
}
