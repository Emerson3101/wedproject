import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [],
  // Opt-out específicos del bundling de Server Components / Turbopack.
  // sharp usa binarios nativos (.node) que Turbopack no puede empaquetar
  // sin causar ERR_DLOPEN_FAILED (visto en dev mode Windows). Al
  // externalizarlo, Node hace el require() nativo en runtime desde
  // `node_modules/sharp` (top-level) y resuelve la versión correcta del
  // binario `sharp-win32-x64-0.35.3.node`. Es el arreglo recomendado en
  // https://sharp.pixelplumbing.com/install#nextjs y en los docs de
  // Next 16 (serverExternalPackages.md).
  serverExternalPackages: ["sharp"],
  // Turbopack: pinta el root del workspace al directorio del
  // proyecto. Sin esto, Turbopack detecta el `package-lock.json`
  // del HOME del usuario y resuelve módulos desde ahí — lo que
  // hace que las ediciones a archivos del proyecto NO se vean
  // reflejadas en el dev server (porque Turbopack está caching
  // desde el root equivocado).
  turbopack: {
    root: __dirname,
  },
  // Optimización de imágenes
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com", // YouTube thumbnails
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Supabase storage
      },
      {
        protocol: "https",
        hostname: "*.res.cloudinary.com", // Cloudinary uploaded photos
      },
    ],
  },

  // Headers de seguridad y performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Rewrites
  async rewrites() {
    return [];
  },
};

export default nextConfig;
