-- =============================================
-- Table: users
-- Version: 3
-- Description: Core user profiles linked to Supabase Auth.
--              v3 removes the public_key column introduced in v2.
--              E2EE has been decommissioned; data security is enforced
--              entirely through Supabase RLS policies.
-- =============================================

-- ── Migration (run against an existing v2 database) ──────────────────────────
ALTER TABLE "users" DROP COLUMN IF EXISTS "public_key";

-- ── Full Table Definition (standalone reference) ──────────────────────────────

-- 1. Table Definition
-- ---------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "users" (
    "id"               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "first_name"       varchar(50) NOT NULL,
    "last_name"        varchar(50) NOT NULL,
    "email"            text UNIQUE NOT NULL,

    -- Pair Code: Unique identifier for syncing (e.g. ALEX-8392)
    "pair_code"        varchar(20) UNIQUE NOT NULL,

    "created_on"       timestamptz NOT NULL DEFAULT now(),
    "last_updated_on"  timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_users_email"     ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_pair_code" ON "users" ("pair_code");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — own profile and partner's profile
CREATE POLICY "Users can view own and partner's profile"
ON "users"
FOR SELECT
USING (
    auth.uid() = id OR id = public.get_partner_id(auth.uid())
);

-- Policy: UPDATE — own profile only
CREATE POLICY "Users can update own profile"
ON "users"
FOR UPDATE
USING (auth.uid() = id);

-- Policy: INSERT — own profile only (also handled by the trigger below)
CREATE POLICY "Users can insert own profile"
ON "users"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Functions & Triggers
-- ---------------------------------------------

-- A. Timestamp updater
CREATE OR REPLACE FUNCTION update_last_updated_on()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_on = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_on();

-- B. New user handler — creates a public profile on Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name text;
    v_last_name  text;
    v_pair_code  text;
    v_code_suffix int;
BEGIN
    v_first_name := COALESCE(new.raw_user_meta_data->>'firstName', 'User');
    v_last_name  := COALESCE(new.raw_user_meta_data->>'lastName', '');

    -- Generate a unique NAME-XXXX pair code
    LOOP
        v_code_suffix := floor(random() * 9000) + 1000;
        v_pair_code   := UPPER(REGEXP_REPLACE(v_first_name, '\W+', '', 'g')) || '-' || v_code_suffix;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE pair_code = v_pair_code);
    END LOOP;

    INSERT INTO public.users (id, first_name, last_name, email, pair_code)
    VALUES (new.id, v_first_name, v_last_name, new.email, v_pair_code);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
