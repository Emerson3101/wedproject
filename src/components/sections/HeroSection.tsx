"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { couple, weddingDate } from "@/data/wedding";
import { couplePhotos } from "@/data/couplePhotos";
import { formatSectionDate } from "@/lib/utils";

/* ============================================
   HERO — Portada Full-Screen
   Se renderiza inmediatamente sin guard de montaje.
   Framer-motion maneja la animación de entrada.
   Curva elegante [0.16, 1, 0.3, 1] + blur-in sutil en los nombres.
   ============================================ */
const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* El fondo romántico es ahora un único gradiente fijo global
          (page.tsx) detrás de toda la página: el hero es transparente
          y la transición hacia el countdown es continua, sin corte. */}

      {/* Foto opcional de la pareja.
           El retrato vive dentro de un wrapper con `aspect-ratio: 3/4`
           limitado por la altura del viewport. Sin letterbox — el `<img>`
           llena 100 % del wrapper con `object-cover` (mismo aspecto → sin
           recortes perceptibles). Fuera del wrapper (bandas laterales,
           arriba y abajo) se ve directamente `bg-romantic` (el gradiente
           global). Así NO hay capas ambient o veladuras pintando colores
           extra desde la foto → el hero y el countdown comparten exactamente
           el mismo fondo (bg-romantic) → sin corte de color entre secciones.

           La doble máscara va en el WRAPPER (donde viven las aristas del
           retrato 3:4), no en la imagen:
             1) `radial-gradient(ellipse closest-side, …)` — feather
                simétrico en los 4 bordes al mismo ritmo.
             2) `linear-gradient(90deg, transparent 0%, #000 12%, #000 88%,
                transparent 100%)` — desvanece específicamente izq/der. */}
      {couplePhotos.hero && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            height: "min(100vh, 133.33vw)",
            aspectRatio: "3 / 4",
            maxWidth: "100vw",
            maskImage:
              "radial-gradient(ellipse closest-side, #000 75%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse closest-side, #000 75%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 18%, #000 82%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        >
          <Image
            src={couplePhotos.hero}
            alt={`${couple.name1} & ${couple.name2}`}
            fill
            priority
            sizes="(orientation: portrait) 100vw, 75vh"
            className="object-cover"
            style={{ opacity: 0.4 }}
          />
        </div>
      )}

      {/* Contenido Central */}
      <div className="hero-content relative z-20 text-center px-4 pt-20 md:pt-0">
        {/* Ornamento superior */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="text-script mb-6 text-4xl md:text-5xl bg-gradient-to-r from-silver-light via-silver to-silver-dark bg-clip-text text-transparent drop-shadow-[0_1px_6px_rgba(138,143,152,0.25)]"
        >
          ¡Boda de plata!
        </motion.div>

        {/* Nombres */}
        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.25, ease: EASE }}
          className="text-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-burgundy leading-tight mb-4"
        >
          {couple.name1}
        </motion.h1>

        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
          className="text-script text-silver text-5xl md:text-6xl block mb-4"
        >
          &
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.4, ease: EASE }}
          className="text-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-burgundy leading-tight mb-8"
        >
          {couple.name2}
        </motion.h1>

        {/* Fecha */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="mt-8"
        >
          <div className="ornament-line max-w-xs mx-auto mb-6">
            <span className="text-script text-silver text-2xl">✦</span>
          </div>
          <p className="text-body text-lg md:text-xl text-burgundy/70 uppercase tracking-[0.3em]">
            {formatSectionDate(weddingDate)}
          </p>
        </motion.div>

        {/* Scroll indicator — más fino, en plata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-9 border border-silver/40 rounded-full mx-auto flex justify-center pt-2"
          >
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-0.5 h-2 bg-silver/70 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
