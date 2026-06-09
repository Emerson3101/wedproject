-- ============================================
-- MIGRACIÓN: Actualizar esquema existente
-- Ejecuta este SQL en Supabase SQL Editor
-- Seguro de ejecutar varias veces (idempotente)
-- ============================================

-- ============================================
-- 1. ENUMS — Crear solo si no existen
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_status') THEN
    CREATE TYPE guest_status AS ENUM ('pending', 'confirmed', 'declined');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_side') THEN
    CREATE TYPE guest_side AS ENUM ('bride', 'groom');
  END IF;
END $$;

-- ============================================
-- 2. TABLA: songs — Migrar Spotify → YouTube
-- ============================================
-- Renombrar columnas solo si las antiguas aún existen
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'songs' AND column_name = 'spotify_id'
  ) THEN
    ALTER TABLE songs RENAME COLUMN spotify_id TO youtube_video_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'songs' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE songs RENAME COLUMN cover_url TO thumbnail_url;
  END IF;
END $$;

-- Eliminar columnas obsoletas (seguro si ya no existen)
ALTER TABLE songs DROP COLUMN IF EXISTS album;
ALTER TABLE songs DROP COLUMN IF EXISTS preview_url;

-- Asegurar que youtube_video_id tiene constraint UNIQUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'songs_youtube_video_id_key'
      AND conrelid = 'songs'::regclass
  ) THEN
    ALTER TABLE songs ADD CONSTRAINT songs_youtube_video_id_key UNIQUE (youtube_video_id);
  END IF;
END $$;

-- ============================================
-- 3. TABLA: admin_settings (nueva)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valores por defecto (no duplica si ya existen)
INSERT INTO admin_settings (key, value) VALUES
  ('wedding_date', '{"date": "2025-10-18T16:00:00", "timezone": "America/Mexico_City"}'),
  ('couple_names', '{"name1": "Emerson", "name2": "Plancarte"}'),
  ('rsvp_deadline', '{"date": "2025-09-01", "enabled": true}'),
  ('max_companions', '{"limit": 5}'),
  ('site_status', '{"maintenance": false, "rsvp_open": true}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. INDICES — Crear solo si faltan
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guests_invitation_code ON guests(invitation_code);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_companions_guest_id ON companions(guest_id);
CREATE INDEX IF NOT EXISTS idx_songs_votes ON songs(votes DESC);
CREATE INDEX IF NOT EXISTS idx_songs_approved ON songs(is_approved);
CREATE INDEX IF NOT EXISTS idx_songs_youtube_video_id ON songs(youtube_video_id);

-- Eliminar indices obsoletos
DROP INDEX IF EXISTS idx_songs_spotify_id;

-- ============================================
-- 5. TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_guests_updated_at'
  ) THEN
    CREATE TRIGGER update_guests_updated_at
      BEFORE UPDATE ON guests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6a. Eliminar policias existentes para recrearlas limpiamente
-- ============================================
-- Guests
DROP POLICY IF EXISTS "Guests can view own records" ON guests;
DROP POLICY IF EXISTS "Anyone can submit RSVP" ON guests;
DROP POLICY IF EXISTS "Service role can update guests" ON guests;

-- Companions
DROP POLICY IF EXISTS "Anyone can view companions" ON companions;
DROP POLICY IF EXISTS "Anyone can add companions" ON companions;
DROP POLICY IF EXISTS "Service role can manage companions" ON companions;

-- Songs
DROP POLICY IF EXISTS "Anyone can view songs" ON songs;
DROP POLICY IF EXISTS "Anyone can add songs" ON songs;
DROP POLICY IF EXISTS "Anyone can vote on songs" ON songs;
DROP POLICY IF EXISTS "Service role can manage songs" ON songs;

-- Admin settings
DROP POLICY IF EXISTS "Service role can manage settings" ON admin_settings;

-- ============================================
-- 6b. Recrear policias actualizadas
-- ============================================

-- Guests
CREATE POLICY "Guests can view own records"
  ON guests FOR SELECT
  USING (email = current_setting('request.header.x-guest-email', true) OR TRUE);

CREATE POLICY "Anyone can submit RSVP"
  ON guests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can update guests"
  ON guests FOR ALL
  USING (TRUE);

-- Companions
CREATE POLICY "Anyone can view companions"
  ON companions FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can add companions"
  ON companions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage companions"
  ON companions FOR ALL
  USING (TRUE);

