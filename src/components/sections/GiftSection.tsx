"use client";

import Image from "next/image";
import SectionTitle from "@/components/shared/SectionTitle";
import Reveal from "@/components/shared/Reveal";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   REGALOS — Mensaje sobre el sobre-regalo
   Sección sutil (sin link en la navegación) que
   aparece entre el RSVP y la playlist. Sin icono
   Mail: el ornamento del SectionTitle usa el ✦
   por defecto para mantener consistencia con el
   resto del sitio. Una imagen gift-icon pequeña
   en un enclosure circular plateado corona el
   mensaje como acento visual.
   ============================================ */
export default function GiftSection() {
  return (
    <section id="gift" className="section-padding relative z-20">
      <div className="max-w-2xl mx-auto">
        <Reveal y={30}>
          <SectionTitle
            title="Agradecemos tu Gesto"
          />
          <GlassCard padding="sm" className="text-center space-y-4">
            {/* Icono de regalo en enclosure circular plateado.
                El border-white exterior + ring interior plateado
                espejan el patrón de los swatches de DressCode. */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md border-4 border-white shadow-[inset_0_0_0_1px_rgba(138,143,152,0.4)]">
                <Image
                  src="/images/gift-icon.jpeg"
                  alt="Icono de regalo"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </div>
            <p className="text-body text-lg text-burgundy/70 whitespace-pre-line">
              No traer regalo, si gustas en la recepción habrá sobres
              amarillos, gracias.
            </p>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
