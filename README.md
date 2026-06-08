# 💕 Emerson & Plancarte — Sitio Web de Boda

Sitio web elegante de bodas con diseño **glassmorphism**, animaciones fluidas y sistema completo de RSVP.

## 🚀 Tecnologías

| Área | Tecnología |
|------|-----------|
| Framework | **Next.js 16** con App Router + TypeScript |
| Estilos | **Tailwind CSS v4** + CSS Variables |
| Animaciones | **Framer Motion** + **GSAP** ScrollTrigger |
| Base de datos | **Supabase** (PostgreSQL + RLS + Realtime) |
| Emails | **Resend** |
| Música | **YouTube Data API v3** |
| Mapas | **Google Maps Embed API** |
| Deploy | **Vercel** |

## 📋 Secciones

1. **Hero** — Portada full-screen con bokeh animado y pétalos flotantes (Canvas)
2. **Countdown** — Contador regresivo con glass cards
3. **Detalles** — 4 glass cards con información del evento
4. **Nuestra Historia** — Timeline vertical con GSAP ScrollTrigger
5. **Código de Vestimenta** — Paleta de colores y recomendaciones
6. **Ubicación** — Google Maps con estilos personalizados
7. **RSVP** — Formulario con acompañantes dinámicos
8. **Playlist** — Búsqueda YouTube + reproductor embebido + sistema de votos

## 🎨 Sistema de Diseño

### Paleta Cromática
- **Ivory** `#FFFFF0` — Fondo principal
- **Champagne** `#F7E7CE` — Bordes
- **Blush** `#F4C2C2` — Acentos rosa
- **Rose** `#E8A0BF` — Botones
- **Burgundy** `#722F37` — Acento primario
- **Gold** `#C5A55A` — Ornamentos
- **Sage** `#9CAF88` — Naturaleza

### Glassmorphism
```css
backdrop-filter: blur(20px) saturate(180%);
background: rgba(255, 255, 255, 0.18);
border: 1px solid rgba(255, 255, 255, 0.35);
border-radius: 24px;
```

## 🏗️ Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── rsvp/route.ts       # API de confirmación
│   │   ├── songs/route.ts      # API de canciones
│   │   └── youtube/search/     # Búsqueda YouTube
│   ├── admin/page.tsx          # Panel admin
│   ├── globals.css             # Sistema de diseño
│   ├── layout.tsx              # Layout raíz + fuentes
│   └── page.tsx                # Página principal
├── components/
│   ├── sections/               # 8 secciones del sitio
│   ├── shared/                 # Componentes compartidos
│   └── ui/                     # UI primitives
├── data/
│   └── wedding.ts              # Datos de la boda
├── hooks/
│   └── useCountdown.ts         # Hook de countdown
└── lib/
    ├── config.ts               # Configuración
    ├── supabase.ts             # Cliente Supabase
    └── utils.ts                # Utilidades
```

## ⚡ Inicio Rápido

```bash
# 1. Clonar e instalar
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Configurar Supabase
# Ejecutar supabase/schema.sql en Supabase SQL Editor

# 4. Correr en desarrollo
npm run dev

# 5. Build para producción
npm run build
```

## 🔧 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (server-side) |
| `RESEND_API_KEY` | API key de Resend para emails |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API key de Google Maps |
| `YOUTUBE_API_KEY` | API key de YouTube Data API v3 |

## 📊 Base de Datos

Ver `supabase/schema.sql` para el esquema completo con:
- **guests** — Invitados y confirmaciones
- **companions** — Acompañantes
- **songs** — Playlist musical
- **admin_settings** — Configuración del sitio
- **RLS policies** — Seguridad a nivel de fila

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm i -g vercel
vercel
```

### Variables en Vercel
Configurar las variables de entorno en el dashboard de Vercel o usar `vercel.json`.

## 📱 Responsive

El sitio es completamente responsive y ha sido diseñado con un enfoque mobile-first.

---

> Hecho con ❤️ para Emerson & Plancarte
