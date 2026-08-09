"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================
   REVEAL — Entrada unificada y reutilizable
   Reemplaza los reveals `opacity+y/x` copypasteados en
   las secciones. Respeta la curva del proyecto
   [0.16, 1, 0.3, 1] y el FOUC safety: con movimiento
   reducido renderiza un <div> plano (nada se oculta).
   ============================================ */

interface RevealProps {
  children: ReactNode;
  /** Retraso de entrada (s). Útil para stagger de listas (~0.08s). */
  delay?: number;
  /** Desplazamiento Y inicial en px (default 18). */
  y?: number;
  /** Desplazamiento X inicial en px (default 0). Para entradas laterales. */
  x?: number;
  /** Duración (s). Default 0.6. */
  duration?: number;
  /** Margen del viewport. Default "-80px". */
  margin?: string;
  /** Animar solo la primera vez (default true). */
  once?: boolean;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const makeVariants = (
  x: number,
  y: number,
  duration: number,
  delay: number
): Variants => ({
  hidden: { opacity: 0, x, y },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration, delay, ease: EASE },
  },
});

export default function Reveal({
  children,
  delay = 0,
  y = 18,
  x = 0,
  duration = 0.6,
  margin = "-80px",
  once = true,
  className,
}: RevealProps) {
  const prefersReduced = useReducedMotion();

  // Accesibilidad: sin movimiento → node plano, visible de inmediato.
  if (prefersReduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={makeVariants(x, y, duration, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
    >
      {children}
    </motion.div>
  );
}
