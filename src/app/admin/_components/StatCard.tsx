"use client";

/* ============================================
   StatCard — tarjeta de estadística del panel
   --------------------------------------------
   Variantes:
   - default: glass con círculo numerado (comportamiento
     histórico). Si se pasa `icon`, el icono vive en el
     círculo y el número pasa debajo.
   - highlight (WS12): hero card para métrica principal
     (p.ej. Total Confirmados) — número grande, icono,
     badge "Principal" y halo sutil.
   Reutilizada por Dashboard, Canciones y Mensajes.
   ============================================ */

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatColor = "burgundy" | "sage" | "rose" | "silver" | "champagne";

interface StatCardProps {
  label: string;
  value: number;
  color: StatColor;
  /** Icono decorativo (lucide) — opcional. */
  icon?: LucideIcon;
  /** Variante hero — número grande + borde destacado. */
  highlight?: boolean;
  className?: string;
}

const CIRCLE_COLOR: Record<StatColor, string> = {
  burgundy: "bg-wine-mid/70 text-burgundy border-burgundy/20",
  sage: "bg-sage/20 text-sage border-sage/30",
  rose: "bg-rose/20 text-rose border-rose/30",
  silver: "bg-silver/20 text-silver border-silver/30",
  champagne: "bg-champagne/30 text-burgundy border-champagne/40",
};

export function StatCard({
  label,
  value,
  color,
  icon: Icon,
  highlight = false,
  className,
}: StatCardProps) {
  if (highlight) {
    return (
      <div
        className={cn(
          "relative glass p-6 sm:p-7 text-center overflow-hidden border-silver/40 ring-1 ring-silver/20 shadow-[0_8px_30px_rgba(138,143,152,0.18)]",
          className
        )}
      >
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-silver/10 blur-3xl"
          aria-hidden
        />
        {Icon && (
          <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-silver/20 text-silver mb-3">
            <Icon className="w-6 h-6" aria-hidden />
          </div>
        )}
        <div className="relative text-display text-5xl sm:text-6xl font-medium text-burgundy mb-1 tabular-nums">
          {value}
        </div>
        <p className="relative text-body text-xs text-burgundy/60 uppercase tracking-[0.15em]">
          {label}
        </p>
        <span className="relative inline-block mt-2 px-2 py-0.5 rounded-full text-[0.6rem] uppercase tracking-wider bg-silver/15 text-silver border border-silver/25">
          Principal
        </span>
      </div>
    );
  }

  return (
    <div className={cn("glass p-6 text-center", className)}>
      <div
        className={cn(
          "inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl text-display mb-3 border tabular-nums",
          CIRCLE_COLOR[color]
        )}
      >
        {Icon ? <Icon className="w-6 h-6" aria-hidden /> : value}
      </div>
      {Icon && (
        <p className="text-display text-2xl text-burgundy mb-1 tabular-nums">{value}</p>
      )}
      <p className="text-body text-sm text-burgundy/60 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