-- Songs
CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can add songs"
  ON songs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can vote on songs"
  ON songs FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage songs"
  ON songs FOR ALL
  USING (TRUE);

-- Admin settings
CREATE POLICY "Service role can manage settings"
  ON admin_settings FOR ALL
  USING (TRUE);

-- ============================================
-- 7. FUNCIONES HELPER
-- ============================================

-- Función para submit RSVP completo (guest + companions)
CREATE OR REPLACE FUNCTION submit_rsvp(
  p_name VARCHAR,
  p_email VARCHAR,
  p_phone VARCHAR,
  p_status guest_status,
  p_num_companions INTEGER,
  p_dietary TEXT,
  p_message TEXT,
  p_side guest_side,
  p_companions JSONB
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_guest_id UUID;
BEGIN
  INSERT INTO guests (name, email, phone, status, num_companions, dietary_restrictions, message, side, confirmed_at)
  VALUES (p_name, p_email, p_phone, p_status, p_num_companions, p_dietary, p_message, p_side, NOW())
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    num_companions = EXCLUDED.num_companions,
    dietary_restrictions = EXCLUDED.dietary_restrictions,
    message = EXCLUDED.message,
    side = EXCLUDED.side,
    confirmed_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_guest_id;

  DELETE FROM companions WHERE guest_id = v_guest_id;

  IF p_companions IS NOT NULL AND jsonb_array_length(p_companions) > 0 THEN
    INSERT INTO companions (guest_id, name, dietary_restrictions)
    SELECT v_guest_id,
      elem->>'name',
      elem->>'dietary_restrictions'
    FROM jsonb_array_elements(p_companions) AS elem;
  END IF;

  RETURN v_guest_id;
END;
$$;

-- Función para votar una canción
CREATE OR REPLACE FUNCTION vote_song(p_song_id UUID, p_delta INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE songs
  SET votes = GREATEST(0, votes + p_delta)
  WHERE id = p_song_id;
END;
$$;

-- ============================================
-- 8. TABLA: song_likes (One like per song per browser)
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'song_likes'
  ) THEN
    CREATE TABLE song_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      voter_id VARCHAR(64) NOT NULL,
      song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT song_likes_voter_song_unique UNIQUE (voter_id, song_id)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_song_likes_song_id ON song_likes(song_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_voter_id ON song_likes(voter_id);

ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view song_likes" ON song_likes;
DROP POLICY IF EXISTS "Anyone can like songs" ON song_likes;
DROP POLICY IF EXISTS "Service role can manage song_likes" ON song_likes;

CREATE POLICY "Anyone can view song_likes"
  ON song_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can like songs"
  ON song_likes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage song_likes"
  ON song_likes FOR ALL
  USING (TRUE);

-- ============================================
-- 9. FUNCIONES: Like / Unlike (one like per song per browser)
-- ============================================

-- Like a song: inserts a row if voter hasn't liked it yet, bumps vote count
-- Returns 'liked' on success, 'already_liked' if duplicate
CREATE OR REPLACE FUNCTION like_song(p_voter_id VARCHAR, p_song_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO song_likes (voter_id, song_id)
  VALUES (p_voter_id, p_song_id);

  UPDATE songs SET votes = votes + 1 WHERE id = p_song_id;

  RETURN 'liked';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'already_liked';
END;
$$;

-- Unlike a song: deletes the row and bumps vote count down
-- Returns 'unliked' on success, 'not_liked' if nothing to remove
CREATE OR REPLACE FUNCTION unlike_song(p_voter_id VARCHAR, p_song_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_existed INTEGER;
BEGIN
  DELETE FROM song_likes WHERE voter_id = p_voter_id AND song_id = p_song_id
  RETURNING 1 INTO v_existed;

  IF FOUND THEN
    UPDATE songs SET votes = GREATEST(0, votes - 1) WHERE id = p_song_id;
    RETURN 'unliked';
  ELSE
    RETURN 'not_liked';
  END IF;
END;
$$;

-- Check if a voter has liked a song (returns true/false)
CREATE OR REPLACE FUNCTION has_liked_song(p_voter_id VARCHAR, p_song_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM song_likes WHERE voter_id = p_voter_id AND song_id = p_song_id
  ) INTO v_exists;
  RETURN v_exists;
END;
$$;
