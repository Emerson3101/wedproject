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
    default: "Emerson & Plancarte — Nuestra Boda",
    template: "%s | Emerson & Plancarte",
  },
  description:
    "¡Estás invitado a celebrar nuestro gran día! Descubre todos los detalles de la boda de Emerson y Plancarte el 18 de Octubre, 2026.",
  keywords: [
    "boda",
    "invitación",
    "matrimonio",
    "wedding",
    "Emerson",
    "Plancarte",
    "RSVP",
  ],
  authors: [{ name: "Emerson & Plancarte" }],
  creator: "Emerson & Plancarte",
  publisher: "Emerson & Plancarte",
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
    siteName: "Emerson & Plancarte — Boda",
    title: "Emerson & Plancarte — Nuestra Boda",
    description:
      "Únete a nosotros para celebrar nuestro amor. 18 de Octubre, 2026.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emerson & Plancarte — Nuestra Boda",
    description:
      "Únete a nosotros para celebrar nuestro amor. 18 de Octubre, 2026.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  other: {
    // Schema.org structured data
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Boda de Emerson y Plancarte",
      eventType: "Wedding",
      startDate: "2026-10-18T16:00:00-06:00",
      endDate: "2026-10-18T23:59:00-06:00",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Iglesia Santa María & Salón Jardines del Parque",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Av. Principal #123",
          addressLocality: "Ciudad de México",
          addressCountry: "MX",
        },
      },
      organizer: {
        "@type": "Person",
        name: "Emerson & Plancarte",
      },
    }),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFF0" },
    { media: "(prefers-color-scheme: dark)", color: "#FFFFF0" },
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
      <body className="min-h-screen flex flex-col bg-romantic overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
