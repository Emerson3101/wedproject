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
      {/* Layout de dos columnas en desktop: texto a la izquierda, retrato
          a la derecha. En móvil: retrato arriba, texto debajo.

          La máscara del retrato hace `feather` simétrico de los 4 bordes
          hacia el fondo `bg-romantic` global — sin rectángulo duro, sin
          opacidad (la foto se ve a color completo). El degradado lineal
          lateral refuerza el desvanecido de los bordes verticales. */}
      <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col-reverse items-center justify-between gap-10 px-6 py-20 md:py-0 md:flex-row md:items-center md:gap-12 md:px-12 md:min-h-screen">

        {/* ----- COLUMN LEFT: text ----- */}
        <div className="hero-content text-center md:text-left md:flex-1 md:max-w-2xl">
          {/* Ornamento superior — "¡Boda de plata!" con shimmer metálico:
              un highlight brillante barre los caracteres en bucle, como
              luz que atraviesa la plata pulida. El gradiente y la animación
              viven en el motion.div directamente (sin span intermedio) para
              que la caja del bloque respete los ascendentes de Great Vibes. */}
          <motion.div
            aria-label="¡Boda de plata!"
            initial={{ opacity: 0, y: -20, backgroundPositionX: "0%" }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPositionX: ["0%", "220%", "0%"],
            }}
            transition={{
              opacity: { duration: 0.9, delay: 0.1, ease: EASE },
              y: { duration: 0.9, delay: 0.1, ease: EASE },
              backgroundPositionX: {
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2,
              },
            }}
            className="text-script mb-6 text-4xl md:text-5xl drop-shadow-[0_1px_6px_rgba(138,143,152,0.25)]"
            style={{
              backgroundImage:
                "linear-gradient(100deg, #6b7178 0%, #8a8f98 25%, #c5cbd3 45%, #ffffff 50%, #c5cbd3 55%, #8a8f98 75%, #6b7178 100%)",
              backgroundSize: "220% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              /* Great Vibes metrics (fontkit): unitsPerEm=1000,
                 hhea.ascent=851, hhea.descent=-401, pero el
                 bbox real del glifo es maxY=1153 / minY=-556 —
                 los trazos suben hasta 1.153em sobre la línea base
                 (¡) y bajan a -0.556em.  Para que `background-clip:
                 text` no recorte el gradiente, la caja de línea debe
                 cubrir TODO el bbox:

                   (LH - 1.252)/2 + 0.851 ≥ 1.153
                   ⟹  LH ≥ 1.856

                 Usamos 1.9 para tener un margen de seguridad
                 (~0.044em extra arriba y abajo) sin que se note
                 en el flujo del hero.  `overflow: visible` por
                 si algún navegador hace el half-leading impar. */
              lineHeight: 1.9,
              overflow: "visible",
            }}
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
            <div className="ornament-line max-w-xs mx-auto md:mx-0 mb-6 md:justify-start">
              <span className="text-script text-silver text-2xl">✦</span>
            </div>
            <p className="text-body text-lg md:text-xl text-burgundy/70 uppercase tracking-[0.3em]">
              {formatSectionDate(weddingDate)}
            </p>
          </motion.div>

          {/* Mobile scroll indicator — permanece en columna de texto,
              fluye bajo la fecha. En desktop se oculta y se muestra
              el del bloque absoluto inferior-centro (ver más abajo). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
            className="mt-16 md:hidden"
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

        {/* ----- COLUMN RIGHT: portrait ----- */}
        {couplePhotos.hero && (
          <div
            className="relative w-[min(75vw,360px)] aspect-[3/4] md:w-[min(38vw,540px)] md:max-h-[85vh] flex-shrink-0"
            style={{
              maskImage:
                "radial-gradient(ellipse closest-side, #000 80%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse closest-side, #000 80%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          >
            <Image
              src={couplePhotos.hero}
              alt={`${couple.name1} & ${couple.name2}`}
              fill
              priority
              sizes="(max-width: 768px) 75vw, 38vw"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Desktop scroll indicator — fixed al borde inferior-centro
          de la sección hero. En desktop se oculta en móvil (donde
          aplica el de la columna de texto arriba). `z-30` se usa en
          vez de z-20 para que el indicador permanezca sobre el
          retrato y sobre el contenido. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-9 border border-silver/40 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-0.5 h-2 bg-silver/70 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
