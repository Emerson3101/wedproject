"use client";

import { motion } from "framer-motion";
import useCountdown from "@/hooks/useCountdown";
import { weddingDate, couple } from "@/data/wedding";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";

/* ============================================
   COUNTDOWN — Contador Regresivo Flip 3D
   ============================================ */
interface FlipUnitProps {
  value: number;
  label: string;
}

function FlipUnit({ value, label }: FlipUnitProps) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div className="relative w-14 h-[4.5rem] sm:w-16 sm:h-20 md:w-28 md:h-32 perspective-1000">
        <GlassCard variant="strong" className="flex items-center justify-center w-full h-full">
          <span className="text-display text-2xl sm:text-3xl md:text-6xl font-light text-burgundy">
            {padded}
          </span>
        </GlassCard>
      </div>
      <span className="text-body text-[0.65rem] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] text-burgundy/60">
        {label}
      </span>
    </div>
  );
}

export default function CountdownSection() {
  const { days, hours, minutes, seconds } = useCountdown(weddingDate);

  return (
    <section id="countdown" className="section-padding relative z-20 pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Falta Poco"
          subtitle={`Cada segundo nos acerca más a nuestro gran día`}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-12 mt-8 sm:mt-12 max-w-full px-1"
        >
          <FlipUnit value={days} label="Días" />
          <FlipUnit value={hours} label="Horas" />
          <FlipUnit value={minutes} label="Minutos" />
          <FlipUnit value={seconds} label="Segundos" />
        </motion.div>

        {/* Mensaje romántico */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center mt-16"
        >
          <p className="text-script text-gold text-3xl md:text-4xl">
            {couple.name1} & {couple.name2}
          </p>
          <p className="text-body text-burgundy/60 mt-4 max-w-lg mx-auto italic">
            "El amor es paciente, es bondadoso. El amor todo lo espera."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
