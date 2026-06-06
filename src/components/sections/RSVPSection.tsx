"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Utensils, MessageSquare, Send, CheckCircle } from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   RSVP — Formulario de Confirmación
   ============================================ */
interface Companion {
  name: string;
  dietary: string;
}

export default function RSVPSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "confirmed" as "confirmed" | "declined",
    numCompanions: 0,
    companions: [] as Companion[],
    dietary: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const addCompanion = () => {
    if (formData.numCompanions < 5) {
      setFormData((prev) => ({
        ...prev,
        numCompanions: prev.numCompanions + 1,
        companions: [
          ...prev.companions,
          { name: "", dietary: "" },
        ],
      }));
    }
  };

  const removeCompanion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      numCompanions: prev.numCompanions - 1,
      companions: prev.companions.filter((_, i) => i !== index),
    }));
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
    setFormData((prev) => ({
      ...prev,
      companions: prev.companions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Por favor ingresa tu email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          numCompanions: formData.numCompanions,
          companions: formData.companions,
          dietary: formData.dietary,
          message: formData.message,
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error || "Hubo un error al enviar. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("RSVP submit error:", err);
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="rsvp" className="section-padding relative z-20">
        <div className="max-w-2xl mx-auto">
          <SectionTitle ornament="✦" title="¡Gracias!" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="text-center py-12">
              <CheckCircle className="mx-auto text-sage mb-6" size={48} />
              <h3 className="text-display text-3xl text-burgundy mb-4">
                ¡Confirmación Recibida!
              </h3>
              <p className="text-body text-burgundy/70">
                Gracias por confirmar tu asistencia, {formData.name}.
                <br />
                ¡Estamos ansiosos por celebrar contigo!
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="section-padding relative z-20">
      <div className="max-w-2xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Confirma tu Asistencia"
          subtitle="Por favor confirma antes del 1 de septiembre, 2025"
        />

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          onSubmit={handleSubmit}
        >
          <GlassCard className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider block mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-body text-burgundy"
                placeholder="Tu nombre"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider block mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-body text-burgundy"
                placeholder="tu@email.com"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider block mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-body text-burgundy"
                placeholder="+52 55 1234 5678"
              />
            </div>

            {/* Asistencia */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider block mb-3">
                ¿Asistirás?
              </label>
              <div className="flex gap-4">
                {["confirmed", "declined"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: option as any })}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all text-body font-medium ${
                      formData.status === option
                        ? option === "confirmed"
                          ? "border-sage bg-sage/10 text-sage"
                          : "border-burgundy/50 bg-burgundy/5 text-burgundy/70"
                        : "border-champagne bg-transparent text-burgundy/40"
                    }`}
                  >
                    {option === "confirmed" ? "¡Sí, asistiré!" : "No podré asistir"}
                  </button>
                ))}
              </div>
            </div>

            {/* Acompañantes */}
            {formData.status === "confirmed" && (
              <>
                <div>
                  <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider flex items-center gap-2 block mb-3">
                    <Users size={16} />
                    Número de Acompañantes
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={formData.numCompanions}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          numCompanions: val,
                          companions: Array.from({ length: val }, () => ({
                            name: "",
                            dietary: "",
                          })),
                        }));
                      }}
                      className="flex-1 accent-gold"
                    />
                    <span className="text-display text-2xl text-burgundy w-8 text-center">
                      {formData.numCompanions}
                    </span>
                  </div>
                </div>

                {/* Nombres de acompañantes */}
                {formData.companions.map((companion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex gap-3 items-start"
                  >
                    <input
                      type="text"
                      placeholder={`Acompañante ${index + 1}`}
                      value={companion.name}
                      onChange={(e) =>
                        updateCompanion(index, "name", e.target.value)
                      }
                      className="flex-1 px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 text-body text-burgundy"
                    />
                    <button
                      type="button"
                      onClick={() => removeCompanion(index)}
                      className="text-burgundy/30 hover:text-burgundy/60 transition-colors mt-1"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </>
            )}

            {/* Restricciones alimentarias */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider flex items-center gap-2 block mb-2">
                <Utensils size={16} />
                Restricciones Alimentarias
              </label>
              <textarea
                rows={2}
                value={formData.dietary}
                onChange={(e) =>
                  setFormData({ ...formData, dietary: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-body text-burgundy resize-none"
                placeholder="Alergias, vegetariano, sin gluten..."
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="text-body text-sm text-burgundy/70 uppercase tracking-wider flex items-center gap-2 block mb-2">
                <MessageSquare size={16} />
                Mensaje para los Novios
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-champagne bg-white/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all text-body text-burgundy resize-none"
                placeholder="¡Un deseo o mensaje especial!"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-rose text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center text-center"
            >
              {isSubmitting ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send size={18} />
                  Confirmar Asistencia
                </>
              )}
            </button>
          </GlassCard>
        </motion.form>
      </div>
    </section>
  );
}
