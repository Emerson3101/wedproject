"use client";

import { Calendar, Clock, MapPin, Music, Flame } from "lucide-react";
import { padrinos, weddingDetails } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import Reveal from "@/components/shared/Reveal";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   DETALLES DEL EVENTO
   El hover lo gopa GlassCard (lift + scale + sombra).
   El `group` habilita la micro-interacción del ícono
   (escala + tono de anillo), suave y a tono.

   Además de la info de ceremonia/recepción, incluye una
   5a card que honra a los Padrinos de Velación (los
   sponsors espirituales de la ceremonia). Las entradas
   Lazo/Anillos/Arras siguen en `wedding.ts` como data
   dormida por si los clientes las quieren revivir luego.
   ============================================ */
const detailsIcon = {
  date: Calendar,
  time: Clock,
  location: MapPin,
  music: Music,
  velacion: Flame,
};

function DetailCard({
  iconName,
  title,
  value,
  delay,
}: {
  iconName: string;
  title: string;
  value: string;
  delay: number;
}) {
  const Icon = detailsIcon[iconName as keyof typeof detailsIcon] || Calendar;

  return (
    <Reveal delay={delay}>
      <GlassCard className="text-center group h-full">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-silver/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-silver/20">
            <Icon className="text-burgundy" size={24} />
          </div>
        </div>
        <h3 className="text-display text-xl text-burgundy mb-2">{title}</h3>
        <p className="text-body text-lg text-burgundy/70 whitespace-pre-line">{value}</p>
      </GlassCard>
    </Reveal>
  );
}

export default function DetailsSection() {
  const velacion = padrinos.find((p) => p.role === "Velación");
  const velacionValue = velacion
    ? velacion.person2
      ? `${velacion.person1} & ${velacion.person2}`
      : velacion.person1
    : "";

  const cards = [
    {
      icon: "date",
      title: "Ceremonia",
      value: `${weddingDetails.ceremony.date}\n${weddingDetails.ceremony.location}`,
    },
    {
      icon: "time",
      title: "Hora de Ceremonia",
      value: weddingDetails.ceremony.time,
    },
    {
      icon: "location",
      title: "Recepción",
      value: `${weddingDetails.reception.location}\n${weddingDetails.reception.address}`,
    },
    {
      icon: "time",
      title: "Hora de Recepción",
      value: weddingDetails.reception.time,
    },
    {
      icon: "velacion",
      title: velacion?.honor ?? "Padrinos de Velación",
      value: velacionValue,
    },
  ];

  return (
    <section id="details" className="section-padding relative z-20">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          ornament="✦"
          title="Detalles del Evento"
          subtitle="Todos los detalles para que no te pierdas nada de nuestro gran día"
        />

        {/* 3 columnas en desktop: 5 cards fluyen como 3 + 2.
            `h-full` en DetailCard mantiene alturas pareja dentro
            de cada row, sin saltos visuales. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {cards.map((card, i) => (
            <DetailCard
              key={card.title}
              iconName={card.icon}
              title={card.title}
              value={card.value}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
