/* ============================================
   CONFIGURACIÓN DE LA APLICACIÓN
   ============================================ */

export const siteConfig = {
  name: "Alma & Chava",
  tagline: "Boda de plata",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
} as const;

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || "",
  fromEmail: process.env.SEND_FROM_EMAIL || "boda@wedding.com",
} as const;

export const googleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
} as const;

export const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID || "",
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
} as const;

export const invitationCode =
  process.env.INVITATION_CODE || "boda2025";

/* Check if a feature requiring backend is available */
export const isSupabaseConfigured =
  supabaseConfig.url !== "" && supabaseConfig.anonKey !== "";

export const isSupabaseServerConfigured =
  isSupabaseConfigured && supabaseConfig.serviceRoleKey !== "";

export const isResendConfigured = resendConfig.apiKey !== "";

export const isGoogleMapsConfigured = googleMapsConfig.apiKey !== "";

export const isSpotifyConfigured =
  spotifyConfig.clientId !== "" && spotifyConfig.clientSecret !== "";

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
} as const;

export const googlePhotosConfig = {
  albumUrl:
    process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL ||
    "https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9",
} as const;
