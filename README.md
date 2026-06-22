# Emerson Plancarte — Wedding Website

A modern, elegant wedding invitation and management website built for Alma & Chava's October 2026 wedding. Features a complete RSVP system with companion management, collaborative playlist powered by YouTube, photo upload functionality, and an administrative dashboard.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Frontend Architecture](#frontend-architecture)
- [Admin Dashboard](#admin-dashboard)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

### Guest-Facing Features

- **Full-Screen Hero Section** — Animated cover with couple names, wedding date, bokeh background effects, and floating petals
- **Live Countdown Timer** — Real-time countdown to the ceremony with glass morphism cards
- **Event Details** — Ceremony and reception information with times and locations
- **Our Story Timeline** — Interactive vertical timeline showing relationship milestones with GSAP scroll animations
- **Dress Code Guide** — Color palette visualization and attire recommendations for men and women
- **Interactive Map** — Google Maps embeds for both venues with custom styling
- **RSVP System** — Complete form with dynamic companion management (up to 5 companions), dietary restrictions, and personal messages
- **Collaborative Playlist** — YouTube-powered song requests with search, preview, and voting system
- **Photo Upload** — Cloudinary integration for guest photo sharing
- **Digital Invitation Card** — Generates a printable invitation card after RSVP confirmation

### Admin Features

- **Dashboard** — Real-time statistics showing total RSVPs, confirmed, declined, pending, and companion counts
- **Guest Management** — Sortable table with expandable rows showing companion details, dietary restrictions, and messages
- **Song Moderation** — Approve/reject song submissions, delete inappropriate content, view vote counts
- **Data Export** — All data accessible via API for external analysis

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.7 with App Router |
| **Language** | TypeScript 5.x |
| **UI Library** | React 19.2.4 |
| **Styling** | Tailwind CSS v4 with CSS variables |
| **Animations** | Framer Motion 12.x, GSAP 3.x with ScrollTrigger |
| **Database** | Supabase (PostgreSQL 15+) |
| **Email** | Resend |
| **Image Storage** | Cloudinary |
| **Video** | YouTube Data API v3 |
| **Maps** | Google Maps Embed API |
| **Icons** | Lucide React |
| **Utilities** | clsx, tailwind-merge, nanoid, html2canvas, qrcode.react |

### Key Version Notes

This project uses Next.js 16 with breaking changes from earlier versions. Key differences:

- App Router only (no Pages Router)
- Middleware runs differently (see `src/proxy.ts`)
- `next/headers` module used for cookies
- Server Components are default; Client Components explicitly marked with `"use client"`

Always refer to `node_modules/next/dist/docs/` for current API documentation rather than relying on training data.

---

## Design System

### Color Palette

All colors are defined as CSS variables in `src/app/globals.css`:

```css
--ivory: #FFFFF0;        /* Background base */
--champagne: #F7E7CE;    /* Secondary backgrounds, borders */
--blush: #F4C2C2;        /* Pink accents */
--rose: #E8A0BF;         /* Error states, emphasis */
--burgundy: #722F37;     /* Primary text, buttons */
--gold: #C5A55A;         /* Ornaments, highlights */
--sage: #9CAF88;         /* Success states, nature */
```

Derived variants:
- `--burgundy-light: #8C3A42`
- `--gold-light: #D4BA7A`
- `--gold-dark: #A68B45`
- `--sage-light: #B5C9A3`

### Typography

Three font families loaded via `next/font/google`:

| Role | Font | Weights | CSS Variable |
|------|------|---------|--------------|
| Display | Cormorant Garamond | 300, 400, 500, 600 (+ italic) | `--font-display` |
| Body | Jost | 300, 400, 500 | `--font-body` |
| Script | Great Vibes | 400 | `--font-script` |

Usage classes:
- `.text-display` — Cormorant Garamond for headings
- `.text-body` — Jost for paragraphs
- `.text-script` — Great Vibes for decorative text

### Glassmorphism Classes

Three glass effect variants defined in `globals.css`:

```css
/* Standard glass card */
.glass {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
}

/* Stronger blur for overlays */
.glass-strong {
  backdrop-filter: blur(30px) saturate(200%);
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Subtle variant for navigation */
.glass-subtle {
  backdrop-filter: blur(12px) saturate(140%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Button Components

Two button styles defined in CSS:

- `.btn-primary` — Solid burgundy gradient button with shadow
- `.btn-outline` — Outlined burgundy button with hover fill

Both buttons feature hover lift animation and smooth transitions.

### Background Animation

The `.bg-romantic` class applies an animated gradient background that shifts through ivory, champagne, and blush tones over a 15-second loop.

---

## Project Structure

```
wedproject/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home page (all sections)
│   │   ├── layout.tsx                  # Root layout + fonts + SEO
│   │   ├── globals.css                 # Global styles + theme
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx                # Admin dashboard
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                # Guest login page
│   │   │
│   │   ├── test/
│   │   │   └── page.tsx                # Development test suite
│   │   │
│   │   └── api/
│   │       ├── rsvp/
│   │       │   └── route.ts            # POST: Submit RSVP
│   │       │
│   │       ├── songs/
│   │       │   └── route.ts            # GET/POST/PATCH/DELETE songs
│   │       │
│   │       ├── admin/
│   │       │   ├── check/route.ts      # GET: Verify admin session
│   │       │   ├── login/route.ts      # POST: Admin login
│   │       │   ├── guests/route.ts     # GET: Fetch guests
│   │       │   └── songs/route.ts      # PATCH: Approve/reject songs
│   │       │
│   │       ├── auth/
│   │       │   └── login/route.ts      # POST: Guest login
│   │       │
│   │       ├── youtube/
│   │       │   └── search/route.ts     # GET: Search YouTube videos
│   │       │
│   │       ├── test/
│   │       │   ├── guest/route.ts      # Test guest operations
│   │       │   └── cloudinary/route.ts # Test Cloudinary uploads
│   │       │
│   │       └── check/
│   │           └── route.ts            # Health check
│   │
│   ├── components/
│   │   ├── sections/                   # Page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── CountdownSection.tsx
│   │   │   ├── DetailsSection.tsx
│   │   │   ├── StorySection.tsx
│   │   │   ├── DressCodeSection.tsx
│   │   │   ├── LocationSection.tsx
│   │   │   ├── PhotoUploadSection.tsx
│   │   │   ├── RSVPSection.tsx
│   │   │   └── PlaylistSection.tsx
│   │   │
│   │   ├── shared/                     # Reusable components
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── PageSkeleton.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── PageAnimations.tsx
│   │   │   ├── FloatingPetals.tsx
│   │   │   ├── BokehBackground.tsx
│   │   │   ├── SectionTitle.tsx
│   │   │   └── GoogleMapEmbed.tsx
│   │   │
│   │   └── ui/                         # Base UI components
│   │       └── GlassCard.tsx
│   │
│   ├── data/
│   │   └── wedding.ts                  # Wedding configuration data
│   │
│   ├── hooks/
│   │   └── useCountdown.ts             # Countdown timer hook
│   │
│   └── lib/
│       ├── config.ts                   # Environment config wrappers
│       ├── supabase.ts                 # Supabase client setup
│       └── utils.ts                    # Utility functions
│
├── supabase/
│   ├── schema.sql                      # Database schema + RLS policies
│   └── migration_update.sql            # Migration helpers
│
├── src/proxy.ts                        # Next.js middleware for auth
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 20.x or later (tested on 20.x)
- npm 10.x or later
- Supabase account and project
- Resend account for email functionality
- Google Cloud project with Maps Embed API enabled
- YouTube Data API v3 key
- Cloudinary account (for photo uploads)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wedproject

# Install dependencies
npm install

# Copy environment example file
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your credentials. See [Environment Configuration](#environment-configuration) for detailed descriptions.

### Database Setup

1. Log into your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Execute the SQL script

This creates:
- `guests` table with RSVP data
- `companions` table for guest companions
- `songs` table for playlist
- `admin_settings` table for site configuration
- Row Level Security policies
- Helper functions (`submit_rsvp`, `vote_song`)

Verify tables were created:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Running Locally

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

The development server runs on `http://localhost:3000`.

### Development Test Suite

Access `/test` in development mode to verify integrations:

1. **Supabase Test** — Check connection and insert test guest
2. **Cloudinary Test** — Verify upload configuration

---

## Environment Configuration

All environment variables should be set in `.env.local` for development and in your hosting provider for production.

### Required Variables

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
INVITATION_CODE=your-guest-invitation-code
ADMIN_PASSWORD=your-admin-password

# Resend (Transactional Email)
RESEND_API_KEY=re_your-api-key
SEND_FROM_EMAIL=noreply@yourdomain.com

# Google Maps (Venue Display)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# YouTube Data API (Playlist Search)
YOUTUBE_API_KEY=your-api-key

# Cloudinary (Photo Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL=https://photos.app.goo.gl/your-album
```

### Feature Flags

The application gracefully degrades when services are not configured. Check feature availability in code via:

```typescript
import { isSupabaseConfigured, isResendConfigured } from '@/lib/config';
```

### Security Notes

- The middleware in `src/proxy.ts` performs a "fail closed" check: if `INVITATION_CODE` or `ADMIN_PASSWORD` are not set, all requests return 503
- Test routes (`/test`, `/api/test/*`) automatically return 404 in production (`NODE_ENV !== 'development'`)
- Never commit `.env.local` to version control

---

## Database Setup

### Schema Overview

The database consists of four main tables with Row Level Security (RLS) enabled.

#### guests Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique guest identifier |
| `name` | VARCHAR(255) | NOT NULL | Guest full name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Guest email for confirmation |
| `phone` | VARCHAR(50) | NULL | Optional phone number |
| `invitation_code` | VARCHAR(50) | NOT NULL | Group guests by invitation batch |
| `status` | ENUM | NOT NULL | `pending`, `confirmed`, `declined` |
| `num_companions` | INTEGER | NOT NULL | Number of accompanying guests (0-5) |
| `dietary_restrictions` | TEXT | NULL | Dietary requirements |
| `message` | TEXT | NULL | Personal message to couple |
| `side` | ENUM | NULL | `bride`, `groom` (optional) |
| `confirmed_at` | TIMESTAMPTZ | NULL | When RSVP was confirmed |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

#### companions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique companion identifier |
| `guest_id` | UUID | FOREIGN KEY | References `guests.id` (CASCADE DELETE) |
| `name` | VARCHAR(255) | NOT NULL | Companion name |
| `dietary_restrictions` | TEXT | NULL | Companion dietary needs |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |

#### songs Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique song identifier |
| `title` | VARCHAR(255) | NOT NULL | Song title |
| `artist` | VARCHAR(255) | NOT NULL | Artist name |
| `youtube_video_id` | VARCHAR(100) | UNIQUE | YouTube video ID |
| `thumbnail_url` | TEXT | NULL | Video thumbnail URL |
| `added_by` | VARCHAR(100) | NOT NULL | Who added the song |
| `votes` | INTEGER | NOT NULL | Vote count (default: 0) |
| `is_approved` | BOOLEAN | NOT NULL | Admin approval status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |

#### admin_settings Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(100) | PRIMARY KEY | Setting identifier |
| `value` | JSONB | NOT NULL | Setting value as JSON |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

Default settings:
- `wedding_date` — Ceremony date and timezone
- `couple_names` — Names of the couple
- `rsvp_deadline` — RSVP deadline configuration
- `max_companions` — Maximum companions per guest
- `site_status` — Site maintenance and RSVP status

### Stored Procedures

#### submit_rsvp

Atomic operation for submitting RSVP with companions:

```sql
SELECT submit_rsvp(
  p_name := 'John Doe',
  p_email := 'john@example.com',
  p_phone := '+52 55 1234 5678',
  p_status := 'confirmed',
  p_num_companions := 2,
  p_dietary := 'Vegetarian',
  p_message := 'Excited to celebrate!',
  p_side := NULL,
  p_companions := '[{"name": "Jane Doe", "dietary_restrictions": null}]'::jsonb
);
```

Returns the guest UUID. Handles upsert on email conflict.

#### vote_song

Increment or decrement song vote count:

```sql
SELECT vote_song(p_song_id := 'uuid', p_delta := 1);  -- Upvote
SELECT vote_song(p_song_id := 'uuid', p_delta := -1); -- Downvote
```

### Row Level Security Policies

RLS is enabled on all tables. Key policies:

- **guests**: Guests can view their own records by email; anyone can insert; service role has full access
- **companions**: Anyone can view and add; service role has full access
- **songs**: Anyone can view, add, and vote; service role has full access
- **admin_settings**: Service role only

The service role key bypasses RLS, used by server-side API routes.

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/login

Authenticates a guest with the invitation code.

**Request:**
```json
{
  "code": "boda2025"
}
```

**Response (200):**
```json
{
  "success": true
}
```

Sets `site_auth` cookie on success.

**Response (401):**
```json
{
  "error": "Invalid invitation code"
}
```

### RSVP Endpoints

#### POST /api/rsvp

Submit a new RSVP or update an existing one.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+52 55 1234 5678",
  "status": "confirmed",
  "numCompanions": 2,
  "companions": [
    { "name": "Jane Doe", "dietary": null }
  ],
  "dietary": "Vegetarian",
  "message": "Excited to celebrate!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Thank you John! Your confirmation has been received."
}
```

**Response (400):**
```json
{
  "error": "Name and email are required."
}
```

**Response (500):**
```json
{
  "error": "Could not save confirmation. Please try again."
}
```

#### GET /api/rsvp

Check RSVP status by email.

**Query Parameters:**
- `email` — Guest email to look up

**Response (200):**
```json
{
  "status": "confirmed",
  "name": "John Doe"
}
```

**Response (404):**
```json
{
  "status": "not_found"
}
```

### Songs Endpoints

#### GET /api/songs

Retrieve all songs, optionally enriched with voter information.

**Query Parameters:**
- `voterId` — Optional voter ID to check which songs they've liked

**Response (200):**
```json
{
  "songs": [
    {
      "id": "uuid",
      "title": "Song Title",
      "artist": "Artist Name",
      "youtube_video_id": "videoId",
      "thumbnail_url": "https://...",
      "votes": 5,
      "added_by": "Guest",
      "is_approved": true,
      "created_at": "2025-01-01T00:00:00Z",
      "isLikedByVoter": false
    }
  ]
}
```

#### POST /api/songs

Add a new song to the playlist.

**Request:**
```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "youtubeVideoId": "videoId",
  "thumbnailUrl": "https://...",
  "addedBy": "Guest"
}
```

**Response (201):**
```json
{
  "song": { ... }
}
```

#### PATCH /api/songs

Like or unlike a song.

**Request:**
```json
{
  "songId": "uuid",
  "voterId": "voter_uuid",
  "isLike": true
}
```

**Response (200):**
```json
{
  "liked": true
}
```

Possible responses:
- `liked: true` — Vote recorded
- `liked: true, alreadyLiked: true` — Already liked (idempotent)
- `liked: false` — Vote removed
- `liked: false, notLiked: true` — Was not liked

#### DELETE /api/songs

Delete a song (admin only).

**Query Parameters:**
- `songId` — Song UUID to delete

**Response (200):**
```json
{
  "success": true
}
```

### Admin Endpoints

#### GET /api/admin/check

Verify if current session has admin access.

**Response (200):** Session is valid

**Response (401):** Not authenticated

#### POST /api/admin/login

Authenticate as administrator.

**Request:**
```json
{
  "password": "admin-password"
}
```

**Response (200):**
```json
{
  "success": true
}
```

Sets `admin_auth` cookie.

#### GET /api/admin/guests

Fetch all guests with companions.

**Response (200):**
```json
{
  "ok": true,
  "guests": [
    {
      "guest": { "id": "...", "name": "...", ... },
      "companions": [{ "id": "...", "name": "...", ... }]
    }
  ],
  "stats": {
    "total": 50,
    "confirmed": 35,
    "declined": 5,
    "pending": 10,
    "totalCompanions": 42
  }
}
```

#### PATCH /api/admin/songs

Approve or reject a song submission.

**Request:**
```json
{
  "songId": "uuid",
  "isApproved": true
}
```

---

## Authentication

The application uses a dual-tier authentication system based on simple cookie-based authentication.

### Guest Authentication

1. Guests visit `/login` and enter the invitation code
2. Code is validated against `INVITATION_CODE` environment variable
3. On success, `site_auth` cookie is set with the code value
4. Middleware validates the cookie on protected routes

### Admin Authentication

1. Admins access `/admin` which shows a login form
2. Password is validated against `ADMIN_PASSWORD` environment variable
3. On success, `admin_auth` cookie is set
4. Admin-only API routes check for `admin_auth` cookie

### Middleware Flow

The middleware (`src/proxy.ts`) runs on every request:

1. **Environment Check** — Fails with 503 if `INVITATION_CODE` or `ADMIN_PASSWORD` are not set
2. **Static Asset Exclusion** — Skips `/_next`, `/favicon.ico`, and static files
3. **Auth Route Exclusion** — Allows `/api/auth/*`, `/api/admin/login`, `/api/admin/check`
4. **Guest Check** — Requires `site_auth` or `admin_auth` cookie
5. **Admin Check** — For `/api/admin/*` routes (except login/check), requires `admin_auth`
6. **Production Protection** — Blocks `/test` and `/api/test/*` in production

### Voter Identification

The playlist system uses a browser-specific voter ID stored in localStorage:

```typescript
const voterId = localStorage.getItem('wedding_voter_id');
// If not exists: voter_id = 'voter_' + crypto.randomUUID()
```

This allows one vote per song per browser without requiring authentication.

---

## Frontend Architecture

### Component Hierarchy

```
page.tsx (Home)
├── PageSkeleton (Loading overlay)
├── BokehBackground (Canvas-based bokeh)
├── FloatingPetals (Canvas-based petals)
├── PageAnimations (GSAP ScrollTrigger)
├── Navigation (Fixed nav with mobile drawer)
├── HeroSection (Full-screen hero)
├── CountdownSection (Timer)
├── DetailsSection (Event cards)
├── StorySection (Timeline)
├── DressCodeSection (Attire guide)
├── LocationSection (Maps)
├── PhotoUploadSection (Cloudinary)
├── RSVPSection (Form + confirmation)
├── PlaylistSection (YouTube playlist)
└── Footer (Credits)
```

### Animation Strategy

The application uses both Framer Motion and GSAP without conflicts:

| Library | Usage | Reason |
|---------|-------|--------|
| Framer Motion | Component mount animations, state transitions | React-native, declarative |
| GSAP + ScrollTrigger | Scroll-based parallax, timeline animations | Performance, complex scroll logic |

**Important:** Sections render with `opacity: 1 !important` in CSS to prevent FOUC. Animation libraries enhance but do not control initial visibility.

### Key Components

#### PageSkeleton

A full-screen loading overlay that matches the page structure. Uses skeleton shimmer animation with champagne tones. Fades out when `isPageReady` state becomes true after 100ms.

#### Navigation

Fixed navigation with glass effect. Desktop shows all links; mobile uses an animated drawer. Smooth scroll to sections via anchor links.

#### GlassCard

Reusable container component with three variants:

- `default` — Standard glass
- `strong` — Higher opacity for overlays
- `subtle` — Minimal opacity for large areas

#### SectionTitle

Standardized section headers with:
- Ornament character (e.g., `✦`, `❦`, ♫)
- Title text
- Optional subtitle

### State Management

No global state library. Components use:

- `useState` for local state
- `useEffect` for side effects
- Prop drilling for shared data
- localStorage for persistent client data (voter ID)

---

## Admin Dashboard

Access: `/admin` (requires admin password)

### Dashboard Tab

Displays five stat cards:

1. **Total RSVP** — Total number of responses
2. **Confirmed** — Guests attending
3. **Declined** — Guests not attending
4. **Pending** — Awaiting response
5. **Companions** — Total accompanying guests

### Guests Tab

Sortable table with columns:
- Name
- Email
- Phone
- Status (badge: Confirmed/Declined/Pending)
- Companion count (circle indicator)
- Message (truncated)
- Date (formatted)

**Expandable Rows:** Click any guest to see their accompanying guests with:
- Name
- Dietary restrictions (if any)

### Songs Tab

Management interface for playlist:

**Stats Cards:**
- Total songs
- Approved songs
- Pending approval
- Most voted song

**Table Columns:**
- Video thumbnail
- Title
- Artist
- Votes (circle badge)
- Status (Approved/Pending)
- Added by
- Date
- Actions (Approve/Reject, Delete)

---

## Development

### Local Development

```bash
# Start development server
npm run dev

# Open in browser
http://localhost:3000

# Run linter
npm run lint

# Type check (if using tsc)
npx tsc --noEmit
```

### Code Style

The project uses ESLint with the Next.js configuration. Key conventions:

- TypeScript for all code
- Functional components with explicit types
- Destructure props in component signature
- Use `aria-label` for icon buttons
- Descriptive variable names (no shorthand like `d` for data)

### Testing Strategy

Manual testing via `/test` page:

1. **Supabase Connection** — Verifies environment variables and tests guest insertion
2. **Cloudinary Upload** — Verifies upload configuration with test image

For production deployments, verify:

- All API routes return correct status codes
- Middleware redirects unauthenticated users
- Admin dashboard is protected
- RSVP emails send successfully

### Debugging

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| GSAP animations not working | Check that sections are visible; GSAP enhances, not controls |
| Database errors | Verify Supabase URL and keys; check RLS policies |
| Cookie not setting | Ensure HTTPS in production; cookies require secure context |
| YouTube search failing | Check API key quota; verify `YOUTUBE_API_KEY` is set |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Add all required variables in Vercel Dashboard > Project Settings > Environment Variables:

| Variable | Environment |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `INVITATION_CODE` | All |
| `ADMIN_PASSWORD` | Production, Preview |
| `RESEND_API_KEY` | Production, Preview |
| `SEND_FROM_EMAIL` | All |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | All |
| `YOUTUBE_API_KEY` | Production, Preview |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | All |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | All |
| `NEXT_PUBLIC_SITE_URL` | All |

### Post-Deployment Checklist

1. Verify site loads on production URL
2. Test guest login with invitation code
3. Submit a test RSVP and verify it appears in database
4. Test admin login and dashboard access
5. Verify YouTube search works
6. Test photo upload (if enabled)
7. Check that `/test` returns 404

### Custom Domain

1. Add domain in Vercel Dashboard > Project Settings > Domains
2. Update `NEXT_PUBLIC_SITE_URL` to production URL
3. Configure DNS records as directed by Vercel

---

## Troubleshooting

### Database Issues

**Guests not appearing in admin dashboard:**

1. Check Supabase logs for errors
2. Verify RLS policies allow service role access
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Test with `/test` page

**RSVP submission fails:**

1. Check browser console for errors
2. Verify `submit_rsvp` function exists in database:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'submit_rsvp';
   ```
3. Ensure email format is valid
4. Check character limits (name < 100, dietary < 500, message < 1000)

### Authentication Issues

**Cannot login as guest:**

1. Verify `INVITATION_CODE` matches exactly (case-sensitive)
2. Check cookie is being set (DevTools > Application > Cookies)
3. Ensure middleware is not blocking `/api/auth/login`

**Admin dashboard shows login screen:**

1. Verify `ADMIN_PASSWORD` is set
2. Check `admin_auth` cookie value matches exactly
3. Try clearing cookies and logging in again

### Animation Issues

**Sections invisible on load:**

1. Check `globals.css` for `section { opacity: 1 !important; }`
2. Verify skeleton overlay is fading out
3. Check for JavaScript errors blocking execution

**GSAP not animating:**

1. Ensure GSAP and ScrollTrigger are imported
2. Verify `gsap.registerPlugin(ScrollTrigger)` is called
3. Check that trigger elements exist in DOM

### Build Errors

**TypeScript errors:**

```bash
# Check for type errors
npx tsc --noEmit
```

Common fixes:
- Add explicit types to function parameters
- Use `as Type` for type assertions
- Handle null/undefined cases

**Next.js build fails:**

```bash
# Try clean build
rm -rf .next
npm run build
```

---