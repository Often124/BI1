-- =============================================
-- Bi1Gestion — Supabase migration
-- =============================================

-- Table : slides
CREATE TABLE IF NOT EXISTS slides (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 5,
  "order" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table : birthdays
CREATE TABLE IF NOT EXISTS birthdays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12)
);

-- Table : settings (une seule ligne, id = 1)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  scrolling_text TEXT NOT NULL DEFAULT 'Bienvenue !',
  emergency_mode BOOLEAN NOT NULL DEFAULT false,
  emergency_message TEXT NOT NULL DEFAULT '',
  weather_city TEXT NOT NULL DEFAULT 'Paris',
  weather_api_key TEXT NOT NULL DEFAULT '',
  show_clock BOOLEAN NOT NULL DEFAULT true,
  show_date BOOLEAN NOT NULL DEFAULT true,
  show_weather BOOLEAN NOT NULL DEFAULT true,
  show_scrolling_text BOOLEAN NOT NULL DEFAULT true,
  show_birthdays BOOLEAN NOT NULL DEFAULT true,
  transition_duration INTEGER NOT NULL DEFAULT 1000,
  scroll_speed INTEGER NOT NULL DEFAULT 20,
  google_slides_url TEXT NOT NULL DEFAULT '',
  google_slides_enabled BOOLEAN NOT NULL DEFAULT false,
  google_slides_delay_ms INTEGER NOT NULL DEFAULT 5000
);

-- Compatibilité migration incrémentale
ALTER TABLE settings ADD COLUMN IF NOT EXISTS emergency_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS emergency_message TEXT NOT NULL DEFAULT '';

-- Table : logs admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table : utilisateurs admin
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insérer la ligne de settings par défaut si elle n'existe pas
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Autoriser l'accès en lecture publique (anon) pour l'affichage
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies : tout le monde peut lire, tout le monde peut écrire (via anon key)
-- En production on restreindrait l'écriture, mais ici l'auth admin est gérée côté app

DROP POLICY IF EXISTS "Allow read slides" ON slides;
DROP POLICY IF EXISTS "Allow all slides" ON slides;
CREATE POLICY "Allow read slides" ON slides FOR SELECT USING (true);
CREATE POLICY "Allow all slides" ON slides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read birthdays" ON birthdays;
DROP POLICY IF EXISTS "Allow all birthdays" ON birthdays;
CREATE POLICY "Allow read birthdays" ON birthdays FOR SELECT USING (true);
CREATE POLICY "Allow all birthdays" ON birthdays FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read settings" ON settings;
DROP POLICY IF EXISTS "Allow all settings" ON settings;
CREATE POLICY "Allow read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow all settings" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read logs" ON admin_logs;
DROP POLICY IF EXISTS "Allow all logs" ON admin_logs;
CREATE POLICY "Allow read logs" ON admin_logs FOR SELECT USING (true);
CREATE POLICY "Allow all logs" ON admin_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read admin users" ON admin_users;
DROP POLICY IF EXISTS "Allow all admin users" ON admin_users;
CREATE POLICY "Allow read admin users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow all admin users" ON admin_users FOR ALL USING (true) WITH CHECK (true);
