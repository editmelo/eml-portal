-- ============================================================================
-- EML Portal — Supabase Migrations
-- Run these in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- 1. PROFILES TABLE (if not already created)
-- Stores user profiles for the People page and Inbox contact picker.
-- The app now auto-creates a row on signup, login, and session restore.
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  role       text DEFAULT 'CLIENT',
  business   text,
  phone      text,
  nickname   text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Allow authenticated users to read all profiles (needed for People page + Inbox)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (no auth requirement — internal business portal)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by all" ON profiles;
CREATE POLICY "Profiles are viewable by all"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert/update their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- 2. ACTIVITY LOG TABLE
-- Centralized event log with timestamps, visible to all parties.
CREATE TABLE IF NOT EXISTS activity_log (
  id          text PRIMARY KEY,
  actor_id    text,
  actor_name  text,
  actor_role  text,
  action      text NOT NULL,
  description text,
  project_id  text,
  meta        jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read activity
DROP POLICY IF EXISTS "Activity log is viewable by authenticated users" ON activity_log;
CREATE POLICY "Activity log is viewable by authenticated users"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert activity
DROP POLICY IF EXISTS "Authenticated users can log activity" ON activity_log;
CREATE POLICY "Authenticated users can log activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- 3. BACKFILL: Populate profiles from existing auth users
-- This copies all existing users into the profiles table so they show up immediately.
INSERT INTO profiles (id, email, name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email),
  COALESCE(raw_user_meta_data->>'role', 'CLIENT')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name  = EXCLUDED.name,
  role  = EXCLUDED.role;


-- 4. FIX EXISTING USER: Bryant Anthony
--    He was invited as DESIGNER but got CLIENT due to the bug.
--    Find his email and update both auth metadata and profiles table.
--
--    Step 1: Update profiles table role
--    UPDATE profiles SET role = 'DESIGNER' WHERE email = 'bryants@email.com';
--    (Replace 'bryants@email.com' with Bryant's actual email)
--
--    Step 2: Update Supabase Auth metadata
--    Go to Authentication → Users → find Bryant → edit user_metadata → set role to 'DESIGNER'
--    OR run this in SQL Editor:
--    UPDATE auth.users
--    SET raw_user_meta_data = raw_user_meta_data || '{"role": "DESIGNER"}'::jsonb
--    WHERE email = 'bryants@email.com';
--
--    After this, when Bryant logs in again his role will be DESIGNER and he'll
--    see the designer portal. The init() function will also sync his profiles row.
