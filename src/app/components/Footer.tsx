import { MapPin, Phone, Instagram, Send } from "lucide-react";
import React, { useState } from "react";


const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xgogppqw";

export function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.currentTarget),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setSubmitError(error?.errors?.[0]?.message || "No pudimos enviar tu mensaje. Intentá nuevamente.");
        return;
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setSubmitError("No pudimos conectar para enviar tu mensaje. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-secondary/50 border-t border-border mt-16 pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="El Molino"
                className="h-12 w-12 object-contain"
              />
              <span
                className="text-2xl text-primary font-bold italic tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                El Molino
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tradición y calidad artesanal en cada producto. Llevando los
              mejores sabores a tu mesa desde nuestros comienzos.
            </p>

          </div>

          {/* Contact Info */}
          <div>
            <h3
              className="text-lg font-semibold mb-6 text-foreground"
             
            >
              Contacto
            </h3>
            <ul className="space-y-4 sm:flex sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-4 sm:space-y-0 md:block md:space-y-4">
              <li className="flex items-start gap-3 text-muted-foreground text-sm group">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <a
                  href="https://maps.app.goo.gl/7PYu5S649M96pi5WA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Bolívar 2342, Mar del Plata, Argentina
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm group">
                <Instagram className="w-5 h-5 text-[#D62976] shrink-0 group-hover:scale-110 transition-transform" />
                <a href="https://instagram.com/elmolinomdp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@elmolinomdp</a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm group">
                <Phone className="w-5 h-5 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                <a href={`https://wa.me/${PHONE_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">+{PHONE_NUMBER}</a>
              </li>
            </ul>
          </div>

          {/* Contact Form */}
          <div>
            <h3
              className="text-lg font-semibold mb-6 text-foreground"
             
            >
              Escribinos
            </h3>
            {submitted ? (
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                <Send className="w-5 h-5 shrink-0" />
                <p>
                  ¡Mensaje enviado con éxito! Nos pondremos en contacto a la
                  brevedad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 relative">
                <input
                  type="text"
                  name="name"
                  placeholder="Tu nombre"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Tu email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, email: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <textarea
                  name="message"
                  placeholder="Tu mensaje"
                  rows={3}
                  required
                  disabled={isSubmitting}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, message: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none disabled:opacity-50"
                />
                {submitError && (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex justify-center items-center gap-2 group disabled:opacity-70"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                  {!isSubmitting && (
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-end gap-4">
          <a 
            href="https://zenithium.com.ar"
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <img
              src="/zenithium.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
            Desarrollado por Zenithium
          </a>
        </div>
      </div>
    </footer>
  );
}