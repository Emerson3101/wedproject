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

export const gmailConfig = {
  user: process.env.GMAIL_USER || "",
  appPassword: process.env.GMAIL_APP_PASSWORD || "",
} as const;

export const googleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
} as const;

export const youtubeConfig = {
  apiKey: process.env.YOUTUBE_API_KEY || "",
} as const;

/* Check if a feature requiring backend is available */
export const isSupabaseConfigured =
  supabaseConfig.url !== "" && supabaseConfig.anonKey !== "";

export const isSupabaseServerConfigured =
  isSupabaseConfigured && supabaseConfig.serviceRoleKey !== "";

export const isGmailConfigured = gmailConfig.user !== "" && gmailConfig.appPassword !== "";

export const isGoogleMapsConfigured = googleMapsConfig.apiKey !== "";

export const isYouTubeConfigured = youtubeConfig.apiKey !== "";

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
} as const;

// Single source of truth for the fallback Google-Photos album URL.
// Referenced once from `googlePhotosConfig.albumUrl` below — previously this
// literal was duplicated inline in PhotoUploadSection (dead fallback, since
// config guarantees a non-empty albumUrl). Components read
// `googlePhotosConfig.albumUrl` only.
export const DEFAULT_GOOGLE_PHOTOS_ALBUM_URL =
  "https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9";

export const googlePhotosConfig = {
  albumUrl:
    process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL ||
    DEFAULT_GOOGLE_PHOTOS_ALBUM_URL,
} as const;
