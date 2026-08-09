"use client";

import { useEffect } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/* ============================================
   ANIMACIONES GSAP GLOBALES
   Parallax multi-profundidad en el hero: cada sub-elemento
   deriva a distinto ritmo bajo un único ScrollTrigger (el
   indicador de scroll parte más rápido; el ornamento
   equilibra quedo). Cleanup en unmount. Bajo
   prefers-reduced-motion no se monta nada.

   IMPORTANTE: No establecer opacity:0 en secciones (el CSS
   las mantiene visibles por defecto — red de FOUC intacta).
   ============================================ */
export default function PageAnimations() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let cancelled = false;
    let tl: { kill: () => void } | null = null;
    let heroSt: { kill: () => void } | null = null;
    let onLoad: (() => void) | null = null;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        const heroContent = document.querySelector("#hero .hero-content");
        if (heroContent) {
          const isMobile = window.matchMedia("(max-width: 767px)").matches;
          // Velocidades ascendentes por hijo directo del hero; el último
          // (indicador de scroll) parte más rápido, el ornamento queda rezagado.
          const speeds = isMobile
            ? [3, 6, 9, 13, 18, 26]
            : [5, 10, 16, 22, 30, 42];
          const kids = gsap.utils.toArray<HTMLElement>(
            "#hero .hero-content > *"
          );

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: "#hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
          kids.forEach((kid, i) => {
            timeline.to(
              kid,
              {
                yPercent: speeds[i] ?? speeds[speeds.length - 1],
                ease: "none",
              },
              0
            );
          });
          tl = timeline;
          // Captura el ScrollTrigger asociado para cleanup (cast sin any:
          // gsap lo cuelga en `.scrollTrigger` aunque el tipo dinámico no
          // siempre exponga la augmentación del plugin).
          heroSt =
            (timeline as unknown as { scrollTrigger?: { kill: () => void } })
              .scrollTrigger ?? null;
        }

        onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
      });
    });

    return () => {
      cancelled = true;
      tl?.kill();
      heroSt?.kill();
      if (onLoad) window.removeEventListener("load", onLoad);
    };
  }, [reduced]);

  return null;
}
