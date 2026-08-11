"use client";

import { Navigation, ExternalLink, Church, GlassWater } from "lucide-react";
import { weddingDetails } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import Reveal from "@/components/shared/Reveal";
import GlassCard from "@/components/ui/GlassCard";
import GoogleMapEmbed from "@/components/shared/GoogleMapEmbed";

/* ============================================
   UBICACIÓN / MAPA — Con Google Maps
   Las cards de sede heredan el hover premium de
   GlassCard; la del mapa se marca `interactive={false}`
   para que el embed no escale al pasar el cursor.
   ============================================ */
export default function LocationSection() {
  const googleMapsUrl = (coords: { lat: number; lng: number }) =>
    `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  return (
    <section id="location" className="section-padding relative z-20">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Ubicación"
          subtitle="Encuéntranos fácilmente para celebrar juntos"
        />

        {/* Cards de Ceremonia y Recepción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Ceremonia */}
          <Reveal>
            <GlassCard className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-silver/10 flex items-center justify-center">
                  <Church className="text-burgundy" size={24} />
                </div>
              </div>
              <h3 className="text-display text-2xl text-burgundy mb-2">
                {weddingDetails.ceremony.name}
              </h3>
              <p className="text-display text-xl text-silver mb-1">
                {weddingDetails.ceremony.location}
              </p>
              <p className="text-body text-burgundy/60 text-sm mb-2">
                {weddingDetails.ceremony.address}
              </p>
              <p className="text-body text-burgundy/50 text-sm mb-6">
                {weddingDetails.ceremony.date} a las {weddingDetails.ceremony.time}
              </p>
              <a
                href={googleMapsUrl(weddingDetails.ceremony.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center gap-2 text-sm"
              >
                <Navigation size={16} />
                Cómo Llegar
                <ExternalLink size={14} />
              </a>
            </GlassCard>
          </Reveal>

          {/* Recepción */}
          <Reveal delay={0.2}>
            <GlassCard className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-silver/10 flex items-center justify-center">
                  <GlassWater className="text-burgundy" size={24} />
                </div>
              </div>
              <h3 className="text-display text-2xl text-burgundy mb-2">
                {weddingDetails.reception.name}
              </h3>
              <p className="text-display text-xl text-silver mb-1">
                {weddingDetails.reception.location}
              </p>
              <p className="text-body text-burgundy/60 text-sm mb-2">
                {weddingDetails.reception.address}
              </p>
              <p className="text-body text-burgundy/50 text-sm mb-6">
                {weddingDetails.reception.date} a las {weddingDetails.reception.time}
              </p>
              <a
                href={googleMapsUrl(weddingDetails.reception.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center gap-2 text-sm"
              >
                <Navigation size={16} />
                Cómo Llegar
                <ExternalLink size={14} />
              </a>
            </GlassCard>
          </Reveal>
        </div>

        {/* Mapas embebidos — uno por sede */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Mapa Ceremonia */}
          <Reveal y={40} duration={0.8} delay={0.2}>
            <GlassCard padding="none" interactive={false} className="overflow-hidden">
              <GoogleMapEmbed
                center={weddingDetails.ceremony.coordinates}
                height={320}
                markerLabel="⛪"
              />
            </GlassCard>
          </Reveal>

          {/* Mapa Recepción */}
          <Reveal y={40} duration={0.8} delay={0.4}>
            <GlassCard padding="none" interactive={false} className="overflow-hidden">
              <GoogleMapEmbed
                center={weddingDetails.reception.coordinates}
                height={320}
                markerLabel="🎊"
              />
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
