"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { dressCode } from "@/data/wedding";
import { dressCodePhotos } from "@/data/dressCodePhotos";
import SectionTitle from "@/components/shared/SectionTitle";
import Reveal from "@/components/shared/Reveal";
import GlassCard from "@/components/ui/GlassCard";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/* ============================================
   CÓDIGO DE VESTIMENTA
   Entradas vía el sistema unificado <Reveal> (los acodes
   laterales mantienen su deslizamiento elegante con `x`).
   ============================================ */
export default function DressCodeSection() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <section id="dresscode" className="section-padding relative z-20">
      <div className="max-w-5xl mx-auto">
        <SectionTitle
          ornament="✦"
          title={dressCode.title}
          subtitle={dressCode.description}
        />

        {/* Estilo */}
        <Reveal y={30} className="text-center mb-8">
          <span className="text-display text-3xl md:text-4xl text-burgundy italic">
            {dressCode.subtitle}
          </span>
        </Reveal>

        {/* Paleta de Colores */}
        <Reveal y={30} delay={0.2} className="mb-10">
          <GlassCard className="text-center">
            <h3 className="text-display text-2xl text-burgundy mb-6">
              Paleta de Colores Sugerida
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {dressCode.palette.map((swatch) => (
                <div key={swatch.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-full shadow-md border-4 border-white shadow-[inset_0_0_0_1px_rgba(138,143,152,0.4)]"
                    style={{ backgroundColor: swatch.color }}
                    title={swatch.name}
                  />
                  <span className="text-body text-base text-burgundy/60">
                    {swatch.name}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        {/* Ejemplos visuales — 8 fotos de referencia en masonry grid.
            Sin lightbox (no son galería histórica sino muestras de
            vestimenta). Hover: leve realce plateado sobre la foto. */}
        {dressCodePhotos.length > 0 && (
          <Reveal y={30} delay={0.3} className="mb-10">
            <GlassCard>
              <h3 className="text-display text-2xl text-burgundy mb-6 text-center">
                Ejemplos de Vestimenta
              </h3>
              <div className="columns-2 md:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
                {dressCodePhotos.map((src, i) => (
                  <Reveal
                    key={src}
                    y={20}
                    delay={prefersReduced ? 0 : Math.min(i * 0.05, 0.35)}
                  >
                    <div className="group relative w-full block rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                      <Image
                        src={src}
                        alt={`Ejemplo de vestimenta ${i + 1}`}
                        width={600}
                        height={800}
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-burgundy/0 group-hover:bg-burgundy/10 transition-colors duration-300" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        )}

        {/* Recomendaciones Damas y Caballeros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Damas */}
          <Reveal x={-40}>
            <GlassCard>
              <h3 className="text-display text-2xl text-burgundy mb-6 text-center">
                {dressCode.women.title}
              </h3>
              <div className="space-y-3">
                {dressCode.women.suggestions.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Check size={18} className="text-sage flex-shrink-0" />
                    <span className="text-body text-burgundy/70 text-lg">{s}</span>
                  </div>
                ))}
                <hr className="my-4 border-silver/20" />
                {dressCode.women.notSuggested.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <X size={18} className="text-burgundy/30 flex-shrink-0" />
                    <span className="text-body text-burgundy/40 text-lg">{s}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {/* Caballeros */}
          <Reveal x={40} delay={0.15}>
            <GlassCard>
              <h3 className="text-display text-2xl text-burgundy mb-6 text-center">
                {dressCode.men.title}
              </h3>
              <div className="space-y-3">
                {dressCode.men.suggestions.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <Check size={18} className="text-sage flex-shrink-0" />
                    <span className="text-body text-burgundy/70 text-lg">{s}</span>
                  </div>
                ))}
                <hr className="my-4 border-silver/20" />
                {dressCode.men.notSuggested.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <X size={18} className="text-burgundy/30 flex-shrink-0" />
                    <span className="text-body text-burgundy/40 text-lg">{s}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
