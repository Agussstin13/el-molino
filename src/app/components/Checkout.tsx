import { useState, useEffect } from "react";
import { X, MapPin, ChevronRight, CheckCircle2, Truck, AlertCircle, User, BookmarkPlus } from "lucide-react";
import type { SavedAddress } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import {
  formatARS,
  getEffectivePrice,
  getEffectiveGramagePrice,
  isWholesaleActive,
} from "../../lib/price";
import type { PaymentMethod, PaymentMethodCode } from "../../lib/types";
import {
  getCheckoutPaymentDescription,
  getDefaultPaymentMethodCode,
  getPaymentMethodLabel,
  isOnlinePaymentMethod,
  normalizePaymentMethodCode,
} from "../../lib/paymentMethods";
import { ClientLoginModal } from "./ClientLoginModal";

const API_BASE = import.meta.env.VITE_API_BASE;
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER;

interface FormData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  calle: string;
  info_adicional: string;
  ciudad: string;
  codigo_postal: string;
  metodo_entrega: "envio" | "retiro";
  metodo_pago: PaymentMethodCode | string;
  monto_efectivo?: string;
}
interface AddressSuggestion {
  placeId: string;
  text: string;
}

interface ShippingQuoteResponse {
  destinationPlaceId: string;
  shippingAddress: string;
  shippingLatitude: number;
  shippingLongitude: number;
  shippingDistanceMeters: number;
  distanceKm: number;
  baseShippingCost: number;
  shippingCost: number;
  freeShippingApplied: boolean;
  freeShippingThreshold: number | null;
}

const EMPTY_FORM: FormData = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  calle: "",
  info_adicional: "",
  ciudad: "",
  codigo_postal: "",
  metodo_entrega: "envio",
  metodo_pago: "",
};

const FORM_STORAGE_KEY = "el-molino-checkout-form";

