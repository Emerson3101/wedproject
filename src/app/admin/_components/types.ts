import type { Guest, Companion, Song, SeatingTable, SeatingSeat } from "@/lib/supabase";

/* ============================================
   TIPOS ADMIN — shapes específicos del panel
   --------------------------------------------
   Los tipos base (`Guest`, `Companion`, `Song`) viven en `src/lib/supabase.ts`
   como fuente única. Estos son los shapes proyectados/compuestos que las rutas
   admin devuelven y que consumes los componentes del panel.
   ============================================ */

/** Invitado con sus acompañantes — shape de `GET /api/admin/guests`. */
export interface GuestWithCompanions {
  guest: Guest;
  companions: Companion[];
}

/** Estadísticas derivadas del listado de invitados (viene con la respuesta de guests). */
export interface Stats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  totalCompanions: number;
  /** Acompañantes que pertenecen a invitados confirmados (desglose). */
  confirmedCompanions: number;
  /** Headcount real que asistirá: confirmados + sus acompañantes. Métrica hero (WS12). */
  totalConfirmed: number;
}

export const DEFAULT_STATS: Stats = {
  total: 0,
  confirmed: 0,
  declined: 0,
  pending: 0,
  totalCompanions: 0,
  confirmedCompanions: 0,
  totalConfirmed: 0,
};

/** Mensaje proyectado — shape de `GET /api/admin/messages`. */
export interface GuestMessage {
  id: string;
  guestName: string;
  guestEmail: string;
  message: string;
  status: string;
  createdAt: string;
}

/* Respuestas tipadas de cada endpoint (solo los campos de éxito que consumimos). */
export type GuestsResponse = { guests: GuestWithCompanions[]; stats: Stats };
export type SongsResponse = { songs: Song[] };
export type MessagesResponse = { messages: GuestMessage[] };

/* ============================================
   MESAS — shapes proyectados del plano de sentado
   --------------------------------------------
   `GET /api/admin/seating` devuelve `tables` (cada una con sus
   `seats` ya resueltos con info del invitado en vivo) y `pool`
   (invitados confirmados con `lead_seated` y el drift flag).
   ============================================ */

/** Asiento resuelto (se une al lead en vivo para mostrar el side y detectar drift). */
export interface SeatOccupant extends SeatingSeat {
  /** Datos del lead en vivo (solo cuando `source==='rsvp'` y el invitado existe). */
  guest_email?: string | null;
  guest_side?: "bride" | "groom" | null;
  /** Conteo vivo actual de companions del lead (para detectar drift). */
  live_companion_count?: number;
  /** true si el snapshot de companions se quedó chico/grande respecto al vivo. */
  drift_suggested?: boolean;
}

/** Mesa con sus asientos poblados. */
export interface SeatingTableWithSeats extends SeatingTable {
  seats: SeatOccupant[];
}

/** Invitado confirmado junto con su companion list vivo, listo para sentar. */
export interface ConfirmedParty {
  guest: Guest;
  companions: Companion[];
  /** ¿El lead ya tiene una silla en alguna mesa? */
  lead_seated: boolean;
  /** ¿Existe ya alguna ocupación snapshot para este guest_id? */
  seated_snapshot_count: number;
}

export interface SeatingStats {
  tables: number;
  total_seats: number;
  occupied: number;
  unseated_confirmed: number;
}

export const DEFAULT_SEATING_STATS: SeatingStats = {
  tables: 0,
  total_seats: 0,
  occupied: 0,
  unseated_confirmed: 0,
};

export interface SeatingResponse {
  tables: SeatingTableWithSeats[];
  pool: ConfirmedParty[];
  stats: SeatingStats;
}

/** Contexto de move-mode: la silla que se está reubicando. */
export interface MoveContext {
  seatId: string;
  label: string;
  /** Origen (para highlight + evitar ofrecerse como target). */
  originTableId: string;
  originSeatIndex: number;
}

export const DEFAULT_SEATING: SeatingResponse = {
  tables: [],
  pool: [],
  stats: DEFAULT_SEATING_STATS,
};
