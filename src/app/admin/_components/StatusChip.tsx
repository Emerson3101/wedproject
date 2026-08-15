"use client";

/* ============================================
   StatusChip — badge de estado unificado
   --------------------------------------------
   Reemplaza los STATUS_MAP/STATUS_LABEL_MAP
   duplicados en AdminGuestsTable, AdminSongsTable
   y AdminMessages (WS12 admin overhaul). Una sola
   fuente para colores + etiquetas de estado.
   ============================================ */

import { cn } from "@/lib/utils";

export type GuestStatus = "pending" | "confirmed" | "declined";

/** Tono visual de cada estado (sobre el esquema oscuro/vino). */
const STATUS_TONE: Record<GuestStatus, string> = {
  confirmed: "bg-sage/20 text-sage border-sage/30",
  declined: "bg-rose/20 text-rose border-rose/30",
  pending: "bg-silver/20 text-silver border-silver/30",
};

const STATUS_LABEL: Record<GuestStatus, string> = {
  confirmed: "Confirmado",
  declined: "Declinado",
  pending: "Pendiente",
};

const SONG_LABEL: Record<"approved" | "pending", string> = {
  approved: "Aprobada",
  pending: "Pendiente",
};

const SONG_TONE: Record<"approved" | "pending", string> = {
  approved: "bg-sage/20 text-sage border-sage/30",
  pending: "bg-silver/20 text-silver border-silver/30",
};

interface StatusChipProps {
  status: GuestStatus;
  className?: string;
}

/** Chip para estado de invitado (guest).
 *  Acepta también strings crudos del API y cae a `pending` si no coincide. */
export function StatusChip({ status, className }: StatusChipProps) {
  const safe = (["confirmed", "declined", "pending"].includes(status)
    ? status
    : "pending") as GuestStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs uppercase tracking-wider border",
        STATUS_TONE[safe],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {STATUS_LABEL[safe]}
    </span>
  );
}

interface SongStatusChipProps {
  isApproved: boolean;
  className?: string;
}

/** Chip para estado de canción (aprobada / pendiente). */
export function SongStatusChip({ isApproved, className }: SongStatusChipProps) {
  const key: "approved" | "pending" = isApproved ? "approved" : "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs uppercase tracking-wider border",
        SONG_TONE[key],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {SONG_LABEL[key]}
    </span>
  );
}
