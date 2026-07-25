import type { PaymentMethod, PaymentMethodCode } from "./types";

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercado_pago: "Mercado Pago",
  payway: "Payway",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
};

export const ONLINE_PAYMENT_METHOD_CODES = new Set<string>([
  "mercado_pago",
  "payway",
]);

export function normalizePaymentMethodCode(code?: string | null): PaymentMethodCode {
  if (!code) {
    return "";
  }

  const normalized = code.trim().toLowerCase();

  if (normalized === "mercadopago" || normalized === "mercado-pago") {
    return "mercado_pago";
  }

  if (
    normalized === "mercado_pago" ||
    normalized === "payway" ||
    normalized === "transferencia" ||
    normalized === "efectivo"
  ) {
    return normalized;
  }

  return "";
}

export function getPaymentMethodLabel(code?: string | null): string {
  const normalized = normalizePaymentMethodCode(code);
  return PAYMENT_METHOD_LABELS[normalized] ?? code ?? "Sin definir";
}

export function isOnlinePaymentMethod(code?: string | null): boolean {
  return ONLINE_PAYMENT_METHOD_CODES.has(normalizePaymentMethodCode(code));
}

export function getCheckoutPaymentDescription(code?: string | null): string {
  switch (normalizePaymentMethodCode(code)) {
    case "mercado_pago":
      return "Tarjetas de crédito, débito y efectivo";
    case "payway":
      return "Checkout seguro alojado por Payway";
    case "transferencia":
      return "Enviá el comprobante por WhatsApp";
    case "efectivo":
      return "Pagás al momento de la entrega o retiro";
    default:
      return "Método de pago disponible";
  }
}

export function getDefaultPaymentMethodCode(paymentMethods: PaymentMethod[]): PaymentMethodCode {
  return normalizePaymentMethodCode(paymentMethods[0]?.codigo);
}
