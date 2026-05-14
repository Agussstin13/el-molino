import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Info,
  Layers,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { formatARS } from "../../lib/price";
import type {
  CarouselImage,
  Category,
  Coupon,
  Order,
  Product,
} from "../../lib/types";
const API_BASE = import.meta.env.VITE_API_BASE;
import logo from "../../imports/image.png";

type AdminView =
  | "products"
  | "promotions"
  | "orders"
  | "carousel"
  | "categories";

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

const EMPTY_CATEGORY: Omit<Category, "id"> = {
  nombre: "",
  imagenNombre: "",
  orden: 0,
  activo: true,
};

export function AdminPanel() {
  const { logout, adminToken } = useAuth();
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
  const [carouselForm, setCarouselForm] =
    useState<Omit<CarouselImage, "id">>(EMPTY_CAROUSEL);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);
  const [editingCarouselId, setEditingCarouselId] = useState<number | null>(
    null,
  );

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const { showError, showSuccess, showConfirm } = useAlert();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] =
    useState<Omit<Category, "id">>(EMPTY_CATEGORY);
  const [isUploadingCategory, setIsUploadingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  const handleSessionExpired = () => {
    logout();
    showError(
      "Sesión expirada",
      "Tu sesión ha vencido. Por favor, inicia sesión nuevamente.",
    );
    navigate("/login");
  };

  React.useEffect(() => {
    const fetchData = async () => {
      const authHeader: Record<string, string> = adminToken
        ? { Authorization: `Bearer ${adminToken}` }
        : {};

      try {
        // Carousel
        const carouselRes = await fetch(`${API_BASE}/api/carousel/all`, {
          headers: authHeader,
        });
        if (carouselRes.status === 401) return handleSessionExpired();

        if (carouselRes.ok) {
          const data = await carouselRes.json();
          setCarouselImages(data);
        }

        // Categories
        const categoriesRes = await fetch(`${API_BASE}/api/categories/all`, {
          headers: authHeader,
        });
        if (categoriesRes.status === 401) return handleSessionExpired();

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : []);
        } else {
          setCategories([]);
        }

        // Products
        const productsRes = await fetch(`${API_BASE}/api/products`, {
          headers: authHeader,
        });
        if (productsRes.status === 401) return handleSessionExpired();

        if (productsRes.ok) {
          const data = await productsRes.json();
          const mappedProducts = data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name ?? p.nombre,
            price: p.price ?? p.precio,
            stock: p.stock,
            category: p.description ?? p.descripcion,
            image: p.imageUrl ? `${API_BASE}/images/${p.imageUrl}` : "",
            wholesalePrice: p.wholesalePrice
              ? {
                  quantity: p.wholesaleMinimumAmount ?? 10,
                  price: p.wholesalePrice,
                }
              : undefined,
          }));
          setProducts(mappedProducts);
        }

        // Coupons
        const couponsRes = await fetch(`${API_BASE}/api/coupons`, {
          headers: authHeader,
        });
        if (couponsRes.status === 401) return handleSessionExpired();

        if (couponsRes.ok) {
          const data = await couponsRes.json();
          const mappedCoupons = data.map((c: any) => ({
            ...c,
            id: c.id.toString(),
            compra_minima: c.compraMinima,
            valido_mayorista: c.validoMayorista,
          }));
          setCoupons(mappedCoupons);
        }

        // Orders
        const ordersRes = await fetch(`${API_BASE}/api/orders`, {
          headers: authHeader,
        });
        if (ordersRes.status === 401) return handleSessionExpired();

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const mappedOrders = data.map((o: any) => ({
            id: o.id.toString(),
            customer: o.nombreComprador + " " + o.apellidoComprador,
            total: o.total,
            status: o.estadoPedido,
            date: new Date(o.fechaCreacion).toLocaleDateString(),
            metodo_pago: o.metodoPago,
          }));
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Critical error fetching admin data:", err);
      }
    };

    fetchData();
  }, [adminToken]);

  const getAuthHeaders = (contentType: string | null = "application/json") => {
    const headers: Record<string, string> = {};
    if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
    if (contentType) headers["Content-Type"] = contentType;
    return headers;
  };

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
        headers: getAuthHeaders(null),
      });
      if (res.ok) {
        const data = await res.json();
        setProductForm((prev) => ({
          ...prev,
          image: `${API_BASE}/images/${data.fileName}`,
        }));
      } else {
        showError(
          "¡Ups!",
          "No pudimos subir la imagen. Probá con otra o intentá más tarde.",
        );
      }
    } catch (error) {
      console.error(error);
      showError(
        "Problema de conexión",
        "Parece que hay un problema con internet y no pudimos subir la imagen.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    const selectedCategory = categories.find(
      (c) => c.nombre === productForm.category,
    );
    const backendProduct = {
      Name: productForm.name,
      Price: productForm.price,
      Stock: productForm.stock,
      Description: productForm.name, // O una descripción real si la tienes
      ImagePath: productForm.image ? productForm.image.split("/").pop() : null, // Solo el nombre del archivo
      WholesalePrice: (productForm.price ?? 0) * 0.8,
      MinimumWholesaleAmount: 10,
      CategoryId: selectedCategory?.id ?? 0,
      Active: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(backendProduct),
      });

      if (res.ok) {
        const created = await res.json();
        const newProduct = {
          id: created.id.toString(),
          name: created.name ?? created.nombre,
          price: created.price ?? created.precio,
          stock: created.stock,
          category: created.description ?? created.descripcion,
          image: created.imageUrl
            ? `${API_BASE}/images/${created.imageUrl}`
            : "",
          wholesalePrice: created.wholesalePrice
            ? {
                quantity: created.wholesaleMinimumAmount ?? 10,
                price: created.wholesalePrice,
              }
            : undefined,
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
        showSuccess("¡Listo!", "El producto se guardó correctamente.");
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "No se pudo guardar",
          err.title ||
            "Hubo un problema al intentar guardar el producto. Por favor, revisá los datos.",
        );
      }
    } catch (e) {
      console.error(e);
      showError(
        "Problema de red",
        "No pudimos conectar con el servidor. Revisá tu conexión.",
      );
    }
  };

  const handleDeleteProduct = async (id: string) => {
    showConfirm(
      "¿Borrar producto?",
      "¿Estás seguro de que querés borrar este producto? Esta acción no se puede deshacer.",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(null),
          });
          if (res.ok) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            showSuccess("¡Borrado!", "El producto ya no está en la lista.");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(
              "No se pudo borrar",
              errorData.title ||
                "Hubo un problema al intentar eliminar el producto.",
            );
          }
        } catch (e) {
          console.error(e);
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
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
        headers: getAuthHeaders(),
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
        showSuccess("¡Listo!", "El cupón se guardó correctamente.");
      }
    } catch (e) {
      console.error(e);
      showError(
        "Problema de red",
        "No pudimos guardar el cupón. Revisá tu conexión.",
      );
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    showConfirm(
      "¿Borrar cupón?",
      "¿Estás seguro de que querés eliminar este cupón?",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/coupons/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(null),
          });
          if (res.ok) {
            setCoupons((prev) => prev.filter((c) => c.id !== id));
            showSuccess("¡Listo!", "El cupón fue eliminado.");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(
              "No se pudo borrar",
              errorData.title || "Hubo un problema al borrar el cupón.",
            );
          }
        } catch (e) {
          console.error(e);
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
  };

  const setCF = (field: keyof Omit<Coupon, "id">, value: unknown) => {
    setCouponForm((f) => ({ ...f, [field]: value }));
  };

  // Carousel handlers
  const handleCarouselImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCarousel(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(null),
      });
      if (res.ok) {
        const data = await res.json();
        setCarouselForm((prev) => ({ ...prev, imagenNombre: data.fileName }));
      } else {
        showError("¡Ups!", "No pudimos subir la imagen.");
      }
    } catch {
      showError("Problema de conexión", "No se pudo subir la imagen.");
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          Id: editingCarouselId || 0,
          Titulo: carouselForm.titulo || null,
          Subtitulo: carouselForm.subtitulo || null,
          ImagenNombre: carouselForm.imagenNombre,
          Orden: carouselForm.orden,
          Activo: carouselForm.activo,
        }),
      });
      if (res.ok) {
        const saved: CarouselImage = await res.json();

        // Actualizamos la lista y re-normalizamos
        let updatedCarousel: CarouselImage[];
        if (editingCarouselId) {
          updatedCarousel = carouselImages.map((img) =>
            img.id === editingCarouselId ? saved : img,
          );
        } else {
          updatedCarousel = [...carouselImages, saved];
        }

        const normalized = updatedCarousel
          .sort((a, b) => a.orden - b.orden)
          .map((img, i) => ({ ...img, orden: i + 1 }));

        setCarouselImages(normalized);

        // Sincronizar si hubo cambios en otros
        if (
          !editingCarouselId ||
          normalized.some((img, i) => updatedCarousel[i]?.orden !== img.orden)
        ) {
          fetch(`${API_BASE}/api/carousel/reorder`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(normalized),
          });
        }

        setCarouselForm(EMPTY_CAROUSEL);
        setShowCarouselForm(false);
        setEditingCarouselId(null);
        showSuccess(
          "¡Listo!",
          "La imagen del carousel se guardó correctamente.",
        );
      } else {
        showError(
          "No se pudo guardar",
          "Hubo un problema al guardar la imagen.",
        );
      }
    } catch {
      showError("Problema de red", "No pudimos conectar con el servidor.");
    }
  };

  const handleReorderCarousel = async (newOrder: CarouselImage[]) => {
    const updatedWithOrder = newOrder.map((img, index) => ({
      ...img,
      orden: index + 1,
    }));
    setCarouselImages(updatedWithOrder);

    try {
      const res = await fetch(`${API_BASE}/api/carousel/reorder`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedWithOrder),
      });
      if (!res.ok) {
        showError("Error", "No se pudo guardar el nuevo orden del carousel.");
      }
    } catch {
      showError("Error de red", "No se pudo conectar con el servidor.");
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

    // Scroll al inicio del panel de contenido
    setTimeout(() => {
      document
        .getElementById("admin-main-content")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleDeleteCarouselImage = async (id: number) => {
    showConfirm(
      "¿Borrar imagen?",
      "¿Estás seguro de que querés quitar esta imagen del carousel?",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/carousel/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(null),
          });
          if (res.ok) {
            setCarouselImages((prev) => {
              const filtered = prev.filter((img) => img.id !== id);
              const normalized = filtered
                .sort((a, b) => a.orden - b.orden)
                .map((img, i) => ({ ...img, orden: i + 1 }));

              // Sincronizar
              fetch(`${API_BASE}/api/carousel/reorder`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(normalized),
              });

              return normalized;
            });
            showSuccess("¡Listo!", "La imagen fue quitada del carousel.");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(
              "No se pudo borrar",
              errorData.title || "Hubo un problema al eliminar la imagen.",
            );
          }
        } catch {
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
  };

  const handleToggleCarousel = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/carousel/${id}/toggle`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ activo: !current }),
      });
      if (res.ok) {
        setCarouselImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, activo: !current } : img,
          ),
        );
      }
    } catch {
      console.error("Error al cambiar estado");
    }
  };

  // Category handlers
  const handleCategoryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCategory(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(null),
      });
      if (res.ok) {
        const data = await res.json();
        setCategoryForm((prev) => ({ ...prev, imagenNombre: data.fileName }));
      } else {
        showError("¡Ups!", "No pudimos subir la imagen de la categoría.");
      }
    } catch {
      showError(
        "Problema de conexión",
        "No se pudo conectar para subir la imagen.",
      );
    } finally {
      setIsUploadingCategory(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      const url = editingCategoryId
        ? `${API_BASE}/api/categories/${editingCategoryId}`
        : `${API_BASE}/api/categories`;

      const method = editingCategoryId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryForm),
      });

      if (res.ok) {
        const saved: Category = await res.json();

        // Actualizamos la lista y re-normalizamos el orden de todas
        let updatedCategories: Category[];
        if (editingCategoryId) {
          updatedCategories = categories.map((c) =>
            c.id === editingCategoryId ? saved : c,
          );
        } else {
          updatedCategories = [...categories, saved];
        }

        // Ordenar por el orden actual y re-asignar 1, 2, 3... para evitar saltos
        const normalized = updatedCategories
          .sort((a, b) => a.orden - b.orden)
          .map((c, i) => ({ ...c, orden: i + 1 }));

        setCategories(normalized);

        // Si hubo cambios en los números de orden de otros, los sincronizamos
        if (
          !editingCategoryId ||
          normalized.some((c, i) => updatedCategories[i]?.orden !== c.orden)
        ) {
          fetch(`${API_BASE}/api/categories/reorder`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(normalized),
          });
        }

        setCategoryForm(EMPTY_CATEGORY);
        setShowCategoryForm(false);
        setEditingCategoryId(null);
        showSuccess("¡Listo!", "La categoría se guardó correctamente.");
      } else {
        showError(
          "No se pudo guardar",
          "Hubo un problema al guardar la categoría.",
        );
      }
    } catch {
      showError("Problema de red", "No pudimos conectar con el servidor.");
    }
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      nombre: cat.nombre,
      imagenNombre: cat.imagenNombre ?? "",
      orden: cat.orden,
      activo: cat.activo,
    });
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
    // Scroll al inicio del panel de contenido
    setTimeout(() => {
      document
        .getElementById("admin-main-content")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleDeleteCategory = async (id: number) => {
    showConfirm(
      "¿Borrar categoría?",
      "¿Estás seguro de que querés eliminar esta categoría?",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/categories/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(null),
          });
          if (res.ok) {
            // Quitamos la borrada y re-normalizamos las demás
            setCategories((prev) => {
              const filtered = prev.filter((c) => c.id !== id);
              const normalized = filtered
                .sort((a, b) => a.orden - b.orden)
                .map((c, i) => ({ ...c, orden: i + 1 }));

              // Sincronizamos el nuevo orden con el servidor
              fetch(`${API_BASE}/api/categories/reorder`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(normalized),
              });

              return normalized;
            });
            showSuccess("¡Listo!", "La categoría fue eliminada.");
          } else {
            const errorData = await res.json().catch(() => ({}));
            showError(
              "No se pudo borrar",
              errorData.title ||
                "Hubo un problema al intentar borrar la categoría.",
            );
          }
        } catch {
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
  };

  const handleToggleCategory = async (cat: Category) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${cat.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...cat,
          activo: !cat.activo,
        }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, activo: !cat.activo } : c,
          ),
        );
      }
    } catch {
      console.error("Error al cambiar estado");
    }
  };

  const handleReorderCategories = async (newOrder: Category[]) => {
    // Actualizamos el estado local inmediatamente para que el movimiento sea fluido
    const updatedWithOrder = newOrder.map((cat, index) => ({
      ...cat,
      orden: index + 1,
    }));
    setCategories(updatedWithOrder);

    try {
      const res = await fetch(`${API_BASE}/api/categories/reorder`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedWithOrder),
      });
      if (!res.ok) {
        showError("Error", "No se pudo guardar el nuevo orden en el servidor.");
      }
    } catch {
      showError(
        "Error de red",
        "No se pudo conectar con el servidor para guardar el orden.",
      );
    }
  };

  const navItems = [
    { id: "products" as AdminView, icon: Package, label: "Productos" },
    { id: "promotions" as AdminView, icon: Tag, label: "Cupones" },
    { id: "orders" as AdminView, icon: ShoppingBag, label: "Pedidos" },
    { id: "carousel" as AdminView, icon: ImageIcon, label: "Carousel" },
    { id: "categories" as AdminView, icon: Layers, label: "Categorías" },
  ];

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar border-r border-sidebar-border p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <img
            src={logo}
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
      <main id="admin-main-content" className="flex-1 p-8 overflow-auto">
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
                      <select
                        value={productForm.category || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.nombre}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
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
                <h1 style={{ fontFamily: "Georgia, serif" }}>
                  Imágenes del Carousel
                </h1>
                <button
                  id="new-carousel-btn"
                  onClick={() => {
                    if (showCarouselForm) {
                      setEditingCarouselId(null);
                      setCarouselForm(EMPTY_CAROUSEL);
                    }
                    setShowCarouselForm((v) => !v);
                  }}
                  disabled={
                    carouselImages.length >= 10 &&
                    !showCarouselForm &&
                    !editingCarouselId
                  }
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showCarouselForm ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showCarouselForm ? "Cancelar" : "Nueva Imagen"}
                </button>
              </div>

              {carouselImages.length >= 10 && !showCarouselForm && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Límite alcanzado
                    </p>
                    <p className="text-xs text-amber-800">
                      Has alcanzado el máximo de 10 imágenes. Para agregar una
                      nueva, primero debes eliminar alguna de las existentes.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900">
                    Consejo de rendimiento
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Aunque puedes tener hasta 10 imágenes, te recomendamos
                    mantener entre <b>3 y 5 imágenes activas</b>. Tener
                    demasiadas imágenes puede hacer que la página cargue más
                    lento para tus clientes, especialmente en celulares.
                  </p>
                </div>
              </div>

              {showCarouselForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3
                    className="mb-5 text-base"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {editingCarouselId
                      ? "Editar imagen del carousel"
                      : "Agregar imagen al carousel"}
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
                          <span className="text-sm text-primary font-medium animate-pulse">
                            Subiendo...
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Título</label>
                      <input
                        value={carouselForm.titulo ?? ""}
                        onChange={(e) =>
                          setCarouselForm((p) => ({
                            ...p,
                            titulo: e.target.value,
                          }))
                        }
                        placeholder="Ej: Tradición y Calidad"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Subtítulo</label>
                      <input
                        value={carouselForm.subtitulo ?? ""}
                        onChange={(e) =>
                          setCarouselForm((p) => ({
                            ...p,
                            subtitulo: e.target.value,
                          }))
                        }
                        placeholder="Ej: Más de 70 años llevando lo mejor de la naturaleza"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={carouselForm.activo}
                          onChange={(e) =>
                            setCarouselForm((p) => ({
                              ...p,
                              activo: e.target.checked,
                            }))
                          }
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
                      disabled={
                        !carouselForm.imagenNombre || isUploadingCarousel
                      }
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm"
                    >
                      {editingCarouselId
                        ? "Actualizar cambios"
                        : "Guardar imagen"}
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-secondary/10 p-4 rounded-xl mb-6 flex items-center gap-3 border border-border/50">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Podes <b>arrastrar y soltar</b> las imágenes para cambiar su
                  orden en el carousel de la tienda.
                </p>
              </div>

              <Reorder.Group
                axis="y"
                values={carouselImages}
                onReorder={handleReorderCarousel}
                className="space-y-4 relative z-0"
                style={{ isolation: "isolate" }}
              >
                {carouselImages.length === 0 ? (
                  <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground">
                      No hay imágenes en el carousel aún.
                    </p>
                  </div>
                ) : (
                  carouselImages.map((img) => (
                    <Reorder.Item
                      key={img.id}
                      value={img}
                      className={`relative group bg-white rounded-2xl border border-border overflow-hidden shadow-sm ${!img.activo && "opacity-70 grayscale-[0.5]"} cursor-grab active:cursor-grabbing`}
                      transition={{
                        type: "spring",
                        stiffness: 800,
                        damping: 50,
                      }}
                      whileDrag={{
                        scale: 1.03,
                        zIndex: 999,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.3)",
                      }}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-64 aspect-[21/9] md:aspect-video bg-secondary overflow-hidden flex-shrink-0">
                          {img.imagenNombre ? (
                            <img
                              src={`${API_BASE}/images/${img.imagenNombre}`}
                              alt={img.titulo || "Carousel"}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 opacity-10" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                              <GripVertical className="w-3 h-3" />
                              Orden {img.orden}
                            </span>
                            {!img.activo && (
                              <span className="bg-destructive/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                Inactiva
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3
                                className="text-lg font-medium"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                {img.titulo || "Sin título"}
                              </h3>
                              {img.subtitulo && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {img.subtitulo}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCarousel(img)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCarouselImage(img.id)
                                }
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <button
                              onClick={() =>
                                handleToggleCarousel(img.id, img.activo)
                              }
                              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${img.activo ? "text-accent hover:text-accent/80" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {img.activo ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                              {img.activo ? "ACTIVA" : "INACTIVA"}
                            </button>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GripVertical className="w-5 h-5 opacity-30" />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                                Arrastrar para reordenar
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))
                )}
              </Reorder.Group>
            </div>
          )}
          {/* CATEGORIAS */}
          {currentView === "categories" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 style={{ fontFamily: "Georgia, serif" }}>
                  Gestión de Categorías
                </h1>
                <button
                  id="new-category-btn"
                  onClick={() => {
                    if (showCategoryForm) {
                      setCategoryForm(EMPTY_CATEGORY);
                      setEditingCategoryId(null);
                    }
                    setShowCategoryForm(!showCategoryForm);
                  }}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  {showCategoryForm ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showCategoryForm ? "Cancelar" : "Nueva Categoría"}
                </button>
              </div>

              {showCategoryForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
                  <h3
                    className="mb-5 text-base"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {editingCategoryId ? "Editar categoría" : "Crear categoría"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5 font-medium">
                        Nombre de la categoría *
                      </label>
                      <input
                        value={categoryForm.nombre}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            nombre: e.target.value,
                          })
                        }
                        placeholder="Ej: Harinas, Frutos Secos..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-2 font-medium">
                        Imagen de la categoría
                      </label>
                      <div className="flex items-start gap-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
                        {categoryForm.imagenNombre ? (
                          <div className="relative group">
                            <img
                              src={`${API_BASE}/images/${categoryForm.imagenNombre}`}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-border shadow-md"
                            />
                            <button
                              onClick={() =>
                                setCategoryForm({
                                  ...categoryForm,
                                  imagenNombre: "",
                                })
                              }
                              className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-background">
                            <ImageIcon className="w-8 h-8 opacity-20 mb-1" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">
                              Sin imagen
                            </span>
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Sube una imagen representativa para esta categoría.
                            Se mostrará en el grid de la página principal.
                          </p>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCategoryImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm hover:bg-secondary transition-colors w-full md:w-auto">
                              <ImageIcon className="w-4 h-4" />
                              {isUploadingCategory
                                ? "Subiendo..."
                                : "Seleccionar imagen"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                    <button
                      onClick={() => {
                        setShowCategoryForm(false);
                        setEditingCategoryId(null);
                        setCategoryForm(EMPTY_CATEGORY);
                      }}
                      className="px-5 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCategory}
                      disabled={!categoryForm.nombre || isUploadingCategory}
                      className="px-8 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                    >
                      {editingCategoryId ? "Actualizar" : "Crear Categoría"}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-secondary/10 p-4 rounded-xl mb-6 flex items-center gap-3 border border-border/50">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Podes <b>arrastrar y soltar</b> las categorías para cambiar su
                  orden de visualización en la tienda.
                </p>
              </div>

              <Reorder.Group
                axis="y"
                values={categories}
                onReorder={handleReorderCategories}
                className="space-y-4 relative z-0"
                style={{ isolation: "isolate" }}
              >
                {categories.length === 0 ? (
                  <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border">
                    <Layers className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground">
                      No hay categorías creadas aún.
                    </p>
                  </div>
                ) : (
                  categories.map((cat) => (
                    <Reorder.Item
                      key={cat.id}
                      value={cat}
                      className={`relative group bg-white rounded-2xl border border-border overflow-hidden shadow-sm ${!cat.activo && "opacity-70 grayscale-[0.5]"} cursor-grab active:cursor-grabbing`}
                      transition={{
                        type: "spring",
                        stiffness: 800,
                        damping: 50,
                      }}
                      whileDrag={{
                        scale: 1.03,
                        zIndex: 999,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.3)",
                      }}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 aspect-[16/10] md:aspect-square bg-secondary overflow-hidden flex-shrink-0">
                          {cat.imagenNombre ? (
                            <img
                              src={`${API_BASE}/images/${cat.imagenNombre}`}
                              alt={cat.nombre}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 opacity-10" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">
                              <GripVertical className="w-3 h-3" />
                              Orden {cat.orden}
                            </span>
                            {!cat.activo && (
                              <span className="bg-destructive/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                Inactiva
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <h3
                              className="text-lg font-medium"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {cat.nombre}
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCategory(cat)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <button
                              onClick={() => handleToggleCategory(cat)}
                              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${cat.activo ? "text-accent hover:text-accent/80" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {cat.activo ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                              {cat.activo ? "ACTIVA" : "INACTIVA"}
                            </button>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GripVertical className="w-5 h-5 opacity-30" />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                                Arrastrar para reordenar
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))
                )}
              </Reorder.Group>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
