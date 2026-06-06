import { MapPin, Phone, Instagram, Send } from "lucide-react";
import React, { useState } from "react";
import logo from "../../imports/image.png";

export function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate sending message
    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 4000);
    }, 1000);
  };

  return (
    <footer className="bg-secondary/50 border-t border-border mt-16 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="El Molino"
                className="h-12 w-12 object-contain"
              />
              <span
                className="text-xl font-bold text-foreground"
               
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
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-muted-foreground text-sm group">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span>
                  Bolívar 2342, <br />
                  Mar del Plata, <br />
                  Argentina
                </span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm group">
                <Instagram className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <a href="https://instagram.com/elmolinomdp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@elmolinomdp</a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm group">
                <Phone className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <a href="https://wa.me/5492236927799" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">+54 9 223 6927799</a>
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
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-end gap-4">
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Desarrollado por Zenithium
          </a>
        </div>
      </div>
    </footer>
  );
}
