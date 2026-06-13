-- Access request flow for new users
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  nepali_name text,
  email text NOT NULL,
  phone_number text,
  current_address text,
  father_name text,
  grandfather_name text,
  relationship_branch_info text,
  message_to_admin text,
  status text NOT NULL DEFAULT 'pending',
  approved_role text,
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- user_profiles: role storage for approved access (if not already present)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  nepali_name text,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nepali_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS access_status text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an access request (public form)
DROP POLICY IF EXISTS "access_requests_insert_public" ON access_requests;
CREATE POLICY "access_requests_insert_public"
  ON access_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read/update (admin check in app)
DROP POLICY IF EXISTS "access_requests_select_authenticated" ON access_requests;
CREATE POLICY "access_requests_select_authenticated"
  ON access_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "access_requests_update_authenticated" ON access_requests;
CREATE POLICY "access_requests_update_authenticated"
  ON access_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON user_profiles;
CREATE POLICY "user_profiles_select_authenticated"
  ON user_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user_profiles_insert_authenticated" ON user_profiles;
CREATE POLICY "user_profiles_insert_authenticated"
  ON user_profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_profiles_update_authenticated" ON user_profiles;
CREATE POLICY "user_profiles_update_authenticated"
  ON user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
