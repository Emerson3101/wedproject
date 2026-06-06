"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Music } from "lucide-react";
import { weddingDetails } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   DETALLES DEL EVENTO
   ============================================ */
const detailsIcon = {
  date: Calendar,
  time: Clock,
  location: MapPin,
  music: Music,
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <GlassCard className="text-center hover:shadow-lg transition-shadow duration-500">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center">
            <Icon className="text-burgundy" size={24} />
          </div>
        </div>
        <h3 className="text-display text-xl text-burgundy mb-2">{title}</h3>
        <p className="text-body text-burgundy/70">{value}</p>
      </GlassCard>
    </motion.div>
  );
}

export default function DetailsSection() {
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
  ];

  return (
    <section id="details" className="section-padding relative z-20">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          ornament="✦"
          title="Detalles del Evento"
          subtitle="Todos los detalles para que no te pierdas nada de nuestro gran día"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {cards.map((card, i) => (
            <DetailCard
              key={card.title}
              iconName={card.icon}
              title={card.title}
              value={card.value}
              delay={i * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
