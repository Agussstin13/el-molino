import type { Product } from './types';

export const ALL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Proteína Whey Isolate Chocolate 1kg',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=400&q=80',
    discount: 15,
    wholesalePrice: { quantity: 3, price: 3900 },
    category: 'Suplementos',
    description: 'Proteína Whey Isolate de alta calidad con 80% de proteína por porción. Sabor chocolate intenso. Ideal para recuperación muscular post-entrenamiento. Sin azúcar añadida, apta para dietas hipocalóricas.',
  },
  {
    id: '2',
    name: 'Mix Premium de Frutos Secos 500g',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
    wholesalePrice: { quantity: 5, price: 1000 },
    category: 'Frutos Secos',
    description: 'Mezcla premium de nueces, almendras, avellanas y pasas de uva. Sin agregados ni sal. Fuente natural de grasas saludables, proteínas y antioxidantes.',
  },
  {
    id: '3',
    name: 'Harina de Almendras Orgánica 500g',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
    discount: 10,
    category: 'Harinas',
    description: 'Harina de almendras orgánica certificada, perfecta para repostería saludable y dietas bajas en carbohidratos. Sin gluten, alta en proteínas y fibra.',
  },
  {
    id: '4',
    name: 'Mantequilla de Maní Natural 350g',
    price: 980,
    image: 'https://images.unsplash.com/photo-1588214190835-4b706d71f2e4?w=400&q=80',
    category: 'Snacks',
    description: 'Mantequilla de maní 100% natural, sin azúcar añadida ni conservantes. Solo maní tostado. Textura cremosa ideal para untar o usar en preparaciones deportivas.',
  },
  {
    id: '5',
    name: 'Granola Artesanal con Miel 400g',
    price: 1350,
    image: 'https://images.unsplash.com/photo-1571167530149-c9b2f05b7d6d?w=400&q=80',
    wholesalePrice: { quantity: 4, price: 1150 },
    category: 'Snacks',
    description: 'Granola artesanal horneada con avena, miel de abejas, coco rallado y frutas secas. Sin aceites hidrogenados. Desayuno completo y nutritivo.',
  },
  {
    id: '6',
    name: 'Barras de Proteína Mix Sabores x12',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1571167530149-c9b2f05b7d6d?w=400&q=80',
    discount: 20,
    category: 'Suplementos',
    description: 'Pack de 12 barras proteicas en variedad de sabores. 20g de proteína por barra, bajo en azúcar. Snack ideal pre o post-entrenamiento.',
  },
  {
    id: '7',
    name: 'Chips de Coco Deshidratado 200g',
    price: 850,
    image: 'https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?w=400&q=80',
    category: 'Snacks',
    description: 'Chips de coco natural deshidratado, crujientes y deliciosos. Sin azúcar, sin sal. Perfecto para snackear o agregar a yogur y granola.',
  },
  {
    id: '8',
    name: 'Semillas de Chía Orgánicas 500g',
    price: 1100,
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
    wholesalePrice: { quantity: 3, price: 950 },
    category: 'Granos y Cereales',
    description: 'Semillas de chía orgánicas certificadas, ricas en Omega-3, fibra y calcio. Ideales para puddings, smoothies y preparaciones saludables.',
  },
  {
    id: '9',
    name: 'Aceite de Coco Virgen Extra 500ml',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    category: 'Endulzantes',
    description: 'Aceite de coco virgen extra de primera presión en frío. Aroma y sabor natural intenso. Ideal para cocinar a alta temperatura o en dieta cetogénica.',
  },
  {
    id: '10',
    name: 'Té Verde Matcha Premium 100g',
    price: 2200,
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80',
    discount: 10,
    category: 'Bebidas',
    description: 'Té matcha premium de grado ceremonial, cultivado en Japón. Rico en antioxidantes y L-teanina. Energía limpia y concentración mental sin el crash del café.',
  },
  {
    id: '11',
    name: 'Crema de Avellanas Sin Azúcar 300g',
    price: 1650,
    image: 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=400&q=80',
    discount: 25,
    category: 'Snacks',
    description: 'Crema de avellanas artesanal sin azúcar añadida. 70% avellanas, sin aceite de palma. Una alternativa saludable y deliciosa al spread tradicional.',
  },
  {
    id: '12',
    name: 'Quinoa Tricolor Orgánica 500g',
    price: 1450,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    discount: 15,
    category: 'Granos y Cereales',
    description: 'Quinoa tricolor orgánica (blanca, roja y negra). Proteína completa con todos los aminoácidos esenciales. Sin gluten, lista en 15 minutos.',
  },
  {
    id: '13',
    name: 'Leche de Almendras Sin Azúcar 1L',
    price: 680,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    discount: 20,
    category: 'Bebidas',
    description: 'Leche de almendras sin azúcar, sin lactosa y sin gluten. Ideal como alternativa vegetal para bebidas, cereales y recetas de repostería.',
  },
];

export const FEATURED_PRODUCTS = ALL_PRODUCTS.filter(p =>
  ['1', '2', '3', '4', '5'].includes(p.id)
);

export const BEST_SELLERS = ALL_PRODUCTS.filter(p =>
  ['6', '7', '8', '9', '10'].includes(p.id)
);

export const DAILY_DEALS = ALL_PRODUCTS.filter(p =>
  ['11', '12', '13'].includes(p.id)
);

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
}

export function getRelatedProducts(product: Product): Product[] {
  return ALL_PRODUCTS
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 5);
}
