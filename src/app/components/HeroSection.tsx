import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE;



interface CarouselSlide {
  id: number;
  imagenNombre: string;
  titulo: string | null;
  subtitulo: string | null;
  orden: number;
  activo: boolean;
}

export function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<
    { id: number; image: string; titulo: string; subtitulo: string }[]
  >([]);

  const DEFAULT_SLIDE = {
    id: -1,
    image: "",
    titulo: "Bienvenidos a El Molino",
    subtitulo: "Descubrí la mejor calidad en productos naturales y artesanales.",
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/carousel`)
      .then((res) => res.json())
      .then((data: CarouselSlide[]) => {
        if (!data || data.length === 0) {
          setSlides([]);
        } else {
          setSlides(
            data.map((s) => ({
              id: s.id,
              image: s.imagenNombre
                ? `${API_BASE}/images/${s.imagenNombre}`
                : "",
              titulo: s.titulo ?? "",
              subtitulo: s.subtitulo ?? "",
            }))
          );
        }
      })
      .catch(() => {
        setSlides([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  // Auto-scroll cada 6 segundos
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const displaySlides = slides.length > 0 ? slides : [DEFAULT_SLIDE];
  const slide = displaySlides[currentSlide] || DEFAULT_SLIDE;

  if (loading) {
    return (
      <section className="relative h-[440px] md:h-[520px] overflow-hidden bg-secondary animate-pulse" />
    );
  }

  return (
    <section className="relative h-[440px] md:h-[520px] overflow-hidden">
      {/* Slides container */}
      <div className="relative w-full h-full">
        {displaySlides.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: banner.image ? `url('${banner.image}')` : "none",
                backgroundColor: banner.image ? undefined : "hsl(var(--secondary))",
              }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/40 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          <p className="text-accent text-sm uppercase tracking-widest mb-3 font-medium">
            Productos naturales y artesanales
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl mb-5 text-primary leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {slide.titulo}
          </h1>
          <p className="text-lg md:text-xl text-foreground/75 mb-8 max-w-lg">
            {slide.subtitulo}
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

      {/* Navigation buttons */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all text-white"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all text-white"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {displaySlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide
                  ? "bg-primary w-6"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
