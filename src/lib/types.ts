export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  discount?: number;
  wholesalePrice?: { quantity: number; price: number };
  description?: string;
  category?: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Coupon {
  id: string;
  nombre: string;
  detalle: string;
  codigo: string;
  monto: number | null;
  porcentaje: number | null;
  tope: number | null;
  compra_minima: number | null;
  activo: boolean;
  valido_mayorista: boolean;
}

export interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  date: string;
  metodo_pago: string;
}
