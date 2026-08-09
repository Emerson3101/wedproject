import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Great_Vibes } from "next/font/google";
import "./globals.css";

/* ============================================
   FUENTES
   ============================================ */
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
  preload: true,
});

/* ============================================
   METADATA — SEO completo
   ============================================ */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://wedding.example.com"
  ),
  title: {
    default: "Alma & Chava — Nuestra Boda",
    template: "%s | Alma & Chava",
  },
  description:
    "¡Estás invitado a celebrar nuestro gran día! Descubre todos los detalles de la boda de Alma y Chava el 12 de Septiembre, 2026.",
  keywords: [
    "boda",
    "invitación",
    "matrimonio",
    "wedding",
    "Alma",
    "Chava",
    "RSVP",
  ],
  authors: [{ name: "Alma & Chava" }],
  creator: "Alma & Chava",
  publisher: "Alma & Chava",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Alma & Chava — Boda",
    title: "Alma & Chava — Nuestra Boda",
    description:
      "Únete a nosotros para celebrar nuestro amor. 12 de Septiembre, 2026.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alma & Chava — Nuestra Boda",
    description:
      "Únete a nosotros para celebrar nuestro amor. 12 de Septiembre, 2026.",
  },
  // Note: /favicon.ico is served by the `src/app/favicon.ico` file convention,
  // which also auto-emits the `<link rel="icon">` tag — no metadata.icons block
  // needed here. (apple-icon.png was referenced previously but never existed in
  // public/ or as an app/apple-icon.* file convention → 404 on iOS; removed.)
  other: {
    // Schema.org structured data
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Boda de Alma y Chava — 25° Aniversario",
      eventType: "Wedding",
      startDate: "2026-09-12T18:00:00-05:00",
      endDate: "2026-09-13T01:00:00-05:00",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Parroquia San Cristóbal",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Durango s/n, Col. Progreso",
          addressLocality: "Acapulco de Juárez, Guerrero",
          postalCode: "39350",
          addressCountry: "MX",
        },
      },
      organizer: {
        "@type": "Person",
        name: "Alma & Chava",
      },
    }),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F8" },
    { media: "(prefers-color-scheme: dark)", color: "#F6F5F8" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/* ============================================
   LAYOUT RAÍZ
   ============================================ */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorantGaramond.variable} ${jost.variable} ${greatVibes.variable} antialiased`}
      suppressHydrationWarning
    >
      {/* bg-ivory: fallback plano si JS no corre. El gradiente vivo lo
          aporta la capa fija `bg-romantic` de page.tsx; login/admin y
          el PageSkeleton tienen su propio fondo `bg-romantic`. */}
      <body className="min-h-screen flex flex-col bg-ivory overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
