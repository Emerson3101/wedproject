# CLEANUP_LOG.md — Bitácora de la limpieza de deuda técnica

> Reglas del proyecto (CLAUDE.md / AGENTS.md): registrar cada avance y razonamiento
> en markdown hasta que termine la tarea; tras cada autocompact, este archivo
> restaura el contexto. **Cuando el código y los docs discrepan, el código gana**:
> al final (WS11) se sincronizan los docs. La fecha de hoy es 2026-07-10.

Session goal: *limpiar toda la deuda de código/técnica* del sitio de boda en vivo
(Next.js 16 / React 19). Alcance acordado con el usuario: **safe cleanup + safe
refactors** (cero errores lint/tsc/build, bugs concretos, ruido de debug, `any`,
refactors moderados) — **sin** reescrituras arriesgadas de arquitectura. Rotación
de la YOUTUBE_API_KEY filtrada = solo documentar (no rewrite de git history).
`admin_settings` drifted seed = borrar seed, conservar tabla.

Plan completo: `C:\Users\Emerson Plancarte\.claude\plans\during-this-session-we-iterative-mist.md`.

Gate repetible (corre entre cada workstream de riesgo): `npm run lint` → 0/0,
`npx tsc --noEmit -p tsconfig.json` → exit 0, `npm run build` → 18 páginas OK
(proxy falla *cerrado* en runtime, no en build; el build no necesita env).

---

## WS1 — Toolchain baseline ✅
- `package.json`: añadidos scripts `typecheck` (`tsc --noEmit`) y
  `typecheck:build`. Lint/tsc/build corrieron limpios. Los `<img>` crudos se
  convirtieron a `next/image` solo donde el host ya estaba en `remotePatterns`
  (`img.youtube.com`, en `admin` y `PhotoUploadSection`); el resto queda como
  `<img>` con `eslint-disable` justificado.

## WS2 — Bugs concretos de cara al usuario ✅
- **Email de confirmación hardcodeado (año 2025)**: `api/rsvp/route.ts` ahora
  importa de `src/data/wedding.ts` (`weddingDate`, `weddingDetails`, `couple`)
  — el email refleja 2026 / horarios / sedios reales. `sendConfirmationEmail`
  recibe `cleanName` (saneado, ya HTML-escapado) en vez del `name` crudo.
- **Leak de cleanup del widget Cloudinary**: `PhotoUploadSection`trackea el
  widget en `useRef` y lo destruye en cleanup.
- **`RSVPSection` `<section id="rsvp">` duplicado**: un solo wrapper, branch
  interno. Preserva el selector FOUC `section { opacity:1 !important }` y el
  `scroll-margin-top`.
- **`Song.thumbnail_url`/`youtube_video_id` no-anulables pero nullable en DB**:
  `src/lib/supabase.ts` ahora `string | null`.
- **`added_by` drift**: el server default alineado a `"Guest"` (schema.sql +
  cliente).

## WS4 — Dead code ✅
- `src/lib/config.ts`: borrado el export muerto `invitationCode` (nadie lo
  importaba; todos leen `process.env.INVITATION_CODE`; quitaba el literal
  `"boda2025"` footgun).
- `src/lib/utils.ts`: borrada `sleep()` (cero callers).
- `PhotoUploadSection.tsx`: quitados 2 `console.log` de debug (quedan los
  `console.error`/`warn` de server, intencionales).

## WS3 — Remover `any` ✅
- `PhotoUploadSection`: interfaces reales `CloudinaryWidget` /
  `CloudinaryUploadResult` discriminados por `result.event`.
- `StorySection.iconMap`: `Record<string, LucideIcon>`.
- `RSVPSection`: `status` casteado al union `"confirmed"|"declined"`, no `any`.
- `utils.ts debounce`: generic `(...args: never[]) => unknown` (quitado el
  `eslint-disable` de `no-explicit-any`).
- `api/test/cloudinary/route.ts`: `CloudinaryUploadResponse`, params sin usar.

## WS5 — Extracción de `src/lib/auth.ts` ✅
- Helpers `requireGuestOrAdmin()` y `requireAdmin(messages?, request?)`.
  `AuthMessages` permite sobreescribir bodies de 503/401 → cada ruta migrada
  produce respuestas byte-idénticas a las originales (preservación de contrato
  cliente/servidor, no se churnea la forma `{success}` vs `{ok}`).
- Migrados: `api/rsvp`, `api/songs`, `api/youtube/search`, `api/admin/guests`,
  `api/admin/songs`. `/api/admin/messages` queda **sin migrar por diseño**
  (confía en `proxy.ts`, COMPENDIUM §3) — se le añadió in-note explicando la
  excepción. `/api/admin/check` y los login setters NO se migran (son setters,
  no checkers).

