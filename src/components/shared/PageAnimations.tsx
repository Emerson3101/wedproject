"use client";

import { useEffect, useRef } from "react";

/* ============================================
   ANIMACIONES GSAP GLOBALES
   ScrollTrigger para secciones, parallax en hero
   ============================================ */
export default function PageAnimations() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Animar cada sección al entrar en viewport
        const sections = document.querySelectorAll("section[id]");
        sections.forEach((section) => {
          gsap.fromTo(
            section,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.8,
              scrollTrigger: {
                trigger: section,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        });

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
