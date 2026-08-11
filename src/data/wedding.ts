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
    year: "01",
    title: "Nuestra Historia",
    description: "Aquí inicia nuestra historia de lindos novios.",
    icon: "heart",
    image: "/images/couple/couple-03.jpg" as string | undefined,
  },
  {
    year: "02",
    title: "La Decisión",
    description: "Tomamos la decisión más importante de nuestras vidas hace 25 años.",
    icon: "ring",
    image: "/images/couple/couple-04.jpg" as string | undefined,
  },
  {
    year: "03",
    title: "La Bendición",
    description: "Con la bendición de Dios.",
    icon: "church",
    image: "/images/couple/couple-05.jpg" as string | undefined,
  },
  {
    year: "04",
    title: "Nuestra Familia",
    description: "Construimos una hermosa familia.",
    icon: "home",
    image: "/images/couple/couple-02.jpg" as string | undefined,
  },
  {
    year: "05",
    title: "Nuestra Vida",
    description: "Una hermosa vida.",
    icon: "heart",
    image: "/images/couple/couple-01.jpg" as string | undefined,
  },
  {
    year: "06",
    title: "Nuestro Futuro",
    description: "Y seguimos construyendo un futuro con amor y dedicación.",
    icon: "sparkles",
    image: "/images/couple/couple-08.jpg" as string | undefined,
  },
] as const;

export const dressCode = {
  title: "Código de Vestimenta",
  subtitle: "Formal Elegante",
  description:
    "Queremos verte bien y que te sientas cómodo/a. Lo de abajo es una guía, no una regla; lo que más nos importa es que vengas a celebrar con nosotros.",
  palette: [
    { name: "Plata", color: "#8A8F98" },
    { name: "Blanco", color: "#FFFFFF" },
    { name: "Negro", color: "#0E0E0F" },
  ],
  women: {
    title: "Para las Damas",
    suggestions: [
      "Vestido o conjunto elegante.",
      "De ser posible, alguna prenda con acentos o colores metálicos o plateados.",
      "Calzado formal de preferencia.",
    ],
    notSuggested: [
      "Ropa deportiva o playeras",
    ],
  },
  men: {
    title: "Para los Caballeros",
    suggestions: [
      "Camisa de vestir con pantalón formal (saco y corbata opcionales)",
      "De ser posible, alguna prenda con acentos o colores metálicos o plateados.",
      "Calzado formal de preferencia.",
    ],
    notSuggested: [
      "Ropa deportiva, playeras estampadas o shorts",
    ],
  },
} as const;

export const padrinos = [
  {
    role: "Velación",
    honor: "Padrinos de Velación",
    person1: "Paty Plancarte",
    person2: "Jorge Garabito",
  },
  {
    role: "Lazo",
    honor: "Padrinos de Lazo",
    person1: "Orlando Juarez",
    person2: "Martha Elena Navarrete",
  },
  {
    role: "Anillos",
    honor: "Padrinos de Anillos",
    person1: "Bety Plancarte",
    person2: "Cecy Pérez",
  },
  {
    role: "Arras",
    honor: "Padrinos de Arras",
    person1: "Juan Carlos Cerón",
    person2: "Zenny Jaimes",
  },
] as const;

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
