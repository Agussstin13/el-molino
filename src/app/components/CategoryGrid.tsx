import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE;

interface Category {
  id: number;
  nombre: string;
  imagenNombre: string | null;
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories/all`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data.filter((c: any) => c.activo));
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-12 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          Explorar Categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/?categoria=${category.id}#productos-lista`}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary transition-colors shadow-sm">
                {category.imagenNombre ? (
                  <img
                    src={`${API_BASE}/images/${category.imagenNombre}`}
                    alt={category.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-2xl opacity-20">🏷️</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {category.nombre}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
