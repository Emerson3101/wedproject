import Navigation from "@/components/shared/Navigation";
import FloatingPetals from "@/components/shared/FloatingPetals";
import BokehBackground from "@/components/shared/BokehBackground";
import PageAnimations from "@/components/shared/PageAnimations";
import Footer from "@/components/shared/Footer";

import HeroSection from "@/components/sections/HeroSection";
import CountdownSection from "@/components/sections/CountdownSection";
import DetailsSection from "@/components/sections/DetailsSection";
import StorySection from "@/components/sections/StorySection";
import DressCodeSection from "@/components/sections/DressCodeSection";
import LocationSection from "@/components/sections/LocationSection";
import RSVPSection from "@/components/sections/RSVPSection";
import PlaylistSection from "@/components/sections/PlaylistSection";

/* ============================================
   PÁGINA PRINCIPAL — Sitio Web de Boda
   ============================================ */
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden w-full">
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
      <RSVPSection />
      <PlaylistSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
