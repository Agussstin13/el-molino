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
  if (product.discount) {
    return product.price * (1 - product.discount / 100);
  }
  return product.price;
}

export function isWholesaleActive(product: Product, quantity: number): boolean {
  return !!(product.wholesalePrice && quantity >= product.wholesalePrice.quantity);
}
