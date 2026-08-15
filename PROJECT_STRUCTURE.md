# Project Structure — Boda de Alma & Chava

Wedding invitation website built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, and GSAP. A cookie-gated invitation site with an RSVP system, collaborative YouTube playlist (one like per browser), photo upload, a post-RSVP digital invitation card, and an admin dashboard.

## Tech Stack

| Category       | Technology                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| Framework      | [Next.js 16.2.7](https://nextjs.org) (App Router only; `proxy.ts` replaces middleware) |
| UI             | [React 19.2.4](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) |
| Styling        | [Tailwind CSS 4](https://tailwindcss.com) (CSS `@theme inline` — **no JS config**) |
| Animations     | [Framer Motion 12.40](https://www.framer.com/motion) + [GSAP 3.15](https://gsap.com) (ScrollTrigger, dynamic-imported) |
| Database       | [Supabase](https://supabase.com) (PostgreSQL + RPC functions, RLS permissive) |
| Emails         | [Resend 6.12](https://resend.com)                                           |
| File Upload    | [Cloudinary](https://cloudinary.com) (unsigned preset, client widget)       |
| Video Search   | [YouTube Data API v3](https://developers.google.com/youtube/v3) (server route) |
| Maps           | Google Maps Embed API                                                        |
| QR / Screenshot| [`qrcode.react`](https://github.com/zpao/qrcode.react) (album QR) + [`html2canvas`](https://html2canvas.hertzen.com) (invitation PNG) |
| ID generation  | [`nanoid`](https://github.com/ai/nanoid)                                     |
| Icons          | [Lucide React](https://lucide.dev)                                          |
| Fonts          | Google Fonts via `next/font` (Cormorant Garamond, Jost, Great Vibes)        |
| Utilities      | `clsx`, `tailwind-merge`                                                     |

> **Next.js 16 note:** This is *not* the Next.js you may know from training data. App Router only, no Pages Router; the middleware file is `src/proxy.ts` (the renamed/flavored middleware). Per `AGENTS.md`, consult `node_modules/next/dist/docs/` before writing framework code.

## Directory Structure

```
wedproject/
├── .env.example                    # Environment variable template
├── .env.local                      # Local env vars (git-ignored)
├── AGENTS.md                       # AI agent instructions (→ CLAUDE.md re-exports)
├── CLAUDE.md                       # Claude Code project instructions (@AGENTS.md)
├── Plan de implementación.md       # FROZEN historical founding plan (see docs/COMPENDIUM.md)
├── README.md                       # Project README
├── PROJECT_STRUCTURE.md            # This file
├── Tasks.md                        # Feature backlog / task list
├── docs/
│   ├── COMPENDIUM.md               # Deep project bible / change-planning playbook
│   └── CLEANUP_LOG.md              # Bitácora de la limpieza de deuda técnica (WS1–WS11)
├── next.config.ts                  # Next.js config (images, headers, allowedDevOrigins)
├── eslint.config.mjs               # ESLint 9 config (eslint-config-next)
├── postcss.config.mjs              # PostCSS (Tailwind v4 plugin)
├── tsconfig.json                   # TS config (@/* → ./src/*, strict)
├── vercel.json                     # Vercel: framework nextjs, region iad1, nosniff header
├── package.json
├── package-lock.json
├── public/                         # Static assets (default Next.js SVGs only)
│
├── supabase/
│   ├── schema.sql                  # Base schema (idempotent post-WS8: renames guarded by DO/IF EXISTS)
│   ├── migration_update.sql        # Idempotent supplement: song_likes + like/unlike RPCs + admin_settings
│   └── migration_clean_admin_settings.sql  # Idempotent: scrub drifted admin_settings seed (WS8)
│
└── src/
    ├── proxy.ts                    # Next.js 16 edge gate (auth + route protection)
    │
    ├── data/
    │   ├── wedding.ts              # Content source-of-truth (couple, date, story, nav, hashtag)
    │   └── couplePhotos.ts         # Photo manifest (hero + 5 story milestones; null defaults)
    │
    ├── hooks/
    │   ├── useCountdown.ts             # Countdown timer hook (1s interval)
    │   ├── useAdminFetch.ts            # Generic {data,loading,error,retry} fetch hook (WS6, admin pages)
    │   ├── useTableSort.ts             # Generic column-sort hook (WS12, admin tables)
    │   └── usePrefersReducedMotion.ts  # SSR-safe prefers-reduced-motion boolean (GSAP spots)
    │
    ├── lib/
    │   ├── auth.ts                 # Shared route-auth helpers: requireGuestOrAdmin / requireAdmin (WS5)
    │   ├── config.ts               # Env config + feature flags (Supabase/Resend/YouTube/Maps)
    │   ├── supabase.ts             # Browser + service-role clients, TS interfaces
    │   └── utils.ts                # cn, es-MX date helpers, sanitizeInput, isValidEmail, debounce
    │
    ├── components/
    │   ├── sections/               # Full-page sections + post-RSVP card
    │   │   ├── HeroSection.tsx           # Full-screen hero, animated names + date
    │   │   ├── CountdownSection.tsx      # Flip-card countdown (days/hours/min/sec)
    │   │   ├── DetailsSection.tsx       # Ceremony & reception info cards + Padrinos de Velación card (5th card)
    │   │   ├── StorySection.tsx         # Couple timeline (GSAP ScrollTrigger) — line grows to last node + glowing tip
    │   │   ├── PhotoGallerySection.tsx  # Masonry gallery + lightbox (couplePhotos.gallery)
    │   │   ├── DressCodeSection.tsx     # Dress code + color palette + 8-photo masonry of reference examples (dressCodePhotos)
    │   │   ├── LocationSection.tsx     # Venue cards + Google Maps embed
    │   │   ├── PhotoUploadSection.tsx   # Cloudinary upload + album <QRCodeSVG/>
    │   │   ├── RSVPSection.tsx          # RSVP form → renders InvitationCard on success
    │   │   ├── GiftSection.tsx          # Sobre-regalo message (between RSVP and Playlist, no nav link)
    │   │   ├── PlaylistSection.tsx      # YouTube search + embed + one-vote-per-browser likes; song list capped max-h-[32rem]
    │   │   └── InvitationCard.tsx       # Post-RSVP 600×820 card → html2canvas PNG download
    │   │
    │   ├── shared/                 # Reusable layout/shell components
    │   │   ├── Navigation.tsx          # Fixed top nav + mobile drawer
    │   │   ├── ScrollProgress.tsx      # Framer useScroll silver scroll-progress bar (top)
    │   │   ├── Footer.tsx              # Names, hashtag
    │   │   ├── SectionTitle.tsx        # Heading + ornament with draw-in (Framer whileInView, reduced-motion safe)
    │   │   ├── PageAnimations.tsx      # GSAP multi-depth hero parallax + reduced-motion gate (no opacity hiding)
    │   │   ├── Reveal.tsx              # Reusable Framer whileInView reveal wrapper (opacity + y/x), reduced-motion safe
    │   │   ├── FloatingPetals.tsx      # Falling petal particles (canvas)
    │   │   ├── BokehBackground.tsx     # Bokeh light background
    │   │   ├── GoogleMapEmbed.tsx      # Maps embed wrapper
    │   │   ├── Skeleton.tsx            # Shimmer placeholder + SkeletonText, SkeletonCard
    │   │   └── PageSkeleton.tsx        # Full-page skeleton mirror (initial load)
    │   │
    │   └── ui/
    │       └── GlassCard.tsx           # Glassmorphism card (default/strong/subtle) — motion.div, refined Framer hover lift, interactive opt-out
    │
    └── app/                        # Next.js App Router
        ├── layout.tsx              # Root layout: fonts, metadata, SEO, schema.org JSON-LD
        ├── page.tsx                # Homepage — PageSkeleton + shells + all sections + Footer
        ├── global-error.tsx        # Root error boundary (custom UI overriding the builtin global-error)
        ├── globals.css             # Tailwind theme, CSS vars, keyframes, FOUC fix, reduced-motion reset
        ├── favicon.ico             # App-dir file convention: auto-serves /favicon.ico + <link rel="icon">
        │
        ├── admin/
        │   ├── page.tsx            # Auth gate + sticky header (logout/refresh/Ver Sitio) + icon tabs (sliding pill) + 3× useAdminFetch + mutation handlers (WS12)
        │   └── _components/        # Admin UI extracted from the former God component (WS6) + WS12 overhaul
        │       ├── AdminDashboard.tsx     # Total Confirmados hero card + composition bar + StatCard grid
        │       ├── AdminGuestsTable.tsx   # Responsive (desktop table/mobile cards) + search + filter + sort + pagination; StatusChip + CompanionPanel
        │       ├── AdminSongsTable.tsx    # Same responsive UX; lucide actions; AnimatePresence delete modal
        │       ├── AdminMessages.tsx      # Search + pagination + Reveal stagger
        │       ├── StatCard.tsx           # StatCard (default + highlight hero) with optional lucide icon
        │       ├── StatusChip.tsx         # Unified StatusChip + SongStatusChip (replaces duplicated status maps)
        │       ├── AdminToolbar.tsx       # Search + status filter chips + result count (reusable)
        │       ├── SortHeader.tsx         # Accessible <th> with sort button + aria-sort
        │       ├── Pagination.tsx         # Page-size selector + numbered pager + range summary (zero deps)
        │       ├── States.tsx             # EmptyState + TableSkeleton + ErrorState (shared table states)
        │       ├── AdminToast.tsx         # Toast provider + useToast (framer AnimatePresence, zero deps)
        │       └── types.ts               # Shared admin types (GuestWithCompanions, Stats, GuestMessage, responses)
        │
        ├── login/
        │   └── page.tsx            # Guest login (password → /api/auth/login → redirect /)
        │
        ├── test/
        │   └── page.tsx            # Dev-only integration test page (404 in prod)
        │
        └── api/                    # Route handlers (serverless)
            ├── rsvp/
            │   └── route.ts            # POST submit RSVP → submit_rsvp RPC (+ optional Gmail SMTP email w/ Satori invitation PNG); GET status
            ├── songs/
            │   └── route.ts            # GET(?voterId) + POST + PATCH(like/unlike) + DELETE(admin)
            ├── youtube/search/
            │   └── route.ts            # GET — proxy YouTube Data API v3 search
            ├── test/
            │   ├── guest/route.ts      # Dev-only (404 in prod; also proxy-gated)
            │   └── cloudinary/route.ts # Dev-only (404 in prod; also proxy-gated)
            ├── auth/
            │   └── login/route.ts      # POST {password} → sets site_auth cookie
            └── admin/
                ├── check/route.ts      # GET → {ok:true}/{ok:false}
                ├── login/route.ts      # POST {password} → sets admin_auth cookie
                ├── logout/route.ts     # POST → clears admin_auth cookie (WS12; whitelisted in proxy.ts so logout from an expired session still works)
                ├── guests/route.ts     # GET → guests+companions+stats (stats include confirmedCompanions + totalConfirmed as of WS12)
                │   └── [guestId]/
                │       └── companions/
                │           ├── route.ts                # POST — add companion (admin; resyncs num_companions)
                │           └── [companionId]/route.ts  # DELETE — remove companion (admin; resyncs num_companions)
                ├── songs/route.ts      # PATCH {songId,isApproved} → approve/reject (admin)
                └── messages/route.ts    # GET → guest messages from guests.message column
```

\* `layout.tsx` previously referenced `/apple-icon.png` in `metadata.icons`, but that file never existed (404 on iOS apple-touch-icon) — the `icons` block was removed in WS10. `/favicon.ico` is served (and its `<link rel="icon">` emitted) automatically by the `src/app/favicon.ico` file convention, so no `metadata.icons` block is needed. See COMPENDIUM §10 #11.

## Auth & Access Model

The real security boundary is **`src/proxy.ts`** (the Next 16 middleware), not Postgres RLS.

- **Fail-closed:** if `INVITATION_CODE` or `ADMIN_PASSWORD` env vars are unset, **every** request returns `503` (`proxy.ts:15-21`).
- **Whitelist (always allowed):** `/_next/*`, static asset extensions (png/jpg/css/js/woff…), `/api/auth/*`, `/login` (`proxy.ts:31-40`).
- **Tier 1 — guest:** any path requires `site_auth` cookie `=== INVITATION_CODE` or `admin_auth` cookie `=== ADMIN_PASSWORD`; unauthenticated browser → redirect to `/login`, unauthenticated API → `401` (`proxy.ts:42-59`).
- **Tier 2 — admin:** `/api/admin/*` (except `login`/`check`/`logout`) and `DELETE /api/songs` require `admin_auth`; otherwise `401` (`proxy.ts:62-71`).
- **Prod test block:** `/test` and `/api/test/*` return `404` when `NODE_ENV !== development` (`proxy.ts:23-29`).
- **Cookies:** `site_auth` (30 days) and `admin_auth` (24h) — both httpOnly, `secure` in prod, `sameSite=lax`.

RLS is intentionally permissive (`USING(TRUE)`/`WITH CHECK(TRUE)` on most public tables); server routes use the service-role key, which **bypasses RLS**. RLS is a secondary net, the proxy is the wall.

## Schema & Migrations (`supabase/`)

| File | Idempotent? | Defines |
| ---- | ----------- | ------- |
| `schema.sql` | **Yes** (post-WS8) — renames wrapped in `DO $$ … IF EXISTS` blocks | `guests`, `companions`, `songs` (YouTube cols), `updated_at` trigger, `submit_rsvp`, `vote_song` (deprecated), base RLS |
| `migration_update.sql` | **Yes** — wraps renames in `DO $$ … IF EXISTS` blocks | `admin_settings` (real-valued seed), `song_likes` (one per browser), `like_song`/`unlike_song`/`has_liked_song`, indices, refreshed RLS |
| `migration_clean_admin_settings.sql` | **Yes** (WS8) — `DELETE` drift + `INSERT … ON CONFLICT DO UPDATE` truth | Bridge for already-drifted DBs: scrubs `2025`/Emerson/Plancarte rows and re-seeds `2026-09-12T18:00:00`/Alma & Chava/`2026-08-15`/`{"limit": 2}`/`almaychava` |

**Fresh-DB run order:** `schema.sql` → `migration_update.sql` (or, for an already-migrated DB, just `migration_update.sql`). For a DB that already holds drifted `admin_settings` rows, also run `migration_clean_admin_settings.sql` once. See `docs/COMPENDIUM.md §4` for full column/proc detail.

> ℹ️ `admin_settings` seeds **real** values (`couple_names`=Alma & Chava, `wedding_date`=2026-09-12) post-WS8. The app still ignores this table — content comes from `src/data/wedding.ts`. Stale placeholder rows on existing DBs are cleared by `migration_clean_admin_settings.sql`.

## Data Flow

### Content source-of-truth (`src/data/wedding.ts`)
Not the database. Exported constants used across the UI:
- `couple` — names (`Alma`, `Chava`, display `A & C`)
- `weddingDate` — `new Date("2026-09-12T18:00:00")` (countdown, hero, metadata, InvitationCard)
- `weddingDetails` — ceremony (Parroquia San Cristóbal, Acapulco) + reception (Jardín de Fiestas El Patio II, La Bocana), coords
- `ourStory` — 6 milestone entries with index labels `01`–`06` (no calendar dates, per client), `title`, verbatim client description, `icon` (heart/ring/church/home/sparkles), and `image` pointing directly at the photo for that milestone (couple-03/04/05/02/01/08). StorySection renders the photo via `next/image` when `image` is set.
- `padrinos` — 4 sponsor entries (Velación, Lazo, Anillos, Arras) with honor title and `person1`/`person2` names (Lazo's `person2` is `null` until confirmed). The Velación entry is rendered by DetailsSection as its 5th card; Lazo/Anillos/Arras stay as dormant data for archival, no dedicated section.
- `dressCode` (Formal Elegante, gentle guide; palette includes pure `#0E0E0F` off-black, lifted from `#000000` so swatch stays visible on dark wine bg), `hashtag` (`"25AnivAlmaYChava"`), `navigation` (9 links: Inicio/Detalalles/Historia/Galería/Vestimenta/Ubicación/Fotos/RSVP/Playlist — "Padrinos" link removed since section retired).

### Photo manifest (`src/data/couplePhotos.ts`)
Two fields: `hero` (currently `couple-08.jpg`) and `gallery` (24 photos — couple-01 through couple-09 as `.jpg`, couple-10 through couple-24 as `.jpeg`). Story-timeline photos live directly on `ourStory` entries in `wedding.ts` (not here), so this manifest only controls the hero and the masonry `PhotoGallerySection`.

### Configuration (`src/lib/config.ts`)
Env-driven wrappers + boolean feature flags: `isSupabaseConfigured`, `isSupabaseServerConfigured`, `isResendConfigured`, `isGoogleMapsConfigured`, `isYouTubeConfigured`. `resendConfig.fromEmail` defaults to `SEND_FROM_EMAIL`.

### Supabase clients (`src/lib/supabase.ts`)
- `supabase` — browser client (anon key) for client components
- `createSupabaseServerClient()` — service-role client for API routes (bypasses RLS)
- TS interfaces: `Guest`, `Companion`, `Song` (with `youtube_video_id`)

## Sections (Home Page Order)

| #  | Section            | ID            | Key Features                                            |
| -- | ------------------ | ------------- | ------------------------------------------------------- |
| 1  | HeroSection        | `#hero`       | Full-screen, animated names, date, scroll hint (desktop bottom-center / mobile in-flow) |
| 2  | CountdownSection   | `#countdown`  | Live countdown (days/hours/min/sec)                      |
| 3  | DetailsSection     | `#details`    | Ceremony/reception info cards + Padrinos de Velación (5th card, 3+2 layout on desktop) |
| 4  | StorySection       | `#story`      | Timeline with GSAP ScrollTrigger                         |
| 5  | PhotoGallerySection| `#gallery`    | Masonry grid + lightbox of couple photos                 |
| 6  | DressCodeSection   | `#dresscode`  | Color palette + 8-photo masonry of reference examples (dressCodePhotos) + attire suggestions |
| 7  | LocationSection    | `#location`   | Venue cards, Google Maps links, embedded map             |
| 8  | PhotoUploadSection | `#photos`     | Cloudinary upload widget + album `<QRCodeSVG/>`           |
| 9  | RSVPSection        | `#rsvp`       | RSVP form + companion mgmt → **InvitationCard** on success |
| 10 | GiftSection        | `#gift`       | Sobre-regalo message; no nav link (subtle, between RSVP & Playlist) |
| 11 | PlaylistSection    | `#playlist`   | YouTube search, embed, one-vote-per-browser likes; song list capped at `max-h-[32rem]` |

**InvitationCard** is not a section in `page.tsx` — it renders inside RSVPSection's success screen (html2canvas PNG download). Rendered with dark wine gradient + champagne-light text to match the inverted site theme; both the html2canvas client capture and the **generateInvitationImage** server-side PNG (Satori + Sharp, for email attachment) share that visual spec.

> The entire site is gated: an unauthenticated visitor is redirected to `/login` before reaching any section.

## API Endpoints

| Method | Route                        | Access       | Description                                       |
| ------ | ---------------------------- | ------------ | ------------------------------------------------- |
| POST   | `/api/auth/login`            | Public       | `{password}` → sets `site_auth` cookie            |
| POST   | `/api/rsvp`                  | Guest/Admin  | Submit RSVP → `submit_rsvp` RPC. Email optional: if provided + valid, sends Gmail SMTP confirmation w/ Satori-generated invitation PNG. If empty/invalid, stores sentinel `noemail+…@local.invalid` and returns `emailSkipped: true` so the frontend warns the guest that the invitation can only be downloaded once from the page (no email latency penalty). |
| GET    | `/api/rsvp?email=`           | Guest/Admin  | Check RSVP status by email                         |
| GET    | `/api/songs?voterId=`        | Guest/Admin  | List songs, enriched with `isLikedByVoter`         |
| POST   | `/api/songs`                 | Guest/Admin  | Add a song (defaults to `is_approved=false`)       |
| PATCH  | `/api/songs`                 | Guest/Admin  | `{songId,voterId,isLike}` → `like_song`/`unlike_song` |
| DELETE | `/api/songs?songId=`         | **Admin**    | Delete a song (proxy-gated)                        |
| GET    | `/api/youtube/search?q=`     | Guest/Admin  | Proxy YouTube Data API v3 search                   |
| GET    | `/api/admin/check`           | Public*      | Returns whether `admin_auth` is set                 |
| POST   | `/api/admin/login`           | Public*      | `{password}` → sets `admin_auth` cookie            |
| POST   | `/api/admin/logout`         | Public*      | Clears `admin_auth` cookie (WS12) — whitelisted in proxy so logout from an expired session still works |
| GET    | `/api/admin/guests`          | **Admin**    | Guests + companions + aggregate stats (incl. `confirmedCompanions` + `totalConfirmed` as of WS12) |
| POST   | `/api/admin/guests/[guestId]/companions` | **Admin** | Add companion (no MAX limit); resyncs `num_companions` |
| DELETE | `/api/admin/guests/[guestId]/companions/[companionId]` | **Admin** | Remove companion; resyncs `num_companions` |
| PATCH  | `/api/admin/songs`           | **Admin**    | `{songId,isApproved}` → approve/reject             |
| GET    | `/api/admin/messages`        | **Admin**    | Messages from `guests.message` column              |
| GET    | `/api/test/guest`            | Dev only     | Test endpoint (404 in prod)                        |
| GET    | `/api/test/cloudinary`       | Dev only     | Test endpoint (404 in prod)                        |

\* `/api/admin/login` and `/api/admin/check` are whitelisted by the proxy so the login flow itself can function.

> 📝 `POST /api/admin/login` returns `{ok:true}` (not `{success:true}`); `POST /api/auth/login` returns `{success:true}`. `GET /api/admin/guests` does its own in-route `admin_auth` cookie check; `/api/admin/messages` relies entirely on the proxy gate.

## Admin Dashboard (`/admin`)

Four tabs. Post-WS6, `src/app/admin/page.tsx` was the auth gate + tab switch + wiring (~238 lines); WS12 elevated it into a sticky-header shell (Refrescar / Cerrar sesión / Ver Sitio) with an animated icon-tab switch (Framer `layoutId`) and toast feedback. The UI lives in `src/app/admin/_components/` (`AdminDashboard`, `AdminGuestsTable`, `AdminSongsTable`, `AdminMessages`, plus WS12 `StatusChip`/`AdminToolbar`/`SortHeader`/`Pagination`/`States`/`AdminToast`); data fetching goes through `src/hooks/useAdminFetch.ts` and column sort through `src/hooks/useTableSort.ts`:
- **Dashboard** — hero **Total Confirmados** card (`stats.totalConfirmed`, WS12: confirmed guests + their companions) + zero-dep response-composition bar + total/confirmed/declined/pending/companions stats
- **Invitados** — sortable + searchable + filterable + paginated + responsive table (stacked cards on mobile, sticky-header on desktop) with expandable companion rows
- **Canciones** — same responsive table UX; song moderation (approve/reject via `/api/admin/songs`, delete via `/api/songs`); reads the **public** `/api/songs`
- **Mensajes** — searchable + paginated guest messages (via `/api/admin/messages`)

Mutations (approve/delete/add-companion) refetch from the server (no optimistic client state); deletes confirm via an `AnimatePresence` modal; successes confirm via toast; errors surface inline (no `alert()`).

## Design System

### Color Palette (CSS vars in `globals.css`)
| Token            | Hex       | Usage                |
| ---------------- | --------- | -------------------- |
| `--ivory`        | `#F6F5F8` | Cool pearl background |
| `--champagne`    | `#EAE8EE` | Accents, borders     |
| `--blush`        | `#E6DEE5` | Gradient stops (mauve) |
| `--rose`         | `#D7CBD9` | Error states (mauve)  |
| `--burgundy`     | `#722F37` | Primary text/buttons |
| `--silver`       | `#8A8F98` | Silver ornaments (steel) |
| `--sage`         | `#9CAF88` | Success states       |

Derived: `--burgundy-light #8C3A42`, `--silver-light #C5CBD3` (platinum), `--silver-dark #5C6168` (pewter), `--sage-light #B5C9A3`, `--foreground #3D3B40`. Mapped into Tailwind via `@theme inline`.

### Typography
| Role    | Font               | Classes        |
| ------- | ------------------ | -------------- |
| Display | Cormorant Garamond | `.text-display` |
| Body    | Jost               | `.text-body`    |
| Script  | Great Vibes        | `.text-script`  |

### Glassmorphism
`.glass`, `.glass-strong`, `.glass-subtle` — also via the `<GlassCard variant="…">` component.

### Animations
- **Global backdrop** — a single `fixed` `bg-romantic` layer in `page.tsx` paints the rich gradient across the whole site (seamless, no scroll-time edge); `<body>` uses `bg-ivory` as the no-JS fallback. Login/admin carry their own full-screen gradient.
- **Framer Motion** — reusable `<Reveal>` (opacity 0→1 + y 18→0, `ease [0.16,1,0.3,1]`, ~0.6s, `once`-true, list stagger ~0.08s) drives section/card entrances; `SectionTitle` draws in (ornament pop + divider scaleX + heading rise); the silver `ScrollProgress` top bar uses `useScroll`. `<GlassCard>` is a `motion.div` with a refined hover lift (`y:-8, scale:1.02`, spring) + CSS box-shadow bloom; `interactive={false}` opts out (e.g. the Google Map card).
- **GSAP + ScrollTrigger** — multi-depth hero parallax (each sub-element at its own `yPercent` under one `#hero` trigger), and the `StorySection` timeline whose silver line is height-measured to the final node and grows over the whole track with a glowing comet tip leading it; both dynamically imported for SSR and gated by `usePrefersReducedMotion()`. No `opacity:0` on `<section>` wrappers.
- **CSS keyframes** — `gradientShift`, `float`, `petalFall`, `shimmer`, `skeletonShimmer`; clamped to ~0.01ms under `prefers-reduced-motion: reduce`.
- **Reduced motion** — split: the CSS block above stops ambient CSS motion; Framer spots use `useReducedMotion()` and render in place; GSAP spots short-circuit via `usePrefersReducedMotion()`. The `FloatingPetals` canvas is JS-driven and not covered. Content always stays visible.
- **FOUC fix** — `section { opacity: 1 !important }`; `PageSkeleton` crossfades out after a 100ms `isPageReady` flag.

## Environment Variables

See `.env.example`. Key variables (✱ = required for the proxy to boot):

| Variable                                   | Required | Used By                          |
| ------------------------------------------ | -------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | Yes      | Clients                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Yes      | Browser client                   |
| `SUPABASE_SERVICE_ROLE_KEY`                | Yes      | Server routes (bypasses RLS)      |
| `INVITATION_CODE`                          | Yes ✱    | Guest login / proxy               |
| `ADMIN_PASSWORD`                           | Yes ✱    | Admin login / proxy               |
| `GMAIL_USER`                               | No       | Gmail SMTP sender (confirmation emails) |
| `GMAIL_APP_PASSWORD`                       | No       | Gmail App Password (sender auth)       |
| `NEXT_PUBLIC_SITE_URL`                     | No       | Site URL for absolute links in emails  |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`          | No       | Maps embed                         |
| `YOUTUBE_API_KEY`                          | No       | Playlist search (server route)     |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`        | No       | Photo upload                       |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`     | No       | Photo upload                       |
| `NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL`       | No       | Album link + QR                    |
| `NEXT_PUBLIC_SITE_URL`                     | No       | `metadataBase`, SEO                |

> 🔒 `.env.example` uses a **placeholder** for `YOUTUBE_API_KEY`. A real key was leaked and committed in **git history** in a prior session. This repo intentionally **does not** rewrite git history; the file itself is now clean. The remaining action is **manual and user-owned**: rotate the key in the Google Cloud Credential console and update the deployed value on Vercel. See `docs/COMPENDIUM.md §10 #5`.

## Scripts

```bash
npm run dev             # Dev server (localhost:3000)
npm run build           # Production build
npm run start           # Production server
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit  (gate; added WS1)
npm run typecheck:build # tsc --noEmit with the build tsconfig (gate; added WS1)
```

## Notes

- All sections are `"use client"` client components for interactivity.
- GSAP is dynamically imported (`await import("gsap")`) to avoid SSR issues.
- **Loading strategy** — `PageSkeleton` mirrors the real layout during initial JS load (100ms), then crossfades via opacity. Sections stay visible (`section { opacity: 1 !important }`) so GSAP never hides rendered content. HeroSection renders immediately (no `mounted` guard). PlaylistSection shows skeleton cards while fetching.
- **Wedding date:** September 12, 2026 (`src/data/wedding.ts`). The countdown, hero, metadata JSON-LD, and InvitationCard all read from here. The RSVP confirmation email (`api/rsvp/route.ts`) now reads `wedding.ts` content too — no hardcoded "2025" (fixed WS2).
- Site is Spanish (`lang="es"`); date locale is **`es-MX`** everywhere (admin, InvitationCard, hero, and `utils.ts` helpers) — normalized WS7.
- Admin panel at `/admin` (password-protected); guest entry requires the invitation code at `/login`.
- `next.config.ts` remote image patterns allow `img.youtube.com`, `*.supabase.co`, `*.res.cloudinary.com`.
- `vercel.json` pins region `iad1` (match to your Supabase region) and a global `nosniff` header.
- For the deep project bible and change-planning recipes, see `docs/COMPENDIUM.md`.
