"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/shared/Navigation";
import FloatingPetals from "@/components/shared/FloatingPetals";
import BokehBackground from "@/components/shared/BokehBackground";
import PageAnimations from "@/components/shared/PageAnimations";
import Footer from "@/components/shared/Footer";
import PageSkeleton from "@/components/shared/PageSkeleton";

import HeroSection from "@/components/sections/HeroSection";
import CountdownSection from "@/components/sections/CountdownSection";
import DetailsSection from "@/components/sections/DetailsSection";
import StorySection from "@/components/sections/StorySection";
import DressCodeSection from "@/components/sections/DressCodeSection";
import LocationSection from "@/components/sections/LocationSection";
import RSVPSection from "@/components/sections/RSVPSection";
import PlaylistSection from "@/components/sections/PlaylistSection";
import PhotoUploadSection from "@/components/sections/PhotoUploadSection";

/* ============================================
   PÁGINA PRINCIPAL — Sitio Web de Boda

   Muestra un skeleton estructurado durante la carga
   inicial de JavaScript, luego transiciona suavemente
   al contenido real con animaciones.
   ============================================ */
export default function Home() {
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Marcar la página como lista después de un breve delay
    // para que los módulos de animación (GSAP, framer-motion)
    // estén listos y no haya flash de contenido invisible
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden w-full">
      {/* Skeleton durante carga inicial */}
      {!isPageReady && <PageSkeleton />}

      {/* Contenido real con transición suave */}
      <div
        className={`transition-opacity duration-700 ${
          isPageReady ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Fondos animados — globales */}
        <BokehBackground />
        <FloatingPetals />

        {/* Animaciones GSAP globales */}
        <PageAnimations />

        {/* Navegación */}
        <Navigation />

        {/* Secciones */}
        <HeroSection />
        <CountdownSection />
        <DetailsSection />
        <StorySection />
        <DressCodeSection />
        <LocationSection />
        <PhotoUploadSection />
        <RSVPSection />
        <PlaylistSection />

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}
