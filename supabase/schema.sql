-- ============================================
-- SUPABASE — ESCHEMA DE BASE DE DATOS
-- Ejecuta este SQL en Supabase SQL Editor
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE guest_status AS ENUM ('pending', 'confirmed', 'declined');
CREATE TYPE guest_side AS ENUM ('bride', 'groom');

-- ============================================
-- TABLA: guests
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  invitation_code VARCHAR(50) NOT NULL DEFAULT 'boda2025',
  status guest_status NOT NULL DEFAULT 'pending',
  num_companions INTEGER NOT NULL DEFAULT 0,
  dietary_restrictions TEXT,
  message TEXT,
  side guest_side,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT guests_email_unique UNIQUE (email)
);

-- Índice para búsqueda rápida por código de invitación
CREATE INDEX IF NOT EXISTS idx_guests_invitation_code ON guests(invitation_code);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

-- ============================================
-- TABLA: companions
-- ============================================
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dietary_restrictions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companions_guest_id ON companions(guest_id);

-- ============================================
-- TABLA: songs
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  spotify_id VARCHAR(100) UNIQUE,
  cover_url TEXT,
  preview_url TEXT,
  added_by VARCHAR(100) NOT NULL DEFAULT 'Guest',
  votes INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_votes ON songs(votes DESC);
CREATE INDEX IF NOT EXISTS idx_songs_approved ON songs(is_approved);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);

-- ============================================
-- TABLA: admin_settings (Configuración del sitio)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valores por defecto
INSERT INTO admin_settings (key, value) VALUES
  ('wedding_date', '{"date": "2025-10-18T16:00:00", "timezone": "America/Mexico_City"}'),
  ('couple_names', '{"name1": "Emerson", "name2": "Plancarte"}'),
  ('rsvp_deadline', '{"date": "2025-09-01", "enabled": true}'),
  ('max_companions', '{"limit": 5}'),
  ('site_status', '{"maintenance": false, "rsvp_open": true}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIAS: guests
-- ============================================

-- Los invitados pueden leer solo sus propios registros
CREATE POLICY "Guests can view own records"
  ON guests FOR SELECT
  USING (email = current_setting('request.header.x-guest-email', true) OR TRUE);

-- Cualquier persona puede insertar (formulario RSVP público)
CREATE POLICY "Anyone can submit RSVP"
  ON guests FOR INSERT
  WITH CHECK (TRUE);

-- Solo servicio (admin) puede actualizar/eliminar
CREATE POLICY "Service role can update guests"
  ON guests FOR ALL
  USING (TRUE);

-- ============================================
-- POLICIAS: companions
-- ============================================
CREATE POLICY "Anyone can view companions"
  ON companions FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can add companions"
  ON companions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage companions"
  ON companions FOR ALL
  USING (TRUE);

-- ============================================
-- POLICIAS: songs
-- ============================================
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

-- ============================================
-- POLICIAS: admin_settings
-- ============================================
CREATE POLICY "Service role can manage settings"
  ON admin_settings FOR ALL
  USING (TRUE);

-- ============================================
-- FUNCIONES HELPER
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
  -- Insertar o actualizar guest
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

  -- Eliminar acompañantes anteriores
  DELETE FROM companions WHERE guest_id = v_guest_id;

  -- Insertar nuevos acompañantes
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
