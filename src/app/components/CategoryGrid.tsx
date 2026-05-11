import { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/config';



interface Category {
  id: number;
  nombre: string;
  imagenNombre: string | null;
  orden: number;
  activo: boolean;
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetch(`${API_BASE}/api/categories?onlyActive=true`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("API did not return an array of categories:", data);
          setCategories([]);
        }
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8" style={{ fontFamily: 'Georgia, serif' }}>Nuestras Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square rounded-md bg-secondary animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8" style={{ fontFamily: 'Georgia, serif' }}>Nuestras Categorías</h2>
        
        {categories.length === 0 ? (
          <div className="bg-secondary/30 rounded-2xl p-12 text-center border-2 border-dashed border-border">
            <p className="text-muted-foreground italic">Aún no hay categorías disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                className="group relative aspect-square rounded-md overflow-hidden border-2 border-border hover:border-primary hover:shadow-xl transition-all bg-card"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent z-10" />
                {category.imagenNombre ? (
                  <img
                    src={`${API_BASE}/images/${category.imagenNombre}`}
                    alt={category.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    📦
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span className="text-white drop-shadow-md text-center px-2 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
                    {category.nombre}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
