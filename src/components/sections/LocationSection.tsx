"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, ExternalLink, Church, GlassWater } from "lucide-react";
import { weddingDetails } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";
import GoogleMapEmbed from "@/components/shared/GoogleMapEmbed";

/* ============================================
   UBICACIÓN / MAPA — Con Google Maps
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Ceremonia */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <GlassCard className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
                  <Church className="text-burgundy" size={24} />
                </div>
              </div>
              <h3 className="text-display text-2xl text-burgundy mb-2">
                {weddingDetails.ceremony.name}
              </h3>
              <p className="text-display text-xl text-gold mb-1">
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
          </motion.div>

          {/* Recepción */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <GlassCard className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
                  <GlassWater className="text-burgundy" size={24} />
                </div>
              </div>
              <h3 className="text-display text-2xl text-burgundy mb-2">
                {weddingDetails.reception.name}
              </h3>
              <p className="text-display text-xl text-gold mb-1">
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
          </motion.div>
        </div>

        {/* Mapa embebido con estilos personalizados */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12"
        >
          <GlassCard padding="none" className="overflow-hidden">
            <GoogleMapEmbed
              center={weddingDetails.ceremony.coordinates}
              zoom={15}
              height={400}
              markerLabel="💕"
            />
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
