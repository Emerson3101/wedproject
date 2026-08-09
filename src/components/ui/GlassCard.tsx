"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================
   GLASSCARD —卡片 con glassmorphism + hover premium
   El realce (lift / scale) lo maneja framer-motion para
   que transform y sombras vivan suavemente juntos (antes
   un `transition-shadow` heredado rompía el easing del
   levantamiento). `interactive={false}` desactiva el hover
   en superficies donde escalar sería ruidoso (p.ej. el mapa).
   ============================================ */
interface GlassCardProps {
  children: React.ReactNode;
  variant?: "default" | "strong" | "subtle";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  /** Activar micro-interacción de hover (default true). */
  interactive?: boolean;
}

export default function GlassCard({
  children,
  variant = "default",
  className,
  padding = "md",
  interactive = true,
}: GlassCardProps) {
  const prefersReduced = useReducedMotion();

  const variantClass = {
    default: "glass",
    strong: "glass-strong",
    subtle: "glass-subtle",
  }[variant];

  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-12",
  }[padding];

  // Framer posee el `transform` (lift + scale); la sombra vive en
  // CSS con su propio easing — dos propiedades independientes → sin jank.
  const animateHover =
    interactive && !prefersReduced ? { y: -8, scale: 1.02 } : undefined;
  const animateTap = interactive && !prefersReduced ? { scale: 0.99 } : undefined;

  return (
    <motion.div
      className={cn(
        variantClass,
        paddingClass,
        interactive &&
          "transition-[box-shadow] duration-500 ease-out hover:shadow-[0_24px_60px_-26px_rgba(60,66,74,0.30)]",
        className
      )}
      whileHover={animateHover}
      whileTap={animateTap}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
