import {
  Package,
  Tag,
  ShoppingBag,
  Edit,
  Trash2,
  LogOut,
  Plus,
  X,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  GripVertical,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatARS } from "../../lib/price";
import type { Coupon, Order, Product } from "../../lib/types";

type AdminView = "products" | "promotions" | "orders" | "carousel";

const API_BASE = "http://localhost:5001";

interface CarouselImage {
  id: number;
  imagenNombre: string;
  titulo: string | null;
  subtitulo: string | null;
  orden: number;
  activo: boolean;
}

const EMPTY_CAROUSEL: Omit<CarouselImage, "id"> = {
  imagenNombre: "",
  titulo: "",
  subtitulo: "",
  orden: 0,
  activo: true,
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  pendiente: "bg-chart-4/20 text-chart-4",
  procesando: "bg-chart-1/20 text-chart-1",
  enviado: "bg-chart-2/20 text-chart-2",
  entregado: "bg-accent/20 text-accent",
  cancelado: "bg-destructive/20 text-destructive",
};

const EMPTY_COUPON: Omit<Coupon, "id"> = {
  nombre: "",
  detalle: "",
  codigo: "",
  monto: null,
  porcentaje: null,
  tope: null,
  compra_minima: null,
  activo: true,
  valido_mayorista: false,
};

