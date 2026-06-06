"use client";

import { useEffect } from "react";
import {
  Heart,
  Sparkles,
  Home,
  Gem,
  Church,
} from "lucide-react";
import { ourStory } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   NUESTRA HISTORIA — Timeline con GSAP ScrollTrigger
   ============================================ */
const iconMap: Record<string, any> = {
  heart: Heart,
  sparkles: Sparkles,
  home: Home,
  ring: Gem,
  church: Church,
};

export default function StorySection() {
  useEffect(() => {
    // Importar GSAP dinámicamente (solo en browser)
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Animar cada item del timeline con stagger
        const items = document.querySelectorAll(".story-item");
        if (items.length === 0) return;

        items.forEach((item, index) => {
          const isLeft = index % 2 === 0;

          gsap.fromTo(
            item,
            {
              opacity: 0,
              x: isLeft ? -80 : 80,
              scale: 0.95,
            },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
                end: "top 60%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        // Animar la línea dorada central
        const line = document.querySelector(".timeline-line");
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0, transformOrigin: "top center" },
            {
              scaleY: 1,
              duration: 1.5,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: line,
                start: "top 80%",
                end: "top 30%",
                scrub: 1,
              },
            }
          );
        }

        // Parallax en los puntos dorados
        const dots = document.querySelectorAll(".timeline-dot");
        dots.forEach((dot) => {
          gsap.fromTo(
            dot,
            { scale: 0, opacity: 0 },
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
        });
      });
    });
  }, []);

  return (
    <section id="story" className="section-padding relative z-20">
      <div className="max-w-4xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Nuestra Historia"
          subtitle="Cada momento nos trajo más cerca, hasta llegar a este día tan especial"
        />

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Línea central dorada */}
          <div className="timeline-line absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold-light to-gold transform md:-translate-x-px" />

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
                <div className="timeline-dot absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-gold border-4 border-ivory shadow-md transform -translate-x-1/2 z-10 mt-1" />

                {/* Contenido */}
                <div
                  className={`ml-12 md:ml-0 md:w-1/2 ${
                    isLeft ? "md:pr-12 md:text-right" : "md:pl-12"
                  }`}
                >
                  <GlassCard className="hover:shadow-xl transition-shadow duration-500">
                    <div
                      className={`flex items-center gap-3 mb-3 ${
                        isLeft ? "md:justify-end" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="text-burgundy" size={18} />
                      </div>
                      <span className="text-display text-2xl text-gold font-medium">
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
        </div>
      </div>
    </section>
  );
}
