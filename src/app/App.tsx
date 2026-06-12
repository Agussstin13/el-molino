import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { SignalRProvider } from './context/SignalRContext';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPanel } from './components/AdminPanel';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAdminAuthenticated } = useAuth();
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SignalRProvider>
          <AlertProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<ShopPage />} />
                <Route path="/products/top-selling" element={<ShopPage />} />
                <Route path="/productos" element={<ShopPage />} />
                <Route path="/producto/:id" element={<ProductDetailPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <WhatsAppFloatingButton />
            </CartProvider>
          </AlertProvider>
        </SignalRProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}