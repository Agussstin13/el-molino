import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WhatsAppFloatingButton } from "./components/WhatsAppFloatingButton";
import { NoIndexSeo } from "./components/Seo";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SignalRProvider } from "./context/SignalRContext";
import { ShopPage } from "./pages/ShopPage";
import NotFoundPage from "./pages/NotFoundPage";

const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((module) => ({
    default: module.ProductDetailPage,
  })),
);
const AdminLoginPage = lazy(() =>
  import("./pages/AdminLoginPage").then((module) => ({
    default: module.AdminLoginPage,
  })),
);
const AdminPanel = lazy(() =>
  import("./components/AdminPanel").then((module) => ({
    default: module.AdminPanel,
  })),
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((module) => ({
    default: module.OrdersPage,
  })),
);
const GuestOrderPage = lazy(() =>
  import("./pages/GuestOrderPage").then((module) => ({
    default: module.GuestOrderPage,
  })),
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAdminAuthenticated } = useAuth();
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

function ProtectedClientRoute({ children }: { children: ReactNode }) {
  const { isClientAuthenticated } = useAuth();
  if (!isClientAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PrivatePage({ children }: { children: ReactNode }) {
  return (
    <>
      <NoIndexSeo
        title="Área privada | El Molino"
        description="Área privada de clientes y administración de El Molino."
      />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SignalRProvider>
          <AlertProvider>
            <CartProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<ShopPage />} />
                  <Route path="/productos" element={<ShopPage />} />
                  <Route path="/productos-destacados" element={<ShopPage />} />
                  <Route
                    path="/categoria/:categoryId/:slug?"
                    element={<ShopPage />}
                  />
                  <Route
                    path="/producto/:id/:slug?"
                    element={<ProductDetailPage />}
                  />
                  <Route
                    path="/products/top-selling"
                    element={<Navigate to="/productos-destacados" replace />}
                  />
                  <Route
                    path="/pedido/:token"
                    element={
                      <PrivatePage>
                        <GuestOrderPage />
                      </PrivatePage>
                    }
                  />
                  <Route
                    path="/mis-pedidos"
                    element={
                      <PrivatePage>
                        <ProtectedClientRoute>
                          <OrdersPage />
                        </ProtectedClientRoute>
                      </PrivatePage>
                    }
                  />
                  <Route
                    path="/admin/login"
                    element={
                      <PrivatePage>
                        <AdminLoginPage />
                      </PrivatePage>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <PrivatePage>
                        <ProtectedRoute>
                          <AdminPanel />
                        </ProtectedRoute>
                      </PrivatePage>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              <WhatsAppFloatingButton />
            </CartProvider>
          </AlertProvider>
        </SignalRProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}