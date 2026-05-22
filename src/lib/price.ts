import type { Product } from './types';

export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 500;

/**
 * Formatea un número como moneda argentina (ARS).
 * Ej: 4500 → "$4.500"
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Retorna el precio efectivo según la cantidad:
 * - Si aplica precio mayorista → precio mayorista
 * - Si tiene descuento → precio con descuento
 * - Si no → precio normal
 */
export function getEffectivePrice(product: Product, quantity: number): number {
  if (product.wholesalePrice && quantity >= product.wholesalePrice.quantity) {
    return product.wholesalePrice.price;
  }
  if (product.onOffer && product.offerPrice) {
    return product.offerPrice;
  }
  if (product.discount) {
    return product.price * (1 - product.discount / 100);
  }
  return product.price;
}

export function isWholesaleActive(product: Product, quantity: number): boolean {
  return !!(product.wholesalePrice && quantity >= product.wholesalePrice.quantity);
}

/**
 * Formatea una cadena o número en el formato de entrada de dinero argentino (miles con punto, decimales con coma).
 * Ej: 400000 -> "400.000"
 * Ej: "400000,5" -> "400.000,5"
 */
export function formatInputPrice(val: string | number | null | undefined): string {
  if (val === undefined || val === null) return "";
  
  // Convertir a string y unificar separadores decimales a coma
  let s = typeof val === "number" ? val.toString().replace(/\./g, ",") : val;
  
  // Eliminar cualquier caracter que no sea dígito o coma
  s = s.replace(/[^0-9,]/g, "");
  
  // Asegurar que solo exista una coma decimal
  const parts = s.split(",");
  if (parts.length > 2) {
    s = parts[0] + "," + parts.slice(1).join("");
  }
  
  const intPart = parts[0];
  const decPart = parts[1];
  
  // Limpiar ceros a la izquierda
  let cleanInt = intPart.replace(/^0+/, "");
  if (cleanInt === "") cleanInt = "0";
  
  // Añadir puntos de miles
  const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Reensamblar con coma decimal si corresponde
  if (s.includes(",")) {
    const cleanDec = decPart !== undefined ? decPart.slice(0, 2) : "";
    return formattedInt + "," + cleanDec;
  }
  
  return formattedInt;
}

/**
 * Convierte un precio con formato de entrada en un número de punto flotante puro.
 * Ej: "400.000,50" -> 400000.5
 */
export function parseInputPrice(formattedVal: string | number | null | undefined): number {
  if (formattedVal === undefined || formattedVal === null) return 0;
  if (typeof formattedVal === "number") return formattedVal;
  
  // Remover puntos de miles
  let s = formattedVal.replace(/\./g, "");
  // Reemplazar coma decimal por punto decimal
  s = s.replace(/,/g, ".");
  
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}