## WS7 — Normalización de locale a es-MX ✅
- `src/lib/utils.ts`: `formatDate`/`formatTime` ahora `es-MX`; añadidos
  `SITE_LOCALE`, `formatSectionDate()` (día/mes-largo/año) y
  `formatAdminDate()` (día/mes-corto). **Hallazgo clave**: `formatDate`/`formatTime`
  NO tenían callers (solo definición + docs) → se repurposan como helpers
  canónicos es-MX.
- Migrados los 4 sitios con `Date`→locale: `HeroSection.tsx:71` (es-ES→es-MX
  vía `formatSectionDate`), `InvitationCard.tsx` (`formatDate`/`formatTime`),
  `admin/page.tsx` (3 spots → `formatAdminDate`/`formatSectionDate`). El único
  `es-ES` restante en código era ese hero; ya no.
- **No se tocaron**: el email `rsvp/route.ts` lee strings pre-formateados de
  `wedding.ts` (fuente de contenido), no `Date`→helper, para no alterar su
  salida visible (`"18 de Octubre, 2026"` ≠ `"18 de octubre de 2026"`). Cambiar
  el locale de un helper `Date` no afecta al email.

## WS6 — Split del God component admin ✅
- `admin/page.tsx` 894→238 líneas (auth gate + tab switch + 3×`useAdminFetch`
  + handlers de mutación que re-piden la lista al servidor). 626 líneas en 6
  componentes/tipos bajo `_components/` + hook `useAdminFetch` (80 l).
- **`src/hooks/useAdminFetch.ts`**: reemplaza los 3 `useEffect` fetch
  duplicados (guests/songs/messages) y los 2 `.then` retry inline.
  `{data, loading, error, retry}`. **Gotcha aprendido**: la regla ERROR
  `react-hooks/set-state-in-effect` dispara sobre `setLoading(true)`
  sincrónico en el cuerpo del efecto — se resolvió moviendo el pre-flight +
  la cadena `fetch().then()` dentro de un `queueMicrotask` (patrón ya probado
  en WS1 con `PhotoUploadSection`). Mismo patrón que acepta el gate.
- **Mutaciones sin estado optimista**: approve/delete → fetch + `retry()`
  (servidor = fuente única); zero estado de sobreescritura local ⇒
  zero setState-in-effect en el cliente. `confirm()` → modal estilizado;
  `alert()` (errores) → UI inline (`actionError` local en la tabla).
