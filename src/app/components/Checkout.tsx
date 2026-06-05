import { useState, useEffect } from "react";
import { X, MapPin, ChevronRight, CheckCircle2, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { formatARS, getEffectivePrice, getShippingCostByDistance } from "../../lib/price";
const API_BASE = import.meta.env.VITE_API_BASE;

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
  metodo_pago: "mercadopago" | "transferencia" | "efectivo";
  monto_efectivo: string;
}

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
  };
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
  metodo_pago: "mercadopago",
  monto_efectivo: "",
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
        className={`w-full px-3 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors ${
          error ? "border-destructive" : "border-border"
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
    {error && (
      <p className="text-xs text-destructive mt-1">{error}</p>
    )}
  </div>
);

export function Checkout() {
  const { isCheckoutOpen, items, closeCheckout, subtotal, shipping, total, clearCart, shippingRates, freeShippingThreshold } = useCart();
  const { isClientAuthenticated, clientUser, updateClientProfile } = useAuth();
  const { showError, showSuccess } = useAlert();
  const [step, setStep] = useState<"datos" | "pago" | "revisar" | "confirmado">("datos");
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [form, setForm] = useState<FormData>(() => {
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed ? { ...EMPTY_FORM, ...parsed } : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });

  useEffect(() => {
    if (clientUser) {
      setForm((f) => {
        const newForm = { ...f };
        let changed = false;
        if (clientUser.nombre && !newForm.nombre) {
          newForm.nombre = clientUser.nombre;
          changed = true;
        }
        if (clientUser.apellido && !newForm.apellido) {
          newForm.apellido = clientUser.apellido;
          changed = true;
        }
        if (clientUser.dni && !newForm.dni) {
          newForm.dni = clientUser.dni;
          changed = true;
        }
        if (clientUser.telefono && !newForm.telefono) {
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

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);

  // Coordenadas del local (Bolívar 2342, Mar del Plata)
  const STORE_LAT = -38.0040339;
  const STORE_LNG = -57.5469972;

  const calcularDistanciaKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Estados para autocompletado de dirección
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (form.metodo_entrega === "envio" && form.calle.trim().length > 3 && showSuggestions) {
      const timeoutId = setTimeout(async () => {
        setIsSearchingAddress(true);
        try {
          // Búsqueda más flexible en lugar de restrictiva por 'city='
          const query = encodeURIComponent(`${form.calle.trim()}, Mar del Plata, Argentina`);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=5&email=test@elmolino.com`);
          if (res.ok) {
            const data = await res.json();
            setAddressSuggestions(data);
          }
        } catch (e) {
          console.error("Error fetching address:", e);
        } finally {
          setIsSearchingAddress(false);
        }
      }, 600);
      return () => clearTimeout(timeoutId);
    } else {
      setAddressSuggestions([]);
    }
  }, [form.calle, form.metodo_entrega, showSuggestions]);

  const handleAddressSelect = (suggestion: AddressSuggestion & { lat?: string; lon?: string }) => {
    const fullAddress = suggestion.display_name;

    // Calcular distancia si la sugerencia trae coordenadas
    if (suggestion.lat && suggestion.lon) {
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lon);
      const km = calcularDistanciaKm(STORE_LAT, STORE_LNG, lat, lng);
      setDistanciaKm(km);
      if (subtotal < freeShippingThreshold) {
        const costo = getShippingCostByDistance(km, shippingRates);
        setShippingCost(costo);
      } else {
        setShippingCost(0);
      }
    }

    setForm((f) => {
      const newForm = { ...f, calle: fullAddress };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newForm));
      return newForm;
    });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    if (errors.calle) setErrors((err) => ({ ...err, calle: "" }));
  };

  // Recalcular el envío si cambia el método de entrega
  useEffect(() => {
    if (form.metodo_entrega === "retiro") {
      setShippingCost(0);
      setDistanciaKm(null);
    } else if (distanciaKm !== null) {
      if (subtotal < freeShippingThreshold) {
        setShippingCost(getShippingCostByDistance(distanciaKm, shippingRates));
      } else {
        setShippingCost(0);
      }
    } else {
      setShippingCost(null);
    }
  }, [form.metodo_entrega, subtotal, shippingRates, freeShippingThreshold, distanciaKm]);

  if (!isCheckoutOpen) return null;

  const set =
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((f) => {
        const newForm = { ...f, [field]: e.target.value };
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
      if (!form.calle.trim()) newErrors.calle = "Requerido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularEnvio = async () => {
    // Envío deshabilitado - Solo Mar del Plata
  };

  const handleConfirm = async () => {
    const userToken = localStorage.getItem('userToken');

    const backendOrder = {
      buyerFirstName: form.nombre,
      buyerLastName: form.apellido,
      buyerPhone: form.telefono,
      buyerDocument: form.dni,
      shippingAddress:
        form.metodo_entrega === "retiro" 
          ? "Retiro por sucursal" 
          : `${form.calle}${form.info_adicional ? " - " + form.info_adicional : ""}`.trim(),
      paymentMethod: form.metodo_pago === "mercadopago" ? 0 : form.metodo_pago === "efectivo" ? 1 : 2,
      orderInformation: form.metodo_pago === "efectivo" && form.monto_efectivo
        ? `Paga con $${form.monto_efectivo}`
        : undefined,
      shippingCost: form.metodo_entrega === "envio" ? (shippingCost ?? 0) : 0,
      items: items.map((i) => ({
        productId: parseInt(i.id, 10),
        quantity: i.quantity,
        productGramageId: i.selectedGramage?.id,
      })),
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        setConfirmedTotal(finalTotal);
        setStep("confirmado");
        clearCart();
        
        if (form.metodo_pago === "mercadopago" && data?.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.title || errData?.detail || "Error al confirmar el pedido. Intente nuevamente.";
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

  // finalTotal usa el shippingCost calculado por distancia si existe, si no el del contexto
  const finalTotal = subtotal === 0 ? 0
    : form.metodo_entrega === "retiro" ? subtotal
    : shippingCost !== null ? subtotal + shippingCost
    : total;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[92vh] bg-card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-2 border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-border bg-secondary/30 flex-shrink-0">
          <h2 style={{ fontFamily: "Georgia, serif" }}>Finalizar Compra</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmado */}
        {step === "confirmado" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-accent" />
            <h3
              className="text-2xl text-primary"
              style={{ fontFamily: "Georgia, serif" }}
            >
              ¡Pedido confirmado!
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {form.metodo_pago === "mercadopago"
                ? "Te redirigiremos al link de pago de Mercado Pago para completar la transacción."
                : form.metodo_pago === "transferencia"
                ? "Realizá la transferencia con los datos que se muestran a continuación y enviá el comprobante por WhatsApp."
                : "Abonarás en efectivo al recibir o retirar tu pedido."}
            </p>
            {form.metodo_pago === "transferencia" && (
              <div className="mt-2 w-full max-w-sm bg-secondary/40 border border-border rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos para transferir</p>
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
            {(form.metodo_pago === "transferencia" || form.metodo_pago === "efectivo") && (
              <a
                href={`https://wa.me/5492236927799?text=${encodeURIComponent(
                  form.metodo_pago === "transferencia"
                    ? `¡Hola! Acabo de hacer un pedido (#transferencia). Mi nombre es ${form.nombre} ${form.apellido} y el total es de $${confirmedTotal}. Adjunto el comprobante de transferencia.`
                    : `¡Hola! Acabo de hacer un pedido con pago en efectivo. Mi nombre es ${form.nombre} ${form.apellido} y el total es de $${confirmedTotal}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                {form.metodo_pago === "transferencia" ? "Enviar comprobante por WhatsApp" : "Coordinar entrega por WhatsApp"}
              </a>
            )}
            <button
              onClick={handleClose}
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl transition-colors"
            >
              Volver a la tienda
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Steps */}
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

            <div className="grid md:grid-cols-5 gap-6">
              {/* Formulario */}
              <div className="md:col-span-3 space-y-5">
                {step === "datos" && (
                  <>
                    <div className="bg-primary/10 text-primary p-3 rounded-lg border border-primary/20 mb-4 text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Atención: Solo se realizan compras y entregas dentro de Mar del Plata.
                    </div>

                    {/* Método de Entrega */}
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">Método de entrega</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors text-sm font-medium ${form.metodo_entrega === "envio" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                          <input type="radio" name="entrega" value="envio" checked={form.metodo_entrega === "envio"} onChange={set("metodo_entrega")} className="hidden" />
                          Envío a domicilio
                        </label>
                        <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors text-sm font-medium ${form.metodo_entrega === "retiro" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                          <input type="radio" name="entrega" value="retiro" checked={form.metodo_entrega === "retiro"} onChange={set("metodo_entrega")} className="hidden" />
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
                            <label className="block text-sm mb-1.5">Calle *</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={form.calle}
                                onChange={(e) => {
                                  set("calle")(e);
                                  setShowSuggestions(true);
                                }}
                                placeholder="Ej: Av. Independencia"
                                className={`w-full px-3 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors ${
                                  errors.calle ? "border-destructive" : "border-border"
                                }`}
                              />
                              {isSearchingAddress && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                            {errors.calle && (
                              <p className="text-xs text-destructive mt-1">{errors.calle}</p>
                            )}

                            {/* Dropdown de Sugerencias */}
                            {showSuggestions && form.calle.trim().length > 3 && (isSearchingAddress || addressSuggestions.length > 0) && (
                              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {isSearchingAddress && addressSuggestions.length === 0 ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">Buscando direcciones...</div>
                                ) : (
                                  addressSuggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleAddressSelect(suggestion)}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 border-b border-border/50 last:border-0 transition-colors"
                                    >
                                      <p className="font-medium truncate">{suggestion.address?.road || suggestion.display_name.split(',')[0]}</p>
                                      <p className="text-xs text-muted-foreground truncate">{suggestion.display_name}</p>
                                    </button>
                                  ))
                                )}
                              </div>
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

                    {/* Calculadora envío removida ya que es solo para Mar del Plata */}

                    <button
                      onClick={() => validateDatos() && setStep("pago")}
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

                    {/* Mercado Pago */}
                    <label
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.metodo_pago === "mercadopago" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <input
                        type="radio"
                        name="pago"
                        value="mercadopago"
                        checked={form.metodo_pago === "mercadopago"}
                        onChange={set("metodo_pago")}
                        className="accent-primary"
                      />
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-2xl">💳</span>
                      </div>
                      <div>
                        <p className="font-medium">Mercado Pago</p>
                        <p className="text-sm text-muted-foreground">
                          Tarjetas de crédito, débito y efectivo
                        </p>
                      </div>
                    </label>

                    {/* Transferencia */}
                    <div className={`rounded-xl border-2 transition-colors ${form.metodo_pago === "transferencia" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <label className="flex items-center gap-4 p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="pago"
                          value="transferencia"
                          checked={form.metodo_pago === "transferencia"}
                          onChange={set("metodo_pago")}
                          className="accent-primary"
                        />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-2xl">🏦</span>
                        </div>
                        <div>
                          <p className="font-medium">Transferencia Bancaria</p>
                          <p className="text-sm text-muted-foreground">
                            Mercado Pago — enviá el comprobante por WhatsApp
                          </p>
                        </div>
                      </label>
                      {form.metodo_pago === "transferencia" && (
                        <div className="px-4 pb-4 pl-20">
                          <div className="bg-white/50 p-3 rounded-lg border border-border/50 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Datos para transferir</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Titular</span>
                              <span className="font-medium">Mateo Agustin Lucero</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Banco</span>
                              <span className="font-medium">Mercado Pago</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Alias</span>
                              <span className="font-medium font-mono tracking-wide">elmolinomdp</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Efectivo */}
                    <div className={`rounded-xl border-2 transition-colors ${form.metodo_pago === "efectivo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <label className="flex items-center gap-4 p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="pago"
                          value="efectivo"
                          checked={form.metodo_pago === "efectivo"}
                          onChange={set("metodo_pago")}
                          className="accent-primary"
                        />
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-2xl">💵</span>
                        </div>
                        <div>
                          <p className="font-medium">Efectivo</p>
                          <p className="text-sm text-muted-foreground">
                            Pagás al momento de la entrega o retiro
                          </p>
                        </div>
                      </label>
                      {form.metodo_pago === "efectivo" && (
                        <div className="px-4 pb-4 pl-20">
                          <div className="bg-white/50 p-3 rounded-lg border border-border/50">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              ¿Con cuánto vas a abonar? (Opcional)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">$</span>
                              <input
                                type="number"
                                value={form.monto_efectivo}
                                onChange={set("monto_efectivo")}
                                placeholder={`${finalTotal}`}
                                className="w-full pl-7 pr-3 py-1.5 border border-border rounded bg-input-background text-sm focus:ring-1 focus:ring-primary/50 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setStep("revisar")}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl transition-colors font-medium mt-2"
                    >
                      Revisar pedido
                    </button>
                  </div>
                )}

                {step === "revisar" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Revisá los datos de tu compra</p>
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Datos Personales</span>
                        <span className="font-medium">{form.nombre} {form.apellido} - DNI: {form.dni}</span>
                        <span className="block text-muted-foreground">{form.telefono}</span>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block text-xs">Método de Entrega</span>
                        <span className="font-medium">{form.metodo_entrega === "envio" ? "Envío a Domicilio" : "Retiro por Sucursal"}</span>
                        {form.metodo_entrega === "envio" && <span className="block text-muted-foreground">{form.calle} {form.info_adicional && `- ${form.info_adicional}`}</span>}
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block text-xs">Método de Pago</span>
                        <span className="font-medium">
                          {form.metodo_pago === "mercadopago" ? "Mercado Pago" : 
                           form.metodo_pago === "transferencia" ? "Transferencia Bancaria" : "Efectivo"}
                        </span>
                        {form.metodo_pago === "efectivo" && form.monto_efectivo && (
                          <span className="block text-muted-foreground">Paga con: ${form.monto_efectivo}</span>
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
              <div className="md:col-span-2">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border sticky top-0">
                  <h3
                    className="mb-4 text-base"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Resumen del pedido
                  </h3>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const price = getEffectivePrice(item, item.quantity);
                      return (
                        <div
                          key={item.id}
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
                        {distanciaKm !== null && form.metodo_entrega === "envio" && (
                          <span className="text-xs opacity-60">({distanciaKm.toFixed(1)} km)</span>
                        )}
                      </span>
                      <span>
                        {form.metodo_entrega === "retiro"
                          ? "Gratis (retiro)"
                          : shippingCost === 0
                          ? "¡Gratis!"
                          : shippingCost !== null
                          ? formatARS(shippingCost)
                          : subtotal >= freeShippingThreshold
                          ? "¡Gratis!"
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
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
