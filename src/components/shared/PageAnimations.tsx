"use client";

import { useEffect, useRef } from "react";

/* ============================================
   ANIMACIONES GSAP GLOBALES
   ScrollTrigger para secciones, parallax en hero

   IMPORTANTE: No establecer opacity:0 en secciones.
   El CSS ya las hace visibles por defecto.
   Framer-motion maneja las animaciones de entrada
   en cada componente. GSAP aquí solo añade parallax
   y efectos de scroll como mejora visual.
   ============================================ */
export default function PageAnimations() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Parallax solo en el contenido del hero (no en la sección completa)
        const heroInner = document.querySelector("#hero .hero-content");
        if (heroInner) {
          const parallaxAmount = window.matchMedia("(max-width: 767px)").matches
            ? 12
            : 25;

          gsap.to(heroInner, {
            yPercent: parallaxAmount,
            ease: "none",
            scrollTrigger: {
              trigger: "#hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        // Refresh ScrollTrigger después de que las imágenes carguen
        window.addEventListener("load", () => {
          ScrollTrigger.refresh();
        });
      });
    });
  }, []);

  return null;
}
