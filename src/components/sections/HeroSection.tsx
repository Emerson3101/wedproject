"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { couple, weddingDate } from "@/data/wedding";

/* ============================================
   HERO — Portada Full-Screen
   ============================================ */
export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-romantic" />

      {/* Contenido Central */}
      <div className="hero-content relative z-20 text-center px-4 pt-20 md:pt-0">
        {/* Ornamento superior */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-script text-gold text-4xl md:text-5xl mb-6"
        >
          ¡Boda de plata!
        </motion.div>

        {/* Nombres */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-burgundy leading-tight mb-4"
        >
          {couple.name1}
        </motion.h1>

        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-script text-gold text-5xl md:text-6xl block mb-4"
        >
          &
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-burgundy leading-tight mb-8"
        >
          {couple.name2}
        </motion.h1>

        {/* Fecha */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="mt-8"
        >
          <div className="ornament-line max-w-xs mx-auto mb-6">
            <span className="text-script text-gold text-2xl">✦</span>
          </div>
          <p className="text-body text-lg md:text-xl text-burgundy/70 uppercase tracking-[0.3em]">
            {weddingDate.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gold/50 rounded-full mx-auto flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-gold/70 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
