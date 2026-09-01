"use client";

/* ============================================
   AdminDashboard — pestaña de resumen (RSVP stats)
   --------------------------------------------
   Tarjeta hero con el Total Confirmado (headcount
   real: invitados confirmados + sus acompañantes),
   rejilla de estadísticas clásica y barra de
   composición de respuestas (cero dependencias).
   (WS12 admin overhaul)
   ============================================ */

import { motion, useReducedMotion } from "framer-motion";
import { Users, CheckCircle2, XCircle, Clock, UserPlus, Crown, FileSpreadsheet, Loader2 } from "lucide-react";
import { StatCard } from "./StatCard";
import type { Stats } from "./types";

interface AdminDashboardProps {
  stats: Stats;
  onExportExcel?: () => void;
  exportingExcel?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Barra de composición apilada (confirmed/declined/pending) — cero dependencias. */
function ResponseComposition({ stats }: { stats: Stats }) {
  const total = stats.total || 0;
  const segments = [
    { key: "confirmed", label: "Confirmados", value: stats.confirmed, color: "bg-sage" },
    { key: "declined", label: "Declinaron", value: stats.declined, color: "bg-rose" },
    { key: "pending", label: "Pendientes", value: stats.pending, color: "bg-silver/60" },
  ];
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
      className="glass p-6"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-display text-lg text-burgundy">Composición de respuestas</h2>
        <span className="text-xs text-burgundy/50 uppercase tracking-wider">
          {total} RSVP
        </span>
      </div>

      {total === 0 ? (
        <p className="text-burgundy/50 text-sm py-6 text-center">
          Aún no hay respuestas para mostrar.
        </p>
      ) : (
        <>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-wine-deep/50">
            {segments.map((seg) =>
              seg.value > 0 ? (
                <div
                  key={seg.key}
                  className={seg.color}
                  style={{ width: `${(seg.value / total) * 100}%` }}
                  aria-hidden
                />
              ) : null
            )}
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-sm">
            {segments.map((seg) => (
              <li key={seg.key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} aria-hidden />
                <span className="text-burgundy/70 text-xs">{seg.label}</span>
                <span className="text-burgundy font-medium text-xs tabular-nums">
                  {seg.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  );
}

export function AdminDashboard({
  stats,
  onExportExcel,
  exportingExcel,
}: AdminDashboardProps) {
  const prefersReduced = useReducedMotion();
  const reveal = (delay: number) => ({
    initial: prefersReduced ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 } as const,
    viewport: { once: true, margin: "-60px" } as const,
    transition: { duration: 0.6, ease: EASE, delay } as const,
  });

  return (
    <div className="space-y-6">
      {/* Métrica hero — Total Confirmado */}
      <motion.div {...reveal(0)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          label="Total Invitados Confirmados"
          value={stats.totalConfirmed}
          color="silver"
          icon={Crown}
          highlight
          className="lg:col-span-1"
        />
        <div
          className="glass p-6 lg:col-span-2 flex flex-col justify-center"
          aria-label="Detalle de la métrica principal"
        >
          <p className="text-burgundy/60 text-xs uppercase tracking-[0.15em] mb-4">
            Desglose del headcount
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-display text-3xl text-burgundy tabular-nums">
                {stats.confirmed}
              </p>
              <p className="text-burgundy/50 text-xs uppercase tracking-wider">
                Invitados confirmados
              </p>
            </div>
            <div>
              <p className="text-display text-3xl text-burgundy tabular-nums">
                {stats.confirmedCompanions}
              </p>
              <p className="text-burgundy/50 text-xs uppercase tracking-wider">
                Acompañantes de confirmados
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-champagne/30 flex items-center justify-between gap-4 flex-wrap text-burgundy/60 text-xs">
            <div>
              <span className="text-sage font-medium">Catering / Seating:</span> esta cifra
              refleja el número real de personas que asistirán.
            </div>
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={exportingExcel}
                className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {exportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sage-light" aria-hidden />
                )}
                <span>{exportingExcel ? "Exportando..." : "Descargar Excel"}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Rejilla clásica de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div {...reveal(0.05)}>
          <StatCard label="Total RSVP" value={stats.total} color="burgundy" icon={Users} />
        </motion.div>
        <motion.div {...reveal(0.1)}>
          <StatCard label="Confirmados" value={stats.confirmed} color="sage" icon={CheckCircle2} />
        </motion.div>
        <motion.div {...reveal(0.15)}>
          <StatCard label="Declinaron" value={stats.declined} color="rose" icon={XCircle} />
        </motion.div>
        <motion.div {...reveal(0.2)}>
          <StatCard label="Pendientes" value={stats.pending} color="silver" icon={Clock} />
        </motion.div>
      </div>

      {/* Composición + acompañantes totales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResponseComposition stats={stats} />
        </div>
        <motion.div {...reveal(0.1)} className="h-full">
          <StatCard
            label="Acompañantes (total)"
            value={stats.totalCompanions}
            color="champagne"
            icon={UserPlus}
            className="h-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
