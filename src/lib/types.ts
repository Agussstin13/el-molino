export interface ProductGramage {
  id: number;
  productId: number;
  grams: number;
  price: number;
  offerPrice?: number | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  imagePath?: string;
  discount?: number;
  wholesalePrice?: { quantity: number; price: number };
  description?: string;
  category?: string;
  categoryId?: number;
  stock: number;
  active?: boolean;
  offerPrice?: number | null;
  onOffer?: boolean; // legacy — derivado de offerPrice != null
  measurementUnit?: string; // "unidad" | "gramo"
  gramages?: ProductGramage[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedGramage?: ProductGramage; // gramaje seleccionado si aplica
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

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  wholesalePrice: boolean;
  productGramageId?: number;
  gramageGrams?: number;
}

export interface Order {
  id: string;
  customer: string;
  total: number;
  status: "pendiente" | "enviado";
  date: string;
  metodo_pago: string;
  informacion?: string;
  telefono?: string;
  dni?: string;
  direccionEnvio?: string;
  estadoPago?: string;
  shippingCost?: number;
  items?: OrderItem[];
}

export interface Category {
  id: number;
  nombre: string;
  orden: number;
  imagenNombre: string;
}

export interface CarouselImage {
  id: number;
  imagenNombre: string;
  titulo: string | null;
  subtitulo: string | null;
  orden: number;
  activo: boolean;
  redirectUrl?: string | null;
}