- Tipos locales duplicados (`GuestData`/`SongData`…) reemplazados por los de
  `src/lib/supabase.ts` (corrige el drift `string` vs `string|null` de WS2 #5).

---

## WS10 — Tidy chico de config ✅
- **Google-Photos fallback URL dedup**: el literal
  `https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9` vivía triplicado (inline en
  `PhotoUploadSection` + `config.ts`). Ya no: ahora se exporta
  `DEFAULT_GOOGLE_PHOTOS_ALBUM_URL` desde `src/lib/config.ts` (única fuente),
  referenciado una vez por `googlePhotosConfig.albumUrl`. Los componentes leen
  solo `googlePhotosConfig.albumUrl` (grep confirma cero fallback inline
  restante — los 4 hits en `PhotoUploadSection` son usos legítimos del config,
  no dups).
- **`MAX_COMPANIONS = 5`**: ya existía como const en `RSVPSection.tsx:19`,
  usado en el clamp (el `max` nativo del `<input type="range">`) Y el
  `<input max=...` (línea 249). Single source of truth — confirmado, sin drift
  con el seed `admin_settings.max_companions` (ambos = 5).
- **`apple-icon.png` / `icons` metadata**: `layout.tsx` referenciaba
  `/apple-icon.png` que **nunca existió** en `public/` ni como file-convention
  `app/apple-icon.*` → 404 en iOS apple-touch-icon. Removido el bloque entero
  `icons: {...}` del `metadata`. `/favicon.ico` SÍ se sirve — pero vía la
  *file convention* `src/app/favicon.ico` (confirmado en los docs de Next 16
  `app-icons.md`: el archivo auto-emite el `<link rel="icon">` tag), así que
  remover el `metadata.icons` es cero pérdida de comportamiento. Se dejó un
  comment in-situ explicando la decisión.

## WS8 — Migraciones DB ✅
- **`admin_settings` drifted seed → valores reales en la fuente**. Confirmado
  (grep `src/`) que la app **NO lee** `admin_settings` (fuente de verdad =
  `src/data/wedding.ts`); el cambio es cero-impacto runtime. Se corrigieron los
  valores literal en TRES archivos para converger en verdad (2026 / Alma &
  Chava / 2026-09-01) y que una DB fresca no reintroduzca drift:
  - `schema.sql` y `migration_update.sql`: el `INSERT ... VALUES` del seed
    pasó de `2025`/`Emerson`/`Plancarte` a `2026`/`Alma`/`Chava`. Se conserva
    `ON CONFLICT (key) DO NOTHING` → **preserva** cualquier valor que un admin
    haya seteado a mano (no lo sobrescribe al re-correr).
  - **NEW** `supabase/migration_clean_admin_settings.sql`: el *puente* para DBs
    que **ya tienen** las filas drift (un re-run de `schema.sql`/`migration_update.sql`
    no las limpia por el `DO NOTHING`). Hace `DELETE` de las 5 keys + `INSERT
    ... ON CONFLICT (key) DO UPDATE` con los valores reales. Idempotente: el
    `DELETE` es no-op si no hay filas; el `DO UPDATE` sobrescribe drift que
    sobreviva. Estado final idéntico en cada corrida. Criterio de verificación
    §D del plan satisfecho (`SELECT key,value … → 2026 / Alma-Chava, sin
    2025/Emerson/Plancarte`).
- **`schema.sql` RENAME no-idempotente → guard `DO $$ IF EXISTS`**. Las líneas
  74-75 hacían `ALTER TABLE songs RENAME COLUMN spotify_id TO youtube_video_id`
  (y `cover_url → thumbnail_url`) *crudos*, sin guard. En una DB fresca el
  `CREATE TABLE IF NOT EXISTS songs` de más arriba crea la tabla con los
  nombres nuevos → las columnas `spotify_id`/`cover_url` no existen → el
  `RENAME` crudo falla "column spotify_id does not exist" (COMPENDIUM §10 #1).
  **Fix:** envuelto en `DO $$ BEGIN IF EXISTS (… column_name='spotify_id' …)
  THEN ALTER … RENAME … END $$` — patrón idéntico al que `migration_update.sql:26-42`
  ya tenía correcto. Removido el comment engañoso "Ignorar errores si las
  columnas ya fueron renombradas" (ya no hay errores que ignorar).
- **`vote_song` deprecado (no dropeado)**. Grep `src/` = 0 callers (el camino
  vivo es `like_song`/`unlike_song` con tracking por `song_likes`; `vote_song`
  suma/resta sin tracking → doble-conteo). Se dejó la proc por backward-compat
  con callers externos pero con un comment `-- DEPRECATED: …` arriba en ambos
  `schema.sql` y `migration_update.sql` (COMPENDIUM §10 #13), para que nadie
  la reconecte por accidente.
- **Deliberadamente NO tocado**: `guests.invitation_code VARCHAR(50) NOT NULL
  DEFAULT 'boda2025'` (`schema.sql:20`). Está **fuera de WS8** (no es drift de
  admin_settings). Cambiarlo alteraría el path de insert de RSVP (todo guest
  nuevo toma ese default vía `submit_rsvp`, que no pasa `invitation_code`), con
  dependencia desconocida del env real (`INVITATION_CODE` vive en `.env.local`,
  intocable). Regla "no risky changes en vivo" → dejarlo; se documenta en
  COMPENDIUM (WS11). La app no gatea por esta columna (gatea por cookie = env),
  así que es inocuo hoy.

---

## WS9 — Docs de la YOUTUBE_API_KEY filtrada (no rewrite de history) ✅
- **Verificación de leak**: `git grep "AIza[0-9A-Za-z_-]{20,}"` (sobre tracked
  files, excluye automáticamente `.env.local`/`node_modules`/`.next` por estar
  gitignored) → **0 hits**. Ningún archivo tracked contiene una key real de
  Google. `.env.example:24` ya es placeholder (`your-youtube-api-key`) con el
  rotate-reminder in-situ (líneas 22-23). `.env.local` no se toca (gitignored;
  podría hold la key real — el único remedio restante es manual/user-owned).
- **Decisión de no-rewrite confirmada**: el usuario eligió "documentar + rotate
  reminder". NO `git filter-repo`, NO force-push. La key real sigue en **git
  history** (intocable por scope); la acción residual es rotar en Google Cloud
  Credential console + redeployar en Vercel — user-owned.
- **Docs actualizados** (ver WS11 para los edits concretos): `COMPENDIUM §10 #5`,
  `PROJECT_STRUCTURE.md` (env-vars + Security Note con rotación manual), y
  `README.md` (Security Notes con el rotate reminder explícito "no rewrite de
  history").

## WS11 — Sync de docs (COMPENDIUM, PROJECT_STRUCTURE, README) + este log ✅
- **`docs/COMPENDIUM.md`** — todas las secciones tocadas:
  - §10 gotchas #1/#3/#4/#5/#6/#11/#13 → markers "✅ FIXED (WSx)" con detalle.
  - §9 tabla de scripts → filas `typecheck`/`typecheck:build` + párrafo del
    gate repetible (`lint` 0/0 → `tsc` exit 0 → `build` 18 páginas).
  - §5.1 RSVP "content-drift bug" → "✅ FIXED (WS2)" — el email ahora lee
    `src/data/wedding.ts`.
  - §4 `admin_settings` seeded defaults → valores reales (2026 / Alma & Chava)
    + pointer a `migration_clean_admin_settings.sql`.
  - §3 defense-in-depth → doc full de `src/lib/auth.ts` (`requireGuestOrAdmin`/
    `requireAdmin`, `AuthMessages` override para respuestas byte-idénticas,
    rutas migradas: `/api/rsvp`, `/api/songs`, `/api/youtube/search`,
    `/api/admin/guests`, `/api/admin/songs`; NO migradas: `/api/admin/messages`
    confía en el proxy, `/api/admin/check` + logins son setters).
  - §5.3 admin moderation → "Structure (post-WS6 refactor)" (page.tsx ~238
    líneas = gate + tab switch + 3 `useAdminFetch` + handlers que refetchan del
    server; UI en `_components/`; `queueMicrotask` para satisfacer
    `set-state-in-effect`; `window.confirm`→modal; `alert`→inline; zero
    optimistic mutation).
- **`PROJECT_STRUCTURE.md`** — sync completo:
  - Árbol: añadidos `useAdminFetch.ts` (hooks/), `auth.ts` (lib/),
    `CLEANUP_LOG.md` (docs/), `migration_clean_admin_settings.sql` (supabase/),
    `src/app/admin/_components/{AdminDashboard,AdminGuestsTable,AdminSongsTable,AdminMessages}.tsx`.
  - Comentarios: `utils.ts` → "es-MX date helpers" (era "formatDate/es-ES");
    `favicon.ico` → file-convention note (era "referenced as /apple-icon.png*");
    `admin/page.tsx` → "~238 líneas post-WS6" (era la desc God-component).
  - Tabla de schema: `schema.sql` → **Yes** (post-WS8); fila nueva para
    `migration_clean_admin_settings.sql`; footnote apple-icon → "removed in
    WS10"; warning `admin_settings` drift → "seeds real values post-WS8".
  - Admin Dashboard section → estructura post-WS6 (split + useAdminFetch +
    server-as-source mutations + modal/inline).
  - Scripts → `typecheck` + `typecheck:build`.
  - YOUTUBE rotate-reminder → "no rewrite de history; rotación manual user-owned".
  - Notes → RSVP email 2025 y es-ES/es-MX ambos marcados FIXED.
  - **Bug self-caught y fixeado**: un edit anterior había dejado una línea
    `├── supabase/` duplicada (stray, sin hijos) en el árbol de `docs/` —
    removida; el `├── supabase/` real (con sus 3 .sql) vive más abajo.
- **`README.md`** — sync completo:
  - Sección de schema idempotency gotcha (era "schema.sql NO idempotente") →
    "✅ idempotent (post-WS8)" + instrucción de correr
    `migration_clean_admin_settings.sql` para DBs stale.
  - `vote_song` listado como "deprecated" con pointer a COMPENDIUM §10 #13.
  - `admin_settings` placeholder-drift warning (era "2025/Emerson/Plancarte")
    → "✅ seed fixed (WS8)" + pointer al clean migration.
  - Security Notes → bullet nuevo sobre la YOUTUBE_API_KEY filtrada: tracked
    files clean, no rewrite de history, rotación manual en Google Cloud + Vercel.
  - Scripts (Running Locally + Development) → `npm run typecheck` (era raw
    `npx tsc --noEmit`).
  - Env config `YOUTUBE_API_KEY=your-youtube-api-key` (consistencia con
    `.env.example`).
  - Filas de troubleshooting (email 2025 / DB seed 2025) → "Fixed in WS2/WS8".
- **`docs/CLEANUP_LOG.md`** (este archivo) — bitácora WS1→WS11 completa.

### Estado final del backlog
- WS1–WS11: **todos ✅**. Pendiente list = vacío.

---

## Gate final (post-WS11, doc-sync) ✅
- `npm run lint` → **0 errors / 0 warnings**.
- `npx tsc --noEmit -p tsconfig.json` → **exit 0**.
- `npm run build` → **18/18 páginas estáticas generadas, exit 0** (proxy falla
  *cerrado* en runtime, no en build — el build no necesita env). El warning
  `module.register()` deprecation es interno de Node 22+/Next-SWC, fuera de
  nuestro control, no es deuda del proyecto.

> La deuda de código/técnica del sitio de boda está **limpia**. Las únicas
> acciones residuales son **manuales y user-owned** (no-code): (1) rotar la
> YOUTUBE_API_KEY en Google Cloud + redeploy Vercel (WS9), y (2) si la DB
> productiva ya tenía el seed drift de `admin_settings`, correr
> `supabase/migration_clean_admin_settings.sql` una vez (WS8).

