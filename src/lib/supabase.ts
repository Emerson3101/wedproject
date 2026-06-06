import { createClient } from "@supabase/supabase-js";
import { supabaseConfig, isSupabaseConfigured } from "./config";

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
  if (!isSupabaseConfigured) {
    console.warn(
      "Supabase no está configurado. Configura las variables de entorno."
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
  album: string;
  spotify_id: string;
  cover_url: string;
  preview_url?: string | null;
  added_by: string;
  votes: number;
  is_approved: boolean;
  created_at: string;
}
