"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { dressCode } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   CÓDIGO DE VESTIMENTA
   ============================================ */
export default function DressCodeSection() {
  return (
    <section id="dresscode" className="section-padding relative z-20">
      <div className="max-w-5xl mx-auto">
        <SectionTitle
          ornament="✦"
          title={dressCode.title}
          subtitle={dressCode.description}
        />

        {/* Estilo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-display text-3xl md:text-4xl text-burgundy italic">
            {dressCode.subtitle}
          </span>
        </motion.div>

        {/* Paleta de Colores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-16"
        >
          <GlassCard className="text-center">
            <h3 className="text-display text-2xl text-burgundy mb-6">
              Paleta de Colores Sugerida
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {dressCode.palette.map((swatch) => (
                <div key={swatch.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-full shadow-md border-4 border-white"
                    style={{ backgroundColor: swatch.color }}
                    title={swatch.name}
                  />
                  <span className="text-body text-xs text-burgundy/60">
                    {swatch.name}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recomendaciones Damas y Caballeros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Damas */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard>
              <h3 className="text-display text-2xl text-burgundy mb-6 text-center">
                {dressCode.women.title}
              </h3>
              <div className="space-y-3">
                {dressCode.women.suggestions.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Check size={18} className="text-sage flex-shrink-0" />
                    <span className="text-body text-burgundy/70 text-sm">{s}</span>
                  </div>
                ))}
                <hr className="my-4 border-gold/20" />
                {dressCode.women.notSuggested.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <X size={18} className="text-burgundy/30 flex-shrink-0" />
                    <span className="text-body text-burgundy/40 text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Caballeros */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <GlassCard>
              <h3 className="text-display text-2xl text-burgundy mb-6 text-center">
                {dressCode.men.title}
              </h3>
              <div className="space-y-3">
                {dressCode.men.suggestions.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Check size={18} className="text-sage flex-shrink-0" />
                    <span className="text-body text-burgundy/70 text-sm">{s}</span>
                  </div>
                ))}
                <hr className="my-4 border-gold/20" />
                {dressCode.men.notSuggested.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <X size={18} className="text-burgundy/30 flex-shrink-0" />
                    <span className="text-body text-burgundy/40 text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
