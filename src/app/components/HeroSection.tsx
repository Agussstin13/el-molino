import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative h-[440px] md:h-[520px] bg-gradient-to-br from-secondary via-muted to-secondary overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <p className="text-accent text-sm uppercase tracking-widest mb-3 font-medium">
            Productos naturales y artesanales
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl mb-5 text-primary leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Tradición y Calidad Natural
          </h1>
          <p className="text-lg md:text-xl text-foreground/75 mb-8 max-w-lg">
            Más de 70 años llevando lo mejor de la naturaleza a tu mesa. Granos,
            semillas, suplementos y snacks seleccionados.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              id="hero-cta"
              onClick={() =>
                document
                  .getElementById("productos-destacados")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Explorar productos
            </button>
            <button
              onClick={() => navigate("/producto/1")}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-xl transition-all"
            >
              Ver ofertas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
