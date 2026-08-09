"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/* ============================================
   SCROLL PROGRESS — barra plateada sutil
   Indicador de progreso de lectura en el borde superior.
   Puramente decorativo (no oculta contenido): FOUC-safe.
   ============================================ */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-gradient-to-r from-silver-light via-silver to-silver-dark pointer-events-none"
    />
  );
}
