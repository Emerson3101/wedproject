"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================
   SECTIONTITLE — Entrada coordinada (draw-in)
   Ornamento que salta, encabezado que asciende,
   subtítulo rezagado y un divisor que se "dibuja"
   desde el centro con un ✦ que aparece al final.
   Bajo prefers-reduced-motion todo queda estático.
   (La clase CSS `.ornament-line` sigue disponible
   para usos sueltos como el del Hero.)
   ============================================ */
interface SectionTitleProps {
  ornament?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function SectionTitle({
  ornament = "✦",
  title,
  subtitle,
  className,
}: SectionTitleProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn("text-center mb-8", className)}>
      {ornament && (
        <motion.span
          initial={prefersReduced ? false : { scale: 0.4, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="text-script text-silver text-3xl block mb-4"
        >
          {ornament}
        </motion.span>
      )}

      <motion.h2
        initial={prefersReduced ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-display text-4xl md:text-5xl lg:text-6xl font-light text-burgundy mb-4"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="text-body text-lg md:text-xl text-burgundy/70 max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Divisor que se dibuja desde el centro + ✦ que salta. */}
      <div className="flex items-center justify-center gap-4 mt-6 max-w-xs mx-auto">
        <motion.span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-transparent via-silver to-transparent origin-right"
          initial={prefersReduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        />
        <motion.span
          aria-hidden
          initial={prefersReduced ? false : { scale: 0.4, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.28 }}
          className="text-script text-silver text-2xl"
        >
          ✦
        </motion.span>
        <motion.span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-l from-transparent via-silver to-transparent origin-left"
          initial={prefersReduced ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        />
      </div>
    </div>
  );
}
