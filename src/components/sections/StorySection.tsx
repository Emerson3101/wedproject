"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  Sparkles,
  Home,
  Gem,
  Church,
  type LucideIcon,
} from "lucide-react";
import { ourStory } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/* ============================================
   NUESTRA HISTORIA — Timeline con GSAP ScrollTrigger

   La línea plateada crece con el scroll a lo largo de
   TODA la pista (no en su propia ventana), mide su altura
   para terminar justo en el centro del último nodo, y un
   "cometa" luminoso cabalga la cabeza mientras crece —
   estacionándose sobre el nodo final. Bajo
   `prefers-reduced-motion`, la línea aparece estática y
   los items/puntos sólo desvanecen (sin traslación/escala).
   ============================================ */
const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  sparkles: Sparkles,
  home: Home,
  ring: Gem,
  church: Church,
};

export default function StorySection() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    // Estado mutable del efecto; GSAP se importa de forma dinámica
    // (SSR-safe) y se tipa por inferencia dentro del .then().
    let tl: { kill: () => void } | null = null;
    let localTriggers: Array<{ kill: () => void }> = [];
    let rebuild: (() => void) | null = null;
    let refresh: (() => void) | null = null;

    const killAll = () => {
      tl?.kill();
      tl = null;
      localTriggers.forEach((t) => t.kill());
      localTriggers = [];
    };

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        const build = () => {
          if (cancelled) return;
          killAll();

          // Cast estructural (sin any): gsap cuelga el ScrollTrigger
          // asociado en `.scrollTrigger` del tween/timeline; así lo
          // capturamos para cleanup sin depender de la augmentación de tipos
          // del plugin (que vía import() dinámico puede no resolverse).
          const triggerOf = (t: object) =>
            (t as { scrollTrigger?: { kill: () => void } }).scrollTrigger;

          const track = trackRef.current;
          const line = lineRef.current;
          const tip = tipRef.current;
          if (!track || !line || !tip) return;

          const dots = track.querySelectorAll<HTMLElement>(".timeline-dot");
          if (dots.length === 0) return;

          // La línea termina en el CENTRO del último nodo.
          const trackRect = track.getBoundingClientRect();
          const lastDotRect = dots[dots.length - 1].getBoundingClientRect();
          const lastDotCenterY =
            lastDotRect.top - trackRect.top + lastDotRect.height / 2;
          const tipHalf = tip.offsetHeight / 2 || 6;

          if (reduced) {
            // Estático: línea completa + cometa parqueado en el último nodo.
            gsap.set(line, {
              height: lastDotCenterY,
              scaleY: 1,
              transformOrigin: "top center",
            });
            gsap.set(tip, { y: lastDotCenterY - tipHalf });
          } else {
            gsap.set(line, {
              height: lastDotCenterY,
              scaleY: 0,
              transformOrigin: "top center",
            });
            gsap.set(tip, { y: 0 });

            // Una sola.timeline scrubbed sobre TODA la pista: la línea
            // escala de 0→1 mientras el cometa baja de 0→al último nodo.
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: track,
                start: "top 80%",
                end: "bottom 75%",
                scrub: 1,
              },
            });
            timeline
              .fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: "none" }, 0)
              .fromTo(
                tip,
                { y: 0 },
                { y: lastDotCenterY - tipHalf, ease: "none" },
                0
              );
            tl = timeline;
            const tlSt = triggerOf(timeline);
            if (tlSt) localTriggers.push(tlSt);
          }

          // Entrada de cada item: fade + (opcional) traslación y escala.
          const items = track.querySelectorAll<HTMLElement>(".story-item");
          items.forEach((item, index) => {
            const isLeft = index % 2 === 0;
            const tween = gsap.fromTo(
              item,
              reduced
                ? { opacity: 0 }
                : { opacity: 0, x: isLeft ? -60 : 60, scale: 0.96 },
              {
                opacity: 1,
                x: 0,
                scale: 1,
                duration: 0.9,
                ease: "expo.out",
                scrollTrigger: {
                  trigger: item,
                  start: "top 85%",
                  end: "top 60%",
                  toggleActions: "play none none none",
                },
              }
            );
            const twSt = triggerOf(tween);
            if (twSt) localTriggers.push(twSt);
          });

          // Pop-in de los puntos (back.out); bajo reduced-motion, sólo fade.
          dots.forEach((dot) => {
            const tween = gsap.fromTo(
              dot,
              reduced ? { opacity: 0 } : { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(2)",
                scrollTrigger: {
                  trigger: dot,
                  start: "top 80%",
                  toggleActions: "play none none none",
                },
              }
            );
            const twSt = triggerOf(tween);
            if (twSt) localTriggers.push(twSt);
          });
        };

        rebuild = build;
        refresh = () => ScrollTrigger.refresh();
        build();
      });
    });

    // Re-medir al cambiar el layout (fuentes/toolbar) — la altura de la
    // línea depende de la posición del último nodo.
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        rebuild?.();
        refresh?.();
      }, 200);
    };
    const onLoad = () => {
      rebuild?.();
      refresh?.();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onLoad);

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      killAll();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
    };
  }, [reduced]);

  return (
    <section id="story" className="section-padding relative z-20">
      <div className="max-w-4xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Nuestra Historia"
          subtitle="Cada momento nos trajo más cerca, hasta llegar a este día tan especial"
        />

        {/* Timeline */}
        <div ref={trackRef} className="relative mt-16">
          {/* Línea central plateada — altura medida por JS para terminar en
              el último nodo; GSAP posee el `transform` (scaleY), por eso el
              centrado se hace con margen (-ml-px) y no con translate. */}
          <div
            ref={lineRef}
            className="timeline-line absolute left-4 md:left-1/2 top-0 w-px -ml-px bg-gradient-to-b from-silver via-silver-light to-silver-dark"
          />

          {ourStory.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Heart;
            const isLeft = index % 2 === 0;

            return (
              <div
                key={item.year}
                className={`story-item relative flex items-start mb-12 md:mb-16 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Punto en la línea */}
                <div className="timeline-dot absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-silver border-4 border-ivory shadow-md transform -translate-x-1/2 z-10 mt-1" />

                {/* Contenido */}
                <div
                  className={`ml-12 md:ml-0 md:w-1/2 ${
                    isLeft ? "md:pr-12 md:text-right" : "md:pl-12"
                  }`}
                >
                  <GlassCard>
                    {/* Foto opcional del milestone — se renderiza solo si
                        el entry tiene `image` definido (graceful absence).
                        Cuando la pareja entregue las fotos, basta con
                        setear el campo en src/data/wedding.ts; el resto
                        del layout se ajusta automáticamente. */}
                    {item.image && (
                      <div
                        className={`relative w-full aspect-video rounded-xl overflow-hidden mb-4 ${
                          isLeft ? "md:flex md:justify-end" : ""
                        }`}
                      >
                        <Image
                          src={item.image}
                          alt={`${item.title} — ${item.year}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-3 mb-3 ${
                        isLeft ? "md:justify-end" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="text-burgundy" size={18} />
                      </div>
                      <span className="text-display text-2xl text-silver font-medium">
                        {item.year}
                      </span>
                    </div>
                    <h3 className="text-display text-xl text-burgundy mb-2">
                      {item.title}
                    </h3>
                    <p className="text-body text-burgundy/60 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </GlassCard>
                </div>
              </div>
            );
          })}

          {/* Cometa luminoso — cabalga la cabeza de la línea mientras crece
              y estaciona sobre el último nodo. Pintado al final (DOM) y con
              z-20 para que la luz se vea por encima de los puntos. */}
          <div
            ref={tipRef}
            aria-hidden
            className="absolute left-4 md:left-1/2 -ml-1.5 top-0 w-3 h-3 rounded-full bg-silver-light shadow-[0_0_12px_4px_rgba(197,203,211,0.7)] z-20"
          />
        </div>
      </div>
    </section>
  );
}
