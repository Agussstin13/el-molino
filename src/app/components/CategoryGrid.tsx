const categories = [
  {
    name: 'Harinas',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  },
  {
    name: 'Suplementos',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80',
  },
  {
    name: 'Frutos Secos',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  },
  {
    name: 'Granos y Cereales',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  },
  {
    name: 'Endulzantes',
    image: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=400&q=80',
  },
  {
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80',
  },
];

export function CategoryGrid() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8" style={{ fontFamily: 'Georgia, serif' }}>Nuestras Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.name}
              className="group relative aspect-square rounded-md overflow-hidden border-2 border-border hover:border-primary hover:shadow-xl transition-all bg-card"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent z-10" />
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-white drop-shadow-md text-center px-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {category.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
