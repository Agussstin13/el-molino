import { useState, useEffect } from "react";
import { X, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { formatARS, getEffectivePrice } from "../../lib/price";
const API_BASE = import.meta.env.VITE_API_BASE;

interface FormData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  calle: string;
  nro_calle: string;
  info_adicional: string;
  ciudad: string;
  codigo_postal: string;
  metodo_pago: "mercadopago" | "transferencia";
}

const EMPTY_FORM: FormData = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  calle: "",
  nro_calle: "",
  info_adicional: "",
  ciudad: "",
  codigo_postal: "",
  metodo_pago: "mercadopago",
};

const FORM_STORAGE_KEY = "el-molino-checkout-form";

export function Checkout() {
  const {
    items,
    isCheckoutOpen,
    closeCheckout,
    total,
    subtotal,
    shipping,
    clearCart,
  } = useCart();
  const { clientUser } = useAuth();
  const { showError } = useAlert();
  const [step, setStep] = useState<"datos" | "pago" | "confirmado">("datos");
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
        if (!newForm.nombre) {
          newForm.nombre = clientUser.nombre;
          changed = true;
        }
        if (!newForm.apellido) {
          newForm.apellido = clientUser.apellido;
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
    if (!form.telefono.trim()) newErrors.telefono = "Requerido";
    if (!form.calle.trim()) newErrors.calle = "Requerido";
    if (!form.nro_calle.trim()) newErrors.nro_calle = "Requerido";
    if (!form.ciudad.trim()) newErrors.ciudad = "Requerido";
    if (!form.codigo_postal.trim()) newErrors.codigo_postal = "Requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularEnvio = async () => {
    if (!form.codigo_postal || form.codigo_postal.length < 4) return;
    setCalculatingShipping(true);
    await new Promise((r) => setTimeout(r, 800));
    // Mock: costo aleatorio entre $400 y $1200
    setShippingCost(Math.floor(Math.random() * 800) + 400);
    setCalculatingShipping(false);
  };

  const handleConfirm = async () => {
    const userToken = localStorage.getItem('userToken');

    const backendOrder = {
      buyerFirstName: form.nombre,
      buyerLastName: form.apellido,
      buyerPhone: form.telefono,
      buyerDocument: form.dni,
      shippingAddress:
        `${form.calle} ${form.nro_calle}, ${form.ciudad}, ${form.codigo_postal}${form.info_adicional ? " - " + form.info_adicional : ""}`.trim(),
      paymentMethod: form.metodo_pago,
      items: items.map((i) => ({
        productId: parseInt(i.id, 10),
        quantity: i.quantity,
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
        setStep("confirmado");
        clearCart();
        localStorage.removeItem(FORM_STORAGE_KEY);
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
    if (step === "confirmado") {
      setStep("datos");
      setForm(EMPTY_FORM);
    } else {
      setStep("datos");
    }
    setErrors({});
    setShippingCost(null);
  };

  const finalTotal = total + (shippingCost ?? 0);

  const InputField = ({
    label,
    field,
    type = "text",
    placeholder,
    half = false,
  }: {
    label: string;
    field: keyof FormData;
    type?: string;
    placeholder?: string;
    half?: boolean;
  }) => (
    <div className={half ? "" : "col-span-2"}>
      <label className="block text-sm mb-1.5">{label}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={set(field)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors ${
          errors[field] ? "border-destructive" : "border-border"
        }`}
      />
      {errors[field] && (
        <p className="text-xs text-destructive mt-1">{errors[field]}</p>
      )}
    </div>
  );

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
                : "Recibirás los datos para realizar la transferencia bancaria por WhatsApp."}
            </p>
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
            <div className="flex items-center gap-2 mb-6">
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
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Formulario */}
              <div className="md:col-span-3 space-y-5">
                {step === "datos" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Nombre *"
                        field="nombre"
                        placeholder="Juan"
                        half
                      />
                      <InputField
                        label="Apellido *"
                        field="apellido"
                        placeholder="Pérez"
                        half
                      />
                      <InputField
                        label="DNI *"
                        field="dni"
                        placeholder="30123456"
                        half
                      />
                      <InputField
                        label="Teléfono *"
                        field="telefono"
                        placeholder="+54 9 11 1234-5678"
                        half
                      />
                      <InputField
                        label="Calle *"
                        field="calle"
                        placeholder="Av. Corrientes"
                      />
                      <InputField
                        label="Número *"
                        field="nro_calle"
                        placeholder="1234"
                        half
                      />
                      <InputField
                        label="Info adicional"
                        field="info_adicional"
                        placeholder="Piso 4 Depto B"
                        half
                      />
                      <InputField
                        label="Ciudad *"
                        field="ciudad"
                        placeholder="Buenos Aires"
                        half
                      />
                      <InputField
                        label="Código Postal *"
                        field="codigo_postal"
                        placeholder="1043"
                        half
                      />
                    </div>

                    {/* Calculadora envío */}
                    <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">
                          Calcular costo de envío
                        </span>
                      </div>
                      <button
                        onClick={calcularEnvio}
                        disabled={
                          calculatingShipping || form.codigo_postal.length < 4
                        }
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-2 rounded-lg transition-colors text-sm"
                      >
                        {calculatingShipping ? "Calculando..." : "Calcular"}
                      </button>
                      {shippingCost !== null && (
                        <p className="text-sm text-accent mt-2 font-medium">
                          Costo estimado: {formatARS(shippingCost)}
                        </p>
                      )}
                    </div>

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
                    <label
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.metodo_pago === "transferencia" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
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
                          Pago directo — te enviamos los datos
                        </p>
                      </div>
                    </label>

                    <button
                      id="confirm-order-btn"
                      onClick={handleConfirm}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl transition-colors font-medium mt-2"
                    >
                      Confirmar pedido
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
                      <span className="text-muted-foreground">Envío</span>
                      <span>
                        {shippingCost !== null
                          ? formatARS(shippingCost)
                          : shipping === 0
                            ? "¡Gratis!"
                            : "A calcular"}
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
