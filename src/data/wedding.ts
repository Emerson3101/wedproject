/* ============================================
   DATOS DE LA BODA
   Fuente única de verdad para todo el contenido
   del frontend. Cambia estos valores para actualizar
   el sitio; los componentes los leen directamente.
   ============================================ */

export const couple = {
  name1: "Alma",
  name2: "Chava",
  displayName: "A & C",
} as const;

export const hashtag = "25AnivAlmaYChava" as const;

export const weddingDate = new Date("2026-09-12T18:00:00");

export const weddingDetails = {
  ceremony: {
    name: "Ceremonia",
    time: "6:00 PM",
    date: "12 de Septiembre, 2026",
    location: "Parroquia San Cristóbal",
    address: "Durango s/n, Col. Progreso, C.P. 39350, Acapulco de Juárez, Gro.",
    coordinates: { lat: 16.8620759, lng: -99.8997943 },
  },
  reception: {
    name: "Recepción",
    time: "8:00 PM",
    date: "12 de Septiembre, 2026",
    location: "Jardín de Fiestas El Patio II",
    address: "Av. Cuauhtémoc S/N, Fracc. Magallanes, La Bocana, C.P. 39379, Acapulco de Juárez, Gro.",
    coordinates: { lat: 16.8658202, lng: -99.8756469 },
  },
} as const;

export const ourStory = [
  {
    year: "2020",
    title: "Nos Conocimos",
    description:
      "Todo comenzó con una conversación casual que cambió nuestras vidas para siempre.",
    icon: "heart",
    image: undefined as string | undefined,
  },
  {
    year: "2021",
    title: "Primera Cita",
    description:
      "Una cena bajo las estrellas que nos confirmó que algo especial estaba naciendo.",
    icon: "sparkles",
    image: undefined as string | undefined,
  },
  {
    year: "2022",
    title: "Nos Mudamos Juntos",
    description:
      "Decidimos dar el siguiente paso y construir un hogar lleno de amor y risas.",
    icon: "home",
    image: undefined as string | undefined,
  },
  {
    year: "2024",
    title: "La Propuesta",
    description:
      "Con los nervios y el corazón lleno, la pregunta más importante fue hecha.",
    icon: "ring",
    image: undefined as string | undefined,
  },
  {
    year: "2026",
    title: "¡Boda de plata!",
    description:
      "El día más esperado llega. ¡Únete a nosotros para celebrar este gran momento!",
    icon: "church",
    image: undefined as string | undefined,
  },
] as const;

export const dressCode = {
  title: "Código de Vestimenta",
  subtitle: "Formal Elegante",
  description:
    "Queremos verte bien y que te sientas cómodo/a. Lo de abajo es una guía, no una regla — lo que más nos importa es que vengas a celebrar con nosotros.",
  palette: [
    { name: "Plata", color: "#8A8F98" },
    { name: "Platino", color: "#EAE8EE" },
    { name: "Blanco", color: "#FFFFFF" },
    { name: "Negro", color: "#000000" },
    { name: "Gris", color: "#5C6168" },
  ],
  women: {
    title: "Para las Damas",
    suggestions: [
      "Vestido o conjunto elegante — la opción que te haga sentir bonita",
      "Si quieres, un toque de brillo o plata para acompañar la ocasión",
      "Zapatos cómo te sientas mejor (sandalias, tacones o flats, todo vale)",
    ],
    notSuggested: [
      "Ropa deportiva o playeras",
    ],
  },
  men: {
    title: "Para los Caballeros",
    suggestions: [
      "Camisa de vestir con pantalón formal (saco y corbata opcionales)",
      "Si te animas, un acento plateado sutil: corbata, pañuelo o gemelos",
      "Zapatos de piel, loafers o — si es casual — unos buenos tenis blancos",
    ],
    notSuggested: [
      "Ropa deportiva, playeras estampadas o shorts",
    ],
  },
} as const;

export const navigation = [
  { label: "Inicio", href: "#hero" },
  { label: "Detalles", href: "#details" },
  { label: "Historia", href: "#story" },
  { label: "Galería", href: "#gallery" },
  { label: "Vestimenta", href: "#dresscode" },
  { label: "Ubicación", href: "#location" },
  { label: "Fotos", href: "#photos" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Playlist", href: "#playlist" },
] as const;
