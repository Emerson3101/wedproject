import type { Guest, Companion, Song } from "@/lib/supabase";

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
}

export const DEFAULT_STATS: Stats = {
  total: 0,
  confirmed: 0,
  declined: 0,
  pending: 0,
  totalCompanions: 0,
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
