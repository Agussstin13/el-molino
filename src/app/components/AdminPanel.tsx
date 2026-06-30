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
  Upload,
  Percent,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Hash,
  Truck,
  Save,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { useSignalR } from "../context/SignalRContext";
import { formatARS, formatInputPrice, parseInputPrice } from "../../lib/price";
import type {
  CarouselImage,
  Category,
  Coupon,
  Order,
  Product,
} from "../../lib/types";
const API_BASE = import.meta.env.VITE_API_BASE;

type AdminView =
  | "products"
  | "promotions"
  | "orders"
  | "carousel"
  | "categories"
  | "daily-offers"
  | "shipping";

const EMPTY_CAROUSEL: Omit<CarouselImage, "id"> = {
  imagenNombre: "",
  titulo: "",
  subtitulo: "",
  orden: 0,
  activo: true,
  redirectUrl: "",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  pendiente: "bg-amber-100 text-amber-700",
  en_preparacion: "bg-blue-100 text-blue-700",
  enviado: "bg-indigo-100 text-indigo-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-500",
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
};

export function AdminPanel() {
  const { logout, adminToken } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>("products");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] =
    useState<Omit<Coupon, "id">>(EMPTY_COUPON);
  const [tipoDescuento, setTipoDescuento] = useState<"monto" | "porcentaje">(
    "porcentaje",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0 as string | number,
    stock: 0,
    category: "",
    enableWholesale: false,
    wholesalePrice: 0 as string | number,
    minimumWholesaleAmount: 10,
    enableOffer: false,
    offerPrice: 0 as string | number,
    measurementUnit: "unidad" as "unidad" | "gramo",
    gramages: [] as number[], // lista de gramos: [250, 500, 1000]
    newGramageInput: "", // input temporal para agregar un gramaje
    active: true,
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Carousel state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [showCarouselForm, setShowCarouselForm] = useState(false);
  const [carouselForm, setCarouselForm] =
    useState<Omit<CarouselImage, "id">>(EMPTY_CAROUSEL);
  const [carouselImageFile, setCarouselImageFile] = useState<File | null>(null);
  const [carouselImagePreview, setCarouselImagePreview] = useState<string>("");
  const [editingCarouselId, setEditingCarouselId] = useState<number | null>(
    null,
  );
  const [ordersFilter, setOrdersFilter] = useState<
    | "todos"
    | "pendientes"
    | "en_preparacion"
    | "enviados"
    | "entregados"
    | "cancelados"
  >("pendientes");

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const { showError, showSuccess, showConfirm } = useAlert();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] =
    useState<Omit<Category, "id">>(EMPTY_CATEGORY);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  // Daily offers state
  const [offersDraft, setOffersDraft] = useState<
    Record<string, { active: boolean; offerPrice: string | number }>
  >({});
  const [offersSearchQuery, setOffersSearchQuery] = useState("");
  const [offersFilter, setOffersFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isSavingOffers, setIsSavingOffers] = useState(false);

  // Shipping state
  interface ShippingRateAdmin {
    id: number;
    desdeKm: number;
    hastaKm: number;
    precio: number;
    activo: boolean;
  }
  const [shippingRates, setShippingRates] = useState<ShippingRateAdmin[]>([]);
  const [umbralEnvioGratis, setUmbralEnvioGratis] = useState<string>("5000");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [editingShippingId, setEditingShippingId] = useState<number | null>(
    null,
  );
  const [shippingForm, setShippingForm] = useState({
    desdeKm: "",
    hastaKm: "",
    precio: "",
    activo: true,
  });
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  const { lastProductsUpdate, lastCategoriesUpdate } = useSignalR();

  useEffect(() => {
    document.title = "El Molino - Admin";
    if (currentView === "daily-offers") {
      const initialDraft: Record<
        string,
        { active: boolean; offerPrice: string | number }
      > = {};
      products.forEach((p) => {
        initialDraft[p.id] = {
          active: p.offerPrice != null,
          offerPrice: p.offerPrice ? formatInputPrice(p.offerPrice) : "",
        };
      });
      setOffersDraft(initialDraft);
    }
    if (currentView === "shipping") {
      fetchShippingRates();
    }
  }, [currentView, products]);

  const handleToggleOfferDraft = (productId: string) => {
    setOffersDraft((prev) => {
      const current = prev[productId] || { active: false, offerPrice: "" };
      const nextActive = !current.active;

      let nextOfferPrice = current.offerPrice;
      if (nextActive && !nextOfferPrice) {
        const prod = products.find((p) => p.id === productId);
        if (prod) {
          const suggested = Math.round(prod.price * 0.9);
          nextOfferPrice = formatInputPrice(suggested);
        }
      } else if (!nextActive) {
        nextOfferPrice = "";
      }

      return {
        ...prev,
        [productId]: {
          active: nextActive,
          offerPrice: nextOfferPrice,
        },
      };
    });
  };

  const handleOfferPriceDraftChange = (productId: string, value: string) => {
    setOffersDraft((prev) => {
      const current = prev[productId] || { active: false, offerPrice: "" };
      return {
        ...prev,
        [productId]: {
          ...current,
          offerPrice: formatInputPrice(value),
        },
      };
    });
  };

  const getDiscountPercentage = (productId: string): number | null => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return null;

    const draft = offersDraft[productId];
    if (!draft || !draft.active) return null;

    const offerVal = parseInputPrice(draft.offerPrice);
    if (offerVal <= 0 || offerVal >= prod.price) return null;

    const discount = ((prod.price - offerVal) / prod.price) * 100;
    return Math.round(discount);
  };

  const getAverageDiscount = (): number => {
    let sum = 0;
    let count = 0;
    products.forEach((p) => {
      const draft = offersDraft[p.id];
      if (draft && draft.active) {
        const offerVal = parseInputPrice(draft.offerPrice);
        if (offerVal > 0 && offerVal < p.price) {
          sum += ((p.price - offerVal) / p.price) * 100;
          count++;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  };

  const handleSaveDailyOffers = async () => {
    const dirtyProducts = products.filter((p) => {
      const draft = offersDraft[p.id];
      if (!draft) return false;
      const parsedDraftPrice = parseInputPrice(draft.offerPrice);
      const currentOfferActive = p.offerPrice != null;
      const draftOfferActive = draft.active;
      const isStatusChanged = draftOfferActive !== currentOfferActive;
      const isPriceChanged = parsedDraftPrice !== (p.offerPrice ?? 0);
      return isStatusChanged || (draftOfferActive && isPriceChanged);
    });

    if (dirtyProducts.length === 0) {
      showError(
        "Sin cambios",
        "No se detectaron modificaciones en las ofertas.",
      );
      return;
    }

    for (const p of dirtyProducts) {
      const draft = offersDraft[p.id];
      if (draft.active) {
        const parsedDraftPrice = parseInputPrice(draft.offerPrice);
        if (parsedDraftPrice >= p.price) {
          showError(
            "Error de precio",
            `El producto "${p.name}" tiene un precio de oferta (${formatARS(parsedDraftPrice)}) mayor o igual a su precio normal (${formatARS(p.price)}).`,
          );
          return;
        }
        if (p.wholesalePrice && parsedDraftPrice <= p.wholesalePrice.price) {
          showError(
            "Error en promoción",
            `El producto "${p.name}" tiene un precio de oferta (${formatARS(parsedDraftPrice)}) menor o igual a su precio mayorista (${formatARS(p.wholesalePrice.price)}).`,
          );
          return;
        }
      }
    }

    setIsSavingOffers(true);
    let successCount = 0;
    let failCount = 0;

    for (const p of dirtyProducts) {
      const draft = offersDraft[p.id];
      const parsedDraftPrice = parseInputPrice(draft.offerPrice);

      const formData = new FormData();
      formData.append("Id", p.id);
      formData.append("Name", p.name);
      formData.append("Description", p.description || "");
      formData.append("Price", String(p.price));
      formData.append("Stock", String(p.stock));
      formData.append("CategoryId", String(p.categoryId));
      formData.append("Active", String(p.active));
      formData.append("MeasurementUnit", p.measurementUnit ?? "unidad");

      if (p.measurementUnit === "gramo" && Array.isArray(p.gramages)) {
        p.gramages.forEach((g: any) => {
          const gramsVal = typeof g === "number" ? g : g.grams;
          if (gramsVal) {
            formData.append("Gramages", String(gramsVal));
          }
        });
      }

      // Si la oferta está activa, enviamos el precio; si no, no enviamos nada (backend lo pone en null)
      if (draft.active && parsedDraftPrice > 0) {
        formData.append("OfferPrice", String(parsedDraftPrice));
      }

      if (p.wholesalePrice) {
        formData.append("WholesalePrice", String(p.wholesalePrice.price));
        formData.append(
          "MinimumWholesaleAmount",
          String(p.wholesalePrice.quantity),
        );
      }

      if (p.imagePath) {
        formData.append("ExistingImagePath", p.imagePath);
      }

      try {
        const res = await fetch(`${API_BASE}/api/products/${p.id}`, {
          method: "PUT",
          headers: getAuthHeaders(null),
          body: formData,
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Refresh products list
    try {
      const productsRes = await fetch(`${API_BASE}/api/products`, {
        headers: getAuthHeaders(null),
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        const mapped = data.map((p: any) => ({
          id: p.id.toString(),
          name: p.name ?? p.nombre,
          price: p.price ?? p.precio,
          stock: p.stock,
          description: p.description ?? "",
          category: p.categoryName ?? "",
          categoryId: p.categoryId ?? p.categoriaId,
          image: imgUrl(p.imagePath ?? p.imageUrl ?? ""),
          imagePath: p.imagePath ?? p.imageUrl ?? "",
          active: p.active ?? true,
          offerPrice: p.offerPrice ?? null,
          onOffer: p.offerPrice != null,
          measurementUnit: p.measurementUnit ?? "unidad",
          gramages: Array.isArray(p.gramages) ? p.gramages : [],
          wholesalePrice: p.wholesalePrice
            ? {
                quantity: p.minimumWholesaleAmount ?? 10,
                price: p.wholesalePrice,
              }
            : undefined,
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Error refreshing products:", err);
    }

    setIsSavingOffers(false);
    if (failCount === 0) {
      showSuccess(
        "¡Ofertas guardadas!",
        `Se actualizaron con éxito las ofertas de ${successCount} producto(s).`,
      );
    } else if (successCount > 0) {
      showSuccess(
        "Guardado parcial",
        `Se actualizaron ${successCount} ofertas, pero fallaron ${failCount}.`,
      );
    } else {
      showError(
        "Error",
        "No se pudo actualizar ninguna de las ofertas modificadas.",
      );
    }
  };

  // ── Shipping handlers ──────────────────────────────────────────────────────
  const fetchShippingRates = async () => {
    try {
      const [ratesRes, configRes] = await Promise.all([
        fetch(`${API_BASE}/api/shipping`, { headers: getAuthHeaders(null) }),
        fetch(`${API_BASE}/api/shipping/config`, {
          headers: getAuthHeaders(null),
        }),
      ]);
      if (ratesRes.ok) setShippingRates(await ratesRes.json());
      if (configRes.ok) {
        const cfg = await configRes.json();
        setUmbralEnvioGratis(String(cfg.umbralEnvioGratis ?? 5000));
      }
    } catch (e) {
      console.error("Error fetching shipping config:", e);
    }
  };

  const handleSaveShippingRate = async () => {
    const desde = 0; // Hardcode since we only use Hasta
    const hasta = parseFloat(shippingForm.hastaKm);
    const precio = parseFloat(
      shippingForm.precio.replace(/\./g, "").replace(",", "."),
    );

    if (isNaN(hasta) || isNaN(precio)) {
      showError("Datos incompletos", "Completá todos los campos del tramo.");
      return;
    }
    if (hasta <= 0) {
      showError("Rango inválido", "El km máximo debe ser mayor a 0.");
      return;
    }

    setIsSavingShipping(true);
    try {
      const payload = {
        id: editingShippingId ?? 0,
        desdeKm: desde,
        hastaKm: hasta,
        precio,
        activo: shippingForm.activo,
      };
      const url = editingShippingId
        ? `${API_BASE}/api/shipping/${editingShippingId}`
        : `${API_BASE}/api/shipping`;
      const method = editingShippingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showSuccess(
          "¡Listo!",
          editingShippingId ? "Tramo actualizado." : "Tramo creado.",
        );
        setShowShippingForm(false);
        setEditingShippingId(null);
        setShippingForm({ desdeKm: "", hastaKm: "", precio: "", activo: true });
        fetchShippingRates();
      } else {
        const errorData = await res.json().catch(() => null);
        showError("Error", errorData?.title || "No se pudo guardar el tramo.");
      }
    } catch {
      showError("Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleDeleteShippingRate = async (id: number) => {
    showConfirm(
      "¿Eliminar tramo?",
      "Esta acción no se puede deshacer.",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/shipping/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(null),
          });
          if (res.ok) {
            showSuccess("¡Listo!", "Tramo eliminado.");
            fetchShippingRates();
          } else {
            const err = await res.json().catch(() => ({}));
            showError(
              "Error",
              err.detail ||
                err.title ||
                err.message ||
                "No se pudo eliminar el tramo.",
            );
          }
        } catch {
          showError("Error de red", "No se pudo conectar con el servidor.");
        }
      },
    );
  };

  const handleSaveUmbral = async () => {
    const val = parseFloat(
      umbralEnvioGratis.replace(/\./g, "").replace(",", "."),
    );
    if (isNaN(val) || val < 0) {
      showError("Valor inválido", "Ingresá un monto válido.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/shipping/config/umbral`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(val),
      });
      if (res.ok) {
        showSuccess("¡Listo!", "Umbral de envío gratis actualizado.");
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "Error",
          err.detail ||
            err.title ||
            err.message ||
            "No se pudo guardar el umbral.",
        );
      }
    } catch {
      showError("Error de red", "No se pudo conectar con el servidor.");
    }
  };

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
          // Ordenar por displayOrder (los que tienen 0 van al final) y renumerar
          // siempre de forma secuencial 1, 2, 3... para evitar duplicados
          const sorted = [...data].sort(
            (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
          );
          const mapped: import("../../lib/types").CarouselImage[] = sorted.map(
            (item: any, i: number) => ({
              id: item.id,
              imagenNombre: item.imageUrl ?? "",
              titulo: item.title ?? "",
              subtitulo: item.description ?? "",
              orden: i + 1, // Siempre secuencial para evitar duplicados
              activo: item.active ?? true,
              redirectUrl: item.redirectUrl ?? "",
            }),
          );
          setCarouselImages(mapped);

          // Sincronizar el orden corregido con el backend (arregla datos viejos en la DB)
          if (mapped.length > 0) {
            const backendPayload = mapped.map((img) => ({
              id: img.id,
              imageUrl: img.imagenNombre,
              title: img.titulo ?? null,
              description: img.subtitulo ?? null,
              displayOrder: img.orden,
              active: img.activo,
              redirectUrl: img.redirectUrl ?? null,
              creationDate: new Date().toISOString(),
            }));
            fetch(`${API_BASE}/api/carousel/reorder`, {
              method: "PATCH",
              headers: { ...authHeader, "Content-Type": "application/json" },
              body: JSON.stringify(backendPayload),
            });
          }
        }

        // Categories
        const categoriesRes = await fetch(`${API_BASE}/api/categories/all`, {
          headers: authHeader,
        });
        if (categoriesRes.status === 401) return handleSessionExpired();

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          if (Array.isArray(data)) {
            const sorted = [...data].sort(
              (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
            );
            const mapped = sorted.map((c: any, i: number) => ({
              id: c.id,
              nombre: c.name ?? "",
              imagenNombre: c.imagePath ?? "",
              orden: c.displayOrder > 0 ? c.displayOrder : i + 1,
              activo: c.active ?? true,
            }));
            setCategories(mapped);
          } else {
            setCategories([]);
          }
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
            category: p.categoryName ?? "",
            categoryId: p.categoryId,
            description: p.description ?? "",
            imagePath: p.imagePath ?? p.imageUrl ?? "",
            image: imgUrl(p.imagePath ?? p.imageUrl ?? ""),
            active: p.active ?? true,
            onOffer: p.offerPrice != null,
            offerPrice: p.offerPrice ?? null,
            measurementUnit: p.measurementUnit ?? "unidad",
            gramages: Array.isArray(p.gramages) ? p.gramages : [],
            wholesalePrice: p.wholesalePrice
              ? {
                  quantity: p.minimumWholesaleAmount ?? 10,
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
      } catch (err) {
        console.error("Critical error fetching admin data:", err);
      }
    };

    fetchData();
  }, [adminToken, lastProductsUpdate, lastCategoriesUpdate]);

  React.useEffect(() => {
    if (!adminToken) return;

    const fetchOrders = async () => {
      try {
        const ordersRes = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (ordersRes.status === 401) return handleSessionExpired();

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const mappedOrders = data.map((o: any) => ({
            id: o.id?.toString(),
            customer: o.buyerFirstName + " " + o.buyerLastName,
            total: o.total,
            status: o.orderStatus || o.estadoPedido, // Fallback por las dudas
            date: new Date(o.createdAt || o.fechaCreacion).toLocaleDateString(),
            metodo_pago:
              o.paymentMethod === "mercado_pago"
                ? "mercadopago"
                : o.paymentMethod || o.metodoPago,
            informacion: o.orderInformation,
            telefono: o.buyerPhone,
            dni: o.buyerDocument,
            direccionEnvio: o.shippingAddress,
            estadoPago: o.paymentStatus,
            shippingCost: o.shippingCost,
            items: o.items,
            fechaCreacion: o.createdAt || o.fechaCreacion,
          }));

          // Ordenar de más reciente a más antiguo
          mappedOrders.sort(
            (a: any, b: any) =>
              new Date(b.fechaCreacion).getTime() -
              new Date(a.fechaCreacion).getTime(),
          );

          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10 segundos
    return () => clearInterval(interval);
  }, [adminToken]);

  const getAuthHeaders = (contentType: string | null = "application/json") => {
    const headers: Record<string, string> = {};
    if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
    if (contentType) headers["Content-Type"] = contentType;
    return headers;
  };

  // Construye la URL final de una imagen: el backend puede devolver
  // paths absolutos (/images/carousel/x.jpg) o relativos (carousel/x.jpg)
  const imgUrl = (path: string) =>
    path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`;

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(newStatus),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
        showSuccess(
          "Éxito",
          `El pedido ahora está en estado: ${STATUS_LABELS[newStatus]}`,
        );
      } else {
        const errorData = await res.json().catch(() => null);
        showError(
          "Error",
          errorData?.detail || "No se pudo actualizar el estado.",
        );
      }
    } catch (e) {
      showError("Error", "Error de conexión al actualizar estado.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleNewProductClick = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      enableWholesale: false,
      wholesalePrice: 0,
      minimumWholesaleAmount: 10,
      enableOffer: false,
      offerPrice: 0,
      measurementUnit: "unidad",
      gramages: [],
      newGramageInput: "",
      active: true,
    });
    setProductImageFile(null);
    setProductImagePreview("");
    setShowProductForm(true);
  };

  const handleEditProductClick = (product: any) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || 0,
      stock:
        product.measurementUnit === "gramo"
          ? product.stock / 1000
          : product.stock || 0,
      category: product.category || "",
      enableWholesale: !!product.wholesalePrice,
      wholesalePrice: product.wholesalePrice?.price || 0,
      minimumWholesaleAmount: product.wholesalePrice?.quantity || 10,
      enableOffer: product.offerPrice != null,
      offerPrice: product.offerPrice || 0,
      measurementUnit: product.measurementUnit ?? "unidad",
      gramages: Array.isArray(product.gramages)
        ? product.gramages.map((g: any) => g.grams)
        : [],
      newGramageInput: "",
      active: product.active !== false,
    });
    setProductImagePreview(product.image || "");
    setProductImageFile(null);
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    if (!productImageFile && !productImagePreview) {
      showError(
        "Imagen requerida",
        "El producto debe tener una imagen para poder guardarse.",
      );
      return;
    }

    const selectedCategory = categories.find(
      (c) => c.nombre === productForm.category,
    );

    if (!selectedCategory) {
      showError(
        "Categoría requerida",
        "Por favor selecciona una categoría válida para el producto.",
      );
      return;
    }

    if (
      productForm.measurementUnit === "gramo" &&
      productForm.gramages.length === 0
    ) {
      showError(
        "Faltan presentaciones",
        "Los productos por peso deben incluir al menos un gramaje.",
      );
      return;
    }

    const parsedPrice = parseInputPrice(productForm.price);
    const parsedWholesale = parseInputPrice(productForm.wholesalePrice);
    const parsedOffer = parseInputPrice(productForm.offerPrice);

    if (productForm.enableWholesale && parsedWholesale >= parsedPrice) {
      showError(
        "Error en precio",
        "El precio mayorista debe ser menor al precio normal.",
      );
      return;
    }

    if (
      productForm.enableOffer &&
      parsedOffer > 0 &&
      parsedOffer >= parsedPrice
    ) {
      showError(
        "Error en precio",
        "El precio de oferta debe ser menor al precio normal.",
      );
      return;
    }

    if (
      productForm.enableWholesale &&
      productForm.enableOffer &&
      parsedOffer > 0 &&
      parsedWholesale >= parsedOffer
    ) {
      showError(
        "Error en precio",
        "El precio mayorista debe ser menor al precio de oferta.",
      );
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("Name", productForm.name ?? "");
    formData.append("Description", productForm.description ?? "");
    formData.append("Price", String(parseInputPrice(productForm.price)));

    const finalStock =
      productForm.measurementUnit === "gramo"
        ? (productForm.stock ?? 0) * 1000
        : (productForm.stock ?? 0);
    formData.append("Stock", String(finalStock));

    formData.append("CategoryId", String(selectedCategory.id));
    formData.append("Active", String(productForm.active));
    formData.append("MeasurementUnit", productForm.measurementUnit);

    // Gramajes: solo si es producto por gramo
    if (productForm.measurementUnit === "gramo") {
      productForm.gramages.forEach((g) =>
        formData.append("Gramages", String(g)),
      );
    }

    if (productForm.enableWholesale) {
      formData.append(
        "WholesalePrice",
        String(parseInputPrice(productForm.wholesalePrice)),
      );
      formData.append(
        "MinimumWholesaleAmount",
        String(productForm.minimumWholesaleAmount),
      );
    }

    // La oferta se activa/desactiva enviando o no offerPrice
    if (
      productForm.enableOffer &&
      parseInputPrice(productForm.offerPrice) > 0
    ) {
      formData.append(
        "OfferPrice",
        String(parseInputPrice(productForm.offerPrice)),
      );
    }
    // Si no hay oferta, no enviamos OfferPrice (el backend lo pondrá en null)

    if (productImageFile) {
      formData.append("Image", productImageFile);
    }

    try {
      const url = editingProductId
        ? `${API_BASE}/api/products/${editingProductId}`
        : `${API_BASE}/api/products`;

      const method = editingProductId ? "PUT" : "POST";

      if (editingProductId) {
        formData.append("Id", editingProductId);
        const currentProd = products.find((p) => p.id === editingProductId);
        if (currentProd?.imagePath) {
          formData.append("ExistingImagePath", currentProd.imagePath);
        }
      }

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(null),
        body: formData,
      });

      if (res.ok) {
        const productsRes = await fetch(`${API_BASE}/api/products`, {
          headers: getAuthHeaders(null),
        });
        if (productsRes.ok) {
          const data = await productsRes.json();
          const mapped = data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name ?? p.nombre,
            price: p.price ?? p.precio,
            stock: p.stock,
            description: p.description ?? "",
            category: p.categoryName ?? "",
            categoryId: p.categoryId ?? p.categoriaId,
            image: imgUrl(p.imagePath ?? p.imageUrl ?? ""),
            imagePath: p.imagePath ?? p.imageUrl ?? "",
            active: p.active ?? true,
            offerPrice: p.offerPrice ?? null,
            onOffer: p.offerPrice != null,
            measurementUnit: p.measurementUnit ?? "unidad",
            gramages: Array.isArray(p.gramages) ? p.gramages : [],
            wholesalePrice: p.wholesalePrice
              ? {
                  quantity: p.minimumWholesaleAmount ?? 10,
                  price: p.wholesalePrice,
                }
              : undefined,
          }));
          setProducts(mapped);
        }

        setShowProductForm(false);
        setEditingProductId(null);
        setProductForm({
          name: "",
          description: "",
          price: 0,
          stock: 0,
          category: "",
          enableWholesale: false,
          wholesalePrice: 0,
          minimumWholesaleAmount: 10,
          enableOffer: false,
          offerPrice: 0,
          measurementUnit: "unidad",
          gramages: [],
          newGramageInput: "",
          active: true,
        });
        setProductImageFile(null);
        setProductImagePreview("");
        showSuccess(
          "¡Listo!",
          `El producto se ${editingProductId ? "actualizó" : "creó"} correctamente.`,
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          `No se pudo ${editingProductId ? "actualizar" : "guardar"}`,
          err.detail ||
            err.title ||
            `Hubo un problema al intentar ${editingProductId ? "actualizar" : "guardar"} el producto.`,
        );
      }
    } catch (e) {
      console.error(e);
      showError(
        "Problema de red",
        "No pudimos conectar con el servidor. Revisá tu conexión.",
      );
    } finally {
      setIsSaving(false);
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
            const text = await res.text().catch(() => "");
            const isForeignKey =
              text.includes("23503") ||
              text.toLowerCase().includes("fk_") ||
              text.toLowerCase().includes("foreign key");
            if (isForeignKey) {
              showError(
                "No se puede eliminar este producto",
                "Este producto forma parte de uno o más pedidos existentes. Para proteger el historial de ventas no es posible eliminarlo. Podés desactivarlo desde la columna de estado para ocultarlo de la tienda.",
              );
            } else {
              const errorData = (() => {
                try {
                  return JSON.parse(text);
                } catch {
                  return {};
                }
              })();
              showError(
                "No se pudo borrar",
                errorData.title ||
                  "Hubo un problema al intentar eliminar el producto.",
              );
            }
          }
        } catch {
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
  };

  const handleSaveCoupon = async () => {
    if (
      tipoDescuento === "porcentaje" &&
      (!couponForm.porcentaje || couponForm.porcentaje <= 0)
    ) {
      showError(
        "Datos inválidos",
        "El porcentaje de descuento debe ser mayor a 0.",
      );
      return;
    }

    if (tipoDescuento === "monto") {
      if (!couponForm.monto || couponForm.monto <= 0) {
        showError(
          "Datos inválidos",
          "El monto de descuento debe ser mayor a 0.",
        );
        return;
      }
      if (
        couponForm.compra_minima !== null &&
        couponForm.compra_minima !== undefined
      ) {
        if (couponForm.monto >= couponForm.compra_minima) {
          showError(
            "Datos inválidos",
            "El monto de descuento debe ser estrictamente menor que la compra mínima.",
          );
          return;
        }
      }
    }

    if (
      couponForm.compra_minima !== null &&
      couponForm.compra_minima !== undefined &&
      couponForm.compra_minima <= 0
    ) {
      showError("Datos inválidos", "La compra mínima debe ser mayor a 0.");
      return;
    }

    if (
      tipoDescuento === "porcentaje" &&
      couponForm.tope !== null &&
      couponForm.tope !== undefined
    ) {
      if (couponForm.tope <= 0) {
        showError(
          "Datos inválidos",
          "El tope máximo de descuento debe ser mayor a 0.",
        );
        return;
      }

      if (
        couponForm.compra_minima !== null &&
        couponForm.compra_minima !== undefined &&
        couponForm.tope > couponForm.compra_minima
      ) {
        showError(
          "Datos inválidos",
          "El tope máximo de descuento no puede ser mayor que la compra mínima.",
        );
        return;
      }
    }

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
      const url = editingCouponId
        ? `${API_BASE}/api/coupons/${editingCouponId}`
        : `${API_BASE}/api/coupons`;
      const method = editingCouponId ? "PUT" : "POST";
      const payload = editingCouponId
        ? { ...backendCoupon, id: parseInt(editingCouponId) }
        : backendCoupon;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (editingCouponId) {
          const updatedCoupon: Coupon = {
            ...couponForm,
            id: editingCouponId,
            monto: backendCoupon.monto,
            porcentaje: backendCoupon.porcentaje,
            tope: backendCoupon.tope,
            compra_minima: backendCoupon.compraMinima,
            activo: backendCoupon.activo,
            valido_mayorista: backendCoupon.validoMayorista,
          };
          setCoupons(
            coupons.map((c) => (c.id === editingCouponId ? updatedCoupon : c)),
          );
          showSuccess("¡Listo!", "El cupón se actualizó correctamente.");
        } else {
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
          showSuccess("¡Listo!", "El cupón se guardó correctamente.");
        }
        setCouponForm(EMPTY_COUPON);
        setEditingCouponId(null);
        setShowCouponForm(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "Error",
          err.detail ||
            err.title ||
            err.message ||
            "No pudimos guardar el cupón.",
        );
      }
    } catch (e) {
      console.error(e);
      showError(
        "Problema de red",
        "No pudimos guardar el cupón. Revisá tu conexión.",
      );
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      nombre: coupon.nombre,
      detalle: coupon.detalle,
      codigo: coupon.codigo,
      monto: coupon.monto,
      porcentaje: coupon.porcentaje,
      tope: coupon.tope,
      compra_minima: coupon.compra_minima,
      activo: coupon.activo,
      valido_mayorista: coupon.valido_mayorista,
    });
    setTipoDescuento(coupon.porcentaje ? "porcentaje" : "monto");
    setShowCouponForm(true);
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
  const handleCarouselImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarouselImageFile(file);
    setCarouselImagePreview(URL.createObjectURL(file));
  };

  // Convierte el tipo frontend CarouselImage al formato CarouselItem que espera el backend
  const toCarouselBackend = (items: CarouselImage[]) =>
    items.map((img) => ({
      id: img.id,
      imageUrl: img.imagenNombre,
      title: img.titulo ?? null,
      description: img.subtitulo ?? null,
      displayOrder: img.orden,
      active: img.activo,
      redirectUrl: img.redirectUrl ?? null,
      creationDate: new Date().toISOString(),
    }));

  const handleSaveCarouselImage = async () => {
    try {
      // POST (crear): FormData con imagen incluida
      // PUT (editar): JSON [FromBody] según el backend
      let res: Response;

      if (editingCarouselId) {
        // Edición — ahora usa [FromForm] UpdateCarouselItemRequest con imagen opcional
        const formData = new FormData();
        formData.append("Id", String(editingCarouselId));
        formData.append("Title", carouselForm.titulo || "");
        formData.append("Description", carouselForm.subtitulo || "");
        formData.append("ExistingImageUrl", carouselForm.imagenNombre);
        formData.append("RedirectUrl", carouselForm.redirectUrl || "");
        formData.append("DisplayOrder", String(carouselForm.orden));
        formData.append("Active", String(carouselForm.activo));
        if (carouselImageFile) formData.append("Image", carouselImageFile);
        res = await fetch(`${API_BASE}/api/carousel/${editingCarouselId}`, {
          method: "PUT",
          headers: getAuthHeaders(null),
          body: formData,
        });
      } else {
        // Creación — el backend usa [FromForm] CreateCarouselItemRequest
        if (!carouselImageFile) {
          showError("Imagen requerida", "Por favor seleccioná una imagen.");
          return;
        }
        const formData = new FormData();
        formData.append("Image", carouselImageFile);
        formData.append("Title", carouselForm.titulo || "");
        formData.append("Description", carouselForm.subtitulo || "");
        formData.append("RedirectUrl", carouselForm.redirectUrl || "");
        formData.append("DisplayOrder", String(carouselForm.orden));
        formData.append("Active", String(carouselForm.activo));
        res = await fetch(`${API_BASE}/api/carousel`, {
          method: "POST",
          headers: getAuthHeaders(null),
          body: formData,
        });
      }
      if (res.ok) {
        // Para POST devuelve el item creado; para PUT devuelve NoContent
        let saved: CarouselImage;
        if (editingCarouselId) {
          if (carouselImageFile) {
            // Hubo cambio de imagen — re-fetch para obtener la nueva URL del servidor
            const updated = await fetch(
              `${API_BASE}/api/carousel/${editingCarouselId}`,
              { headers: getAuthHeaders(null) },
            ).then((r) => r.json());
            saved = {
              id: updated.id,
              imagenNombre: updated.imageUrl ?? "",
              titulo: updated.title ?? "",
              subtitulo: updated.description ?? "",
              orden: updated.displayOrder,
              activo: updated.active,
              redirectUrl: updated.redirectUrl ?? "",
            };
          } else {
            // Sin nueva imagen — construimos el estado localmente
            saved = {
              id: editingCarouselId,
              imagenNombre: carouselForm.imagenNombre,
              titulo: carouselForm.titulo,
              subtitulo: carouselForm.subtitulo,
              orden: carouselForm.orden,
              activo: carouselForm.activo,
              redirectUrl: carouselForm.redirectUrl,
            };
          }
        } else {
          const json = await res.json();
          saved = {
            id: json.id,
            imagenNombre: json.imageUrl ?? "",
            titulo: json.title ?? "",
            subtitulo: json.description ?? "",
            orden: json.displayOrder,
            activo: json.active,
            redirectUrl: json.redirectUrl ?? "",
          };
        }

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

        if (
          !editingCarouselId ||
          normalized.some((img, i) => updatedCarousel[i]?.orden !== img.orden)
        ) {
          fetch(`${API_BASE}/api/carousel/reorder`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(toCarouselBackend(normalized)),
          });
        }

        setCarouselForm(EMPTY_CAROUSEL);
        setCarouselImageFile(null);
        setCarouselImagePreview("");
        setShowCarouselForm(false);
        setEditingCarouselId(null);
        showSuccess(
          "¡Listo!",
          "La imagen del carousel se guardó correctamente.",
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "No se pudo guardar",
          err.detail ||
            err.title ||
            err.message ||
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
        body: JSON.stringify(toCarouselBackend(updatedWithOrder)),
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
      redirectUrl: img.redirectUrl ?? "",
    });
    setCarouselImageFile(null);
    setCarouselImagePreview("");
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
                body: JSON.stringify(toCarouselBackend(normalized)),
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
    const item = carouselImages.find((img) => img.id === id);
    if (!item) return;
    try {
      const formData = new FormData();
      formData.append("Id", String(id));
      formData.append("Title", item.titulo || "");
      formData.append("Description", item.subtitulo || "");
      formData.append("ExistingImageUrl", item.imagenNombre);
      formData.append("DisplayOrder", String(item.orden));
      formData.append("Active", String(!current));
      const res = await fetch(`${API_BASE}/api/carousel/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(null),
        body: formData,
      });
      if (res.ok) {
        setCarouselImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, activo: !current } : img,
          ),
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "Error",
          err.detail ||
            err.title ||
            err.message ||
            "No se pudo cambiar el estado de la imagen.",
        );
      }
    } catch {
      showError("Error de red", "No se pudo conectar con el servidor.");
    }
  };

  // Category handlers
  const handleCategoryImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCategoryImageFile(file);
    setCategoryImagePreview(URL.createObjectURL(file));
  };

  const handleSaveCategory = async () => {
    setIsSaving(true);
    try {
      const url = editingCategoryId
        ? `${API_BASE}/api/categories/${editingCategoryId}`
        : `${API_BASE}/api/categories`;

      const method = editingCategoryId ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("Name", categoryForm.nombre);
      formData.append("DisplayOrder", String(categoryForm.orden));
      if (categoryImageFile) formData.append("Image", categoryImageFile);
      // En edición, pasar la URL actual para que el servicio pueda borrar la vieja si se sube una nueva
      if (editingCategoryId) {
        formData.append("ExistingImagePath", categoryForm.imagenNombre);
      }

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(null),
        body: formData,
      });

      if (res.ok) {
        let saved: Category;

        if (editingCategoryId && categoryImageFile) {
          // Hubo nueva imagen — re-fetch para obtener la nueva URL
          const updated = await fetch(
            `${API_BASE}/api/categories/${editingCategoryId}`,
            { headers: getAuthHeaders(null) },
          ).then((r) => r.json());
          saved = {
            id: updated.id,
            nombre: updated.name ?? "",
            imagenNombre: updated.imagePath ?? "",
            orden: updated.displayOrder,
          };
        } else if (editingCategoryId) {
          // Sin nueva imagen — construir desde el estado local
          saved = {
            id: editingCategoryId,
            nombre: categoryForm.nombre,
            imagenNombre: categoryForm.imagenNombre,
            orden: categoryForm.orden,
          };
        } else {
          // POST — el backend devuelve la categoría creada
          const json = await res.json();
          saved = {
            id: json.id,
            nombre: json.name ?? "",
            imagenNombre: json.imagePath ?? "",
            orden: json.displayOrder,
          };
        }

        let updatedCategories: Category[];
        if (editingCategoryId) {
          updatedCategories = categories.map((c) =>
            c.id === editingCategoryId ? saved : c,
          );
        } else {
          updatedCategories = [...categories, saved];
        }

        const normalized = updatedCategories
          .sort((a, b) => a.orden - b.orden)
          .map((c, i) => ({ ...c, orden: i + 1 }));

        setCategories(normalized);

        if (
          !editingCategoryId ||
          normalized.some((c, i) => updatedCategories[i]?.orden !== c.orden)
        ) {
          fetch(`${API_BASE}/api/categories/reorder`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(
              normalized.map((c) => ({ id: c.id, displayOrder: c.orden })),
            ),
          });
        }

        setCategoryForm(EMPTY_CATEGORY);
        setCategoryImageFile(null);
        setCategoryImagePreview("");
        setShowCategoryForm(false);
        setEditingCategoryId(null);
        showSuccess("¡Listo!", "La categoría se guardó correctamente.");
      } else {
        const err = await res.json().catch(() => ({}));
        showError(
          "No se pudo guardar",
          err.detail ||
            err.title ||
            err.message ||
            "Hubo un problema al guardar la categoría.",
        );
      }
    } catch {
      showError("Problema de red", "No pudimos conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      nombre: cat.nombre,
      imagenNombre: cat.imagenNombre ?? "",
      orden: cat.orden,
    });
    setCategoryImageFile(null);
    setCategoryImagePreview("");
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
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
                body: JSON.stringify(
                  normalized.map((c) => ({ id: c.id, displayOrder: c.orden })),
                ),
              });

              return normalized;
            });
            showSuccess("¡Listo!", "La categoría fue eliminada.");
          } else {
            const errorData = await res.json().catch(() => ({}));
            const errorMsg: string =
              errorData.message ?? errorData.title ?? errorData.detail ?? "";

            // 409 Conflict o mensaje que menciona productos asociados
            const hasLinkedProducts =
              res.status === 409 ||
              errorMsg.toLowerCase().includes("product") ||
              errorMsg.toLowerCase().includes("asociad");

            if (hasLinkedProducts) {
              showError(
                "No se puede eliminar",
                "Esta categoría tiene productos asociados. Reasigná o eliminá esos productos antes de borrar la categoría.",
              );
            } else {
              showError(
                "No se pudo borrar",
                errorMsg || "Hubo un problema al intentar borrar la categoría.",
              );
            }
          }
        } catch {
          showError("Problema de red", "No pudimos conectar con el servidor.");
        }
      },
    );
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
        body: JSON.stringify(
          updatedWithOrder.map((c) => ({ id: c.id, displayOrder: c.orden })),
        ),
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
    { id: "orders" as AdminView, icon: ShoppingBag, label: "Pedidos" },
    { id: "products" as AdminView, icon: Package, label: "Productos" },
    {
      id: "daily-offers" as AdminView,
      icon: Percent,
      label: "Ofertas del día",
    },
    { id: "promotions" as AdminView, icon: Tag, label: "Cupones" },
    { id: "carousel" as AdminView, icon: ImageIcon, label: "Carousel" },
    { id: "categories" as AdminView, icon: Layers, label: "Categorías" },
    { id: "shipping" as AdminView, icon: Truck, label: "Envíos" },
  ];

  const filteredOffersProducts = products.filter((p) => {
    if (offersSearchQuery) {
      const q = offersSearchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesCat = (p.category || "").toLowerCase().includes(q);
      if (!matchesName && !matchesCat) return false;
    }
    const draft = offersDraft[p.id];
    const isOnOffer = draft ? draft.active : p.offerPrice != null;
    if (offersFilter === "active") return isOnOffer;
    if (offersFilter === "inactive") return !isOnOffer;
    return true;
  });

  const hasOffersChanges = products.some((p) => {
    const draft = offersDraft[p.id];
    if (!draft) return false;
    const parsedDraftPrice = parseInputPrice(draft.offerPrice);
    const currentOfferActive = p.offerPrice != null;
    const draftOfferActive = draft.active;
    const isStatusChanged = draftOfferActive !== currentOfferActive;
    const isPriceChanged = parsedDraftPrice !== (p.offerPrice ?? 0);
    return isStatusChanged || (draftOfferActive && isPriceChanged);
  });

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isSidebarExpanded ? "w-60" : "w-20"} transition-all duration-300 bg-sidebar border-r border-sidebar-border p-4 flex flex-col flex-shrink-0 relative`}
      >
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-6 bg-sidebar border border-border rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent z-10 hidden md:block shadow-sm"
        >
          {isSidebarExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div
          className={`flex items-center ${isSidebarExpanded ? "gap-3" : "justify-center"} mb-8 h-12`}
        >
          <img
            src="/logo.svg"
            alt="El Molino"
            className="h-10 w-10 object-contain flex-shrink-0"
          />
          {isSidebarExpanded && (
            <div className="whitespace-nowrap overflow-hidden">
              <p
                className="text-sidebar-foreground font-bold italic tracking-wide text-2xl leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                El Molino
              </p>
              <p className="text-xs text-muted-foreground mt-1">Panel Admin</p>
            </div>
          )}
        </div>

        <nav className="space-y-1 flex-1 overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center ${isSidebarExpanded ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-lg transition-colors text-sm ${
                currentView === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              title={!isSidebarExpanded ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarExpanded && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4 space-y-2 overflow-x-hidden">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center ${isSidebarExpanded ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm`}
            title={!isSidebarExpanded ? "Ver tienda" : undefined}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && (
              <span className="whitespace-nowrap">Ver tienda</span>
            )}
          </a>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarExpanded ? "gap-3 px-3" : "justify-center px-0"} py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm`}
            title={!isSidebarExpanded ? "Cerrar sesión" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarExpanded && (
              <span className="whitespace-nowrap">Cerrar sesión</span>
            )}
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
                <h1>Gestión de Productos</h1>
                <button
                  id="new-product-btn"
                  onClick={() => {
                    if (showProductForm) {
                      setShowProductForm(false);
                      setEditingProductId(null);
                    } else {
                      handleNewProductClick();
                    }
                  }}
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
                  <h3 className="mb-5 text-base">
                    {editingProductId ? "Editar producto" : "Crear producto"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm mb-1.5 font-medium">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={productForm.name || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Ej: Avena arrollada"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm mb-1.5 font-medium">
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
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-foreground"
                      >
                        <option value="" disabled>
                          Seleccionar...
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.nombre}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5 font-medium">
                        Descripción
                      </label>
                      <textarea
                        value={productForm.description || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Descripción opcional del producto..."
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5 font-medium">
                        Tipo de venta *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((p) => ({
                              ...p,
                              measurementUnit: "unidad",
                              gramages: [],
                              newGramageInput: "",
                            }))
                          }
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                            productForm.measurementUnit === "unidad"
                              ? "bg-foreground text-background border-foreground"
                              : "border-border text-foreground hover:border-foreground/50"
                          }`}
                        >
                          Por unidad
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((p) => ({
                              ...p,
                              measurementUnit: "gramo",
                            }))
                          }
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                            productForm.measurementUnit === "gramo"
                              ? "bg-foreground text-background border-foreground"
                              : "border-border text-foreground hover:border-foreground/50"
                          }`}
                        >
                          Por gramo (kg)
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm mb-1.5 font-medium">
                        {productForm.measurementUnit === "gramo"
                          ? "Stock inicial (kilos) *"
                          : "Stock inicial (unidades) *"}
                      </label>
                      <input
                        type="number"
                        value={productForm.stock || ""}
                        onChange={(e) =>
                          setProductForm((p) => ({
                            ...p,
                            stock: Number(e.target.value),
                          }))
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm mb-1.5 font-medium">
                        {productForm.measurementUnit === "gramo"
                          ? "Precio por kg *"
                          : "Precio minorista *"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                          $
                        </span>
                        <input
                          type="text"
                          value={formatInputPrice(productForm.price)}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              price: formatInputPrice(e.target.value),
                            }))
                          }
                          placeholder="0,00"
                          className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      {productForm.measurementUnit === "gramo" && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          El precio de cada gramaje se calcula automáticamente a
                          partir del precio por kg.
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 bg-secondary/20 border border-border/50 rounded-lg">
                      <span className="text-sm font-medium text-foreground">
                        Producto activo
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((p) => ({ ...p, active: !p.active }))
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          productForm.active
                            ? "bg-accent"
                            : "bg-switch-background"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            productForm.active
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-border/40 mt-2">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none text-foreground">
                        <input
                          type="checkbox"
                          checked={productForm.enableWholesale}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              enableWholesale: e.target.checked,
                            }))
                          }
                          className="accent-primary rounded border-border"
                        />
                        Habilitar precio mayorista
                      </label>
                    </div>

                    {productForm.enableWholesale && (
                      <>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm mb-1.5 font-medium">
                            Precio mayorista *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                              $
                            </span>
                            <input
                              type="text"
                              value={formatInputPrice(
                                productForm.wholesalePrice,
                              )}
                              onChange={(e) =>
                                setProductForm((p) => ({
                                  ...p,
                                  wholesalePrice: formatInputPrice(
                                    e.target.value,
                                  ),
                                }))
                              }
                              placeholder="0,00"
                              className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm mb-1.5 font-medium">
                            {productForm.measurementUnit === "gramo"
                              ? "Cantidad mínima mayorista (gramos) *"
                              : "Cantidad mínima mayorista*"}
                          </label>
                          <input
                            type="number"
                            value={productForm.minimumWholesaleAmount || ""}
                            onChange={(e) =>
                              setProductForm((p) => ({
                                ...p,
                                minimumWholesaleAmount: Number(e.target.value),
                              }))
                            }
                            placeholder="10"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {/* Gramajes — solo si producto por gramo */}
                    {productForm.measurementUnit === "gramo" && (
                      <div className="col-span-2 p-4 bg-secondary/20 border border-border/50 rounded-xl">
                        <label className="block text-sm font-medium mb-3">
                          Presentaciones (gramajes) *
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {productForm.gramages.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              No hay gramajes cargados todavía.
                            </p>
                          )}
                          {productForm.gramages.map((g, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm font-medium"
                            >
                              {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
                              <button
                                type="button"
                                onClick={() =>
                                  setProductForm((p) => ({
                                    ...p,
                                    gramages: p.gramages.filter(
                                      (_, idx) => idx !== i,
                                    ),
                                  }))
                                }
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={productForm.newGramageInput}
                            onChange={(e) =>
                              setProductForm((p) => ({
                                ...p,
                                newGramageInput: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = parseInt(
                                  productForm.newGramageInput,
                                );
                                if (
                                  val > 0 &&
                                  !productForm.gramages.includes(val)
                                ) {
                                  setProductForm((p) => ({
                                    ...p,
                                    gramages: [...p.gramages, val].sort(
                                      (a, b) => a - b,
                                    ),
                                    newGramageInput: "",
                                  }));
                                }
                              }
                            }}
                            placeholder="Ej: 250 (en gramos)"
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(productForm.newGramageInput);
                              if (
                                val > 0 &&
                                !productForm.gramages.includes(val)
                              ) {
                                setProductForm((p) => ({
                                  ...p,
                                  gramages: [...p.gramages, val].sort(
                                    (a, b) => a - b,
                                  ),
                                  newGramageInput: "",
                                }));
                              }
                            }}
                            className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Ingresá el peso en gramos. Ej: 250, 500, 1000
                        </p>
                      </div>
                    )}

                    <div className="col-span-2 pt-2 border-t border-border/40 mt-2">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none text-foreground">
                        <input
                          type="checkbox"
                          checked={productForm.enableOffer}
                          onChange={(e) =>
                            setProductForm((p) => ({
                              ...p,
                              enableOffer: e.target.checked,
                            }))
                          }
                          className="accent-primary rounded border-border"
                        />
                        Habilitar precio de oferta (Promoción)
                      </label>
                    </div>

                    {productForm.enableOffer && (
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm mb-1.5 font-medium">
                          Precio de oferta *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                            $
                          </span>
                          <input
                            type="text"
                            value={formatInputPrice(productForm.offerPrice)}
                            onChange={(e) =>
                              setProductForm((p) => ({
                                ...p,
                                offerPrice: formatInputPrice(e.target.value),
                              }))
                            }
                            placeholder="0,00"
                            className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-sm mb-2 font-medium">
                        Imagen del producto *
                      </label>
                      <div className="flex items-start gap-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
                        {productImagePreview ? (
                          <div className="relative group">
                            <img
                              src={productImagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-border shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setProductImageFile(null);
                                setProductImagePreview("");
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-white p-1.5 rounded-full hover:bg-destructive/90 transition-all shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border hover:border-primary/50 rounded-lg cursor-pointer transition-colors bg-secondary/5">
                            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Subir imagen
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                        <div className="flex-1 text-xs text-muted-foreground flex flex-col justify-center gap-1">
                          <p className="font-semibold text-foreground">
                            Detalles de carga:
                          </p>
                          <p>• Formatos soportados: JPG, PNG, WEBP</p>
                          <p>
                            • Relación de aspecto recomendada: 1:1 (Cuadrada)
                          </p>
                          <p>• Tamaño máximo de archivo: 2 MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProductId(null);
                      }}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary/40 transition-colors text-sm text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProduct}
                      disabled={
                        isSaving ||
                        !productForm.name ||
                        !parseInputPrice(productForm.price) ||
                        (!productImageFile && !productImagePreview)
                      }
                      className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm font-semibold shadow-sm"
                    >
                      {isSaving
                        ? "Guardando..."
                        : editingProductId
                          ? "Actualizar producto"
                          : "Guardar producto"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o categoría..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

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
                      <th className="text-left p-4 text-sm font-medium">
                        Estado
                      </th>
                      <th className="text-right p-4 text-sm font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(
                        (p) =>
                          p.name
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase()) ||
                          (p.category &&
                            p.category
                              .toLowerCase()
                              .includes(productSearchTerm.toLowerCase())),
                      )
                      .map((product) => (
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
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {product.name}
                                  </p>
                                  {product.offerPrice != null && (
                                    <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[9px] font-extrabold rounded tracking-wider">
                                      PROMO
                                    </span>
                                  )}
                                  {product.measurementUnit === "gramo" && (
                                    <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground text-[9px] font-semibold rounded tracking-wider">
                                      GRAMOS
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {product.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {product.offerPrice != null ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="line-through text-muted-foreground text-xs">
                                    {formatARS(product.price)}
                                  </span>
                                  <span className="font-bold text-accent">
                                    {formatARS(product.offerPrice)}
                                  </span>
                                </div>
                                {product.wholesalePrice && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    May:{" "}
                                    <span className="font-medium text-foreground">
                                      {formatARS(product.wholesalePrice.price)}
                                    </span>{" "}
                                    (min. {product.wholesalePrice.quantity} u.)
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium">
                                  {formatARS(product.price)}
                                  {product.measurementUnit === "gramo" && (
                                    <span className="text-muted-foreground text-xs ml-1">
                                      /kg
                                    </span>
                                  )}
                                </span>
                                {product.wholesalePrice && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    May:{" "}
                                    <span className="font-medium text-foreground">
                                      {formatARS(product.wholesalePrice.price)}
                                    </span>{" "}
                                    (min. {product.wholesalePrice.quantity} u.)
                                  </p>
                                )}
                                {product.measurementUnit === "gramo" &&
                                  Array.isArray(product.gramages) &&
                                  product.gramages.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {(product.gramages as any[])
                                        .map((g: any) =>
                                          g.grams >= 1000
                                            ? `${g.grams / 1000}kg`
                                            : `${g.grams}g`,
                                        )
                                        .join(" · ")}
                                    </p>
                                  )}
                              </div>
                            )}
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
                              {product.measurementUnit === "gramo"
                                ? product.stock >= 1000
                                  ? `${product.stock / 1000} kg`
                                  : `${product.stock} g`
                                : `${product.stock} uds.`}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                product.active
                                  ? "bg-accent/10 text-accent border-accent/20"
                                  : "bg-secondary/60 text-muted-foreground border-border"
                              }`}
                            >
                              {product.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleEditProductClick(product)}
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

          {/* OFERTAS DEL DÍA */}
          {currentView === "daily-offers" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Ofertas del día</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Activá el descuento por producto y definí el precio de
                    oferta
                  </p>
                </div>
                <div className="bg-accent/10 text-accent border border-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start md:self-auto">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {(() => {
                      const d = new Date();
                      const dayName = d.toLocaleDateString("es-AR", {
                        weekday: "long",
                      });
                      const dayNum = d.getDate();
                      const monthName = d.toLocaleDateString("es-AR", {
                        month: "long",
                      });
                      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} de ${monthName}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* KPIs Rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total productos
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight mt-1">
                    {products.length}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-medium text-muted-foreground">
                    En oferta hoy
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight mt-1 text-accent">
                    {Object.values(offersDraft).filter((d) => d.active).length}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-medium text-muted-foreground">
                    Descuento promedio
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight mt-1 text-chart-4">
                    {getAverageDiscount()}%
                  </span>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={offersSearchQuery}
                    onChange={(e) => setOffersSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex bg-secondary/40 p-1 border border-border rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setOffersFilter("all")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      offersFilter === "all"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setOffersFilter("active")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      offersFilter === "active"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Con oferta
                  </button>
                  <button
                    onClick={() => setOffersFilter("inactive")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      offersFilter === "inactive"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sin oferta
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mb-6">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">
                        Producto
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Precio Normal
                      </th>
                      <th
                        className="text-left p-4 text-sm font-medium"
                        style={{ width: "200px" }}
                      >
                        Precio Oferta
                      </th>
                      <th className="text-left p-4 text-sm font-medium">
                        Descuento
                      </th>
                      <th
                        className="text-right p-4 text-sm font-medium"
                        style={{ width: "100px" }}
                      >
                        Activo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOffersProducts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-muted-foreground text-sm"
                        >
                          No se encontraron productos para los criterios
                          seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredOffersProducts.map((product) => {
                        const draft = offersDraft[product.id] || {
                          active: false,
                          offerPrice: "",
                        };
                        const pct = getDiscountPercentage(product.id);
                        return (
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
                            <td className="p-4 text-sm font-medium text-foreground">
                              {formatARS(product.price)}
                            </td>
                            <td className="p-4">
                              <div className="relative">
                                <span
                                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none ${
                                    draft.active
                                      ? "text-muted-foreground"
                                      : "text-muted-foreground/30"
                                  }`}
                                >
                                  $
                                </span>
                                <input
                                  type="text"
                                  disabled={!draft.active}
                                  value={draft.offerPrice}
                                  onChange={(e) =>
                                    handleOfferPriceDraftChange(
                                      product.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={
                                    draft.active ? "0,00" : "Desactivado"
                                  }
                                  className={`w-full pl-7 pr-3 py-1.5 border rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary/20 ${
                                    draft.active
                                      ? "bg-input-background border-border text-foreground font-medium"
                                      : "bg-secondary/30 border-border/40 text-muted-foreground/40 cursor-not-allowed"
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              {pct !== null ? (
                                <span className="px-2.5 py-0.5 bg-accent/20 text-accent border border-accent/20 rounded-full text-xs font-semibold">
                                  -{pct}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 text-sm">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleOfferDraft(product.id)
                                  }
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    draft.active
                                      ? "bg-accent"
                                      : "bg-switch-background"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      draft.active
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actions Bar */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/40">
                <button
                  type="button"
                  disabled={!hasOffersChanges}
                  onClick={() => {
                    const initialDraft: Record<
                      string,
                      { active: boolean; offerPrice: string | number }
                    > = {};
                    products.forEach((p) => {
                      initialDraft[p.id] = {
                        active: p.offerPrice != null,
                        offerPrice: p.offerPrice
                          ? formatInputPrice(p.offerPrice)
                          : "",
                      };
                    });
                    setOffersDraft(initialDraft);
                    showSuccess(
                      "Descartado",
                      "Se descartaron los cambios no guardados.",
                    );
                  }}
                  className={`px-4 py-2 border border-border rounded-lg transition-colors text-sm text-foreground ${
                    !hasOffersChanges
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  Descartar
                </button>
                <button
                  type="button"
                  disabled={isSavingOffers || !hasOffersChanges}
                  onClick={handleSaveDailyOffers}
                  className={`px-6 py-2 bg-primary disabled:opacity-50 text-primary-foreground rounded-lg transition-colors text-sm font-semibold shadow-sm flex items-center gap-2 ${
                    !hasOffersChanges || isSavingOffers
                      ? "cursor-not-allowed"
                      : "hover:bg-primary/90"
                  }`}
                >
                  {isSavingOffers ? "Guardando cambios..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          )}

          {/* CUPONES */}
          {currentView === "promotions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1>Cupones de Descuento</h1>
                <button
                  id="new-coupon-btn"
                  onClick={() => {
                    if (showCouponForm) {
                      setShowCouponForm(false);
                      setEditingCouponId(null);
                      setCouponForm(EMPTY_COUPON);
                    } else {
                      setShowCouponForm(true);
                      setEditingCouponId(null);
                      setCouponForm(EMPTY_COUPON);
                    }
                  }}
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
                  <h3 className="mb-5 text-base">
                    {editingCouponId ? "Editar cupón" : "Crear cupón"}
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
                            onChange={(e) => {
                              if (!e.target.value) {
                                setCF("porcentaje", null);
                                return;
                              }
                              const val = Number(e.target.value);
                              if (val <= 100) {
                                setCF("porcentaje", val);
                              }
                            }}
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
                            setCF(
                              "monto",
                              e.target.value ? Number(e.target.value) : null,
                            )
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
                        onClick={() => handleEditCoupon(coupon)}
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">Historial de Pedidos</h1>
                <div className="flex bg-secondary/40 p-1 border border-border rounded-lg self-start sm:self-auto">
                  {(
                    [
                      ["pendientes", "Pendientes"],
                      ["en_preparacion", "En preparación"],
                      ["enviados", "Enviados"],
                      ["entregados", "Entregados"],
                      ["cancelados", "Cancelados"],
                      ["todos", "Todos"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setOrdersFilter(val)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        ordersFilter === val
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(
                        (o) =>
                          ordersFilter === "todos" ||
                          (ordersFilter === "pendientes" &&
                            o.status === "pendiente") ||
                          (ordersFilter === "en_preparacion" &&
                            o.status === "en_preparacion") ||
                          (ordersFilter === "enviados" &&
                            o.status === "enviado") ||
                          (ordersFilter === "entregados" &&
                            o.status === "entregado") ||
                          (ordersFilter === "cancelados" &&
                            o.status === "cancelado"),
                      )
                      .map((order) => (
                        <React.Fragment key={order.id}>
                          <tr
                            className="border-t border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id,
                              )
                            }
                          >
                            <td className="p-4 text-sm font-mono">
                              {order.id}
                            </td>
                            <td className="p-4 text-sm">{order.customer}</td>
                            <td className="p-4 text-sm font-medium">
                              {formatARS(order.total)}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground capitalize">
                              {order.metodo_pago}
                              {order.informacion && (
                                <div className="text-xs text-primary font-medium mt-1 normal-case">
                                  {order.informacion}
                                </div>
                              )}
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
                            <td className="p-4 text-muted-foreground">
                              {expandedOrderId === order.id ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </td>
                          </tr>
                          {expandedOrderId === order.id && (
                            <tr className="bg-secondary/10">
                              <td
                                colSpan={7}
                                className="p-0 border-b border-border"
                              >
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-6"
                                >
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Columna Cliente y Envío */}
                                    <div className="bg-card p-5 rounded-xl border border-border/50 shadow-sm space-y-4">
                                      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                          <User size={18} />
                                        </div>
                                        <h4 className="font-semibold text-foreground">
                                          Datos del Cliente
                                        </h4>
                                      </div>
                                      <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-3">
                                          <User
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Nombre completo
                                            </p>
                                            <p className="font-medium text-foreground">
                                              {order.customer}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <Hash
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Documento (DNI)
                                            </p>
                                            <p className="font-medium text-foreground">
                                              {order.dni || "No especificado"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <Phone
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Teléfono de contacto
                                            </p>
                                            <p className="font-medium text-foreground">
                                              {order.telefono ||
                                                "No especificado"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <MapPin
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Dirección de entrega
                                            </p>
                                            <p className="font-medium text-foreground">
                                              {order.direccionEnvio ||
                                                "Retiro por sucursal"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Columna Pago y Detalles */}
                                    <div className="bg-card p-5 rounded-xl border border-border/50 shadow-sm space-y-4">
                                      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                          <CreditCard size={18} />
                                        </div>
                                        <h4 className="font-semibold text-foreground">
                                          Información de Pago
                                        </h4>
                                      </div>
                                      <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-3">
                                          <CreditCard
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Método seleccionado
                                            </p>
                                            <p className="font-medium text-foreground capitalize">
                                              {order.metodo_pago}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <Tag
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Estado del cobro
                                            </p>
                                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full capitalize">
                                              {order.estadoPago || "Pendiente"}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <FileText
                                            size={16}
                                            className="text-muted-foreground mt-0.5 shrink-0"
                                          />
                                          <div>
                                            <p className="text-muted-foreground text-xs">
                                              Aclaraciones adicionales
                                            </p>
                                            <p className="font-medium text-foreground mt-0.5 bg-primary/5 px-2 py-1.5 rounded text-primary">
                                              {order.informacion ||
                                                "Sin aclaraciones adicionales"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="pt-3 mt-1 border-t border-border/50">
                                          <p className="text-muted-foreground text-xs mb-2">
                                            Cambiar estado del pedido
                                          </p>
                                          <select
                                            className="w-full py-2 px-3 rounded-md text-sm font-medium border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={order.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleUpdateOrderStatus(
                                                order.id,
                                                e.target
                                                  .value as Order["status"],
                                              );
                                            }}
                                          >
                                            {(
                                              Object.entries(STATUS_LABELS) as [
                                                Order["status"],
                                                string,
                                              ][]
                                            ).map(([val, label]) => (
                                              <option key={val} value={val}>
                                                {label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Columna Resumen del Pedido */}
                                    <div className="bg-card p-5 rounded-xl border border-border/50 shadow-sm flex flex-col h-full">
                                      <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-4">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                          <ShoppingBag size={18} />
                                        </div>
                                        <h4 className="font-semibold text-foreground">
                                          Resumen de Productos
                                        </h4>
                                      </div>

                                      <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                                        <ul className="space-y-3">
                                          {order.items?.map((item, idx) => (
                                            <li
                                              key={idx}
                                              className="flex justify-between items-center text-sm group"
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center bg-secondary/50 text-secondary-foreground w-6 h-6 rounded-md font-medium text-xs">
                                                  {item.quantity}x
                                                </span>
                                                <div>
                                                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                    {item.productName}
                                                  </p>
                                                  {item.gramageGrams && (
                                                    <p className="text-xs text-muted-foreground">
                                                      Gramaje:{" "}
                                                      {item.gramageGrams}g
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <span className="font-medium whitespace-nowrap text-foreground">
                                                {formatARS(
                                                  item.price * item.quantity,
                                                )}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="pt-4 mt-auto border-t border-border/50">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm text-muted-foreground">
                                            Subtotal productos
                                          </span>
                                          <span className="text-sm font-medium text-foreground">
                                            {formatARS(
                                              order.total -
                                                (order.shippingCost || 0),
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/30">
                                          <span className="text-sm text-muted-foreground">
                                            Envío
                                          </span>
                                          <span className="text-sm font-medium text-foreground">
                                            {order.shippingCost
                                              ? formatARS(order.shippingCost)
                                              : "Gratis / No aplica"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold text-muted-foreground">
                                            Total del pedido
                                          </span>
                                          <span className="text-lg font-bold text-primary">
                                            {formatARS(order.total)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
                <h1>Imágenes del Carousel</h1>
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
                  <h3 className="mb-5 text-base">
                    {editingCarouselId
                      ? "Editar imagen del carousel"
                      : "Agregar imagen al carousel"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">Imagen *</label>
                      <div className="flex items-center gap-4">
                        {(carouselImagePreview ||
                          (editingCarouselId && carouselForm.imagenNombre)) && (
                          <img
                            src={
                              carouselImagePreview ||
                              imgUrl(carouselForm.imagenNombre)
                            }
                            alt="Preview"
                            className="w-24 h-16 object-cover rounded-lg border border-border"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCarouselImageSelect}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
                        />
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
                    <div className="col-span-2">
                      <label className="block text-sm mb-1.5">
                        URL de Redirección (Opcional)
                      </label>
                      <input
                        value={carouselForm.redirectUrl ?? ""}
                        onChange={(e) =>
                          setCarouselForm((p) => ({
                            ...p,
                            redirectUrl: e.target.value,
                          }))
                        }
                        placeholder="Ej: /producto/1, o /?categoria=2"
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
                      disabled={!editingCarouselId && !carouselImageFile}
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
                              src={imgUrl(img.imagenNombre)}
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
                              <h3 className="text-lg font-medium">
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
                <h1 className="text-2xl font-bold">Gestión de categorías</h1>
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
                  <h3 className="mb-5 text-base">
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
                        {categoryImagePreview ||
                        (editingCategoryId && categoryForm.imagenNombre) ? (
                          <div className="relative group">
                            <img
                              src={
                                categoryImagePreview ||
                                imgUrl(categoryForm.imagenNombre)
                              }
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-border shadow-md"
                            />
                            <button
                              onClick={() => {
                                setCategoryForm({
                                  ...categoryForm,
                                  imagenNombre: "",
                                });
                                setCategoryImageFile(null);
                                setCategoryImagePreview("");
                              }}
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
                              onChange={handleCategoryImageSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm hover:bg-secondary transition-colors w-full md:w-auto">
                              <ImageIcon className="w-4 h-4" />
                              Seleccionar imagen
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
                      disabled={!categoryForm.nombre || isSaving}
                      className="px-8 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                    >
                      {isSaving
                        ? "Guardando..."
                        : editingCategoryId
                          ? "Actualizar"
                          : "Crear Categoría"}
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
                      className={`relative group bg-white rounded-2xl border border-border overflow-hidden shadow-sm cursor-grab active:cursor-grabbing`}
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
                              src={imgUrl(cat.imagenNombre)}
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
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-medium">
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
                          <div className="flex items-center justify-end pt-4 border-t border-border/50">
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

          {/* ENVÍOS */}
          {currentView === "shipping" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1>Tarifas de Envío</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurá los costos de envío por tramo de distancia desde
                    el local.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingShippingId(null);
                    setShippingForm({
                      desdeKm: "",
                      hastaKm: "",
                      precio: "",
                      activo: true,
                    });
                    setShowShippingForm(true);
                  }}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo tramo
                </button>
              </div>

              {/* Umbral envío gratis */}
              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Envío gratis a partir de...
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                      $
                    </span>
                    <input
                      type="text"
                      value={umbralEnvioGratis}
                      onChange={(e) => setUmbralEnvioGratis(e.target.value)}
                      placeholder="5000"
                      className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSaveUmbral}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Los pedidos que superen este monto no pagarán envío
                  (actualmente: ${umbralEnvioGratis}).
                </p>
              </div>

              {/* Formulario inline */}
              {showShippingForm && (
                <div className="bg-card border-2 border-primary/30 rounded-xl p-5 mb-6 shadow-sm">
                  <h3 className="text-base mb-4">
                    {editingShippingId ? "Editar tramo" : "Nuevo tramo"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5">
                        Hasta (km)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={shippingForm.hastaKm}
                        onChange={(e) =>
                          setShippingForm((f) => ({
                            ...f,
                            hastaKm: e.target.value,
                          }))
                        }
                        placeholder="5"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">
                        Precio ($)
                      </label>
                      <input
                        type="text"
                        value={shippingForm.precio}
                        onChange={(e) =>
                          setShippingForm((f) => ({
                            ...f,
                            precio: e.target.value,
                          }))
                        }
                        placeholder="500"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input-background text-sm focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer text-sm pb-2">
                        <input
                          type="checkbox"
                          checked={shippingForm.activo}
                          onChange={(e) =>
                            setShippingForm((f) => ({
                              ...f,
                              activo: e.target.checked,
                            }))
                          }
                          className="accent-primary"
                        />
                        Activo
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveShippingRate}
                      disabled={isSavingShipping}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingShipping ? "Guardando..." : "Guardar tramo"}
                    </button>
                    <button
                      onClick={() => {
                        setShowShippingForm(false);
                        setEditingShippingId(null);
                      }}
                      className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla de tramos */}
              {shippingRates.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>No hay tramos de envío configurados.</p>
                  <p className="text-sm mt-1">
                    Creá el primero con el botón "Nuevo tramo".
                  </p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 border-b border-border">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Hasta
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Precio
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Estado
                        </th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {shippingRates
                        .slice()
                        .sort((a, b) => a.hastaKm - b.hastaKm)
                        .map((rate) => (
                          <tr
                            key={rate.id}
                            className="hover:bg-secondary/20 transition-colors"
                          >
                            <td className="px-5 py-3">{rate.hastaKm} km</td>
                            <td className="px-5 py-3 font-semibold text-primary">
                              {formatARS(rate.precio)}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rate.activo ? "bg-chart-2/20 text-chart-2" : "bg-secondary text-muted-foreground"}`}
                              >
                                {rate.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingShippingId(rate.id);
                                    setShippingForm({
                                      desdeKm: String(rate.desdeKm),
                                      hastaKm: String(rate.hastaKm),
                                      precio: String(rate.precio),
                                      activo: rate.activo,
                                    });
                                    setShowShippingForm(true);
                                  }}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteShippingRate(rate.id)
                                  }
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
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
