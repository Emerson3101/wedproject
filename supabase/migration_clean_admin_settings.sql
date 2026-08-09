-- ============================================
-- MIGRACIÓN: Limpiar el seed drift de admin_settings
-- ============================================
-- PROPÓSITO
--   Borrar las filas placeholder drift que vivían en admin_settings (fechas
--   `2025`, couple `Emerson`/`Plancarte`) y re-sembrar valores REALES alineados
--   a `src/data/wedding.ts` (2026 / Alma & Chava). La tabla se CONSERVA.
--
-- POR QUÉ / SCOPE
--   - La app NO lee admin_settings hoy (fuente de verdad = src/data/wedding.ts,
--     grep en src/ = 0). Estos valores son para una funcionalidad futura.
--   - `schema.sql` y `migration_update.sql` ahora siembran los valores reales
--     desde cero (corregido en este mismo workstream), pero una DB que YA tenga
--     las filas drift viejas no las sobrescribe con `ON CONFLICT DO NOTHING`.
--     Esta migración es el puente: corre una vez sobre una DB existente y la
--     deja limpia. (COMPENDIUM §10 #4.)
--
-- IDEMPOTENCIA
--   - El `DELETE` es no-op si las filas ya no están.
--   - El `INSERT ... ON CONFLICT (key) DO UPDATE` siempre deja el valor real,
--     sobrescribiendo drift o re-creando filas borradas. Re-correr es seguro:
--     el estado final es idéntico (mismos valores reales en las 5 keys).
--   - `updated_at` se refresca en cada corrida de un match; es aceptable para
--     una migración de limpieza puntual (no es hot path).
--
-- ORDEN DE EJECUCIÓN
--   No requiere orden relativo a schema.sql/migration_update.sql. Puede correr
--   antes, después o independientemente. Crea la tabla si por algún motivo no
--   existiera (defensivo).
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1) Borrar las filas placeholder drift (idempotente: no-op si ya están fuera).
DELETE FROM admin_settings
WHERE key IN (
  'wedding_date',
  'couple_names',
  'rsvp_deadline',
  'max_companions',
  'site_status'
);

-- 2) Re-sembrar valores reales (alineados a src/data/wedding.ts).
--    ON CONFLICT DO UPDATE sobrescribe cualquier drift que haya sobrevivido al
--    DELETE (o una corrida previa parcial), garantizando el estado final correcto.
INSERT INTO admin_settings (key, value) VALUES
  ('wedding_date',     '{"date": "2026-09-12T18:00:00", "timezone": "America/Mexico_City"}'),
  ('couple_names',     '{"name1": "Alma",  "name2": "Chava"}'),
  ('rsvp_deadline',    '{"date": "2026-08-15",            "enabled": true}'),
  ('max_companions',   '{"limit": 2}'),
  ('site_status',      '{"maintenance": false,            "rsvp_open": true}')
ON CONFLICT (key) DO UPDATE SET
  value      = EXCLUDED.value,
  updated_at = NOW();

-- Verificación opcional (correr a mano en el SQL Editor):
--   SELECT key, value FROM admin_settings ORDER BY key;
-- Debe mostrar 2026-09-12T18:00:00 / Alma & Chava / 2026-08-15 — sin 2025,
-- sin Emerson/Plancarte. (Criterio de verificación §D del plan.)
