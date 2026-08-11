"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { couplePhotos } from "@/data/couplePhotos";
import { couple } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import Reveal from "@/components/shared/Reveal";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/* ============================================
   GALERÍA — Fotos de la pareja
   Masonry responsive (CSS columns) + lightbox.
   Las fotos se alimentan desde `couplePhotos.gallery`
   en `src/data/couplePhotos.ts`. Click en cualquier
   foto abre un lightbox a pantalla completa.
   ============================================ */
export default function PhotoGallerySection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(() => {
    setActiveIndex((i) =>
      i === null ? i : (i - 1 + couplePhotos.gallery.length) % couplePhotos.gallery.length
    );
  }, []);
  const showNext = useCallback(() => {
    setActiveIndex((i) =>
      i === null ? i : (i + 1) % couplePhotos.gallery.length
    );
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, closeLightbox, showPrev, showNext]);

  if (couplePhotos.gallery.length === 0) return null;

  return (
    <section id="gallery" className="section-padding relative z-20">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Galería"
          subtitle={`Un vistazo a nuestra historia juntos`}
        />

        <div className="columns-2 md:columns-3 gap-4 mt-8 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {couplePhotos.gallery.map((src, i) => (
            <Reveal
              key={src}
              y={30}
              delay={prefersReduced ? 0 : Math.min(i * 0.05, 0.4)}
            >
              <button
                onClick={() => setActiveIndex(i)}
                className="group relative w-full block rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                aria-label={`Ver foto ${i + 1} en grande`}
              >
                <Image
                  src={src}
                  alt={`${couple.name1} y ${couple.name2}, foto ${i + 1}`}
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-burgundy/0 group-hover:bg-burgundy/10 transition-colors duration-300" />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ivory/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-burgundy/60 hover:text-burgundy transition-colors p-2"
              aria-label="Cerrar"
            >
              <X size={28} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-2 md:left-6 text-burgundy/40 hover:text-burgundy transition-colors text-4xl px-3 py-2 select-none"
              aria-label="Anterior"
            >
              ‹
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-2 md:right-6 text-burgundy/40 hover:text-burgundy transition-colors text-4xl px-3 py-2 select-none"
              aria-label="Siguiente"
            >
              ›
            </button>

            <motion.div
              key={activeIndex}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={couplePhotos.gallery[activeIndex]}
                alt={`${couple.name1} y ${couple.name2}, foto ${activeIndex + 1}`}
                width={1200}
                height={1600}
                sizes="100vw"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-body text-sm text-burgundy/50 uppercase tracking-widest">
              {activeIndex + 1} / {couplePhotos.gallery.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
