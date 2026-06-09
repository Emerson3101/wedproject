# Project Structure — Boda de Alma & Chava

Wedding invitation website built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, and GSAP.

## Tech Stack

| Category       | Technology                                              		          |
| -------------- | ------------------------------------------------------------------------------ |
| Framework      | [Next.js 16](https://nextjs.org) (App Router)           			  |
| UI             | [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) |
| Styling        | [Tailwind CSS 4](https://tailwindcss.com) (CSS, no JS config) 		  |
| Animations     | [Framer Motion 12](https://www.framer.com/motion) + [GSAP 3](https://gsap.com) |
| Database       | [Supabase](https://supabase.com) (PostgreSQL + RPC)     			  |
| Emails         | [Resend](https://resend.com)                            			  |
| File Upload    | [Cloudinary](https://cloudinary.com)                    			  |
| Icons          | [Lucide React](https://lucide.dev)                      			  |
| Fonts          | Google Fonts via `next/font` (Cormorant Garamond, Jost, Great Vibes) 	  |

## Directory Structure

```
wedproject/
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment variables (git-ignored)
├── AGENTS.md                       # AI agent instructions for this project
├── CLAUDE.md                       # Claude Code project instructions (→ AGENTS.md)
├── next.config.ts                  # Next.js config (images, headers, security)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── public/                         # Static assets (favicon, apple-icon)
│
├── src/
│   ├── data/
│   │   └── wedding.ts              # Central wedding data (couple, dates, story, nav)
│   │
│   ├── lib/
│   │   ├── config.ts               # App config (Supabase, Resend, YouTube, Cloudinary, env checks)
│   │   ├── supabase.ts             # Supabase client (browser + server) + DB type definitions
│   │   └── utils.ts                # Shared utilities (cn, formatDate, debounce, sleep)
│   │
│   ├── hooks/
│   │   └── useCountdown.ts         # Custom hook — countdown timer to wedding date
│   │
│   ├── components/
│   │   ├── sections/               # Full-page sections rendered on the homepage
│   │   │   ├── HeroSection.tsx           # Full-screen hero with couple names + date
│   │   │   ├── CountdownSection.tsx      # Flip-card countdown timer (days/hours/min/sec)
│   │   │   ├── DetailsSection.tsx        # Event details cards (ceremony & reception)
│   │   │   ├── StorySection.tsx          # Couple's timeline (GSAP ScrollTrigger)
│   │   │   ├── DressCodeSection.tsx      # Dress code + color palette
│   │   │   ├── LocationSection.tsx       # Venue cards + embedded Google Map
│   │   │   ├── PhotoUploadSection.tsx    # Guest photo upload (Cloudinary + Google Photos)
│   │   │   ├── RSVPSection.tsx           # RSVP form with companion management
│   │   │   └── PlaylistSection.tsx       # Musical playlist (YouTube search + embed player + voting)
│   │   │
│   │   ├── shared/                 # Reusable layout/shell components
│   │   │   ├── Navigation.tsx          # Fixed top nav with mobile hamburger menu
│   │   │   ├── Footer.tsx              # Footer with couple names, quote, hashtag
│   │   │   ├── SectionTitle.tsx        # Section heading with ornament decoration
│   │   │   ├── PageAnimations.tsx      # Global GSAP animations (parallax only, no opacity hiding)
│   │   │   ├── FloatingPetals.tsx      # Animated falling petal background particles
│   │   │   ├── BokehBackground.tsx     # Bokeh light background effect
│   │   │   ├── GoogleMapEmbed.tsx      # Google Maps embed wrapper
│   │   │   ├── Skeleton.tsx            # Reusable shimmer skeleton placeholder + SkeletonText, SkeletonCard
│   │   │   └── PageSkeleton.tsx        # Full-page skeleton mirror (shown during initial JS load)
│   │   │
│   │   └── ui/                     # Base UI primitives
│   │       └── GlassCard.tsx             # Glassmorphism card (default/strong/subtle)
│   │
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout: fonts, metadata, SEO, schema.org
│   │   ├── page.tsx                # Homepage — renders all sections in order
│   │   ├── globals.css             # Global styles: Tailwind theme, CSS vars, animations
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx                # Admin panel: guest stats, RSVP table, song moderation
│   │   │
│   │   ├── test/
│   │   │   └── page.tsx                # Test/debug page (development utility)
│   │   │
│   │   └── api/                    # Route handlers (serverless API endpoints)
│   │       ├── rsvp/
│   │       │   └── route.ts            # POST/GET — save & query RSVP responses
│   │       ├── songs/
│   │       │   └── route.ts            # POST/PATCH — add songs & vote
│   │       ├── youtube/search/
│   │       │   └── route.ts            # GET — proxy YouTube search API
│   │       └── test/guest/
│   │           └── route.ts            # GET — test endpoint for guest data
│   │
│   └── hooks/                    # Custom React hooks
│
└── Tasks.md                      # Feature backlog / task list
```

## Data Flow

### Wedding Data (`src/data/wedding.ts`)
Single source of truth for all wedding-related content. Exported constants:
- **`couple`** — Names and display name for the couple
- **`weddingDate`** — The wedding date (used by countdown, hero, metadata)
- **`weddingDetails`** — Ceremony and reception info (time, location, coordinates)
- **`ourStory`** — Timeline events for the couple's story
- **`dressCode`** — Dress code rules, color palette, suggestions
- **`navigation`** — Nav links (auto-populates the header)

### Configuration (`src/lib/config.ts`)
Environment-driven feature toggles:
- **Supabase** — Database connectivity check
- **Resend** — Email delivery check
- **YouTube** — Music API check
- **Cloudinary** — Photo upload check
- **Google Photos** — Shared album link

### Supabase (`src/lib/supabase.ts`)
- Browser client (for client components)
- Server client (for API routes, uses service role key)
- TypeScript interfaces: `Guest`, `Companion`, `Song`

## Sections (Home Page Order)

| #  | Section            | ID            | Key Features                                    |
| -- | ------------------ | ------------- | ------------------------------------------------ |
| 1  | HeroSection        | `#hero`       | Full-screen, animated names, date, scroll hint    |
| 2  | CountdownSection   | `#countdown`  | Live countdown (days/hours/min/sec)               |
| 3  | DetailsSection     | `#details`    | 4 info cards: ceremony date, time, reception      |
| 4  | StorySection       | `#story`      | Timeline with GSAP ScrollTrigger animations       |
| 5  | DressCodeSection   | `#dresscode`  | Color palette, suggestions for men/women          |
| 6  | LocationSection    | `#location`   | Venue cards, Google Maps links, embedded map      |
| 7  | PhotoUploadSection | `#photos`     | Cloudinary upload widget + Google Photos album    |
| 8  | RSVPSection        | `#rsvp`       | Full RSVP form, companions, dietary, messaging    |
| 9  | PlaylistSection    | `#playlist`   | YouTube search, embedded player, manual add, vote on songs, skeleton loading |

## API Endpoints

| Method | Route                    | Description                                |
| ------ | ------------------------ | ------------------------------------------ |
| POST   | `/api/rsvp`              | Submit RSVP response                       |
| GET    | `/api/rsvp?email=...`    | Check guest RSVP status                    |
| POST   | `/api/songs`             | Add a song request                         |
| PATCH  | `/api/songs`             | Vote on a song                             |
| GET    | `/api/youtube/search?q=` | Search YouTube for videos                  |
| DELETE | `/api/songs?songId=`     | Delete a song (admin)                      |
| PATCH  | `/api/admin/songs`       | Approve/reject a song (admin)              |

## Design System

### Color Palette (defined in `globals.css`)
| Token          | Hex        | Usage                    |
| -------------- | ---------- | ------------------------ |
| `--ivory`      | `#FFFFF0`  | Background               |
| `--champagne`  | `#F7E7CE`  | Accents, borders         |
| `--blush`      | `#F4C2C2`  | Gradient stops           |
| `--rose`       | `#E8A0BF`  | Error states             |
| `--burgundy`   | `#722F37`  | Primary text, buttons    |
| `--gold`       | `#C5A55A`  | Ornaments, highlights    |
| `--sage`       | `#9CAF88`  | Success states           |

### Typography
| Role       | Font               | Classes           |
| ---------- | ------------------ | ----------------- |
| Display    | Cormorant Garamond | `.text-display`   |
| Body       | Jost               | `.text-body`      |
| Script     | Great Vibes        | `.text-script`    |

### Glassmorphism
Three variants via CSS classes: `.glass`, `.glass-strong`, `.glass-subtle` — also exposed through the `GlassCard` component.

### Animations
- **Framer Motion** — Section reveals, card hover effects, button micro-interactions
- **GSAP + ScrollTrigger** — Parallax on hero, timeline animations (no longer sets `opacity: 0` on sections)
- **CSS keyframes** — `gradientShift` (background), `float` (decorative), `petalFall` (petals), `shimmer` (gold accents), `skeletonShimmer` (loading placeholders)

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable                                   | Required | Used By           |
| ------------------------------------------ | -------- | ----------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | Yes      | RSVP, Playlist    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Yes      | RSVP, Playlist    |
| `SUPABASE_SERVICE_ROLE_KEY`                | Yes      | Server API routes |
| `RESEND_API_KEY`                           | No       | Confirmation email|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`        | No       | Photo uploads     |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`     | No       | Photo uploads     |
| `NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL`      | No       | Photo album link  |
| `NEXT_PUBLIC_ADMIN_PASSWORD`               | No       | Admin panel       |

## Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes

- All sections use `"use client"` (client components) for interactivity
- GSAP is dynamically imported (`import("gsap")`) to avoid SSR issues
- **Loading strategy** — `PageSkeleton` mirrors the real layout during initial JS load (100ms), then crossfades via opacity transition. Sections are visible by default (`section { opacity: 1 !important }`) so GSAP never hides already-rendered content. HeroSection renders immediately (no `mounted` guard). PlaylistSection shows skeleton cards while fetching song data.
- The countdown target date is **October 18, 2026** (configured in `src/data/wedding.ts`)
- The site is in Spanish (`lang="es"`) with `es-ES` locale for date formatting
- Admin panel is accessible at `/admin` (password-protected)
- Image remote patterns allow `img.youtube.com` (YouTube), `*.supabase.co`, and `*.res.cloudinary.com`
