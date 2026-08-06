interface CategorySeoCopy {
  title: string;
  description: string;
}

const CATEGORY_SEO: Record<number, CategorySeoCopy> = {
  1: {
    title: "Suplementos deportivos en Mar del Plata",
    description: "Comprá proteínas, creatina y suplementos deportivos en Mar del Plata. Consultá stock online, elegí envío local o retiro en El Molino."
  },
  4: {
    title: "Frutos secos en Mar del Plata",
    description: "Comprá frutos secos y frutas desecadas en Mar del Plata. Opciones por peso, precios online, envío local y retiro en El Molino."
  },
  6: {
    title: "Legumbres, cereales y semillas en Mar del Plata",
    description: "Legumbres, cereales, semillas y hongos en Mar del Plata. Comprá online por peso o por unidad con envío local y retiro en tienda."
  },
  7: {
    title: "Herboristería en Mar del Plata",
    description: "Productos de herboristería en Mar del Plata: hierbas e infusiones con compra online, envío dentro de la ciudad y retiro en El Molino."
  },
  8: {
    title: "Infusiones y yerba en Mar del Plata",
    description: "Comprá infusiones, tés y yerba en Mar del Plata. Catálogo online con stock actualizado, entrega local o retiro por Bolívar 2342."
  },
  10: {
    title: "Harinas y rebozadores en Mar del Plata",
    description: "Harinas y rebozadores en Mar del Plata para cocina y repostería. Comprá online con stock visible, envío local o retiro en tienda."
  },
  13: {
    title: "Granola y cereales de desayuno en Mar del Plata",
    description: "Comprá granola y cereales de desayuno en Mar del Plata. Opciones para todos los días con precios online, envío local y retiro."
  },
  14: {
    title: "Snacks saludables en Mar del Plata",
    description: "Snacks saludables en Mar del Plata para comprar online. Consultá variedades y stock, con envío dentro de la ciudad o retiro en tienda."
  },
  16: {
    title: "Productos sin azúcar en Mar del Plata",
    description: "Comprá productos sin azúcar en Mar del Plata. Catálogo online con bebidas, galletitas y más, envío local o retiro en El Molino."
  },
  19: {
    title: "Productos sin TACC en Mar del Plata",
    description: "Comprá productos sin TACC y sin gluten en Mar del Plata. Catálogo online con stock actualizado, envío local o retiro en El Molino."
  },
};

export function getCategorySeo(categoryId: number, categoryName: string) {
  return (
    CATEGORY_SEO[categoryId] ?? {
      title: `${categoryName} en Mar del Plata`,
      description: `Comprá ${categoryName.toLowerCase()} en Mar del Plata. Consultá precios y stock online, con envío dentro de la ciudad o retiro en El Molino.`
    }
  );
}
