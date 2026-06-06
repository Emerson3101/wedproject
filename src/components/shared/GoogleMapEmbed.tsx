"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================
   GOOGLE MAPS — Embed con estilos personalizados
   ivory/dorado theme
   ============================================ */

interface GoogleMapEmbedProps {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  markerLabel?: string;
}

export default function GoogleMapEmbed({
  center,
  zoom = 15,
  height = 400,
  markerLabel = "💕",
}: GoogleMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Estilos de mapa ivory/dorado
  const mapStyles = [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f1e8" }] },
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#722F37" }] },
    { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e8" }] },
    { featureType: "administrative", elementType: "geometry.fill", stylers: [{ visibility: "off" }] },
    { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#e8e0d0" }] },
    { featureType: "poi", elementType: "geometry.fill", stylers: [{ color: "#F7E7CE" }] },
    { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { featureType: "poi公园", elementType: "geometry.fill", stylers: [{ color: "#9CAF88" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#C5A55A" }, { weight: 2 }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#ffffff" }, { weight: 0.5 }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#dddddd" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#D4BA7A" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#722F37" }] },
  ];

  const stylesString = JSON.stringify(mapStyles)
    .replace(/"/g, "'")
    .replace(/,/g, "|3,")
    .replace(/\]/g, "]");

  // Google Maps embed URL con estilos
  const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${center.lng}!3d${center.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1ses!2smx!4v1`;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-champagne/30 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-body text-burgundy/50 text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <iframe
        title="Wedding Location Map"
        src={embedUrl}
        className="w-full h-full border-0"
        style={{ filter: "sepia(15%) saturate(90%) brightness(105%) hue-rotate(-5deg)" }}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Overlay con marker */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-burgundy/5 to-transparent" />
      </div>

      {/* Marker personalizado */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full -mt-4 pointer-events-none">
        <div className="animate-bounce">
          <span className="text-4xl drop-shadow-lg">{markerLabel}</span>
        </div>
        <div className="w-3 h-3 bg-gold rounded-full mx-auto -mt-1 shadow-md" />
      </div>
    </div>
  );
}
