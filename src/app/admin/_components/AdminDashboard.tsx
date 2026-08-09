"use client";

/* ============================================
   AdminDashboard — pestaña de resumen (RSVP stats)
   ============================================ */

import { StatCard } from "./StatCard";
import type { Stats } from "./types";

interface AdminDashboardProps {
  stats: Stats;
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="Total RSVP" value={stats.total} color="burgundy" />
      <StatCard label="Confirmados" value={stats.confirmed} color="sage" />
      <StatCard label="Declinaron" value={stats.declined} color="rose" />
      <StatCard label="Pendientes" value={stats.pending} color="silver" />
      <StatCard label="Acompañantes" value={stats.totalCompanions} color="champagne" />
    </div>
  );
}
