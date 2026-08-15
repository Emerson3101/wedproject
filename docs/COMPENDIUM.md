# COMPENDIUM — Boda de Alma & Chava (wedding site)

> The deep project bible. Every factual claim below is verified against source and cites
> `file:line` so it can be checked. Use this file to reason about **any** requested change
> and produce a viable action plan (see §11 — Change-Planning Playbook).
>
> For the quick view, see [`../README.md`](../README.md) (setup + feature overview) and
> [`../PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md) (file map + tables). This file is the
> reasoning layer on top of those.

**Couple:** Alma & Chava · **Wedding date:** 12 September 2026, 18:00 (`src/data/wedding.ts:16`)
**Stack:** Next.js 16.2.7 (App Router), React 19.2.4, TypeScript 5, Tailwind v4, Supabase, Resend, GSAP + Framer Motion
**Last verified against source:** commit `232de34` (HEAD)

---

## Table of contents

1. [Purpose & how to use this file](#1-purpose--how-to-use-this-file)
2. [System at a glance](#2-system-at-a-glance)
3. [Auth & trust model](#3-auth--trust-model)
4. [Database model](#4-database-model)
5. [Request & data-flow lifecycle](#5-request--data-flow-lifecycle)
6. [Front-end section pipeline & rendering](#6-front-end-section-pipeline--rendering)
7. [External integrations matrix](#7-external-integrations-matrix)
8. [Design system](#8-design-system)
9. [Build, run, deploy](#9-build-run-deploy)
10. [Gotchas & conventions](#10-gotchas--conventions)
11. [Change-Planning Playbook](#11-change-planning-playbook)

---

## 1. Purpose & how to use this file

This compendium exists so that **any future change request** ("add a gift-registry section",
"let guests bring +3 instead of +2", "switch the playlist back to Spotify") can be turned
into a correct, low-risk action plan without re-reading the whole codebase or guessing.

**How to use it:**

- **Before planning a change** → jump to §11 (Change-Planning Playbook). There is likely a
  templated recipe for your change type; if not, the blank "action plan template" at the end of
  §11 is the format to fill in.
- **To understand a subsystem** → read the matching section (Auth §3, DB §4, request flows §5,
  front-end §6, integrations §7).
- **To avoid foot-guns** → §10 (Gotchas) collects the non-obvious traps (schema idempotency,
  GSAP opacity rule, leaked-key rotation, locale inconsistency, RSVP email hardcodes 2025).
- **To verify any claim** → every fact cites `path/to/file.ts:line` — confirm against the
  source before acting; the codebase is the source of truth, not this prose.
- **When the code and this file disagree** → the code wins. Update this file (and the
  README/PROJECT_STRUCTURE if affected) as part of the change. Per `CLAUDE.md`, every major
  reasoning/breakthrough is recorded in a markdown file so context survives autocompact.

**Scope & conventions:**

- All API routes are Next.js 16 **Route Handlers** under `src/app/api/**/route.ts`.
- The repo is Spanish-locale for the user-facing site (`lang="es"`); comments are Spanish;
  variable/identifier names are English. This compendium is in English for clarity.
- Secrets are **never** reproduced here. See §10 for the leaked-key rotation note.

---

## 2. System at a glance

A single-page Next.js 16 app behind an **edge auth gate (`src/proxy.ts`, the Next.js 16
replacement for `middleware.ts`)** that admits either guests (who entered the invitation code)
or admins (who entered the admin password). Inside the gate, the homepage renders 9 sections
backed by Supabase (RSVP + companions, collaborative YouTube playlist with one-vote-per-
browser, Cloudinary photo upload), a Resend confirmation email flow, and a print/download
invitation card generated client-side. A separate `/admin` dashboard lets the couple moderate
guests, songs, and guest messages.

### ASCII data-flow

```
                         Browser (client)
                               │
   ┌───────────────────────────┼───────────────────────────────┐
   │  1. GET any path  ────────►│ src/proxy.ts  (edge, matcher /:path*)
   │     cookie: site_auth       │   • fail-closed 503 if no INVITATION_CODE/ADMIN_PASSWORD  (proxy.ts:15-21)
   │            admin_auth       │   • /test + /api/test/* → 404 in prod                         (proxy.ts:23-29)
   │                             │   • whitelist /_next, /login, /api/auth/*, static ext        (proxy.ts:31-40)
   │                             │   • guest gate: redirect→/login or 401                        (proxy.ts:50-59)
   │                             │   • admin gate: /api/admin/* (+DELETE /api/songs) → 401       (proxy.ts:61-71)
   └───────────────────────────┬─┘
                               │ 2. admitted
        ┌──────────────────────┼──────────────────────────────────────────┐
        │                      ▼                                            │
        │   src/app/page.tsx  (9 sections, client components)              │
        │     Hero ▸ Countdown ▸ Details ▸ Story ▸ DressCode ▸ Location  │  (page.tsx:66-74)
        │     ▸ PhotoUpload ▸ RSVP ▸ Playlist                              │
        │   shells: BokehBackground, FloatingPetals, PageAnimations,       │
        │            Navigation, Footer; PageSkeleton overlay (100ms)     │  (page.tsx:30-52)
        └──────┬───────────┬───────────┬───────────────┬───────────────────┘
               │           │           │               │
      RSVP submit    song search    song add/vote   photo upload
       POST /api/rsvp GET /api/     POST/PATCH      Cloudinary widget
                     youtube/search /api/songs      (client preset)
               │           │           │               │
               ▼           ▼           ▼               ▼
        ┌────────────────────────────────────────────────────────┐
        │  Next.js Route Handlers (src/app/api/**)               │
        │   • own cookie re-check (defense-in-depth)             │
        │   • createSupabaseServerClient()  (service-role key)   │  (supabase.ts:18-26)
        └───────────┬────────────────────────────────────────────┘
                    │ service-role (bypasses RLS)
                    ▼
        ┌────────────────────────────────────────────────────────┐
        │  Supabase / PostgreSQL                                 │
        │   tables: guests, companions, songs, song_likes,      │
        │            admin_settings                             │
        │   RPCs: submit_rsvp, vote_song, like_song,            │
        │         unlike_song, has_liked_song, update_updated_at│
        └───────────┬────────────────────────────────────────────┘
                    │ optional, only if status==="confirmed"
                    ▼
        ┌────────────────────────────────────────────────────────┐
        │  External services                                    │
        │   Resend (email)  YouTube Data API v3  Google Maps Emb │
        │   Cloudinary (photos)  Google Photos (album link+QR)   │
        └────────────────────────────────────────────────────────┘
```

**Mental model in one sentence:** `proxy.ts` is the real security wall (cookie = shared
secret that equals the env var), Supabase RLS is permissive and relies on that wall, and the
server Route Handlers re-check the cookie a second time before using the **service-role**
Supabase key — which is why data writes work despite RLS being wide open.

## 3. Auth & trust model

> **This is the most important section.** The site has no per-user accounts and no Supabase
> Auth. Identity is binary: *guest* (knows the invitation code) or *admin* (knows the admin
> password). A cookie equal to the corresponding env var is the entire credential. RLS is
> deliberately permissive; `proxy.ts` is the real boundary.

### The two secrets and the two cookies

| Tier | Env var (source of truth) | Cookie name | Set by | Lifetime | httpOnly | secure | sameSite |
|------|--------------------------|-------------|--------|----------|----------|--------|----------|
| Guest | `INVITATION_CODE` (`src/lib/config.ts:30-31`, default `almaychava`) | `site_auth` | `POST /api/auth/login` (`src/app/api/auth/login/route.ts`) | 30 days | yes | `NODE_ENV==="production"` | `lax` |
| Admin | `ADMIN_PASSWORD` | `admin_auth` | `POST /api/admin/login` (`src/app/api/admin/login/route.ts`) | 24 hours | yes | `NODE_ENV==="production"` | `lax` |

A cookie is "valid" when its value equals the env verbatim (`proxy.ts:46-47`:
`isGuestAuthenticated = siteAuth === invitationCode`,
`isAdminAuthenticated = adminAuth === adminPassword`). This means **rotating a secret
invalidates all existing sessions immediately** (the cookie no longer matches) — useful and
also a gotcha: changing `INVITATION_CODE` logged-out every guest.

### `proxy.ts` decision flow (numbered, matches the file order)

`src/proxy.ts` runs on every path (`export const config = { matcher: "/:path*" }`, `proxy.ts:76-78`):

1. **Fail closed.** If `INVITATION_CODE` or `ADMIN_PASSWORD` is unset → `503` with body
   "Error de configuración: Faltan credenciales en .env" (`proxy.ts:11-21`). The site never
   serves content with a missing config — it cannot be bypassed by deleting env vars.
2. **Test-route block in prod.** If `pathname === "/test"` or starts with `/api/test` **and**
   `NODE_ENV !== "development"` → `404` ("Not Found") (`proxy.ts:23-29`). The `/test` and
   `/api/test/*` debug surfaces are dev-only.
3. **Whitelist (pass-through, no auth).** `pathname` starts with `/_next`, `/favicon.ico`,
   `/api/auth`, is exactly `/login`, or ends in a static-asset extension regex
   (`png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|css|js`) → `NextResponse.next()`
   (`proxy.ts:31-40`). Note `/api/auth/*` (the guest login endpoint) is public.
4. **Read cookies.** `siteAuth = site_auth`, `adminAuth = admin_auth` (`proxy.ts:43-44`).
5. **Guest gate.** If neither cookie is valid → for `/api/*` return `401` JSON; otherwise
   redirect to `/login` (`proxy.ts:50-59`). So **every protected API call without a valid
   cookie is 401**, and every protected page without a valid cookie bounces to login.
6. **Admin gate.** Define admin-auth routes exempt from the admin requirement:
   `pathname === "/api/admin/login" || pathname === "/api/admin/check" || pathname ===
   "/api/admin/logout"` (`isAdminAuthRoute`, `proxy.ts:64-67` — `logout` added WS12).
   Then a route needs admin **if** it's an `/api/admin/*` route that is *not* an auth route,
   **or** it's `DELETE /api/songs` (`isAdminRoute`, `proxy.ts:68-69`). If such a route is hit
   without `admin_auth` → `401` JSON "No autorizado. Requiere sesión de administrador."
   (`proxy.ts:71-76`).

### How the two logins work (correction of an earlier assumption)

The `/login` page is **single-form, guest-only**: `src/app/login/page.tsx` has one password
field that `POST`s `{ password }` to `/api/auth/login` (`login/page.tsx:26-30`) and on success
`router.push("/")` + `router.refresh()` (`login/page.tsx:39-40`). There is **no admin form on
`/login`**. The admin authenticates on the **`/admin` page itself**, which `POST`s to
`/api/admin/login` (`src/app/admin/page.tsx:114`). Two endpoints:

- `POST /api/auth/login` — body `{ password }`; compares to `INVITATION_CODE`; on match sets
  `site_auth` (httpOnly, 30d) and returns `{ success: true }`; on mismatch returns `401`
  `{ error: "Contraseña de acceso incorrecta." }`.
- `POST /api/admin/login` — body `{ password }`; compares to `ADMIN_PASSWORD`; on match sets
  `admin_auth` (httpOnly, 24h) and returns **`{ ok: true }`** (note: `ok`, not `success` —
  unlike the guest endpoint).
- `POST /api/admin/logout` (WS12) — no body; overwrites `admin_auth` with `maxAge: 0` to clear
  the cookie immediately and returns `{ ok: true }`. Whitelisted in `proxy.ts` (`isAdminAuthRoute`
  alongside `login`/`check`) so a sign-out from an already-expired session still succeeds (the
  admin-gate 401 cannot pre-empt the call that's discarding the stale cookie).

### Defense-in-depth: routes re-check the cookie themselves

`proxy.ts` is the edge wall, but every protected Route Handler **also** re-validates the
cookie before touching Supabase. This is belt-and-suspenders (in case the matcher is bypassed
or a route is elevated to public later). The consolidated implementation lives in
`src/lib/auth.ts` (extracted WS5 — previously this 503-config + 401-cookie boilerplate was
copy-pasted verbatim in every protected route):

- `requireGuestOrAdmin(messages?)` → `{ ok: true } | { ok: false, response }`. Reads
  `INVITATION_CODE` + `ADMIN_PASSWORD` (503 if either unset, fail-closed), then asserts
  `site_auth` cookie `=== INVITATION_CODE` **or** `admin_auth` cookie `=== ADMIN_PASSWORD`
  (401 otherwise). `AuthMessages` lets a route override the 503/401 body/`wrapOk` so each
  migrated route produces **byte-identical** error responses to its pre-refactor form (no
  client/server contract churn — see §10 #17).
- `requireAdmin(messages?, request?)` → admin-only; ADMITS a Bearer
  `Authorization: <ADMIN_PASSWORD>` header as an alternative to the cookie (used by
  `/api/admin/songs`). Logs a config error to the console when `ADMIN_PASSWORD` is unset
  (behavior inherited from the original admin routes).

**Migrated to the helpers (WS5):** `/api/rsvp`, `/api/songs`, `/api/youtube/search`,
`/api/admin/guests`, `/api/admin/songs`. **Deliberately NOT migrated (trusts proxy):**
`/api/admin/messages` (COMPENDIUM §3 caveat below — left as-is with an in-note). **Not
migrated (they are setters, not checkers):** `/api/admin/check`, `/api/admin/login`,
`/api/auth/login`. Patterns observed in the originals (still accurate as a description of
what the helpers do):

- **Guest-or-admin** check (both cookies accepted): `/api/songs` GET/POST/PATCH
  (`src/app/api/songs/route.ts:24-33`, `100-109`, `195-205`), `/api/youtube/search`
  (`src/app/api/youtube/search/route.ts:22-32`). Also each returns `503` if either env var is
  unset (`songs/route.ts:13-21`, `youtube/search/route.ts:11-20`).
- **Admin-only** check (`admin_auth` only): `/api/songs` DELETE
  (`src/app/api/songs/route.ts:300-308`), `/api/admin/songs` PATCH (cookie **or**
  `Authorization: Bearer <ADMIN_PASSWORD>` header, `src/app/api/admin/songs/route.ts:24-35`),
  `/api/admin/guests` GET (`src/app/api/admin/guests/route.ts:23-30`), and the new
  companion-management routes introduced for the admin Invitados tab:
  `POST /api/admin/guests/[guestId]/companions` (inserts one companion, no `MAX_COMPANIONS`
  enforcement — admin may add beyond the public 2-companion limit — then resyncs
  `guests.num_companions` to the live row count; `src/app/api/admin/guests/[guestId]/companions/route.ts`)
  and `DELETE /api/admin/guests/[guestId]/companions/[companionId]` (deletes one companion,
  verifies `companion.guest_id === guestId` to prevent cross-guest deletion, then resyncs
  `num_companions`; `src/app/api/admin/guests/[guestId]/companions/[companionId]/route.ts`).
  Both re-check `admin_auth` in-route (`requireAdmin({ wrapOk: true })`) on top of the proxy
  `proxy.ts:62-71` admin gate.
- **No in-route check** (trusts `proxy.ts` entirely): `/api/admin/messages` GET. Because
  `proxy.ts` already enforces `admin_auth` for all `/api/admin/*` except `login`/`check`
  (`proxy.ts:62-71`), the messages route has no auth code of its own. **Caveat:** if the
  matcher ever stopped covering `/api/admin/messages`, this route would become public. Keep
  that coupling in mind when touching the proxy.

### Why Supabase RLS is permissive and the proxy is the real boundary

`supabase/migration_update.sql:117-195` enables RLS on all tables but creates policies like
`USING (TRUE)` / `WITH CHECK (TRUE)` (e.g. `Anyone can view songs`, `Anyone can add songs`,
`Service role can manage songs`, `Service role can manage settings`) — i.e. RLS allows
everything for the anon/browser key. Guest reads even use
`email = current_setting('request.header.x-guest-email', true) OR TRUE` so the `OR TRUE`
makes the condition trivially true (`migration_update.sql:149-151`).

The reason this is safe-ish: **the browser is never given the service-role key.** The browser
client (`src/lib/supabase.ts:11-13`) uses the anon key; that anon key is gated behind
`proxy.ts`. Server Route Handlers use `createSupabaseServerClient()` which builds a client
with `SUPABASE_SERVICE_ROLE_KEY` (`supabase.ts:18-26`), and **the service-role key bypasses
RLS entirely**. So writes always go: client → (proxy cookie wall) → Route Handler (re-checks
cookie) → service-role client → DB (RLS irrelevant). The "real" enforcement is the cookie
equality check, performed twice. RLS exists mainly as a backstop and is intentionally open.

**Implication for changes:** do **not** try to secure a new route by tightening RLS — the
service-role key the server uses ignores it. Secure new routes the way the existing ones do:
(1) decide guest-or-admin tier, (2) re-check the cookie in the Route Handler, (3) if admin,
ensure the proxy covers it (it will, by the `/api/admin/*` rule) or add a `DELETE /api/...`
exception to `isAdminRoute`.

### Privilege separation summary

```
guest (site_auth)   can:  read homepage sections
                          GET /api/songs, POST /api/songs, PATCH /api/songs (vote)
                          GET /api/youtube/search
                          POST /api/rsvp
                          cannot: /api/admin/* , DELETE /api/songs , /admin* (proxy lets /admin
                                  page through if site_auth valid, but every admin data endpoint
                                  still 401s without admin_auth)

admin (admin_auth)  can:  everything a guest can, PLUS
                          GET /api/admin/guests, /api/admin/songs (PATCH), /api/admin/messages
                          DELETE /api/songs
                          full /admin dashboard
```

Note: `/admin` the **page** is reachable with `site_auth` alone (proxy step 5 only requires
*some* valid cookie). The page renders, but every data fetch hits an admin-gated endpoint
and 401s — so a guest visiting `/admin` sees the login form, not data. That is by design.

## 4. Database model

Schema lives in `supabase/`. Two SQL files — **see §10 for the run-order / idempotency
gotcha**; the short version: `schema.sql` creates the base tables + `submit_rsvp`/`vote_song`
procs, `migration_update.sql` is the idempotent supplement that adds `admin_settings`,
`song_likes`, and the `like_song`/`unlike_song`/`has_liked_song` procs. There is **one** Phone
enum mismatch worth noting: in the helpers below, staff a Postgres `guest_status` /
`guest_side`.

### Tables

#### `guests` (`supabase/schema.sql`, migrate-safe definitions in `migration_update.sql`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `name` | VARCHAR | required |
| `email` | VARCHAR | **UNIQUE** — the upsert key for `submit_rsvp` |
| `phone` | VARCHAR | nullable |
| `invitation_code` | VARCHAR | default `'almaychava'` |
| `status` | `guest_status` enum | `'pending' | 'confirmed' | 'declined'` (enum: `migration_update.sql:10-14`) |
| `num_companions` | INTEGER | resynced from the live `companions` row count by the admin companion add/delete routes (see §3) |
| `dietary_restrictions` | TEXT | nullable — **schema column retained but no longer collected by the public RSVP form**; the backend now sends `p_dietary: null` on every submit (see §5.1) |
| `message` | TEXT | nullable — **also the source of admin "Messages" data** (see §5) |
| `side` | `guest_side` enum | `'bride' | 'groom'`, nullable (enum: `migration_update.sql:16-20`) |
| `confirmed_at` | TIMESTAMPTZ | nullable; set to `NOW()` on confirm in `submit_rsvp` |
| `created_at` | TIMESTAMPTZ | default `NOW()` |
| `updated_at` | TIMESTAMPTZ | default `NOW()`, auto-updated by trigger |

Index: `idx_guests_invitation_code`, `idx_guests_status`, `idx_guests_email`
(`migration_update.sql:80-82`). TS interface: `Guest` in `src/lib/supabase.ts:31-45`.

#### `companions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `guest_id` | UUID FK→`guests.id` | `ON DELETE CASCADE` |
| `name` | VARCHAR | required |
| `dietary_restrictions` | TEXT | nullable — **schema column retained**; admin add-companion route inserts `null` (the public RSVP form no longer collects it) |
| `created_at` | TIMESTAMPTZ | default `NOW()` |

Index: `idx_companions_guest_id` (`migration_update.sql:83`). TS interface: `Companion`,
`supabase.ts:47-53`. There is **no unique constraint on (guest_id, name)** — `submit_rsvp`
rebuilds the set each time by `DELETE WHERE guest_id` then re-`INSERT`.

#### `songs` (migrated Spotify → YouTube)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `title` | VARCHAR(255) | required |
| `artist` | VARCHAR(255) | required |
| `youtube_video_id` | VARCHAR(100) | **UNIQUE** (`songs_youtube_video_id_key`); renamed from `spotify_id` |
| `thumbnail_url` | TEXT | nullable; renamed from `cover_url` |
| `added_by` | VARCHAR(100) | default `'Guest'`; the client sends `'Guest'` even when it shows `'Tú'` UI-side |
| `votes` | INTEGER | default `0`; clamped to `≥0` by `vote_song`/`unlike_song` via `GREATEST(0, …)` |
| `is_approved` | BOOLEAN | default `false` — admin moderation flag (set via `/api/admin/songs` PATCH) |
| `created_at` | TIMESTAMPTZ | default `NOW()` |

Dropped columns (legacy Spotify): `album`, `preview_url` (`schema.sql:77-78`, guarded in
`migration_update.sql:45-46`). Migrated so `spotify_id`/`cover_url` are gone unless an old DB
still has them (see idempotency). TS interface: `Song`, `supabase.ts:55-65`.

#### `song_likes` — one like per song per browser (`migration_update.sql:265-273`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `DEFAULT gen_random_uuid()` |
| `voter_id` | VARCHAR(64) | required; format `voter_<crypto.randomUUID()>`, stored in browser `localStorage['wedding_voter_id']` (`PlaylistSection.tsx:81-89`) |
| `song_id` | UUID FK→`songs.id` | `ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | default `NOW()` |

**Constraint:** `song_likes_voter_song_unique UNIQUE (voter_id, song_id)`
(`migration_update.sql:270`) — this is the mechanism that enforces one-like-per-browser.
`like_song` relies on this constraint to return `'already_liked'` via `EXCEPTION WHEN
unique_violation` (`migration_update.sql:302-317`). Indexes: `idx_song_likes_song_id`,
`idx_song_likes_voter_id` (`migration_update.sql:275-276`). **This table exists only in
`migration_update.sql`, not in `schema.sql`** — running `schema.sql` alone will not create it.

#### `admin_settings` — key/value JSONB config table (`migration_update.sql:62-66`)
| Column | Type | Notes |
|--------|------|-------|
| `key` | VARCHAR(100) PK | |
| `value` | JSONB | required |
| `updated_at` | TIMESTAMPTZ | default `NOW()` |

Seeded defaults — **✅ real values now (WS8); were drifted placeholders.** `ON CONFLICT (key)
DO NOTHING` preserves any value an admin set by hand. Aligned to `src/data/wedding.ts`:
- `wedding_date` → `{"date": "2026-09-12T18:00:00", "timezone": "America/Mexico_City"}`
- `couple_names` → `{"name1": "Alma", "name2": "Chava"}`
- `rsvp_deadline` → `{"date": "2026-08-15", "enabled": true}`
- `max_companions` → `{"limit": 2}`
- `site_status` → `{"maintenance": false, "rsvp_open": true}`

(The same real seed lives in both `schema.sql:122-128` and `migration_update.sql:75-81`.) To
scrub a DB that still holds the pre-WS8 drift (`Emerson`/`Plancarte`/`2025`), run
`supabase/migration_clean_admin_settings.sql` (DELETE the keys + re-INSERT truth
`ON CONFLICT DO UPDATE`; idempotent — also re-seeds the post-WS8 `2026-09-12T18:00:00` /
`2026-08-15` / `{"limit": 2}` values so the seed tracks any future `wedding.ts` edit). See §10 #4.

**The app does not read this table for rendering.** The live content source-of-truth is
`src/data/wedding.ts` (couple `Alma`/`Chava`, hashtag `25AnivAlmaYChava`, date
`2026-09-12T18:00:00` — `wedding.ts:8-16`). `admin_settings` is provisioned for a future
editable-config feature but is currently unused by client code; flag any change that starts
reading it.

### Procedures (RPC functions)

| Function | Params | Returns | Behavior | Source |
|----------|--------|---------|----------|--------|
| `submit_rsvp` | `p_name, p_email, p_phone, p_status, p_num_companions, p_dietary, p_message, p_side, p_companions JSONB` | UUID (guest id) | `INSERT … ON CONFLICT (email) DO UPDATE` (upsert by email), `DELETE` companions for that guest, then re-`INSERT` from the JSONB array. Sets `confirmed_at=NOW()`. | `migration_update.sql:202-243` |
| `vote_song` | `p_song_id UUID, p_delta INTEGER` | void | `UPDATE songs SET votes = GREATEST(0, votes+p_delta)`. **Effectively legacy** — the live like/unlike path uses `like_song`/`unlike_song` which manipulate `votes` themselves. Kept for backward compat. | `migration_update.sql:246-255` |
| `like_song` | `p_voter_id VARCHAR, p_song_id UUID` | TEXT: `'liked'` or `'already_liked'` | `INSERT INTO song_likes`; `songs.votes += 1`; on `unique_violation` returns `'already_liked'` (idempotent — safe to retry). | `migration_update.sql:302-317` |
| `unlike_song` | `p_voter_id VARCHAR, p_song_id UUID` | TEXT: `'unliked'` or `'not_liked'` | `DELETE FROM song_likes`; if a row was deleted, `votes = GREATEST(0, votes-1)`; else `'not_liked'` (idempotent). | `migration_update.sql:321-338` |
| `has_liked_song` | `p_voter_id VARCHAR, p_song_id UUID` | BOOLEAN | `EXISTS(SELECT …)` on `song_likes` for that (voter, song). Note: the live UI does not call this RPC — it instead queries `song_likes` directly server-side in `GET /api/songs` (`songs/route.ts:54-66`) and hydrates `isLikedByVoter`. | `migration_update.sql:341-353` |
| `update_updated_at_column` (trigger fn) | — | trigger | `NEW.updated_at = NOW()`; wired to `guests` via trigger `update_guests_updated_at` (`BEFORE UPDATE`, per-row). | `migration_update.sql:94-112` |

### RLS summary (`migration_update.sql:117-195`, `278-294`)

RLS is **enabled** on all five tables but the policies are permissive (`USING(TRUE)` /
`WITH CHECK(TRUE)`, plus the `OR TRUE` guest read). The "Service role can manage …" policies
let the service-role key do anything. Real enforcement is the cookie wall in `proxy.ts` + the
per-route cookie re-check (§3). See §3 for why tightening RLS is the wrong lever for security.

### Fresh-DB run order & the idempotency gotcha (full version — see §10 for the one-liner)

1. **Run `supabase/schema.sql`** to create `guests`, `companions`, `songs`, the core indexes,
   RLS, the `submit_rsvp` + `vote_song` procs, and the `update_updated_at` trigger.
   - ⚠️ It will **error at lines 74-75** (`ALTER TABLE songs RENAME COLUMN spotify_id TO
     youtube_video_id;` … `cover_url … thumbnail_url;`) on a fresh DB, because `schema.sql`
     *already creates* `songs` with `youtube_video_id` (`schema.sql:54-64`, column at line 58)
     and never had a `spotify_id` to rename. If your SQL runner stops on error, comment out /
     skip lines 74-75, or just proceed — the table is already correctly named.
2. **Run `supabase/migration_update.sql`** to add `admin_settings`, `song_likes`, the
   `like_song`/`unlike_song`/`has_liked_song` procs, safe `DO $$ IF EXISTS` rename guards
   (`migration_update.sql:26-43`), refresh indexes, re-create RLS policies cleanly, seed
   `admin_settings` defaults.

Single-file alternative: `migration_update.sql` is fully self-guarding **for the renames and
RLS**, but it does **not** `CREATE TABLE IF NOT EXISTS` for `guests`/`companions`/`songs` — it
assumes the base tables exist. So you still need `schema.sql` first for a truly fresh DB.

## 5. Request & data-flow lifecycle

### 5.1 RSVP submit (`src/app/api/rsvp/route.ts`)

```
RSVPSection form (client)  ──POST {name,email,phone,status,numCompanions,
                                    dietary,message,companions[]}──►  /api/rsvp
                                                                        │
   /api/rsvp POST  (src/app/api/rsvp/route.ts)
     1. validate name/email present; sanitize all text (utils.ts:43-52 sanitizeInput);
        validate email isValidEmail (≤150 chars)  (utils.ts:55-59).
        Char limits: name<100, phone<20, dietary<500, message<1000,
        companion name<100, companion dietary<500.
        ⚠️ dietary fields are now sent as `null` from the public form (the UI was
        removed post-launch); the limits + RPC parameter are kept for backward
        compat with any client that still sends them, but the live RSVPSection
        passes `p_dietary: null` and each companion's `dietary_restrictions: null`.
     2. supabase.rpc("submit_rsvp", {p_name, p_email, p_phone, p_status, p_num_companions,
         p_dietary, p_message, p_side, p_companions})   [p_side: null — see note]
         → returns guest UUID (upsert on email; companions swapped).
     3. IF isResendConfigured && status === "confirmed":
          send Resend email from SEND_FROM_EMAIL.
     4. respond { ok: true, guestId }.
GET /api/rsvp  → {status, name} or {status:"not_found"}  (used to pre-fill? see route)
```

**Note on `p_side`: null always.** The API payload passes `p_side: null`
(`rsvp/route.ts` ~116-126 per the summary) — the front-end RSVP form does **not** collect
bride/groom side, so `guests.side` is populated to `null` on submit. If a future requirement
asks "which side is this guest?", you'd add a field to `RSVPSection` and thread it to the RPC.

✅ **FIXED (WS2) — RSVP email no longer hardcodes `2025`.** `rsvp/route.ts` now imports
`{ weddingDate, weddingDetails, couple }` from `src/data/wedding.ts` and builds the email
date/times/venues/heading from those (renders `2026`, real ceremony/reception info,
`Alma & Chava`). `sendConfirmationEmail` receives the sanitized `cleanName` (already
HTML-escaped) instead of the raw `name`, closing the HTML-injection surface into the `html:`
body. The email reads pre-formatted strings from `wedding.ts` (not a `Date`→helper), so it is
**not** affected by the WS7 locale standardization — its visible output is unchanged. See §10
#3.

### 5.2 Song search → add → vote (the playlist)

**Search YouTube** (`src/components/sections/PlaylistSection.tsx`):
- The single search input accepts free text **or a pasted YouTube URL**.
- `extractYouTubeVideoId` matches 4 URL forms: `watch?v=`, `youtu.be/`, `embed/`, `shorts/`
  (`PlaylistSection.tsx:46-63`).
- Input is debounced 500ms (`searchYouTube` via `debounce`, `PlaylistSection.tsx:144-199`),
  then `GET /api/youtube/search?q=<query>`.
- `/api/youtube/search` (`src/app/api/youtube/search/route.ts`): re-checks guest-or-admin
  cookie (`:22-32`), needs `YOUTUBE_API_KEY` (`isYouTubeConfigured`, `:34`), calls YouTube
  Data API v3 `search?part=snippet&type=video&maxResults=10&videoEmbeddable=true` (`:53-54`),
  maps to `{videoId, title, artist(channelTitle), thumbnailUrl(medium|default)}` (`:72-77`).
  Returns `{videos:[…]}`.

**Add a song** (`PlaylistSection.handleAddFromYouTube` / `handleManualAdd`):
- Optimistic: insert `SongEntry` client-side, set a 3s success toast (`:280-315`, `:317-368`).
- `POST /api/songs` body `{title, artist, youtubeVideoId?, thumbnailUrl?, addedBy}`
  (`songs/route.ts:112-119`). Title/artist required + sanitized; limits title/artist ≤150,
  addedBy ≤100 (`:121-137`). Inserts with `is_approved:false` (`:144-153`). Returns `{song}`.
- Manual add with a URL derives `youtube_video_id` + thumbnail
  `https://img.youtube.com/vi/<id>/mqdefault.jpg` (`PlaylistSection.tsx:326-329`).

**Vote (like / unlike)** — one-per-browser via `voter_id`:
- `getVoterId()` (`PlaylistSection.tsx:81-89`): reads `localStorage['wedding_voter_id']`; if
  absent, generates `"voter_" + crypto.randomUUID()` and stores it. SSR-guarded
  (`typeof window === "undefined"`).
- `handleVote` optimistic-updates local `votes` + `isVoted` (`:235-246`), then `PATCH /api/songs`
  body `{songId, voterId, isLike}` (`:250-258`), then **`refreshSongs()`** to sync server truth.
- `/api/songs` PATCH (`songs/route.ts:183-281`): re-checks cookie, validates `songId`+`voterId`
  present, calls `supabase.rpc(isLike ? "like_song" : "unlike_song", {p_voter_id, p_song_id})`,
  maps result text → response: `liked`→`{liked:true}`, `already_liked`→`{liked:true, alreadyLiked:true}`,
  `unliked`→`{liked:false}`, `not_liked`→`{liked:false, notLiked:true}`
  (`songs/route.ts:256-265`). Because `like_song` is idempotent, double-submitting a like is
  safe.
- **Vote-count hydration:** `GET /api/songs?voterId=<id>` (`songs/route.ts:11-81`) queries
  `song_likes` for that voter's liked `song_id`s (`:54-66`) and stamps `isLikedByVoter`
  (`:68-71`). `PlaylistSection` reads `isLikedByVoter` → `isVoted` (`:111`). So the heart fill
  reflects *this browser's* like state.

**Play a song:** clicking a row opens a modal embedding
`https://www.youtube.com/embed/<youtube_video_id>?rel=0` (`PlaylistSection.tsx:686-695`),
plus an external "Ver en YouTube" link.

### 5.3 Admin moderation (`/admin` page, `src/app/admin/page.tsx`)

**Structure (post-WS6 refactor, elevated WS12):** `page.tsx` is the auth gate + a sticky
header (Refrescar / Cerrar sesión / Ver Sitio) + an icon-tab switch with a Framer `layoutId`
sliding pill + data wiring (one `useAdminFetch<T>` hook per endpoint + mutation handlers that
refetch the list from the server, which stays the single source of truth). The heavy UI lives
in `src/app/admin/_components/` (`AdminDashboard`, `AdminGuestsTable`, `AdminSongsTable`,
`AdminMessages`, `StatCard`, and — added WS12 — `StatusChip`, `AdminToolbar`, `SortHeader`,
`Pagination`, `States`, `AdminToast`), and the duplicated fetch/retry logic moved into
`src/hooks/useAdminFetch.ts` (returns `{data, loading, error, retry}`) with column sort in
`src/hooks/useTableSort.ts`. The `useAdminFetch` effect wraps its pre-flight + fetch chain in
`queueMicrotask(...)` to satisfy the `react-hooks/set-state-in-effect` lint rule; `retry()`
increments a tick to force a refetch. Mutations (approve/delete/add-companion) never mutate
local state optimistically — they call the server, then `retry()` (zero setState-in-effect on
the client), and surface success via the `AdminToast` provider. `window.confirm` → an
`AnimatePresence` delete modal; `alert` → inline `actionError` UI. Previously all of this was
a ~894-line God component with 3 duplicated `useEffect` fetch blocks and
`window.alert`/`confirm`/`location.reload()`.

The dashboard has 4 tabs (Dashboard / Invitados / Canciones / Mensajes):

- **Invitados** — `GET /api/admin/guests` (`admin/guests/route.ts`): admin check, fetches all
  `guests` (newest-first) + all `companions`, groups companions by guest, and computes `stats
  {total, confirmed, declined, pending, totalCompanions, confirmedCompanions, totalConfirmed}`
  (`:80-100` — `confirmedCompanions`/`totalConfirmed` added WS12). Returns
  `{ok:true, guests:[{guest, companions}], stats}`.
  - **Response-arisen table UX (WS12):** `AdminGuestsTable.tsx` is now responsive + sortable
    + searchable + filterable + paginated, zero new deps. Desktop (≥md) renders a real `<table>`
    with a **sticky `<thead>`** and a bounded-height scroll container; mobile (<md) renders
    stacked glass cards (no horizontal scroll — solves the reported overflow UX pain). Column
    headers are `SortHeader` buttons (`aria-sort`, lucide chevron) wired through
    `useTableSort`; the `AdminToolbar` provides a debounced search (name/email/phone) + status
    filter chips with live counts; `Pagination` offers a page-size selector (10/25/50).
    Expand/collapse moved from a row `<tr onClick>` to a real `<button>` (`aria-expanded` /
    `aria-controls`); `CompanionPanel` is the shared companion UI (list + inline add form +
    lucide `Trash2`/`Loader2` delete with a spinner on the mutating action). Successes confirm
    via `useToast`.
  - **Inline companion management (admin override of `MAX_COMPANIONS`):** unchanged backend —
    `AdminGuestsTable` calls the admin callers in `admin/page.tsx`
    (`handleAddCompanion` / `handleDeleteCompanion`) which hit
    `POST /api/admin/guests/[guestId]/companions` and
    `DELETE /api/admin/guests/[guestId]/companions/[companionId]` (both registered in §3).
    These routes **do not apply the public `MAX_COMPANIONS = 2` limit** — the admin can add
    as many companions as the couple wants (the use case: ad-hoc "+1" by exception). After
    each insert/delete the route recounts `companions` for that guest and rewrites
    `guests.num_companions` so the dashboard totals stay in sync. Mutations refetch the
    Invitados list from `/api/admin/guests` (server stays the source of truth).
  - The dietary-restrictions row (`🍽 {companion.dietary_restrictions}`) was removed from the
    admin UI as part of the dietary-removal pass; the column still travels in the API
    response but is always `null` for new data.
- **Canciones** — the admin page reads the **public** `GET /api/songs` (not the PATCH-only
  `/api/admin/songs`). For actions:
  - `PATCH /api/admin/songs` (`admin/songs/route.ts`): admin auth (cookie **or** Bearer),
    body `{songId, isApproved}` → `UPDATE songs.is_approved`; returns `{song}`
    (`:59-72`).
  - `DELETE /api/songs?songId=<id>` (`songs/route.ts:287-350`): admin-cookie-only, returns
    `{success:true}` (`:336`). Note proxy.ts also gates this (`isAdminRoute` includes
    `DELETE /api/songs`, `proxy.ts:64`).
- **Mensajes** — `GET /api/admin/messages` (`admin/messages/route.ts`): **no in-route auth**
  (trusts proxy), derives from `guests.message`:
  `.not("message","is",null).neq("message","")`, ordered `created_at desc`. Returns
  `{ok:true, messages:[{id, guestName, guestEmail, message, status, createdAt}]}`. There is
  no separate `messages` table — messages live on `guests.message`.

⚠️ **Message overwrite on RSVP re-submit:** because `submit_rsvp` upserts by email and the
`guests.message` column is overwritten on every submit, a guest who re-answers RSVP will
**replace** their previous message. The admin sees only the latest message per email. Document
this if a future requirement wants message history (would need a separate `messages` table).

### 5.4 Invitation card generation (post-RSVP, client-side)

`InvitationCard` is rendered inside `RSVPSection` after a successful confirm
(`RSVPSection.tsx:8` import, `:148` usage). To produce a downloadable PNG **without showing
the card**, it renders the card off-screen (`left:-9999px`, 600×820) and captures it with
**`html2canvas`** (`InvitationCard.tsx:4` import):
`html2canvas(cardRef.current, { scale:2, useCORS:true, backgroundColor:"#F6F5F8", logging:false })`
→ downloads `invitacion-<couple.name1>-<couple.name2>-<guestName>.png`. Date/time rendered
**es-MX** (per summary lines 29, 36 → flag locale inconsistency in §10).

Note: do **not** confuse this with the QR the photo section shows — that's a different library.

### 5.5 Photo upload (`src/components/sections/PhotoUploadSection.tsx`)

- Uses the **Cloudinary upload widget** with an unsigned upload preset (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` +
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `config.ts:46-49`). Upload is client-direct to
  Cloudinary (no server route in the write path; there is a dev-only `/api/test/cloudinary`
  probe).
- A **Google Photos album** link is surfaced as a **QR code** via `qrcode.react`'s `QRCodeSVG`
  (`PhotoUploadSection.tsx:5` import, `:290` usage: `<QRCodeSVG value={googlePhotosConfig.albumUrl || "https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9"} size={180} level="H" />`).
  So **`qrcode.react` is used here, not in `InvitationCard`**; `InvitationCard` uses
  `html2canvas` only.

## 6. Front-end section pipeline & rendering

### 6.1 Section order on the homepage (`src/app/page.tsx:66-74`)

```
HeroSection → CountdownSection → DetailsSection → StorySection → DressCodeSection
→ LocationSection → PhotoUploadSection → RSVPSection → PlaylistSection → Footer
```

Note the non-obvious ordering: **`PhotoUploadSection` comes before `RSVPSection`**
(`page.tsx:72-73`), and `RSVPSection` mounts `InvitationCard` (`:73` → `RSVPSection.tsx:148`).
`PlaylistSection` is last (`:74`).

### 6.2 Shared shells (rendered on every page load, `page.tsx:56-63`)

| Shell | File | Role |
|-------|------|------|
| `BokehBackground` | `src/components/shared/BokehBackground` | Animated blurred-light background |
| `FloatingPetals` | `src/components/shared/FloatingPetals` | Falling-petal overlay (also on `/login`) |
| `PageAnimations` | `src/components/shared/PageAnimations` | GSAP ScrollTrigger entrance animations |
| `Navigation` | `src/components/shared/Navigation` | Top nav from `wedding.ts:123-132` `navigation[]` |
| `Footer` | `src/components/shared/Footer` | Footer content |
| `PageSkeleton` | `src/components/shared/PageSkeleton` | Loading overlay (see 6.4) |

### 6.3 Server vs client component map

`page.tsx` is a **client component** (`"use client"`, `page.tsx:1`); it composes section
components, most of which are themselves `"use client"` (RSVP, Playlist need state + `fetch`).
The whole homepage ships as one client-rendered tree (auth-gated by `proxy.ts` before render).
`login/page.tsx` and `admin/page.tsx` are also client components (forms + `fetch` + `router`).
Static content data (`src/data/wedding.ts`) is imported directly by client components rather
than being fetched — that file is the frontend content source-of-truth (§4).

### 6.4 Loading strategy & the FOUC fix

There are **two distinct loading layers**, both intentional:

1. **Next-level SSR hydration** — the SSR HTML is real content (see 6.5).
2. **`PageSkeleton` overlay + `isPageReady` gate** (`page.tsx:30-52`):
   - `isPageReady` starts `false`. A `useEffect` sets it `true` after a **100ms** `setTimeout`
     (`page.tsx:36-38`). The comment explains this lets GSAP/Framer modules initialize first.
   - The skeleton is a `fixed inset-0 z-50` overlay that **fades** (`transition-opacity
     duration-500`) from `opacity-100` to `opacity-0` + `pointer-events-none` when ready
     (`page.tsx:46-52`).
   - Because real content is always mounted behind the overlay, ScrollTrigger can measure real
     section positions from t=0.

3. **Per-section skeletons (#FOUC)** — `PlaylistSection` shows `SkeletonCard variant="song"`
   while `loading` (`PlaylistSection.tsx:546-552`) before swapping in the fetched list.
   A global `section { opacity: 1 !important }` (in `globals.css`, per the plan/README) pins
   section opacity so GSAP `opacity:0` initial states can't leave a section invisible if JS
   fails to run (the FOUC fix).

### 6.5 GSAP dynamic-import SSR guard

`PageAnimations` dynamically imports GSAP/ScrollTrigger on the client only (so the server
build doesn't execute `window`-dependent code). The pattern: guard with
`typeof window !== "undefined"` (same pattern as `getVoterId` at
`PlaylistSection.tsx:82`). The invariant to preserve: **GSAP sets elements to `opacity:0`
before animating them in on scroll.** If for any reason ScrollTrigger doesn't fire (e.g.,
script blocked, section measured wrong because it was display:none), those elements stay
invisible. The `section { opacity: 1 !important }` rule is the safety net that guarantees
content is never permanently hidden. When editing animations, **don't remove the `!important`
opacity reset** — it is the fallback that makes the site degrade gracefully.

### 6.6 Navigation source

`Navigation` reads `navigation[]` from `wedding.ts:123-132`: Inicio/Detalles/Historia/
Vestimenta/Ubicación/Fotos/RSVP/Playlist (8 items). Changing nav labels/anchors = edit that
array. Note these are **anchor links** (`#hero` etc.), so the section `id`s must match the
`href`s. New sections must (a) render a matching `id` and (b) be appended to `navigation[]`
(see recipe §11a).

## 7. External integrations matrix

| Integration | Purpose | Client or server | Env keys | Config block | Graceful-degradation behavior |
|-------------|---------|-------------------|----------|---------------|------------------------------|
| **Supabase (browser)** | Read/write from client components (anon key) | Client | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabaseConfig` (`config.ts:11-15`), `supabase` client (`supabase.ts:11-13`) | If `isSupabaseConfigured` is false, `supabase` is `undefined`; client code must guard. |
| **Supabase (server)** | All Route Handlers (service-role key, bypasses RLS) | Server | `+ SUPABASE_SERVICE_ROLE_KEY` | `createSupabaseServerClient()` (`supabase.ts:18-26`) | If `isSupabaseServerConfigured` is false, returns `undefined` + `console.warn`; routes that get `null` respond `503 "Backend no disponible."` (`songs/route.ts:166-169`) or `[]` (`songs/route.ts:39-41`). |
| **Resend** | Confirmation emails post-RSVP | Server | `RESEND_API_KEY`, `SEND_FROM_EMAIL` | `resendConfig` (`config.ts:17-20`), `isResendConfigured` (`:40`) | Email only sent when `isResendConfigured && status==="confirmed"` (`rsvp/route.ts`~143-147). Default `fromEmail` `boda@wedding.com` (`config.ts:19`). |
| **YouTube Data API v3** | Song search (10 results, embeddable videos) | Server | `YOUTUBE_API_KEY` | `youtubeConfig` (`config.ts:26-28`), `isYouTubeConfigured` (`:44`) | If unset → `/api/youtube/search` returns `503 "YouTube no configurado."` (`youtube/search/route.ts:34-39`); the client shows `searchError`. **⚠️ the example key value in `.env.example` is real/leaked — rotate it (see §10).** |
| **Cloudinary** | Guest photo uploads (unsigned upload widget) | Client widget → Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `cloudinaryConfig` (`config.ts:46-49`) | If unset the widget won't initialize. Dev probe exists at `/api/test/cloudinary` (prod-blocked by proxy). |
| **Google Maps** | Location map (Embed) | Client/Embed | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `googleMapsConfig` (`config.ts:22-24`), `isGoogleMapsConfigured` (`:42`) | If unset, degrade to a static map/link. Coordinates in `wedding.ts:25,33` (Parroquia San Cristóbal — Parroquia San Cristóbal, Acapulco de Juárez; Jardín de Fiestas El Patio II, La Bocana). |
| **Google Photos** | Shared album link rendered as QR | Client link + QR | `NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL` | `googlePhotosConfig` (`config.ts:51-55`) | Falls back to default album `https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9` (`config.ts:54`). QR via `QRCodeSVG` (`PhotoUploadSection.tsx:290`). |
| **Site URL** | Canonical URL (metadata) | both | `NEXT_PUBLIC_SITE_URL` | `siteConfig.url` (`config.ts:8`, default `http://localhost:3000`) | Used in `layout.tsx` metadata (`:36` per plan). **Not currently in `.env.example` — add it (see §11 / small-fixes).** |

**Failure mode taxonomy** — every external integration follows the same forgiving pattern:
config presence is computed **once** at module load (`is*Configured`), and each consumer
either (a) silently degrades (returns `[]`, a fallback value, or omits the email) or (b)
returns `503` with a Spanish error body. No integration throws into the client. Keep new
integrations to this pattern.

## 8. Design system

All design tokens live in `src/app/globals.css`. Tailwind is **v4** — there is **no
`tailwind.config.js`/`.ts`**; the CSS `@theme inline { … }` block at `globals.css:35-52`
maps raw CSS vars to Tailwind tokens (e.g. `--color-burgundy: var(--burgundy)` → utility
`text-burgundy`, `bg-burgundy`, `border-burgundy`).

### Colors (`globals.css:8-24`)

| Token | Hex | Tailwind utilities | Role |
|-------|-----|--------------------|------|
| `--ivory` | `#F6F5F8` | `bg-ivory` etc. | Page background base (cool pearl); `<body>` uses `bg-ivory` as the **no-JS fallback** — the live gradient is now a single `fixed` `bg-romantic` layer in `page.tsx` (see §8 *Animation system*) |
| `--champagne` | `#EAE8EE` | | Cool platinum (input borders, dividers) |
| `--blush` | `#E6DEE5` | | Cool mauve-mist / selection bg (`:151`) |
| `--rose` | `#D7CBD9` | | "Like"/error-soft accent (cool mauve) |
| `--burgundy` | `#722F37` | | **Primary text + buttons** (the warm anchor) |
| `--silver` | `#8A8F98` | `silver`/`silver-light`/`silver-dark` | **Mid cool steel — ornaments / script headings / accents (boda de plata)** |
| `--sage` | `#9CAF88` | | Tertiary accent (kept cool-green) |
| `--burgundy-light` | `#8C3A42` | derived (`:17`) | |
| `--silver-light`/`--silver-dark` | `#C5CBD3`/`#5C6168` | derived (`:18-19`) | bright platinum / deep pewter |
| `--sage-light` | `#B5C9A3` | derived (`:20`) | |
| `--background` | `= --ivory` (`:23`) | | |
| `--foreground` | `#3D3B40` (`:24`) | | Body text base (neutral charcoal) |

### Typography (`globals.css:27-29`, classes 103/107)

| Var | Family | Use |
|-----|--------|-----|
| `--font-display` | `"Cormorant Garamond", serif` | Headings (`.text-display`) |
| `--font-body` | `"Jost", sans-serif` | Body / UI (default on `body`, `:66`) |
| `--font-script` | `"Great Vibes", cursive` | Name/wordmark (`.text-script`) via `--font-script` |

Fonts are loaded via `next/font` in the layout (Google Fonts) — fonts referenced here are
the families applied. `.text-body`, `.text-display`, `.text-script` are the selector classes
used throughout components.

### Glassmorphism variants (`globals.css:76-92`)

| Class | Purpose |
|-------|---------|
| `.glass` (`:76`) | Standard translucent card |
| `.glass-strong` (`:84`) | Stronger blur/opacity (login card, search card) |
| `.glass-subtle` (`:92`) | Subtle (used for the "agregada" toast) |

The `GlassCard` component (`src/components/ui/GlassCard`) wraps these variants with a `variant`
prop (`default | strong | subtle`) + `padding` (`none | sm | default | lg`). It is a `"use client"`
`motion.div` — Framer owns the `transform` (`whileHover={{ y:-8, scale:1.02 }}`, spring
`stiffness 260 / damping 22 / mass 0.6`), and the box-shadow bloom lives in CSS
(`transition-[box-shadow] duration-500 ease-out hover:shadow-[…]`) so the two never fight (the
old `transition-all`-vs-`transition-shadow` twMerge conflict that snapped the lift is gone).
`interactive={false}` opts the map card out of hover lift/scale; `useReducedMotion()` makes cards
static under reduced motion. Used pervasively.

### Buttons & primitives

- `.btn-primary` (`globals.css:246`), `:hover` (`:265`), `:active` (`:270`)
- `.btn-outline` (`:274`), `:hover` (`:292`)
- `.section-padding` (`:226-229`) — `padding: 5rem 1rem; scroll-margin-top: 5.5rem;` (desktop:
  `8rem 2rem`, `:237-241`) — every `<section>` uses this; the `scroll-margin-top` makes
  anchor-link jumps clear the fixed nav.
- `.ornament-line` (`:301`) with `::before`/`::after` (`:308-309`) — the floral divider rule, now a silver gradient (recolored for the boda de plata).

### Keyframes / animations (`globals.css`)

| Name | Line | Use |
|------|------|-----|
| `gradientShift` | `:126` | Romantic background gradient pan (`.bg-romantic`) |
| `float` | `:158` | Floating decorative circles (login bg) |
| `petalFall` | `:164` | Falling petals (`FloatingPetals`) |
| `shimmer` | `:184` | Generic shimmer — silver tint `rgba(197,203,211,0.35)` |
| `skeletonShimmer` | `:189` | `SkeletonCard` loading shimmer |

Framer Motion (`motion`, `AnimatePresence`) handles enter/exit state animations in sections
(e.g. `PlaylistSection` `whileInView`, modal `AnimatePresence`). GSAP handles scroll-triggered
entrances in `PageAnimations`. The **the two animation systems coexist** — Framer for
component state transitions, GSAP for scroll-based reveals.

> **Motion-language convention (silver refactor):** entrances use Framer `ease: [0.16, 1, 0.3, 1]`
> (an Apple-like elegant curve); `whileInView` reveals go `opacity 0→1 + y 16→0`, ~0.6s; list
> children stagger ~0.08s. GSAP reveals stay FOUC-safe via `gsap.fromTo` / `gsap.set(el,{opacity:0})`
> after measurement — never a Tailwind `opacity-0` that persists if JS fails.

### Animation system (boda de plata presentation rework)

A reusable entrance + a richer, motion-aware backdrop. Pieces:

- **Global fixed `bg-romantic` (`src/app/page.tsx`)** — the first child of `<main>` is a
  `fixed inset-0 -z-10 bg-romantic` layer. Because `.bg-romantic` has `background-size:400% 400%`
  (`globals.css:125`), sizing it against the **viewport** (not the tall document) yields the rich
  gradient in *every* viewport, stationary on scroll — no edge ever crosses the viewport, so the
  Hero→Countdown seam is gone. `<body>` (`layout.tsx`) is now `bg-ivory` (the no-JS fallback);
  `HeroSection` dropped its own clipped `bg-romantic` copy. `login/`, `admin/`, and the
  `PageSkeleton` keep their **own** `bg-romantic` page divs, so no route loses its backdrop.
- **`Reveal` (`src/components/shared/Reveal.tsx`)** — reusable Framer entrance: `whileInView`
  `opacity 0→1 + y 18→0` (optional `x` for lateral slides), project ease `[0.16,1,0.3,1]`, ~0.6s,
  `viewport={{ once:true, margin:"-80px" }}`, list stagger via `delay`. Under `useReducedMotion()`
  it renders a plain `<div>` (content never hidden — FOUC-safe). Replaces the copy-pasted inline
  reveals in `DetailsSection` / `LocationSection` / `DressCodeSection`.
- **`usePrefersReducedMotion` (`src/hooks/usePrefersReducedMotion.ts`)** — SSR-safe `useSyncExternalStore`
  over `matchMedia('(prefers-reduced-motion: reduce)')`. The GSAP spots (`PageAnimations`,
  `StorySection`) use it; Framer spots use the built-in `useReducedMotion()`.
- **Layered hero parallax (`PageAnimations.tsx`)** — one `#hero` ScrollTrigger
  (`start top top / end bottom top / scrub`), each direct child of `.hero-content` drifts at a
  different `yPercent` (scroll-hint leaves fastest, ornament slowest). Early-returns under reduced
  motion; kills its timeline + ScrollTrigger + `load` listener on unmount.
- **Reduced-motion CSS (`globals.css`)** — a `@media (prefers-reduced-motion: reduce)` block clamps
  `animation/transition-duration` to `0.01ms` (stops `.bg-romantic`'s `gradientShift`,
  `.animate-float`, `.animate-shimmer`, `.skeleton-shimmer`). The JS-driven canvas
  (`FloatingPetals`) is *not* stopped by CSS — it is gated separately if needed. The
  `section{opacity:1!important}` FOUC net is untouched by this block.
- **Timeline (`StorySection.tsx`)** — the central line is **height-measured to the last node** and
  grown by a single track-scrubbed `gsap.timeline` (`trigger: track`, `scrub:1`), with a glowing
  "comet" tip riding the growing head and parking on the final dot. See the §10 gotcha.

### Silver-theme refactor (gold → silver — first pass; superseded)

> **Superseded** by the *Cool-platinum palette overhaul* subsection below. The warm foundation
> (`#FFFFF0`/`#F7E7CE`/`#F4C2C2`) and the light silver (`#C0C0C0`) it introduced failed contrast on
> the warm cream and were reworked into a cool platinum scheme. Kept here as the history of the
> gold→silver step.

The accent shifted from gold to **cool metallic silver** to match the silver-wedding theme. Token
rename in `globals.css`: `--gold/-light/-dark` → `--silver/-light/-dark`
(`#C5A55A/#D4BA7A/#A68B45` → `#C0C0C0/#DCDCDC/#9A9A9A`); the `@theme inline` entry is now
`--color-silver` (utilities `text/bg/border/ring/accent-silver`, plus `from/via/to-silver`). The
sweep covered every section plus the login + admin UIs and the Cloudinary widget accent hexes
(`PhotoUploadSection.tsx`). Items beyond the token sweep (hand-fixed because they bypassed tokens):

- **`InvitationCard.tsx`** — ~17 inline `#C5A55A` and `rgba(197,165,90,…)` → `#C0C0C0` / `rgba(192,192,192,…)`; the card gradient was de-saturated toward champagne so the silver ornaments read cleanly (PNG still verifies readable).
- **`GoogleMapEmbed.tsx`** — map filter cooled to a neutral/platinum cast `saturate(78%) brightness(106%) contrast(96%)`; silver marker + spinner.
- **`src/data/wedding.ts`** — palette swatch `{ name: "Gold", color:"#C5A55A" }` → `{ name:"Plata", color:"#C0C0C0" }` (rendered by `DressCodeSection`).
- **Quotes removed:** the Caperucita Roja quote in `Footer.tsx` and the scripture verse in `CountdownSection.tsx`. The `PlaylistSection` success-toast title quotes are intentionally kept.
- **Glass / motion polish:** `.glass*` gained a top-inner highlight `box-shadow: inset 0 1px 0 rgba(255,255,255,0.55)`; `GlassCard` gained `hover:-translate-y-1` + a refined shadow (cascades to every card); `.btn-*:active { transform: scale(0.97) }`; a global `:focus-visible { outline: 2px solid var(--silver); outline-offset: 2px }`; `BokehBackground` hues cooled to champagne→platinum / lower saturation for a silver sheen; `HeroSection` subtitle "¡Boda de plata!" is a silver gradient with `bg-clip-text`; `StorySection` timeline line/dots/year are silver with refined `expo.out` reveals.
- **New component:** `ScrollProgress.tsx` (`src/components/shared/`) — a thin silver `Framer useScroll` progress bar at the top, rendered in `page.tsx` before `Navigation` (decorative, `pointer-events-none`, never hides content).

The **only** remaining `#C5A55A` repo-wide is the server-rendered RSVP confirmation email HTML in
`src/app/api/rsvp/route.ts` (`:204,209,215`) — intentionally out of scope (this was a front-end-only
change). `rg "gold" src` returns nothing; `rg "C5A55A" src` returns only that email route.

### Cool-platinum palette overhaul (boda de plata — this change)

The gold→silver recolor kept the original **warm** foundation (cream/champagne/blush), so the cool
neutral silver read as dingy gray on warm cream and fell to **~1.3:1 contrast** for the display/script
text (`text-silver` drives names, ornaments, venue names, admin pending badges). To make the
*boda de plata* silver harmonize and read comfortably, the **entire foundation moved cool** into a
platinum/frost scheme and the default silver was **deepened to a mid cool steel** (burgundy is kept as
the deliberate warm anchor). New token values in `globals.css:8-24`:

| Token | New hex | Role |
|-------|---------|------|
| `--ivory` (bg) | `#F6F5F8` | cool pearl base — silver glows against it |
| `--champagne` | `#EAE8EE` | cool platinum (gradient mid, scrollbar thumb) |
| `--blush` | `#E6DEE5` | soft cool mauve-mist (selection bg) |
| `--rose` | `#D7CBD9` | cool mauve |
| `--silver` (default) | `#8A8F98` | **mid cool steel** — ornaments/text, ~3:1 on pearl (AA-large) |
| `--silver-light` | `#C5CBD3` | bright platinum (shimmer/highlights) |
| `--silver-dark` | `#5C6168` | deep pewter — high-contrast small text/dots, ~5.7:1 (AA-normal) |
| `--foreground` | `#3D3B40` | neutral charcoal (was warm brown `#3D2B2B`) |
| `--burgundy` / `--sage` | `#722F37` / `#9CAF88` | kept (warm anchor / cool-green accent) |

`.bg-romantic` now pans pearl → platinum → mauve → pearl. Glass borders carry a faint cool tint
`rgba(205,212,222,*)`; `.animate-shimmer` → `rgba(197,203,211,0.35)`; `.skeleton-shimmer` → cool
platinum; hover shadows on `GlassCard`/`StorySection` moved from burgundy to cool pewter.

Hand-fixed (they bypass tokens):
- **`InvitationCard.tsx`** — card gradient → `#F6F5F8`/`#EAE8EE`/`#E6DEE5`; all inline silver → pewter
  `#5C6168` (+ `rgba(92,97,104,*)`) for crisp print contrast on the html2canvas **PNG**; html2canvas
  `backgroundColor` → `#F6F5F8`.
- **`PhotoUploadSection.tsx`** — Cloudinary widget palette (`#F6F5F8`/`#EAE8EE`/`#8A8F98`) + cool-mauve
  cancel-hover; QR unchanged.
- **`BokehBackground.tsx`** — hues pushed to frost `200..255` / saturation `6..16` (frosted silver sheen).
- **`FloatingPetals.tsx`** — two petals → cool mauve/pearl, one → warm-champagne, one → sage (flowers
  don't read gray).
- **`HeroSection.tsx`** — "¡Boda de plata!" gradient now `#C5CBD3→#8A8F98→#5C6168` (metallic pewter
  sweep) + steel drop-shadow.
- **`GoogleMapEmbed.tsx`** — filter → `saturate(62%) brightness(105%) contrast(95%)` (cool neutral-platinum).
- **`src/data/wedding.ts`** `dressCode.palette` — Champagne → `Platino #EAE8EE`, Plata → `#8A8F98`,
  Dusty Rose → `Mauve #D7CBD9` (Burgundy/Sage/Navy kept).
- **DressCode palette further simplified (Cocktail Elegante, per
  `docs/silver_wedding_dress_code.md`)** — the current `palette` array is `Plata #8A8F98`,
  `Platino #EAE8EE`, `Blanco #FFFFFF`, `Negro #2C3E50`, `Gris #5C6168` (silver / white / black
  at varying opacities); subtitle became `Cocktail Elegante — Bodas de Plata`, description
  reads `Plata, blanco y negro` (one bright piece, the rest simple/polished). The platinum
  accent the app surfaces throughout is `#8A8F98` (the `--silver` token).
- **`layout.tsx`** — `themeColor` meta → `#F6F5F8`.

**Tailwind v4 note:** an unknown/misspelled `@theme` token silently emits *no* utility CSS, so a passing
build does **not** prove the recolor renders — verify by grepping the compiled production CSS
(`.next/static/css/*.css`) for the new hexes. `rg "gold" src` returns nothing; `rg "C5A55A" src`
returns only the RSVP email route (still the only `#C5A55A` repo-wide, intentionally out of scope).

### The FOUC safety rule (critical)

```css
/* globals.css:231-235 */
section { opacity: 1 !important; }
```
The comment (es) states: "GSAP and framer-motion improve the entrance but must not hide
content." This `!important` overrides any GSAP `opacity:0` initial state so content is **never
permanently invisible** if JS fails. Do not remove it. (See §6.5.)

### `cn()` utility

`src/lib/utils.ts:4-6` — `twMerge(clsx(inputs))` — the standard conditional-class merge. Use
`cn(...)` for any className composition.

## 9. Build, run, deploy

### Scripts (`package.json:5-10`)

| Script | Command | Use |
|--------|---------|-----|
| `dev` | `next dev` | Local dev server (also unblocks `/test` + `/api/test/*` via `NODE_ENV==="development"`, `proxy.ts:24`) |
| `build` | `next build` | Production build |
| `start` | `next start` | Run the production build |
| `lint` | `eslint` | Lint (ESLint 9, `eslint-config-next` 16.2.7) |
| `typecheck` | `tsc --noEmit` | Type-check without emitting (added WS1; `tsconfig.json` is `noEmit:true`) |
| `typecheck:build` | `tsc --noEmit && npm run build` | Type-check + build as one gate (WS1) |

The **repeatable gate** run between every risky workstream (and as the final gate): `npm
run lint` (0 errors/0 warnings) → `npx tsc --noEmit` → `npm run build` (succeeds; proxy fails
closed at *runtime*, not build time, so build needs no env). There is no test script.

### Runtime versions (`package.json:11-35`)

- **Next.js `16.2.7`** (`:19`), **React `19.2.4`** (`:21-22`) — pinned, not `^`.
- Supabase `@supabase/supabase-js ^2.107.0`, `framer-motion ^12.40.0`, `gsap ^3.15.0`,
  `resend ^6.12.4`, `lucide-react ^1.17.0`, `html2canvas ^1.4.1`, `qrcode.react ^4.2.0`,
  `nanoid ^5.1.11`, `clsx ^2.1.1`, `tailwind-merge ^3.6.0`.
- Dev: **Tailwind v4** (`tailwindcss ^4` + `@tailwindcss/postcss ^4`), `eslint ^9`,
  `typescript ^5`. **No `tailwind.config.*`** — v4 CSS config (§8).

### Path alias (`tsconfig.json:21-23`)

`"@/*": ["./src/*"]` — import from `src/` as `@/lib/supabase`, `@/components/sections/…`, etc.
`target: ES2017`, `strict: true`, `moduleResolution: bundler`. `@/*` is the only alias.

### `next.config.ts` (`next.config.ts`)

- `allowedDevOrigins: ['192.168.1.9']` (`:4`) — author's LAN dev origin.
- `images.formats: ['image/avif','image/webp']`, `remotePatterns` for `img.youtube.com`,
  `*.supabase.co`, `*.res.cloudinary.com` (`:6-22`) — **any new external image host must be
  added here** or `next/image` (and proxy) may block it.
- `headers()` adds `X-Content-Type-Options:nosniff`, `X-Frame-Options:SAMEORIGIN`,
  `Referrer-Policy:strict-origin-when-cross-origin` for `/.*` (`:25-44`) — these are set by
  Next at runtime **in addition to** the same headers declared statically in `vercel.json`
  (redundant-but-harmless).

### Vercel (`vercel.json`)

```json
{ "name": "wedding-site", "framework": "nextjs", "regions": ["iad1"],
  "headers": [{ "source": "/(.*)", "headers": [{"key":"X-Content-Type-Options","value":"nosniff"}] }] }
```
- Project name in Vercel config: `wedding-site` (note: differs from `package.json` `name`
  `wedproject` — cosmetic, only affects the Vercel project label).
- Region pinned `iad1` (Washington D.C.) — Supabase/Resend latency should be measured against
  this; moving the project region changes that.
- `X-Content-Type-Options: nosniff` is set on Vercel's edge (static, `vercel.json`) **and**
  re-declared in `next.config.ts` headers (runtime). Either suffices; both kept intentionally.

### Vercel env-var scoping

Because `proxy.ts` runs on the edge for every request (`matcher: /:path*`) and fails closed
if `INVITATION_CODE` / `ADMIN_PASSWORD` are missing (`proxy.ts:15-21`), these two vars must
exist and be set in **every deployment environment** the proxy runs in (Vercel: ensure they're
not scoped to "Development" only — set them for Production + Preview). Server-only keys
(`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `YOUTUBE_API_KEY`, `ADMIN_PASSWORD`) must
**not** be prefixed `NEXT_PUBLIC_` (they'd ship to the browser). Browser-needed keys
(`NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `_CLOUDINARY_*`, `_GOOGLE_MAPS_*`,
`_GOOGLE_PHOTOS_ALBUM_URL`, `_SITE_URL`) must be `NEXT_PUBLIC_`.

## 10. Gotchas & conventions

Non-obvious traps, collected. Each is verifiable; severity flagged.

1. **✅ FIXED (WS8) — `schema.sql` was NOT idempotent on a fresh DB.** `supabase/schema.sql`
   creates `songs` already with `youtube_video_id`, so the old `schema.sql:74-75` did
   `ALTER TABLE songs RENAME COLUMN spotify_id → youtube_video_id` (and `cover_url →
   thumbnail_url`) **with no `IF EXISTS` guard** — on a fresh DB there was no `spotify_id` to
   rename → `column "spotify_id" does not exist`. **Now both files wrap the renames in
   `DO $$ … IF EXISTS …`** (`schema.sql` matches the guard `migration_update.sql:26-43`
   already had), so `schema.sql` runs clean on a fresh DB with no error to tolerate.
   **Run order for a fresh DB: `schema.sql` first (creates base tables + `submit_rsvp`/
   `vote_song` + trigger + safe renames), then `migration_update.sql`** (adds
   `admin_settings`, `song_likes`, `like_song`/`unlike_song`/`has_liked_song`, clean RLS). To
   clean a DB that already has the pre-WS8 drifted `admin_settings` rows, also run
   `migration_clean_admin_settings.sql` (idempotent). `migration_update.sql` alone is
   insufficient — it assumes the base tables exist. *(Was: blocks fresh setup.)*

2. **`song_likes` only exists in `migration_update.sql`.** Forgetting the second file means
   likes break at runtime (`like_song` RPC errors). Always pair the two. *(Severity: runtime
   like/unlike failure.)*

3. **✅ FIXED (WS2) — RSVP confirmation email used to hardcode the year `2025`.**
   `rsvp/route.ts` now imports `{ weddingDate, weddingDetails, couple }` from
   `src/data/wedding.ts` and builds the email date/time/locations/heading from those (renders
   `2026`, real ceremony/reception times + venues, `Alma & Chava`). `sendConfirmationEmail`
   receives the sanitized `cleanName` (already HTML-escaped) instead of the raw `name`
   (defense-in-depth against injection into the `html:` body). Recipe see §11d. *(Was: bugs
   the one user-facing email.)*

4. **✅ FIXED (WS8) — `admin_settings` seed values were placeholders/drifted.** Both
   `schema.sql:122-128` and `migration_update.sql:75-81` now seed the **real** values
   (`couple_names` → `Alma`/`Chava`, `wedding_date` → `2026-09-12T18:00:00`,
   `rsvp_deadline` → `2026-08-15`, `max_companions` → `{"limit": 2}`), aligned to
   `src/data/wedding.ts`. `ON CONFLICT (key) DO NOTHING` preserves any value an admin set
   by hand. To scrub a DB that already held the
   pre-WS8 drift (`Emerson`/`Plancarte`/`2025`), run `supabase/migration_clean_admin_settings.sql`
   (DELETE the keys + INSERT truth `ON CONFLICT DO UPDATE`; idempotent — also serves as the
   single fix-point when the wedding date/deadline/limit changes so a drifted DB lands on the
   new values). The app still does **not** read this table — live content source-of-truth
   remains `src/data/wedding.ts` (table is provisioned for a future editable-config feature). *(Was: silent content drift.)*

5. **YOUTUBE_API_KEY leak — document + rotate only (no history rewrite).** The real key
   leaked into git history in an earlier commit. **Status (WS9):** `.env.example` holds a
   placeholder (`your-youtube-api-key` only); a `git grep` for the Google-API-key pattern
   `AIza[0-9A-Za-z_-]{20,}` across all tracked files returns **zero** matches — no real key
   remains in the working tree (the only place a real key may live is git-ignored
   `.env.local`, which this repo never touches). **The only remaining action is manual and
   user-owned:** rotate in the Google Cloud Credential console (create a new key, revoke the
   leaked one) and update the deployed value on Vercel. This repo **intentionally does not
   rewrite git history** (`git filter-repo`/force-push out of scope). `.env.example` carries
   the rotate-reminder comment; never paste real secrets into docs — this compendium does not
   reproduce the value. *(Severity: a leaked credential — remediation is rotate, not rewrite.)*

6. **✅ FIXED (WS7) — Locale inconsistency: `es-ES` vs `es-MX`.** `src/lib/utils.ts` now
   standardizes on `es-MX` (the site is a México/CDMX wedding). Canonical helpers there:
   `SITE_LOCALE`, `formatDate`/`formatTime` (repurposed — they previously had zero callers),
  `formatSectionDate` (day/long-month/year), `formatAdminDate` (day/short-month). `HeroSection`,
  `InvitationCard`, and the admin tables/messages all import from `utils` — no more inline
  `toLocaleDateString("es-ES"|"es-MX", …)`. The **RSVP email is intentionally untouched**:
  it reads pre-formatted strings from `src/data/wedding.ts` (`"12 de Septiembre, 2026"`), not a
  `Date`→helper, so locale standardization does not alter its visible output. *(Was: cosmetic.)*

7. **GSAP opacity invariant + the `!important` rule.** GSAP ScrollTrigger sets elements to
   `opacity:0` before reveal. The CSS rule `section { opacity: 1 !important; }`
   (`globals.css:233-235`) is the **fallback** so content shows even if JS fails. Do **not**
   remove it, do not rely on `opacity:0` surviving past hydration, and when adding new
   scroll-animated elements keep `whileInView`/GSAP entrance + the `section` selector coverage.
   *(Severity: content visually disappears.)*

8. **`proxy.ts` fails CLOSED (503) if `INVITATION_CODE` or `ADMIN_PASSWORD` is unset.** This is
   correct security behavior but means **a misconfigured Vercel env silently takes the whole
   site down** with a Spanish config-error message — not a build error. If the site returns
   503 to everyone, check those two env vars on Vercel (Production + Preview). *(Severity:
   full-site outage on misconfig.)*

9. **Cookie = env var value; rotating a secret logs out every existing session.** Changing
   `INVITATION_CODE` invalidates all `site_auth` cookies; changing `ADMIN_PASSWORD`
   invalidates all `admin_auth`. Plan to communicate / pick a low-traffic rotation time. Also,
   because the cookie stores the **secret itself** (not a signed session id), the secret must
   be treated as something a guest will see in their cookie jar — it's the invitation code,
   which is shared. For `ADMIN_PASSWORD` especially, ensure it's strong and rotated if ever
   exposed. *(Severity: security posture.)*

10. **Test routes are prod-blocked.** `/test` and `/api/test/*` → `404` when
    `NODE_ENV !== "development"` (`proxy.ts:23-29`). Do not rely on them in production. The
    Cloudinary probe at `/api/test/cloudinary` is also subject to this.

11. **✅ FIXED (WS10) — `apple-icon.png` was referenced in metadata but never present on
    disk.** `layout.tsx` `metadata.icons` pointed at `/apple-icon.png` which existed in
    neither `public/` nor as an `app/apple-icon.*` file convention → 404 on iOS
    apple-touch-icon. The entire `metadata.icons` block was removed; `/favicon.ico` is still
    served by the `src/app/favicon.ico` **file convention**, which auto-emits the
    `<link rel="icon">` tag — no behavior lost. *(Was: cosmetic metadata.)*

12. **Two different capture/QR libraries — don't conflate them.** `InvitationCard` uses
    **`html2canvas`** (downloads a PNG card, `InvitationCard.tsx:4`). `PhotoUploadSection`
    uses **`qrcode.react` `QRCodeSVG`** (Google-Photos album QR, `PhotoUploadSection.tsx:5,290`).
    They are unrelated; adding "a QR" to a card would be a *new* library choice.

13. **`vote_song` is legacy — now explicitly marked DEPRECATED (WS8).** The live like/unlike
    path (`/api/songs` PATCH → `like_song`/`unlike_song` RPCs) updates `votes` inside those
    procs. `vote_song(id, delta)` (grep `src/` = 0 callers) still **exists** in both
    `schema.sql` and `migration_update.sql` for backward-compat with any external caller, but
    now carries a `-- DEPRECATED: …` comment header so it isn't re-wired by accident (it
    sums/subtracts with no per-browser tracking → double-counts). Do NOT route the live vote
    path through it — use the like/unlike procs. The proc is kept, not dropped (dropping risks
    an external caller). *(Severity: logic error if misused.)*

14. **Re-submitting RSVP replaces companions + message.** `submit_rsvp` deletes all
    `companions` for the guest and re-inserts (`migration_update.sql:231-239`), and overwrites
    `message` via upsert (`:219-228`). A guest who RSVPs again loses prior companions/message
    history. The admin Messages tab sees only the newest message per email. *(Severity:
    data-loss-on-edge-case.)*

15. **`page.tsx` is a client component; the homepage ships as one client tree.** No server
    components fetch data on the homepage — each section fetches its own data client-side
    (`PlaylistSection` → `/api/songs`, RSVP posts to `/api/rsvp`, etc.), all behind the
    `proxy.ts` cookie wall. There is no ISR/SSG of section content. *(Severity: architectural
    awareness.)*

16. **`/admin` page is reachable with a *guest* cookie** (proxy step 5 only needs *some* valid
    cookie), but every admin data endpoint 401s without `admin_auth`, so a guest lands on the
    admin **login form**, not data. This is intentional; don't "fix" it by blocking `/admin`
    for guests unless you want to hide the very existence of an admin panel.

17. **Response-shape inconsistency: `{success:true}` vs `{ok:true}`.** Guest login returns
    `{success:true}`; admin login + most admin endpoints return `{ok:true}`; `/api/songs`
    DELETE returns `{success:true}`. **Always read the specific route** before parsing a
    response — don't assume a global shape. *(Severity: client bug if assumed.)*

18. **RSVP `p_side` is always `null`.** The RSVP form never collects bride/groom; the
    `guests.side` column is effectively unused today. Don't assume it's populated.

19. **Timeline line is height-measured to the last node — don't restore `bottom-0`.**
    `StorySection.tsx` sets the `.timeline-line` height in JS to the center of the last
    `.timeline-dot` and grows it with a single track-scrubbed `gsap.timeline`
    (`trigger: track`, `start "top 80%"`/`end "bottom 75%"`, `scrub: 1`), so it grows
    continuously over the whole section and **ends exactly on the final node** (instead of
    overshooting to the container bottom and getting clipped). A glowing comet tip animates
    `y: 0 → lastDotCenterY` and parks on that node. Consequences: (a) **do not** put `bottom-0`
    back on the line (it re-overshoots); (b) **GSAP must own `transform`** on the line — the
    centering is done with a margin (`-ml-px`), **not** a Tailwind `transform md:-translate-x-px`
    (that fights `scaleY`); (c) the effect re-measures on `resize`/`load` (debounced +
    `ScrollTrigger.refresh()`) because the height depends on the last dot's live position;
    (d) it kills its timeline + all item/dot ScrollTriggers + listeners on unmount. *(Severity:
    visual regression / ScrollTrigger leak if ignored.)*

20. **Reduced-motion gate is split across two systems.** The `@media (prefers-reduced-motion:
    reduce)` block in `globals.css` only stops **CSS-driven** ambient motion
    (`gradientShift`, `.animate-float`, `.animate-shimmer`, `.skeleton-shimmer`). Framer reveals and
    the `GlassCard` hover use the built-in `useReducedMotion()` (each opts itself static); the GSAP
    spots (`PageAnimations`, `StorySection`) gate via `usePrefersReducedMotion()`. The canvas
    `FloatingPetals` is JS-driven (requestAnimationFrame) and is **not** covered by the CSS block —
    if it must stand down under reduced motion, gate it in component code. The invariant that stays
    regardless of flag: **content is always visible** — `Reveal` renders a plain `<div>`,
    `section{opacity:1!important}` holds, and the GSAP entrances degrade to opacity-only. When
    adding a new animation, pick the matching gate (Framer `useReducedMotion` / the hook) so the user
    preference is honored everywhere. *(Severity: accessibility regression.)*

21. **Turbopack dev-server manifest corruption → `global-error.js#default` not found.** In dev,
    Next.js 16 Turbopack can emit a corrupt/empty `_clientMiddlewareManifest.js` (root cause:
    `JSON.parse` → `Unexpected end of JSON input` in `manifest-loader.js:61`). The symptom is a
    secondary `Could not find the module ".../builtin/global-error.js#default" in the React Client
    Manifest` runtime error on any page, because the error-route handler itself depends on the same
    broken manifest. **The code is fine** — `npm run build` passes clean; only the dev cache is
    poisoned. **Fix:** `Remove-Item -Recurse -Force .next` (or `rm -rf .next`) and restart
    `npm run dev`. **Defensive:** `src/app/global-error.tsx` (added WS-prod-data) ships a custom
    Client-Component root error boundary that overrides the builtin, so even if the manifest bug
    recurs the user sees themed fallback UI (silver/burgundy) with a "Intentar de nuevo" reset
    button instead of a 500. The file renders its own `<html>`/`<body>` with inline styles (not
    Tailwind classes) so it works even when the CSS layer is unavailable. *(Severity: dev-only;
    production unaffected.)*

## 11. Change-Planning Playbook

Templated, low-risk recipes for the common modifications. Each recipe lists the exact files
to touch and the architectural implications so you can produce an action plan without
re-deriving the system. Cross-reference §3–§10 as needed. After reading a recipe, copy the
blank "action plan template" at the end of this section and fill it in for the specific
request.

Common rules that apply to **every** recipe:

- **Decide the trust tier** of any new endpoint (guest-or-admin vs admin-only) and mirror the
  existing cookie re-check pattern (§3). The proxy already covers `/api/admin/*`
  (admin-required) and `DELETE /api/songs` (admin-required); everything else is guest-or-
  admin by default.
- **Sanitize + bound-check** all user input server-side (`sanitizeInput`, `isValidEmail`, char
  limits — `utils.ts:43-59`, and the bounds in each POST handler).
- **Use the service-role client** for server writes (`createSupabaseServerClient()`); the
  browser client is read-mostly and anon-key.
- **Don't touch RLS** to add security — tighten the cookie wall + per-route check instead
  (service-role key ignores RLS anyway).
- **Re-run `npm run lint` and `npx tsc --noEmit`** after code edits; the doc edits should not
  change code, so a clean lint/typecheck is a sanity gate.
- **Cite `file:line`** in any reasoning you write — per `CLAUDE.md`, breakthroughs/reasoning
  go in a markdown file so context survives autocompact.

### (a) Add a new homepage section

1. Create `src/components/sections/<Name>Section.tsx` (`"use client"` if it needs state/fetch).
   Wrap content in `<section id="<anchor>" className="section-padding …">` (`section-padding`,
   `globals.css:226-229`). Use `SectionTitle`, `GlassCard`, `cn()`.
2. Import + render it in `src/app/page.tsx` at the desired position (`page.tsx:66-74` is the
   ordered list). Place relative to RSVP/Playlist (post-RSVP state depends on order).
3. Add `{ label, href: "#<anchor>" }` to `navigation[]` in `src/data/wedding.ts:123-132` so
   the nav link resolves (the anchor must match the section `id`).
4. Data-flow impact: none unless the section persists data → then also add an API route (recipe
   b) and decide a DB table (recipe c). Static content lives in `wedding.ts`.
5. If the section animates with GSAP ScrollTrigger, preserve the `section{opacity:1!important}`
   safety net (§6.5, §8) — don't make the section disappear if JS fails.
6. Verify: nav link scrolls to the section (`scroll-margin-top:5.5rem` handles the fixed nav);
   `npm run lint` / `tsc --noEmit` pass; the section renders behind the `PageSkeleton`
   overlay like the others.

### (b) Add a new API route

1. Create `src/app/api/<area>/<verb>/route.ts` exporting the HTTP method(s) you need
   (`export async function GET/POST/PATCH/DELETE`).
2. **Trust tier:** if it's admin-only, name it `/api/admin/<area>` (the proxy auto-gates it,
   `proxy.ts:62-71`) **or** if it's a guest-accessible verb on an admin resource like
   `DELETE`, add an exception clause to `isAdminRoute` in `proxy.ts:63-64`. For
   guest-or-admin, follow `/api/songs`'s pattern: re-check both cookies (`songs/route.ts:24-33`).
   For admin-only in-route, follow `/api/admin/guests` (`admin/guests/route.ts:23-30`).
3. Return `503` if a required env var is missing; `401` if the cookie is invalid (match the
   existing Spanish error bodies). Pick the response shape deliberately — `ok:true` for
   admin-area routes, `success:true` is seen on a few select routes; document which you use.
4. Use `createSupabaseServerClient()` and a service-role write.
5. Data-flow impact: add the route to the API Endpoints table in `PROJECT_STRUCTURE.md` and
   the README API reference; note its access tier + cookie-recheck behavior.
6. Verify: hit the route unauthenticated (expect 401/redirect), with guest cookie, with admin
   cookie; check the proxy actually intercepts it (it will, unless you whitelisted it — don't
   whitelist new data routes).

### (c) Add a new DB column / table

1. **Never edit `schema.sql`'s raw statements to "fix" the rename** — that's the idempotency
   trap (§10 #1). Instead, add the SQL to `supabase/migration_update.sql` as idempotent
   statements: `ALTER TABLE <t> ADD COLUMN IF NOT EXISTS …` / `CREATE TABLE IF NOT EXISTS …`,
   wrapped so re-running is safe. Add the matching index with `CREATE INDEX IF NOT EXISTS`.
2. Add/refresh the RLS policy **permissively** (`USING(TRUE)`) for the new column/table to
   match the existing posture; remember the real wall is the proxy, not RLS.
3. Create any RPC function with `CREATE OR REPLACE FUNCTION` (idempotent).
4. **Update the TypeScript interface** in `src/lib/supabase.ts` (the `Guest`/`Companion`/
   `Song` interfaces, `supabase.ts:31-65`) so server code types the new column. Add a new
   interface for a new table.
5. Data-flow impact: update any Route Handler that selects the new column; Supabase
   `select("*")` will include it automatically but the typed mapping in client code must add
   it.
6. Verify: re-run `migration_update.sql` against a dev DB (should be a no-op or apply cleanly);
   `tsc --noEmit` passes with the new interface; the new column appears in `/api/admin/guests`
   output (since it does `select("*")`).

### (d) Change wedding content / date / locations

1. The frontend source-of-truth is `src/data/wedding.ts`: couple names (`:8-12`), `hashtag`
   (`:14`), `weddingDate` (`:16`), `weddingDetails.ceremony`/`reception`
   time/location/address/coordinates (`:18-35`), `ourStory` (`:37-78`), `dressCode`
   (`:80-121`), `navigation` (`:123-132`). Edit these. The companion photo manifest lives
   in `src/data/couplePhotos.ts` (hero + 5 story photos, all `null` today → graceful
   absence in `HeroSection` / `StorySection` until the client delivers images).
2. **Also update the RSVP email copy** if you change the date/venues/hashtag. The email
   no longer hardcodes a year (✅ fixed in WS2 — it imports `weddingDate`,
   `weddingDetails`, `couple` from `src/data/wedding.ts` and renders `2026`, real
   ceremony/reception info, `Alma & Chava`). It does, however, read pre-formatted strings
   (`"12 de Septiembre, 2026"` — `wedding.ts:22,30`) rather than a `Date`→helper, so a date
   change means editing those strings too, not just `weddingDate`. See §10 #3, §10 #6.
3. **Decide about `admin_settings`.** If you want the couple to edit the date at runtime, wire
   the UI to read `admin_settings.wedding_date` and drop the static `wedding.ts` date (or
   keep `wedding.ts` as the fallback default). The seed is now `2026-09-12T18:00:00` /
   `2026-08-15` / `{"limit": 2}` / `almaychava` — if anything starts reading `admin_settings`,
   also update `schema.sql:122-128` and `migration_update.sql:75-81` (and re-run
   `migration_clean_admin_settings.sql` against drifted DBs) so the seed tracks the new
   value or you will reintroduce drift (§10 #4).
4. The Countdown section derives from `weddingDate` (verify its implementation when you touch
   the date) — ensure it reads `wedding.ts`, and `InvitationCard` likewise.
5. Verify: confirmation email date matches `weddingDate`; countdown target correct;
  `InvitationCard` PNG shows the new date (it formats es-MX, §10 #6); the admin dashboard
  doesn't show stale `2025` anywhere.

### (e) Change the invitation code or admin password

1. Edit the **Vercel env var** (`INVITATION_CODE` and/or `ADMIN_PASSWORD`) for Production +
   Preview. There is no code change — the values live only in env (defaults in
   `config.ts:30-31` are only fallbacks; don't rely on them in prod).
2. **Rotating invalidates existing sessions immediately** (cookie no longer equals the env
   var, `proxy.ts:46-47`) — every guest/admin is logged out and must re-enter. Plan
   accordingly. (§10 #9.)
3. Because the cookie *stores the secret*, treat the new value as semi-shared; for
   `ADMIN_PASSWORD` pick a strong value and don't emit it in logs/docs.
4. Verify: old cookie gets `401`/redirect to `/login`; new code logs in via
   `/api/auth/login`; new password via `/api/admin/login`; `proxy.ts` still gating (no env
   unset → no 503).

### (f) Modify the playlist voting logic

1. The current model is **one like per song per browser**, keyed by `voter_id` (localStorage
   `wedding_voter_id`, `PlaylistSection.tsx:81-89`) + the `song_likes(voter_id,song_id)`
   UNIQUE constraint (`migration_update.sql:265-273`). The like/unlike procs are idempotent.
2. To change the model (e.g. "allow 3 likes per song", or "one like per *logged-in guest
   email*"):
   - Per-guest-email: replace `voter_id` with the authenticated guest identity. This requires
     the guest to be identifiable — today `site_auth` alone doesn't tell you *which* guest;
     you'd need to capture the email at RSVP and bind votes to it. Add a column or a new
     `vote_identity` concept, a migration (recipe c), and thread the identity through
     `/api/songs` PATCH.
   - To allow N likes: change the UNIQUE constraint to a `CHECK`/count validator in a replaced
     `like_song` proc; bump the DB by editing `migration_update.sql` (recipe c) and update
     `like_song`'s `EXCEPTION unique_violation` logic.
3. Keep `vote_song` (legacy) untouched unless you also remove it deliberately — don't route
   the live vote path through it (§10 #13).
4. Update the client optimistic/refresh flow (`PlaylistSection.handleVote` `:231-278`) to
   match the new rule; always `refreshSongs()` after to sync server truth.
5. Verify: Rapidly double-clicking like does not double-count (the UNIQUE proc guards it);
   unliking clamps at 0; the vote count reflects the server's `songs.votes`.

### (g) Add an admin-dashboard tab

1. Add the tab to `src/app/admin/page.tsx` (the 4-tab dashboard is there: Dashboard /
   Invitados / Canciones / Mensajes). Render the new tab's UI + fetch its data.
2. Backend: add the supporting `/api/admin/<thing>` route (recipe b — it's auto-gated admin by
   the `/api/admin/*` rule). **Do not** forget the in-route `admin_auth` re-check
   (`admin/guests/route.ts:23-30` pattern) for defense-in-depth; `/api/admin/messages` is the
   exception that *only* trusts proxy — don't copy that pattern for new routes (§3).
3. Data-flow impact: if the tab needs new DB structure, add a migration (recipe c). If it shows
   existing `guests`/`songs` data, reuse the existing select — note `/admin` reads public
   `/api/songs` for the song list (§5.3).
4. Update `docs/COMPENDIUM.md` §5.3 (admin moderation) and `PROJECT_STRUCTURE.md` Admin
   Dashboard section to list the new tab.
5. Verify: guest cookie hits the new endpoint → 401; admin cookie → data; the tab renders in
   the dashboard and the proxy still gates it.

### (h) Add a new external integration

1. Add the env var(s) to `.env.example` **with placeholder values only** (never real keys,
   §10 #5). Add a `*Config` block + `is*Configured` flag to `src/lib/config.ts` following the
   existing pattern (`config.ts:5-55`). Use `NEXT_PUBLIC_` prefix iff the browser needs it.
2. Decide client vs server. Server: add a Route Handler (recipe b) that calls the API with
   the secret key server-side. Client widget (à la Cloudinary): load the vendor script + use
   the public key, no server in the write path.
3. Add graceful degradation: every consumer must handle `is*Configured === false` by either
   returning `503`/`[]`/a fallback, never throwing into the client (match the pattern in §7).
4. If the integration returns images, add its hostname to `next.config.ts` `images.remotePatterns`
   (`:8-22`) or `next/image`/proxy may block them.
5. Document in §7 (External integrations matrix), and note any failure modes in §10.
6. Verify: with the key unset, the feature degrades without errors; with it set, the call
   succeeds; secrets never reach the client bundle (grep the build output for the key).

### Verification legend (apply per recipe)

- **A** auth: guest can / admin can / 401 / redirect (§3)
- **B** build: `npm run lint` clean + `npx tsc --noEmit` clean (§9)
- **C** content: the change is visible in the right section / email / PDF, with the right date
- **D** data: re-running `migration_update.sql` is a no-op or applies cleanly; app reads the
  new column/table via the updated TS interface (§4, recipe c)
- **E** degrade: feature fails safely when its env/integration is absent (§7)

### Blank action-plan template (copy per request)

```
CHANGE REQUEST: <one line>

Goal / user-visible outcome:
  -

Trust tier of any new endpoint:  [guest-or-admin | admin-only | public]
Files to touch:
  - <path:line> — <what + why>
Migrations (if DB):             [idempotent additions to migration_update.sql + TS interface]
Proxy implications:             [new /api/admin/* auto-gated? new guest verb? matcher unaffected?]
Frontend impact:                [which section / nav[] entry / loading state / animation guard]
External integration impact:   [new env (placeholder-only)? remotePatterns? degrade path]
Doc updates (this file + README/PROJECT_STRUCTURE):
  - -

Verification:
  - [A] unauth → ___; guest cookie → ___; admin cookie → ___
  - [B] lint + tsc --noEmit clean
  - [C] visible outcome matches the goal (incl. correct year/date if relevant — see §10 #3,#4)
  - [D] migration idempotent; TS interface updated; data flows
  - [E] safe degradation when integration/env missing

Risks / gotchas to respect:
  - (list any §10 items that apply, e.g. #1 idempotency, #5 key rotation, #7 GSAP opacity)

Reviewer note: every claim above cites file:line so it can be checked against source.
```

---

*End of compendium. When this file drifts from the code, the code wins — update this file
(and `README.md` / `PROJECT_STRUCTURE.md` if affected) as part of the change. Per `CLAUDE.md`,
record breakthroughs/reasoning in markdown so context survives autocompact.*










