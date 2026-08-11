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

    // Estado mutable del efecto. GSAP se importa de forma dinámica
    // (SSR-safe) y se tipa por inferencia dentro del .then().
    //
    // Un ÚNICO master timeline scrubbed sobre toda la pista es la
    // pieza central de este diseño: con un solo ScrollTrigger no hay
    // ventanas independientes que se des sincronicen — la línea, los
    // puntos y las tarjetas viven todos dentro del mismo progreso de
    // scroll, así que el ritmo es siempre coherente.
    //
    // `masterTl` guarda ese timeline para cleanup; `localTriggers`
    // guarda cualquier ScrollTrigger auxiliar (reduced-motion).
    let masterTl: { kill: () => void } | null = null;
    let localTriggers: Array<{ kill: () => void }> = [];
    let rebuild: (() => void) | null = null;
    let refresh: (() => void) | null = null;

    const killAll = () => {
      masterTl?.kill();
      masterTl = null;
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
          // capturamos para cleanup sin depender de la augmentación
          // de tipos del plugin (que vía import() dinámico puede no
          // resolverse).
          const triggerOf = (t: object) =>
            (t as { scrollTrigger?: { kill: () => void } }).scrollTrigger;

          const track = trackRef.current;
          const line = lineRef.current;
          const tip = tipRef.current;
          if (!track || !line || !tip) return;

          const items = track.querySelectorAll<HTMLElement>(".story-item");
          const dots = track.querySelectorAll<HTMLElement>(".timeline-dot");
          if (items.length === 0 || dots.length === 0) return;
          if (items.length !== dots.length) return;

          const dotsArr = Array.from(dots);
          const itemsArr = Array.from(items);

          // Medición: el centro de cada nodo relativo al top de la
          // pista.  La línea siempre se dimensiona a `lastDotCenterY`
          // y crece por `scaleY`; el cometa viaja por `y`.
          const trackRect = track.getBoundingClientRect();
          const dotYs = dotsArr.map((d) => {
            const r = d.getBoundingClientRect();
            return r.top - trackRect.top + r.height / 2;
          });
          const lastDotCenterY = dotYs[dotYs.length - 1];
          const tipHalf = tip.offsetHeight / 2 || 6;
          const maxTravel = Math.max(lastDotCenterY, 1);

          // Línea: altura fija = último nodo, transformOrigin top, y
          // estado inicial según reduced-motion.
          gsap.set(line, {
            height: lastDotCenterY,
            transformOrigin: "top center",
            scaleY: reduced ? 1 : 0,
          });
          gsap.set(tip, { y: reduced ? lastDotCenterY - tipHalf : 0 });

          if (reduced) {
            // ─────────────────────────────────────────────────────
            // Modo reduced-motion: la línea estática ya toca el
            // último nodo.  Puntos y tarjetas aparecen por scroll
            // con un fade suave (sin traslación/escala).
            // ─────────────────────────────────────────────────────
            dots.forEach((dot) => {
              const tween = gsap.fromTo(
                dot,
                { autoAlpha: 0 },
                {
                  autoAlpha: 1,
                  duration: 0.5,
                  ease: "none",
                  scrollTrigger: {
                    trigger: dot,
                    start: "top 85%",
                    toggleActions: "play none none none",
                  },
                }
              );
              const st = triggerOf(tween);
              if (st) localTriggers.push(st);
            });
            items.forEach((item) => {
              const tween = gsap.fromTo(
                item,
                { autoAlpha: 0 },
                {
                  autoAlpha: 1,
                  duration: 0.6,
                  ease: "none",
                  scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    toggleActions: "play none none none",
                  },
                }
              );
              const st = triggerOf(tween);
              if (st) localTriggers.push(st);
            });
            return;
          }

          // ─────────────────────────────────────────────────────────
          // MODO NORMAL — un master timeline scrubbed sobre toda la
          // pista.  El progreso 0 → 1 del timeline se mapea al scroll
          // desde "top 80%" hasta "bottom 70%" de la pista entera.
          //
          // Dentro del master, por cada item añadimos una mini-
          // timeline en la posición absoluta `index` (con
          // `duration: 1`), de modo que los items ocupan ranuras
          // uniformes.  Cada mini-timeline contiene, en orden:
          //
          //   FASE A (0 → 0.65):  línea + cometa viajan del centro
          //                        del nodo anterior a éste.  La
          //                        tarjeta y el punto permanecen
          //                        invisibles.
          //
          //   FASE B (0.65 → 1.0): el cometa está en el nodo.  El
          //                        punto "pop"ea (back.out) y la
          //                        tarjeta se revela simultáneamente.
          //
          // Como todo vive dentro de un solo timeline scrubbed, el
          // rendimiento visual es siempre: línea → punto → tarjeta,
          // y al usuario le parece que la línea "toca" cada nodo
          // antes de que aparezca la tarjeta.  No hay ventanas
          // independientes que se des sincronicen; el avance es
          // proporcional al scroll (1:1), ni "breakneck" ni lento.
          // ─────────────────────────────────────────────────────────

          // Inicializa puntos invisibles (los "pop"eará la timeline).
          gsap.set(dots, { scale: 0, autoAlpha: 0 });
          gsap.set(items, { autoAlpha: 0 });

          const master = gsap.timeline({
            scrollTrigger: {
              trigger: track,
              start: "top 85%",
              end: "bottom 95%",
              scrub: 1,
            },
          });

          itemsArr.forEach((item, index) => {
            const isLeft = index % 2 === 0;
            const prevFrac = (dotYs[index - 1] ?? 0) / maxTravel;
            const curFrac = dotYs[index] / maxTravel;
            const prevTipY =
              index === 0 ? 0 : dotYs[index - 1] - tipHalf;
            const curTipY = dotYs[index] - tipHalf;
            const dot = dotsArr[index];

            // Mini-timeline por item: 1 unidad de tiempo del master.
            // FASE A 0 → 0.65, FASE B 0.65 → 1.0.
            const phaseASplit = 0.65;
            const phaseADur = phaseASplit; // 0 → 0.65
            const phaseBDur = 1 - phaseASplit; // 0.65 → 1.0

            // ① LÍNEA + COMETA viajan al nodo.  Usamos `set` para
            // fijar el estado inicial sin animar (immediateRender
            // por defecto en `set`), y luego `to` para animar.  Esto
            // evita el problema de `fromTo` con `immediateRender`
            // sobreescribiendo el estado previo cuando varios items
            // comparten el mismo objetivo (la línea).
            master.set(line, { scaleY: prevFrac }, index);
            master.to(
              line,
              { scaleY: curFrac, ease: "none", duration: phaseADur },
              index
            );
            master.set(tip, { y: prevTipY }, index);
            master.to(
              tip,
              { y: curTipY, ease: "none", duration: phaseADur },
              index
            );

            // ② PUNTO "pop"ea (back.out) en la FASE B.
            master.fromTo(
              dot,
              { scale: 0, autoAlpha: 0 },
              {
                scale: 1,
                autoAlpha: 1,
                ease: "back.out(2)",
                duration: phaseBDur,
              },
              index + phaseASplit
            );

            // ③ TARJETA aparece en la FASE B (simultánea al punto).
            master.fromTo(
              item,
              { autoAlpha: 0, x: isLeft ? -60 : 60, scale: 0.96 },
              {
                autoAlpha: 1,
                x: 0,
                scale: 1,
                ease: "none",
                duration: phaseBDur,
              },
              index + phaseASplit
            );
          });

          masterTl = master;
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
        <div ref={trackRef} className="relative mt-8">
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
                className={`story-item relative flex flex-col items-stretch mb-8 md:flex-row md:items-start md:mb-10 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                } ${index === ourStory.length - 1 ? "mb-0 md:mb-0" : ""}`}
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
                    {/* Foto del milestone — se renderiza solo si el entry
                        tiene `image` definido. Frame-in-frame: contenedor
                        cuadrado consistente con margen (matting) de color
                        marfil/champaña, y la foto adentro con `object-contain`
                        — sin recorte. Funciona para retratos y paisajes
                        por igual, manteniendo el ritmo de la línea de tiempo. */}
                    {item.image && (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-5 bg-gradient-to-br from-ivory/90 via-champagne/25 to-ivory/90 p-3 shadow-inner">
                        <div className="relative h-full w-full rounded-lg overflow-hidden bg-ivory ring-1 ring-silver/40 shadow-sm">
                          <Image
                            src={item.image}
                            alt={`${item.title}, ${item.year}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain object-center"
                          />
                        </div>
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
                    <p className="text-body text-burgundy/60 text-lg leading-relaxed">
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
