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

        // Parallax en elementos del hero
        const heroContent = document.querySelector("#hero");
        if (heroContent) {
          gsap.to(heroContent, {
            yPercent: 30,
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
