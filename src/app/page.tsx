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

   El contenido real se renderiza siempre visible
   para que GSAP/ScrollTrigger calculen posiciones
   correctas desde el inicio. PageSkeleton se muestra
   como overlay que se desvanece.
   ============================================ */
export default function Home() {
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Breve delay para que los módulos de animación
    // (GSAP, framer-motion) se inicialicen antes de
    // que el overlay se desvanezca
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden w-full">
      {/* Skeleton overlay — se desvanece al estar listo */}
      <div
        className={`fixed inset-0 z-50 overflow-auto transition-opacity duration-500 ${
          isPageReady ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <PageSkeleton />
      </div>

      {/* Contenido real — siempre visible para GSAP/ScrollTrigger */}
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
    </main>
  );
}
