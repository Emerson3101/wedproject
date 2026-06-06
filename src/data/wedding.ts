/* ============================================
   DATOS DE LA BODA
   Cambia estos valores según la boda real.
   ============================================ */

export const couple = {
  name1: "Emerson",
  name2: "Plancarte",
  displayName: "E & P",
} as const;

export const weddingDate = new Date("2025-10-18T16:00:00");

export const weddingDetails = {
  ceremony: {
    name: "Ceremonia",
    time: "4:00 PM",
    date: "18 de Octubre, 2025",
    location: "Iglesia Santa María",
    address: "Av. Principal #123, Ciudad de México",
    coordinates: { lat: 19.4326, lng: -99.1332 },
  },
  reception: {
    name: "Recepción",
    time: "7:00 PM",
    date: "18 de Octubre, 2025",
    location: "Salón Jardines del Parque",
    address: "Calle de los Jardines #456, Ciudad de México",
    coordinates: { lat: 19.4326, lng: -99.1332 },
  },
} as const;

export const ourStory = [
  {
    year: "2020",
    title: "Nos Conocimos",
    description:
      "Todo comenzó con una conversación casual que cambió nuestras vidas para siempre.",
    icon: "heart",
  },
  {
    year: "2021",
    title: "Primera Cita",
    description:
      "Una cena bajo las estrellas que nos confirmó que algo especial estaba naciendo.",
    icon: "sparkles",
  },
  {
    year: "2022",
    title: "Nos Mudamos Juntos",
    description:
      "Decidimos dar el siguiente paso y construir un hogar lleno de amor y risas.",
    icon: "home",
  },
  {
    year: "2024",
    title: "La Propuesta",
    description:
      "Con los nervios y el corazón lleno, la pregunta más importante fue hecha.",
    icon: "ring",
  },
  {
    year: "2025",
    title: "¡Nos Casamos!",
    description:
      "El día más esperado llega. ¡Únete a nosotros para celebrar este gran momento!",
    icon: "church",
  },
] as const;

export const dressCode = {
  title: "Código de Vestimenta",
  subtitle: "Cocktail Elegante",
  description:
    "Te pedimos vestir de manera elegante para hacer de esta ocasión un momento inolvidable.",
  palette: [
    { name: "Burgundy", color: "#722F37" },
    { name: "Champagne", color: "#F7E7CE" },
    { name: "Gold", color: "#C5A55A" },
    { name: "Sage", color: "#9CAF88" },
    { name: "Dusty Rose", color: "#DCAE96" },
    { name: "Navy", color: "#2C3E50" },
  ],
  women: {
    title: "Para las Damas",
    suggestions: [
      "Vestido cóctel elegante",
      "Vestido largo formal",
      "Conjunto elegante",
    ],
    notSuggested: ["Vestidos casuales", "Denim", "Sandalias informales"],
  },
  men: {
    title: "Para los Caballeros",
    suggestions: [
      "Traje formal",
      "Vestido oscuro con corbata",
      "Chaqueta con pantalón elegante",
    ],
    notSuggested: ["Jeans", "Camisetas", "Zapatos deportivos"],
  },
} as const;

export const navigation = [
  { label: "Inicio", href: "#hero" },
  { label: "Detalles", href: "#details" },
  { label: "Historia", href: "#story" },
  { label: "Vestimenta", href: "#dresscode" },
  { label: "Ubicación", href: "#location" },
  { label: "RSVP", href: "#rsvp" },
  { label: "Playlist", href: "#playlist" },
] as const;
