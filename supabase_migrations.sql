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


-- ============================================================================
-- 5. QUICKBOOKS INTEGRATION TABLES
-- ============================================================================

-- 5a. QB OAuth tokens — stores the connected QuickBooks account credentials.
-- Only one row should exist (Lo's business QB account).
CREATE TABLE IF NOT EXISTS qb_tokens (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id                 text NOT NULL UNIQUE,
  access_token             text NOT NULL,
  refresh_token            text NOT NULL,
  access_token_expires_at  timestamptz NOT NULL,
  refresh_token_expires_at timestamptz NOT NULL,
  company_name             text,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE qb_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write tokens (edge functions use service role key)
DROP POLICY IF EXISTS "Service role manages QB tokens" ON qb_tokens;
CREATE POLICY "Service role manages QB tokens"
  ON qb_tokens FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- 5b. INVOICES TABLE — replaces frontend-only Zustand storage.
-- Source of truth for all invoices. Syncs bidirectionally with QuickBooks.
CREATE TABLE IF NOT EXISTS invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      text,
  client_id       uuid REFERENCES profiles(id),
  client_name     text,
  client_email    text,
  description     text NOT NULL,
  line_items      jsonb DEFAULT '[]',
  amount          numeric(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'Draft',
  issued_at       date,
  due_date        date,
  paid_at         date,
  qb_invoice_id   text,
  qb_customer_id  text,
  payment_link    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admins (Lo) can do everything with invoices
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Clients can only view their own invoices
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;
CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Service role can do everything (for edge functions / webhooks)
DROP POLICY IF EXISTS "Service role manages invoices" ON invoices;
CREATE POLICY "Service role manages invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ============================================================================
-- 6. ZOOM INTEGRATION TABLE
-- ============================================================================

-- Stores Zoom meetings with recordings/transcripts linked to projects
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoom_meeting_id text UNIQUE,
  project_id      text,
  topic           text NOT NULL,
  start_time      timestamptz,
  duration        integer,
  join_url        text,
  host_email      text,
  status          text DEFAULT 'scheduled',
  recording_url   text,
  transcript      text,
  ai_summary      text,
  recording_ready boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE zoom_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all meetings" ON zoom_meetings;
CREATE POLICY "Admins can manage all meetings"
  ON zoom_meetings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Authenticated users can view meetings" ON zoom_meetings;
CREATE POLICY "Authenticated users can view meetings"
  ON zoom_meetings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages meetings" ON zoom_meetings;
CREATE POLICY "Service role manages meetings"
  ON zoom_meetings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