export function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>("products");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] =
    useState<Omit<Coupon, "id">>(EMPTY_COUPON);
  const [tipoDescuento, setTipoDescuento] = useState<"monto" | "porcentaje">(
    "porcentaje",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: "",
    price: 0,
    stock: 0,
    category: "",
    image: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  // Carousel state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [showCarouselForm, setShowCarouselForm] = useState(false);
  const [carouselForm, setCarouselForm] = useState<Omit<CarouselImage, "id">>(EMPTY_CAROUSEL);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);
  const [editingCarouselId, setEditingCarouselId] = useState<number | null>(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/carousel/all`)
      .then((res) => res.json())
      .then((data: CarouselImage[]) => setCarouselImages(data))
      .catch((err) => console.error("Error fetching carousel:", err));

    fetch(`${API_BASE}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        const mappedProducts = data.map((p: any) => ({
          id: p.id.toString(),
          name: p.nombre,
          price: p.precio,
          stock: p.stock,
          category: p.descripcion,
          image: p.imagenNombre
            ? `${API_BASE}/images/${p.imagenNombre}`
            : "",
        }));
        setProducts(mappedProducts);
      })
      .catch((err) => console.error("Error fetching products:", err));

    fetch(`${API_BASE}/api/coupons`)
      .then((res) => res.json())
      .then((data) => {
        const mappedCoupons = data.map((c: any) => ({
          ...c,
          id: c.id.toString(),
          compra_minima: c.compraMinima,
          valido_mayorista: c.validoMayorista,
        }));
        setCoupons(mappedCoupons);
      })
      .catch((err) => console.error("Error fetching coupons:", err));

    fetch(`${API_BASE}/api/orders`)
      .then((res) => res.json())
      .then((data) => {
        const mappedOrders = data.map((o: any) => ({
          id: o.id.toString(),
          customer: o.nombreComprador + " " + o.apellidoComprador,
          total: o.total,
          status: o.estadoPedido,
          date: new Date(o.fechaCreacion).toLocaleDateString(),
          metodo_pago: o.metodoPago,
        }));
        setOrders(mappedOrders);
      })
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProductForm((prev) => ({ ...prev, image: `${API_BASE}/images/${data.fileName}` }));
      } else {
        alert("Error al subir la imagen");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    const backendProduct = {
      nombre: productForm.name,
      precio: productForm.price,
      stock: productForm.stock,
      descripcion: productForm.category, // Using description as category
      imagenNombre: productForm.image?.split("/").pop(), // extract filename
      activo: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendProduct),
      });

      if (res.ok) {
        const created = await res.json();
        const newProduct = {
          id: created.id.toString(),
          name: created.nombre,
          price: created.precio,
          stock: created.stock,
          category: created.descripcion,
          image: created.imagenNombre
            ? `${API_BASE}/images/${created.imagenNombre}`
            : "",
        } as Product;

        setProducts((prev) => [newProduct, ...prev]);
        setShowProductForm(false);
        setProductForm({
          name: "",
          price: 0,
          stock: 0,
          category: "",
          image: "",
        });
      } else {
        alert("Error al guardar el producto en la base de datos");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al guardar el producto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Error al eliminar el producto");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al eliminar");
    }
  };

  const handleSaveCoupon = async () => {
    const backendCoupon = {
      nombre: couponForm.nombre,
      detalle: couponForm.detalle,
      codigo: couponForm.codigo,
      monto: tipoDescuento === "monto" ? Number(couponForm.monto) : null,
      porcentaje:
        tipoDescuento === "porcentaje" ? Number(couponForm.porcentaje) : null,
      tope:
        tipoDescuento === "porcentaje" && couponForm.tope
          ? Number(couponForm.tope)
          : null,
      compraMinima: couponForm.compra_minima
        ? Number(couponForm.compra_minima)
        : null,
      activo: couponForm.activo,
      validoMayorista: couponForm.valido_mayorista,
    };

    try {
      const res = await fetch(`${API_BASE}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendCoupon),
      });

      if (res.ok) {
        const created = await res.json();
        const newCoupon: Coupon = {
          ...couponForm,
          id: created.id.toString(),
          monto: created.monto,
          porcentaje: created.porcentaje,
          tope: created.tope,
          compra_minima: created.compraMinima,
          activo: created.activo,
          valido_mayorista: created.validoMayorista,
        };
        setCoupons((prev) => [newCoupon, ...prev]);
        setCouponForm(EMPTY_COUPON);
        setShowCouponForm(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al guardar el cupón");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/coupons/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setCF = (field: keyof Omit<Coupon, "id">, value: unknown) => {
    setCouponForm((f) => ({ ...f, [field]: value }));
  };

  // Carousel handlers
  const handleCarouselImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCarousel(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setCarouselForm((prev) => ({ ...prev, imagenNombre: data.fileName }));
      } else {
        alert("Error al subir la imagen");
      }
    } catch {
      alert("Error de conexión al subir la imagen");
    } finally {
      setIsUploadingCarousel(false);
    }
  };

  const handleSaveCarouselImage = async () => {
    try {
      const url = editingCarouselId 
        ? `${API_BASE}/api/carousel/${editingCarouselId}`
        : `${API_BASE}/api/carousel`;
      
      const method = editingCarouselId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagenNombre: carouselForm.imagenNombre,
          titulo: carouselForm.titulo || null,
          subtitulo: carouselForm.subtitulo || null,
          orden: carouselForm.orden,
          activo: carouselForm.activo,
        }),
      });
      if (res.ok) {
        const saved: CarouselImage = await res.json();
        if (editingCarouselId) {
          setCarouselImages((prev) => 
            prev.map(img => img.id === editingCarouselId ? saved : img).sort((a, b) => a.orden - b.orden)
          );
        } else {
          setCarouselImages((prev) => [...prev, saved].sort((a, b) => a.orden - b.orden));
        }
        setCarouselForm(EMPTY_CAROUSEL);
        setShowCarouselForm(false);
        setEditingCarouselId(null);
      } else {
        alert("Error al guardar la imagen");
      }
    } catch {
      alert("Error de red al guardar la imagen");
    }
  };

  const handleEditCarousel = (img: CarouselImage) => {
    setCarouselForm({
      imagenNombre: img.imagenNombre,
      titulo: img.titulo ?? "",
      subtitulo: img.subtitulo ?? "",
      orden: img.orden,
      activo: img.activo,
    });
    setEditingCarouselId(img.id);
    setShowCarouselForm(true);
    // Scroll to form
    document.getElementById("new-carousel-btn")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteCarouselImage = async (id: number) => {
    if (!confirm("¿Eliminar esta imagen del carousel?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/carousel/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCarouselImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch {
      console.error("Error al eliminar");
    }
  };

  const handleToggleCarousel = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/carousel/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !current }),
      });
      if (res.ok) {
        setCarouselImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, activo: !current } : img))
        );
      }
    } catch {
      console.error("Error al cambiar estado");
    }
  };

  const navItems = [
    { id: "products" as AdminView, icon: Package, label: "Productos" },
    { id: "promotions" as AdminView, icon: Tag, label: "Cupones" },
    { id: "orders" as AdminView, icon: ShoppingBag, label: "Pedidos" },
    { id: "carousel" as AdminView, icon: ImageIcon, label: "Carousel" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/src/imports/image.png"
            alt="El Molino"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p
              className="text-sidebar-foreground font-medium"
              style={{ fontFamily: "Georgia, serif" }}
            >
              El Molino
            </p>
            <p className="text-xs text-muted-foreground">Panel Admin</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                currentView === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4 space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            Ver tienda
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* PRODUCTOS */}
          {currentView === "products" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: "Georgia, serif" }}>
                  Gestión de Productos
                </h1>
                <button
                  id="new-product-btn"
                  onClick={() => setShowProductForm((v) => !v)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  {showProductForm ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showProductForm ? "Cancelar" : "Nuevo Producto"}
                </button>
              </div>

              {showProductForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3
                    className="mb-5 text-base"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Crear producto
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5">Nombre *</label>
                      <input
                        value={productForm.name || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Ej: Alfajor"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">
                        Categoría *
                      </label>
                      <input
                        value={productForm.category || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            category: e.target.value,
                          }))
                        }
                        placeholder="Ej: Dulces"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">
                        Precio ($) *
                      </label>
                      <input
                        type="number"
                        value={productForm.price || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            price: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Stock *</label>
                      <input
                        type="number"
                        value={productForm.stock || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            stock: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Imagen *</label>
                      <div className="flex items-center gap-4">
                        {productForm.image && (
                          <img
                            src={productForm.image}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
                        />
                        {isUploading && (
                          <span className="text-sm text-primary font-medium animate-pulse">
                            Subiendo...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
                    <button
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProduct}
                      disabled={
                        !productForm.name ||
                        !productForm.price ||
                        !productForm.image ||
                        isUploading
                      }
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm"
                    >
                      Guardar producto
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">
                        Producto
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Precio
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Stock
                      </th>
                      <th className="text-right p-4 text-sm font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-border hover:bg-secondary/20 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {formatARS(product.price)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.stock > 50
                                ? "bg-accent/20 text-accent"
                                : product.stock > 20
                                  ? "bg-chart-4/20 text-chart-4"
                                  : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {product.stock} uds.
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 justify-end">
                            <button
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUPONES */}
          {currentView === "promotions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: "Georgia, serif" }}>
                  Cupones de Descuento
                </h1>
                <button
                  id="new-coupon-btn"
                  onClick={() => setShowCouponForm((v) => !v)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  {showCouponForm ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showCouponForm ? "Cancelar" : "Nuevo Cupón"}
                </button>
              </div>

              {/* Formulario nuevo cupón */}
              {showCouponForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3
                    className="mb-5 text-base"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Crear cupón
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5">Nombre *</label>
                      <input
                        value={couponForm.nombre}
                        onChange={(e) => setCF("nombre", e.target.value)}
                        placeholder="Ej: Verano 2026"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Código *</label>
                      <input
                        value={couponForm.codigo}
                        onChange={(e) =>
                          setCF("codigo", e.target.value.toUpperCase())
                        }
                        placeholder="VERANO2026"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">
                        Detalle / Descripción *
                      </label>
                      <input
                        value={couponForm.detalle}
                        onChange={(e) => setCF("detalle", e.target.value)}
                        placeholder="Descripción del cupón"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Tipo de descuento */}
                    <div className="col-span-2">
                      <label className="block text-sm mb-2">
                        Tipo de descuento *
                      </label>
                      <div className="flex gap-3">
                        <label
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm transition-colors ${tipoDescuento === "porcentaje" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <input
                            type="radio"
                            name="tipo"
                            value="porcentaje"
                            checked={tipoDescuento === "porcentaje"}
                            onChange={() => setTipoDescuento("porcentaje")}
                            className="accent-primary"
                          />
                          Porcentaje (%)
                        </label>
                        <label
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer text-sm transition-colors ${tipoDescuento === "monto" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <input
                            type="radio"
                            name="tipo"
                            value="monto"
                            checked={tipoDescuento === "monto"}
                            onChange={() => setTipoDescuento("monto")}
                            className="accent-primary"
                          />
                          Monto fijo ($)
                        </label>
                      </div>
                    </div>

                    {tipoDescuento === "porcentaje" ? (
                      <>
                        <div>
                          <label className="block text-sm mb-1.5">
                            Porcentaje (1–100) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={couponForm.porcentaje ?? ""}
                            onChange={(e) =>
                              setCF("porcentaje", Number(e.target.value))
                            }
                            placeholder="15"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1.5">
                            Tope máximo de descuento ($)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={couponForm.tope ?? ""}
                            onChange={(e) =>
                              setCF(
                                "tope",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            placeholder="Opcional"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm mb-1.5">
                          Monto fijo ($) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={couponForm.monto ?? ""}
                          onChange={(e) =>
                            setCF("monto", Number(e.target.value))
                          }
                          placeholder="500"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm mb-1.5">
                        Compra mínima ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={couponForm.compra_minima ?? ""}
                        onChange={(e) =>
                          setCF(
                            "compra_minima",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        placeholder="Opcional"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={couponForm.activo}
                          onChange={(e) => setCF("activo", e.target.checked)}
                          className="accent-primary w-4 h-4"
                        />
                        Activo
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={couponForm.valido_mayorista}
                          onChange={(e) =>
                            setCF("valido_mayorista", e.target.checked)
                          }
                          className="accent-primary w-4 h-4"
                        />
                        Válido para precio mayorista
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
                    <button
                      onClick={() => setShowCouponForm(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      id="save-coupon-btn"
                      onClick={handleSaveCoupon}
                      disabled={!couponForm.nombre || !couponForm.codigo}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm"
                    >
                      Guardar cupón
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de cupones */}
              <div className="space-y-3">
                {coupons.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay cupones creados.
                  </div>
                )}
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex-shrink-0 ${coupon.activo ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}
                      >
                        {coupon.codigo}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{coupon.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {coupon.detalle}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {coupon.porcentaje
                              ? `${coupon.porcentaje}% OFF`
                              : `${formatARS(coupon.monto!)} de descuento`}
                          </span>
                          {coupon.tope && (
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                              Tope: {formatARS(coupon.tope)}
                            </span>
                          )}
                          {coupon.compra_minima && (
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                              Mín: {formatARS(coupon.compra_minima)}
                            </span>
                          )}
                          {coupon.valido_mayorista && (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                              Válido mayorista
                            </span>
                          )}
                          {!coupon.activo && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PEDIDOS */}
          {currentView === "orders" && (
            <div>
              <h1 className="mb-6" style={{ fontFamily: "Georgia, serif" }}>
                Historial de Pedidos
              </h1>
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">
                        Pedido
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Cliente
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Total
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Pago
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Estado
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-border hover:bg-secondary/20 transition-colors"
                      >
                        <td className="p-4 text-sm font-mono">{order.id}</td>
                        <td className="p-4 text-sm">{order.customer}</td>
                        <td className="p-4 text-sm font-medium">
                          {formatARS(order.total)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground capitalize">
                          {order.metodo_pago}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {order.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* CAROUSEL */}
          {currentView === "carousel" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: "Georgia, serif" }}>Imágenes del Carousel</h1>
                <button
                  id="new-carousel-btn"
                  onClick={() => {
                    if (showCarouselForm) {
                      setEditingCarouselId(null);
                      setCarouselForm(EMPTY_CAROUSEL);
                    }
                    setShowCarouselForm((v) => !v);
                  }}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  {showCarouselForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showCarouselForm ? "Cancelar" : "Nueva Imagen"}
                </button>
              </div>

              {showCarouselForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3 className="mb-5 text-base" style={{ fontFamily: "Georgia, serif" }}>
                    {editingCarouselId ? "Editar imagen del carousel" : "Agregar imagen al carousel"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Imagen *</label>
                      <div className="flex items-center gap-4">
                        {carouselForm.imagenNombre && (
                          <img
                            src={`${API_BASE}/images/${carouselForm.imagenNombre}`}
                            alt="Preview"
                            className="w-24 h-16 object-cover rounded-lg border border-border"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCarouselImageUpload}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
                        />
                        {isUploadingCarousel && (
                          <span className="text-sm text-primary font-medium animate-pulse">Subiendo...</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Título</label>
                      <input
                        value={carouselForm.titulo ?? ""}
                        onChange={(e) => setCarouselForm((p) => ({ ...p, titulo: e.target.value }))}
                        placeholder="Ej: Tradición y Calidad"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Orden</label>
                      <input
                        type="number"
                        min={0}
                        value={carouselForm.orden}
                        onChange={(e) => setCarouselForm((p) => ({ ...p, orden: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Subtítulo</label>
                      <input
                        value={carouselForm.subtitulo ?? ""}
                        onChange={(e) => setCarouselForm((p) => ({ ...p, subtitulo: e.target.value }))}
                        placeholder="Ej: Más de 70 años llevando lo mejor de la naturaleza"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={carouselForm.activo}
                          onChange={(e) => setCarouselForm((p) => ({ ...p, activo: e.target.checked }))}
                          className="accent-primary w-4 h-4"
                        />
                        Activa al crear
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        setShowCarouselForm(false);
                        setEditingCarouselId(null);
                        setCarouselForm(EMPTY_CAROUSEL);
                      }}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      id="save-carousel-btn"
                      onClick={handleSaveCarouselImage}
                      disabled={!carouselForm.imagenNombre || isUploadingCarousel}
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm"
                    >
                      {editingCarouselId ? "Actualizar cambios" : "Guardar imagen"}
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de imágenes */}
              {carouselImages.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No hay imágenes en el carousel. Agrega la primera.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {carouselImages.map((img) => (
                    <div
                      key={img.id}
                      className={`bg-card rounded-xl border overflow-hidden shadow-sm transition-all ${
                        img.activo ? "border-border" : "border-border opacity-60"
                      }`}
                    >
                      {/* Preview */}
                      <div className="relative h-36 bg-secondary">
                        {img.imagenNombre ? (
                          <img
                            src={`${API_BASE}/images/${img.imagenNombre}`}
                            alt={img.titulo ?? "Slide"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                        {/* Orden badge */}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          Orden {img.orden}
                        </div>
                        {/* Estado badge */}
                        <div
                          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                            img.activo
                              ? "bg-accent/90 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {img.activo ? "Activa" : "Inactiva"}
                        </div>
                      </div>

                      {/* Info + actions */}
                      <div className="p-4">
                        <p className="font-medium text-sm truncate">
                          {img.titulo || <span className="text-muted-foreground italic">Sin título</span>}
                        </p>
                        {img.subtitulo && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{img.subtitulo}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => handleToggleCarousel(img.id, img.activo)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              img.activo
                                ? "bg-accent/10 text-accent hover:bg-accent/20"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {img.activo ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                            {img.activo ? "Desactivar" : "Activar"}
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditCarousel(img)}
                              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                              title="Editar detalles"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCarouselImage(img.id)}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
