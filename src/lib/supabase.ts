import { createClient } from "@supabase/supabase-js";
import {
  supabaseConfig,
  isSupabaseConfigured,
  isSupabaseServerConfigured,
} from "./config";

/* ============================================
   CLIENTE SUPABASE — Browser (Client Components)
   ============================================ */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : undefined;

/* ============================================
   CLIENTE SUPABASE — Server (Server Components/API Routes)
   ============================================ */
export function createSupabaseServerClient() {
  if (!isSupabaseServerConfigured) {
    console.warn(
      "Supabase server no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY."
    );
    return undefined;
  }
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

/* ============================================
   TIPOS DE BASE DE DATOS
   ============================================ */
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  invitation_code: string;
  status: "pending" | "confirmed" | "declined";
  num_companions: number;
  dietary_restrictions?: string | null;
  message?: string | null;
  side: "bride" | "groom" | null;
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Companion {
  id: string;
  guest_id: string;
  name: string;
  dietary_restrictions?: string | null;
  created_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  added_by: string;
  votes: number;
  is_approved: boolean;
  created_at: string;
}

/* --- Mesas (plano de sentado del admin) ---
   Ver migration_update.sql §10. `guest_id` solo se enlaza al
   *lead* (unconfirmed/RSVP confirmado), con FK ON DELETE SET NULL.
   Los asientos de acompañantes son SNAPSHOT de strings
   (`seat_label`, guest_id NULL); `submit_rsvp` borra y re-inserta
   companions, por eso no hay FK a companions(id). Ver COMPENDIUM §10 #22. */
export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  display_order: number;
  shape: "round" | "rect";
  created_at: string;
}

export interface SeatingSeat {
  id: string;
  table_id: string;
  /* Solo el lead confirmado. NULL = acompañante snapshot o invitado adhoc. */
  guest_id: string | null;
  /* Agrupa lead + companions snapshot del mismo asiento. Para adhoc = nanoid(). */
  party_key: string;
  /* Nombre snapshot del ocupante (se captura al sentar, no se resincroniza). */
  seat_label: string;
  is_lead: boolean;
  /* Posición de la silla alrededor de la mesa (0..N-1). */
  seat_index: number;
  /* 'rsvp' = lead confirmado; 'companion' = snapshot de acompañante; 'adhoc' = invitado fuera del RSVP. */
  source: "rsvp" | "companion" | "adhoc";
  created_at: string;
}