const InputField = ({
  label,
  field,
  type = "text",
  placeholder,
  half = false,
  readOnly = false,
  showUpdateBtn = false,
  value,
  onChange,
  error,
  onUpdate,
}: {
  label: string;
  field: keyof FormData;
  type?: string;
  placeholder?: string;
  half?: boolean;
  readOnly?: boolean;
  showUpdateBtn?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  onUpdate?: () => void;
}) => (
  <div className={half ? "" : "col-span-2"}>
    <label className="block text-sm mb-1.5">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors ${error ? "border-destructive" : "border-border"
          } ${readOnly ? "opacity-70 cursor-not-allowed bg-secondary/50" : ""}`}
      />
      {showUpdateBtn && onUpdate && (
        <button
          type="button"
          onClick={onUpdate}
          className="px-3 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
        >
          Actualizar
        </button>
      )}
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export function Checkout() {
  const {
    isCheckoutOpen,
    items,
    closeCheckout,
    subtotal,
    clearCart,
  } = useCart();
  const { clientUser, logoutClient, saveAddress, savedAddresses } = useAuth();
  const { showError } = useAlert();
  const [step, setStep] = useState<"login-prompt" | "datos" | "pago" | "revisar" | "confirmado">(
    "login-prompt",
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentInitializationError, setPaymentInitializationError] = useState<string | null>(null);
  const [confirmedOrderPath, setConfirmedOrderPath] = useState<string | null>(null);
  const [wantToSaveAddress, setWantToSaveAddress] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(() => {
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed ? { ...EMPTY_FORM, ...parsed } : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });

  // Bloquear el scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCheckoutOpen]);

  useEffect(() => {
    if (clientUser) {
      setForm((f) => {
        const newForm = { ...f };
        let changed = false;
        if (clientUser.nombre && newForm.nombre !== clientUser.nombre) {
          newForm.nombre = clientUser.nombre;
          changed = true;
        }
        if (clientUser.apellido && newForm.apellido !== clientUser.apellido) {
          newForm.apellido = clientUser.apellido;
          changed = true;
        }
        if (clientUser.dni && newForm.dni !== clientUser.dni) {
          newForm.dni = clientUser.dni;
          changed = true;
        }
        if (clientUser.telefono && newForm.telefono !== clientUser.telefono) {
          newForm.telefono = clientUser.telefono;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
        }
        return newForm;
      });
    }
  }, [clientUser]);

  useEffect(() => {
    if (isCheckoutOpen && clientUser && step === "login-prompt") {
      setStep("datos");
    }
  }, [isCheckoutOpen, clientUser, step]);

  useEffect(() => {
    if (!isCheckoutOpen) {
      setForm((prev) => ({
        ...prev,
        calle: "",
      }));
      setAddressSuggestions([]);
      setSelectedPlaceId(null);
      setShippingCost(null);
      setDistanciaKm(null);
      setIsAddressVerified(false);
      setSelectedCoords(null);
      setShowAddressConfirm(false);
      setShippingQuoteError(null);
      setPaymentUrl(null);
      setPaymentInitializationError(null);
      setConfirmedOrderPath(null);
      // reset step
      setStep(clientUser ? "datos" : "login-prompt");
    }
  }, [isCheckoutOpen, clientUser]);

  useEffect(() => {
    if (!isCheckoutOpen) {
      return;
    }

    let cancelled = false;

    const fetchPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      setPaymentMethodsError(null);

      try {
        const res = await fetch(`${API_BASE}/api/payment-methods`);

        if (!res.ok) {
          throw new Error("No se pudieron cargar los métodos de pago.");
        }

        const data = await res.json();

        if (!cancelled) {
          setPaymentMethods(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentMethods([]);
          setPaymentMethodsError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los métodos de pago.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPaymentMethods(false);
        }
      }
    };

    fetchPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [isCheckoutOpen]);

  useEffect(() => {
    if (paymentMethods.length === 0) {
      return;
    }

    const normalizedCurrent = normalizePaymentMethodCode(form.metodo_pago);
    const hasCurrentMethod = paymentMethods.some(
      (method) => normalizePaymentMethodCode(method.codigo) === normalizedCurrent,
    );

    const nextPaymentMethod = hasCurrentMethod
      ? normalizedCurrent
      : getDefaultPaymentMethodCode(paymentMethods);

    if (!nextPaymentMethod || nextPaymentMethod === form.metodo_pago) {
      return;
    }

    setForm((prev) => {
      const newForm = {
        ...prev,
        metodo_pago: nextPaymentMethod,
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
      return newForm;
    });
  }, [paymentMethods, form.metodo_pago]);

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);

  // Coordenadas del local (Bolívar 2342, Mar del Plata)
  const STORE_LAT = -38.0040339;
  const STORE_LNG = -57.5469972;

  // Estados para autocompletado de dirección
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);

  // Autocompletado de direcciones resuelto desde el backend
  useEffect(() => {
    if (
      form.metodo_entrega !== "envio" ||
      !showSuggestions ||
      form.calle.trim().length < 3
    ) {
      setAddressSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const baseInput = form.calle.trim();
        const searchTerm = baseInput.toLowerCase().includes("mar del plata")
          ? baseInput
          : `${baseInput}, Mar del Plata`;

        const res = await fetch(
          `${API_BASE}/api/shipping/autocomplete?input=${encodeURIComponent(searchTerm)}`,
        );

        if (!res.ok) {
          throw new Error("No se pudieron buscar direcciones.");
        }

        const data = (await res.json()) as AddressSuggestion[];

        if (!cancelled) {
          setAddressSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error fetching address suggestions:", e);
        if (!cancelled) {
          setAddressSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsSearchingAddress(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.calle, form.metodo_entrega, showSuggestions]);

  const formatAddressSuggestion = (suggestion: AddressSuggestion) => {
    const parts = suggestion.text.split(",").map((part) => part.trim()).filter(Boolean);
    return {
      main: parts[0] ?? suggestion.text,
      secondary: parts.slice(1).join(", "),
      full: suggestion.text,
    };
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setForm((f) => {
      const newForm = { ...f, calle: suggestion.text };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
      return newForm;
    });
    setSelectedPlaceId(suggestion.placeId);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setShippingQuoteError(null);
    setIsAddressVerified(false);
    if (errors.calle) setErrors((err) => ({ ...err, calle: "" }));
  };

  useEffect(() => {
    if (form.metodo_entrega === "retiro") {
      setShippingCost(0);
      setDistanciaKm(null);
      setSelectedCoords(null);
      setSelectedPlaceId(null);
      setShippingQuoteError(null);
      setIsAddressVerified(false);
      return;
    }

    if (!selectedPlaceId) {
      setShippingCost(null);
      setDistanciaKm(null);
      setSelectedCoords(null);
      setShippingQuoteError(null);
      setIsAddressVerified(false);
      return;
    }

    let cancelled = false;

    const quoteShipping = async () => {
      setCalculatingShipping(true);
      setShippingQuoteError(null);

      try {
        const res = await fetch(`${API_BASE}/api/shipping/quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            DestinationPlaceId: selectedPlaceId,
            OrderSubtotal: subtotal,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const errorPayload = data as {
            title?: string;
            detail?: string;
          } | null;
          const msg =
            errorPayload?.title ||
            errorPayload?.detail ||
            "No se pudo validar la dirección de entrega.";
          throw new Error(msg);
        }

        if (!data || !("destinationPlaceId" in data)) {
          throw new Error("No se pudo validar la dirección de entrega.");
        }

        if (cancelled) return;

        const quote = data as ShippingQuoteResponse;

        setSelectedPlaceId(quote.destinationPlaceId);
        setShippingCost(quote.shippingCost);
        setDistanciaKm(quote.distanceKm);
        setSelectedCoords({
          lat: quote.shippingLatitude,
          lng: quote.shippingLongitude,
        });
        setIsAddressVerified(true);
        setForm((f) => {
          if (f.calle === quote.shippingAddress) {
            return f;
          }

          const newForm = { ...f, calle: quote.shippingAddress };
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
          return newForm;
        });
      } catch (e) {
        if (cancelled) return;

        const message =
          e instanceof Error
            ? e.message
            : "No se pudo validar la dirección de entrega.";

        setShippingCost(null);
        setDistanciaKm(null);
        setSelectedCoords(null);
        setIsAddressVerified(false);
        setShippingQuoteError(message);
      } finally {
        if (!cancelled) {
          setCalculatingShipping(false);
        }
      }
    };

    quoteShipping();

    return () => {
      cancelled = true;
    };
  }, [selectedPlaceId, subtotal, form.metodo_entrega]);

  if (!isCheckoutOpen) return null;

  const set =
    (field: keyof FormData) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        setForm((f) => {
          const value = field === "metodo_pago"
            ? normalizePaymentMethodCode(e.target.value)
            : e.target.value;
          const newForm = { ...f, [field]: value };
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
          return newForm;
        });
        if (errors[field]) setErrors((err) => ({ ...err, [field]: "" }));
      };

  const validateDatos = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.nombre.trim()) newErrors.nombre = "Requerido";
    if (!form.apellido.trim()) newErrors.apellido = "Requerido";
    if (!form.dni.trim()) newErrors.dni = "Requerido";
    if (!form.telefono.trim()) {
      newErrors.telefono = "Requerido";
    } else if (form.telefono.replace(/\D/g, "").length < 10) {
      newErrors.telefono = "Debe tener al menos 10 números";
    }
    if (form.metodo_entrega === "envio") {
      if (!form.calle.trim()) {
        newErrors.calle = "Requerido";
      } else if (!selectedPlaceId) {
        newErrors.calle =
          "Debe seleccionar una dirección de las opciones sugeridas.";
      } else if (shippingQuoteError) {
        newErrors.calle = shippingQuoteError;
      } else if (calculatingShipping || !isAddressVerified || shippingCost === null) {
        newErrors.calle = "Estamos validando la dirección y calculando el envío.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    const userToken = localStorage.getItem("userToken");
    const selectedPaymentMethodCode = normalizePaymentMethodCode(form.metodo_pago);

    if (!selectedPaymentMethodCode) {
      showError("Método de pago requerido", "Seleccioná un método de pago para continuar.");
      setStep("pago");
      return;
    }
    
    if (userToken) {
      try {
        const payload = JSON.parse(atob(userToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          logoutClient();
          showError("Sesión expirada", "Tu sesión ha expirado. Por favor, iniciá sesión nuevamente para completar tu compra.");
          setStep("login-prompt");
          return;
        }
      } catch (e) {
        logoutClient();
        showError("Sesión inválida", "Por favor, iniciá sesión nuevamente.");
        setStep("login-prompt");
        return;
      }
    }

    const orderInformation = form.info_adicional.trim() || undefined;

    const backendOrder = {
      BuyerFirstName: form.nombre,
      BuyerLastName: form.apellido,
      BuyerPhone: form.telefono,
      BuyerDocument: form.dni,
      DestinationPlaceId: form.metodo_entrega === "envio" ? (selectedPlaceId ?? "") : "",
      PaymentMethod: selectedPaymentMethodCode,
      OrderInformation: orderInformation,
      Items: items.map((i) => ({
        ProductId: parseInt(i.id, 10),
        Quantity: i.quantity,
        ProductGramageId: i.selectedGramage?.id,
      })),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(backendOrder),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setConfirmedTotal(data?.order?.total ?? finalTotal);
        setConfirmedOrderId(data?.order?.id ?? null);
        setPaymentUrl(data?.paymentUrl ?? null);
        setPaymentInitializationError(
          data?.paymentError?.detail ?? data?.paymentError?.title ?? null,
        );
        setConfirmedOrderPath(
          data?.order?.guestToken
            ? `/pedido/${data.order.guestToken}`
            : "/mis-pedidos",
        );
        setStep("confirmado");
        clearCart();

        // Save address to profile if user opted in
        if (clientUser && wantToSaveAddress && selectedPlaceId && form.calle) {
          saveAddress({
            label: form.calle,
            placeId: selectedPlaceId,
            infoAdicional: form.info_adicional || undefined,
          });
        }
        setWantToSaveAddress(false);

        // Save guest token so the user can check their order later
        if (!userToken && data?.order?.guestToken) {
          const savedTokens = JSON.parse(localStorage.getItem("guestOrderTokens") || "[]");
          savedTokens.unshift({
            orderId: data.order.id,
            token: data.order.guestToken,
            date: new Date().toISOString(),
          });
          // Keep only the last 10 guest orders
          localStorage.setItem("guestOrderTokens", JSON.stringify(savedTokens.slice(0, 10)));
        }

        if (isOnlinePaymentMethod(selectedPaymentMethodCode) && data?.paymentUrl) {
          window.open(data.paymentUrl, '_blank');
        }
      } else {
        const errData = await res.json().catch(() => null);
        const msg =
          errData?.title ||
          errData?.detail ||
          "Error al confirmar el pedido. Intente nuevamente.";
        showError("Error", msg);
      }
    } catch (e) {
      console.error(e);
      showError("Error de red", "Error de red al confirmar el pedido.");
    }
  };

  const handleClose = () => {
    closeCheckout();
    setStep("datos");
    setErrors({});
    setShippingCost(null);
  };

  // finalTotal usa el shippingCost calculado por distancia si existe, si no el subtotal
  const finalTotal =
    subtotal === 0
      ? 0
      : form.metodo_entrega === "retiro"
        ? subtotal
        : shippingCost !== null
          ? subtotal + shippingCost
          : subtotal;
  const selectedPaymentMethodCode = normalizePaymentMethodCode(form.metodo_pago);
  const selectedPaymentMethodLabel = getPaymentMethodLabel(selectedPaymentMethodCode);
  const paymentInitializationFailed = isOnlinePaymentMethod(selectedPaymentMethodCode)
    && paymentInitializationError !== null;
  const hasAvailablePaymentMethods = paymentMethods.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal confirmación de dirección */}
      {showAddressConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddressConfirm(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-border w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">¿Es aquí tu dirección de entrega?</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{form.calle}</p>
                </div>
              </div>
            </div>
            {/* Mapa */}
            <div className="relative">
              <iframe
                key={selectedCoords ? `${selectedCoords.lat},${selectedCoords.lng}` : "store-confirm"}
                title="Confirmar dirección"
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={
                  selectedCoords
                    ? `https://maps.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}&output=embed&z=16`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(form.calle + ", Mar del Plata, Argentina")}&output=embed&z=15`
                }
              />
            </div>
            {/* Acciones */}
            <div className="p-4 flex flex-col gap-2 bg-secondary/10">
              <button
                onClick={() => {
                  setShowAddressConfirm(false);
                  setStep("pago");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl transition-colors font-medium text-sm"
              >
                Sí, es aquí - continuar al pago
              </button>
              <button
                onClick={() => setShowAddressConfirm(false)}
                className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2.5 rounded-xl transition-colors font-medium text-sm"
              >
                No, corregir dirección
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[92vh] bg-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-2 border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-border bg-secondary/30 flex-shrink-0">
          <h2>Finalizar Compra</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmado */}
        {step === "confirmado" ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-6 text-center">
            <div className="flex flex-col items-center justify-start gap-4 max-w-md mx-auto">
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              {isOnlinePaymentMethod(selectedPaymentMethodCode) && !paymentInitializationFailed ? (
                <CheckCircle2 className="w-20 h-20 shrink-0 text-primary" />
              ) : (
                <AlertCircle className="w-20 h-20 shrink-0 text-amber-500" />
              )}
            </div>

            <h3 className="text-2xl text-primary">
              {isOnlinePaymentMethod(selectedPaymentMethodCode)
                ? paymentInitializationFailed
                  ? "Pedido guardado"
                  : "Pedido confirmado"
                : "Casi listo"}
            </h3>

            {paymentInitializationFailed && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg max-w-md text-amber-900 text-sm font-medium">
                No pudimos abrir el checkout. El pedido quedó pendiente y no tenés que volver a crearlo.
              </div>
            )}

            {!isOnlinePaymentMethod(selectedPaymentMethodCode) && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg max-w-md text-amber-900 text-sm font-medium">
                ATENCIÓN: Tu pedido está guardado, pero <strong>NO ESTÁ FINALIZADO</strong> hasta que {selectedPaymentMethodCode === "transferencia"
                  ? "envíes el comprobante de pago"
                  : "confirmes"} por WhatsApp.
              </div>
            )}

            <p className="text-muted-foreground max-w-sm mt-2">
              {isOnlinePaymentMethod(selectedPaymentMethodCode)
                ? paymentInitializationFailed
                  ? paymentInitializationError
                  : `Se ha abierto una nueva pestaña para completar el pago con ${selectedPaymentMethodLabel}. Si no la ves, hacé clic en el botón de abajo.`
                : selectedPaymentMethodCode === "transferencia"
                  ? "Realizá la transferencia con los datos a continuación y enviá el comprobante haciendo clic en el botón verde de abajo."
                  : "Por favor, comunicate por WhatsApp haciendo clic en el botón de abajo para coordinar tu pedido."}
            </p>
            {selectedPaymentMethodCode === "transferencia" && (
              <div className="mt-2 w-full max-w-sm bg-secondary/40 border border-border rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Datos para transferir
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titular</span>
                    <span className="font-medium">Mateo Agustin Lucero</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco</span>
                    <span className="font-medium">Mercado Pago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alias</span>
                    <span className="font-medium font-mono">elmolinomdp</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full max-w-sm mt-6">
              {(selectedPaymentMethodCode === "transferencia" ||
                selectedPaymentMethodCode === "efectivo") && (
                  <a
                    href={`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(
                      selectedPaymentMethodCode === "transferencia"
                        ? `¡Hola! Acabo de hacer un pedido (#${confirmedOrderId ?? "N/A"}) con pago por transferencia. Mi nombre es ${form.nombre} ${form.apellido} y el total es de $${confirmedTotal}. Adjunto el comprobante.`
                        : `¡Hola! Acabo de hacer un pedido (#${confirmedOrderId ?? "N/A"}) con pago en efectivo. Mi nombre es ${form.nombre} ${form.apellido} y el total es de $${confirmedTotal}.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-white px-6 py-3.5 rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98]"
                  >
                    {selectedPaymentMethodCode === "transferencia"
                      ? "Enviar comprobante por WhatsApp"
                      : "Coordinar entrega por WhatsApp"}
                  </a>
                )}
              {isOnlinePaymentMethod(selectedPaymentMethodCode) && paymentUrl && (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#009EE3] hover:bg-[#008ACB] text-white px-6 py-3.5 rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#009EE3]/20 active:scale-[0.98]"
                >
                  Pagar con {selectedPaymentMethodLabel}
                </a>
              )}
              {paymentInitializationFailed && confirmedOrderPath && (
                <a
                  href={confirmedOrderPath}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-xl transition-colors font-medium"
                >
                  Ir al pedido y reintentar el pago
                </a>
              )}
              <button
                onClick={handleClose}
                className="bg-secondary/50 hover:bg-secondary text-secondary-foreground px-8 py-3.5 rounded-xl transition-colors font-medium"
              >
                Volver a la tienda
              </button>
            </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Steps */}
            {step !== "login-prompt" && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                  onClick={() => setStep("datos")}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${step === "datos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  1. Tus datos
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => validateDatos() && setStep("pago")}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${step === "pago" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  2. Pago
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => validateDatos() && setStep("revisar")}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${step === "revisar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  3. Revisar
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-5 gap-6">
              {/* Formulario */}
              <div className="md:col-span-3 space-y-5">
                {step === "login-prompt" && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="bg-primary/10 p-5 rounded-full">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">¿Ya tenés cuenta?</h2>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Iniciá sesión para completar tus datos de envío automáticamente, o continuá como invitado.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-3 pt-4">
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        Iniciar sesión
                      </button>
                      <button
                        onClick={() => setStep("datos")}
                        className="w-full bg-secondary/50 hover:bg-secondary text-foreground py-3.5 rounded-xl font-medium transition-all"
                      >
                        Continuar como invitado
                      </button>
                    </div>
                  </div>
                )}

                {step === "datos" && (
                  <>
                    <div className="bg-primary/10 text-primary p-3 rounded-lg border border-primary/20 mb-4 text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Atención: Solo se realizan compras y entregas dentro de
                      Mar del Plata.
                    </div>

                    {/* Método de entrega */}
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">
                        Método de entrega
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors text-sm font-medium ${form.metodo_entrega === "envio" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          <input
                            type="radio"
                            name="entrega"
                            value="envio"
                            checked={form.metodo_entrega === "envio"}
                            onChange={set("metodo_entrega")}
                            className="hidden"
                          />
                          Envío a domicilio
                        </label>
                        <label
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors text-sm font-medium ${form.metodo_entrega === "retiro" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          <input
                            type="radio"
                            name="entrega"
                            value="retiro"
                            checked={form.metodo_entrega === "retiro"}
                            onChange={set("metodo_entrega")}
                            className="hidden"
                          />
                          Retiro por sucursal
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Nombre *"
                        field="nombre"
                        placeholder="Juan"
                        half
                        readOnly={!!clientUser?.nombre}
                        value={form.nombre}
                        onChange={set("nombre")}
                        error={errors.nombre}
                      />
                      <InputField
                        label="Apellido *"
                        field="apellido"
                        placeholder="Pérez"
                        half
                        readOnly={!!clientUser?.apellido}
                        value={form.apellido}
                        onChange={set("apellido")}
                        error={errors.apellido}
                      />
                      <InputField
                        label="DNI *"
                        field="dni"
                        placeholder="30123456"
                        half
                        readOnly={!!clientUser?.dni}
                        value={form.dni}
                        onChange={set("dni")}
                        error={errors.dni}
                      />
                      <InputField
                        label="Teléfono *"
                        field="telefono"
                        placeholder="+54 9 11 1234-5678"
                        half
                        value={form.telefono}
                        onChange={set("telefono")}
                        error={errors.telefono}
                      />
                      {form.metodo_entrega === "envio" && (
                        <>
                          <div className="col-span-2 relative">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-sm">
                                Dirección *
                              </label>
                              {isAddressVerified && !calculatingShipping && (
                                <span className="text-xs text-primary">
                                  Dirección validada
                                </span>
                              )}
                            </div>

                            {/* Selector de direcciones guardadas â€” combobox */}
                            {clientUser && savedAddresses.length > 0 && (
                              <div className="mb-3">
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                                  <select
                                    value={savedAddresses.find((a: SavedAddress) => a.label === form.calle)?.id ?? ""}
                                    onChange={(e) => {
                                      const addr = savedAddresses.find((a: SavedAddress) => a.id === e.target.value);
                                      if (!addr) return;
                                      setForm((f) => {
                                        const newForm = { ...f, calle: addr.label, info_adicional: addr.infoAdicional || f.info_adicional };
                                        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
                                        return newForm;
                                      });
                                      setSelectedPlaceId(addr.placeId);
                                      setShowSuggestions(false);
                                      setIsAddressVerified(false);
                                      setShippingQuoteError(null);
                                      if (errors.calle) setErrors((err) => ({ ...err, calle: "" }));
                                    }}
                                    className="w-full pl-9 pr-8 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                                  >
                                    <option value="">Elegir dirección guardada...</option>
                                    {savedAddresses.map((addr: SavedAddress) => (
                                      <option key={addr.id} value={addr.id}>
                                        {addr.label}{addr.infoAdicional ? ` (${addr.infoAdicional})` : ""}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="relative my-3">
                                  <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                  </div>
                                  <div className="relative flex justify-center">
                                    <span className="bg-card px-2 text-xs text-muted-foreground">o escribí otra</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="relative">
                              <input
                                type="text"
                                value={form.calle}
                                onChange={(e) => {
                                  set("calle")(e);
                                  setShowSuggestions(true);
                                  setSelectedPlaceId(null);
                                  setIsAddressVerified(false);
                                  setShippingQuoteError(null);
                                  setDistanciaKm(null);
                                  setSelectedCoords(null);
                                  setShippingCost(null);
                                }}
                                placeholder="Ej: Av. Independencia 1200"
                                className={`w-full px-3 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors 
                                  ${errors.calle
                                    ? "border-destructive"
                                    : "border-border"
                                  }`}
                              />
                              {(isSearchingAddress || calculatingShipping) && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                            {errors.calle && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.calle}
                              </p>
                            )}
                            {!errors.calle && shippingQuoteError && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {shippingQuoteError}
                              </p>
                            )}


                            {/* Dropdown de Sugerencias */}
                            {showSuggestions &&
                              form.calle.trim().length > 2 &&
                              (isSearchingAddress ||
                                addressSuggestions.length > 0) && (
                                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {isSearchingAddress &&
                                    addressSuggestions.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground text-center">
                                      Buscando direcciones...
                                    </div>
                                  ) : (
                                    addressSuggestions.map(
                                      (suggestion, idx) => {
                                        const formatted = formatAddressSuggestion(suggestion);
                                        return (
                                          <button
                                            key={`${suggestion.placeId}-${idx}`}
                                            type="button"
                                            onClick={() =>
                                              handleAddressSelect(suggestion)
                                            }
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 border-b border-border/50 last:border-0 transition-colors"
                                          >
                                            <p className="font-medium truncate">
                                              {formatted.main}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                              {formatted.secondary}
                                            </p>
                                          </button>
                                        );
                                      }
                                    )
                                  )}
                                </div>
                              )}

                            {/* Opción guardar dirección (solo para usuarios logueados con dirección validada) */}
                            {clientUser && isAddressVerified && savedAddresses.length < 10 && (
                              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none group">
                                <input
                                  type="checkbox"
                                  checked={wantToSaveAddress}
                                  onChange={(e) => setWantToSaveAddress(e.target.checked)}
                                  className="accent-primary w-3.5 h-3.5 rounded"
                                />
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  Guardar esta dirección en mi perfil
                                </span>
                              </label>
                            )}
                          </div>

                          <InputField
                            label="Info adicional (opcional)"
                            field="info_adicional"
                            placeholder="Ej: Piso 4 Depto B"
                            value={form.info_adicional}
                            onChange={set("info_adicional")}
                            error={errors.info_adicional}
                          />
                        </>
                      )}
                    </div>

                    {/* Calculadora de envío removida ya que es solo para Mar del Plata */}

                    <button
                      onClick={() => {
                        if (!validateDatos()) return;
                        if (form.metodo_entrega === "envio") {
                          setShowAddressConfirm(true);
                        } else {
                          setStep("pago");
                        }
                      }}
                      id="checkout-next-step"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl transition-colors font-medium"
                    >
                      Continuar al pago
                    </button>
                  </>
                )}

                {step === "pago" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Método de pago</p>
                    {loadingPaymentMethods && (
                      <div className="flex items-center justify-center rounded-xl border border-border bg-secondary/20 px-4 py-8">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}

                    {!loadingPaymentMethods && paymentMethodsError && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {paymentMethodsError}
                      </div>
                    )}

                    {!loadingPaymentMethods && !paymentMethodsError && !hasAvailablePaymentMethods && (
                      <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                        No hay métodos de pago disponibles en este momento.
                      </div>
                    )}

                    {!loadingPaymentMethods && paymentMethods.map((method) => {
                      const methodCode = normalizePaymentMethodCode(method.codigo);
                      const isSelected = selectedPaymentMethodCode === methodCode;
                      const methodIcon = methodCode === "mercado_pago"
                        ? "💳"
                        : methodCode === "transferencia"
                          ? "🏦"
                          : methodCode === "efectivo"
                            ? "💵"
                            : "🔒";

                      return (
                        <div
                          key={method.id}
                          className={`rounded-xl border-2 transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <label className="flex items-center gap-4 p-4 cursor-pointer">
                            <input
                              type="radio"
                              name="pago"
                              value={methodCode}
                              checked={isSelected}
                              onChange={set("metodo_pago")}
                              className="accent-primary"
                            />
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-2xl">{methodIcon}</span>
                            </div>
                            <div>
                              <p className="font-medium">{getPaymentMethodLabel(methodCode)}</p>
                              <p className="text-sm text-muted-foreground">
                                {getCheckoutPaymentDescription(methodCode)}
                              </p>
                            </div>
                          </label>

                          {isSelected && methodCode === "transferencia" && (
                            <div className="px-4 pb-4 pl-20">
                              <div className="bg-white/50 p-3 rounded-lg border border-border/50 space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Datos para transferir
                                </p>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Titular
                                  </span>
                                  <span className="font-medium">
                                    Mateo Agustin Lucero
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Banco
                                  </span>
                                  <span className="font-medium">Mercado Pago</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Alias
                                  </span>
                                  <span className="font-medium font-mono tracking-wide">
                                    elmolinomdp
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => setStep("revisar")}
                      disabled={!selectedPaymentMethodCode || loadingPaymentMethods || !hasAvailablePaymentMethods}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-3 rounded-xl transition-colors font-medium mt-2"
                    >
                      Revisar pedido
                    </button>
                  </div>
                )}

                {step === "revisar" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">
                      Revisá los datos de tu compra
                    </p>
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Datos Personales
                        </span>
                        <span className="font-medium">
                          {form.nombre} {form.apellido} - DNI: {form.dni}
                        </span>
                        <span className="block text-muted-foreground">
                          {form.telefono}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block text-xs">
                          Método de entrega
                        </span>
                        <span className="font-medium">
                          {form.metodo_entrega === "envio"
                            ? "Envío a domicilio"
                            : "Retiro por Sucursal"}
                        </span>
                        {form.metodo_entrega === "envio" && (
                          <span className="block text-muted-foreground">
                            {form.calle}{" "}
                            {form.info_adicional && `- ${form.info_adicional}`}
                          </span>
                        )}
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block text-xs">
                          Método de pago
                        </span>
                        <span className="font-medium">
                          {selectedPaymentMethodLabel}
                        </span>
                        {selectedPaymentMethodCode === "efectivo" &&
                          form.monto_efectivo && (
                            <span className="block text-muted-foreground">
                              Paga con: ${form.monto_efectivo}
                            </span>
                          )}
                      </div>
                    </div>
                    <button
                      id="confirm-order-btn"
                      onClick={handleConfirm}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl transition-colors font-medium mt-4 shadow-lg shadow-primary/20"
                    >
                      Confirmar Compra
                    </button>
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border sticky top-0">
                  <h3 className="mb-4 text-base">Resumen del pedido</h3>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const totalForWholesale = items
                        .filter((i) => i.id === item.id)
                        .reduce((acc, i) => {
                          if (i.measurementUnit === "gramo" && i.selectedGramage) {
                            return acc + i.quantity * i.selectedGramage.grams;
                          }

                          return acc + i.quantity;
                        }, 0);

                      const wholesale = isWholesaleActive(item, totalForWholesale);

                      const price =
                        item.measurementUnit === "gramo" && item.selectedGramage
                          ? wholesale && item.wholesalePrice
                            ? item.wholesalePrice.price * (item.selectedGramage.grams / 1000)
                            : getEffectiveGramagePrice(item.selectedGramage)
                          : getEffectivePrice(item, totalForWholesale);

                      return (
                        <div
                          key={`${item.id}-${item.selectedGramage?.id || "base"}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate mr-2">
                            {item.name} ×{item.quantity}
                          </span>
                          <span className="flex-shrink-0">
                            {formatARS(price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatARS(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Envío
                        {distanciaKm !== null &&
                          form.metodo_entrega === "envio" && (
                            <span className="text-xs opacity-60">
                              ({distanciaKm.toFixed(1)} km)
                            </span>
                          )}
                      </span>
                      <span>
                        {form.metodo_entrega === "retiro"
                          ? "Gratis (retiro)"
                          : shippingCost === 0
                            ? "¡Gratis!"
                            : shippingCost !== null
                              ? formatARS(shippingCost)
                              : "Ingresá tu dirección"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-semibold">
                      <span>Total</span>
                      <span className="text-primary text-base">
                        {formatARS(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mapa de dirección - Google Maps */}
                {form.metodo_entrega === "envio" && (() => {
                  const mapLat = isAddressVerified && selectedCoords ? selectedCoords.lat : STORE_LAT;
                  const mapLng = isAddressVerified && selectedCoords ? selectedCoords.lng : STORE_LNG;
                  const label = isAddressVerified && form.calle ? form.calle : "Ingrese su dirección para verla en el mapa";
                  const mapSrc = isAddressVerified && selectedCoords
                    ? `https://maps.google.com/maps?q=${mapLat},${mapLng}&output=embed&z=15`
                    : `https://maps.google.com/maps?q=Mar+del+Plata,+Argentina&output=embed&z=13`;

                  return (
                    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                      </div>
                      <iframe
                        key={isAddressVerified && selectedCoords ? `${mapLat},${mapLng}` : "default-map"}
                        title="Mapa de entrega"
                        width="100%"
                        height="210"
                        style={{ border: 0, display: "block" }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapSrc}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {showLoginModal && (
        <ClientLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            if (clientUser) {
              setStep("datos");
            }
          }}
        />
      )}
    </>
  );
}
