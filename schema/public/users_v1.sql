-- =============================================
-- Table: users
-- Version: 1
-- Description: Core user profiles linked to Supabase Auth
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- We reference auth.users to link Supabase Authentication with our public profile
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "first_name" varchar(50) NOT NULL,
    "last_name" varchar(50) NOT NULL,
    "email" text UNIQUE NOT NULL,
    
    -- Pair Code: Unique identifier for syncing (e.g. ALEX-8392)
    -- Increased to 20 chars to accommodate "NAME-XXXX" format
    "pair_code" varchar(20) UNIQUE NOT NULL,
    
    "created_on" timestamptz NOT NULL DEFAULT now(),
    "last_updated_on" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_pair_code" ON "users" ("pair_code");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own profile AND their partner's profile.
-- This relies on the get_partner_id() function defined in the relationships schema.
CREATE POLICY "Users can view own and partner's profile"
ON "users"
FOR SELECT
USING (
  auth.uid() = id OR id = public.get_partner_id(auth.uid())
);

-- Policy: Update
-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "users"
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Insert
-- Technically handled by the trigger below, but allowed if manual insert is needed (rare)
CREATE POLICY "Users can insert own profile"
ON "users"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Functions & Triggers
-- ---------------------------------------------

-- A. Timestamp Updater
-- Automatically updates 'last_updated_on' on any change
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


-- B. New User Handler (Supabase Auth Hook)
-- Automatically creates a public profile when a user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_first_name text;
    v_last_name text;
    v_pair_code text;
    v_code_suffix int;
BEGIN
    -- Extract metadata (adjust keys based on your client-side signup implementation)
    v_first_name := COALESCE(new.raw_user_meta_data->>'firstName', 'User');
    v_last_name := COALESCE(new.raw_user_meta_data->>'lastName', '');
    
    -- Generate Pair Code: "NAME-XXXX"
    -- Loop to ensure uniqueness
    LOOP
        v_code_suffix := floor(random() * 9000) + 1000; -- Random 4-digit number (1000-9999)
        -- Clean first name (remove spaces/special chars) and uppercase
        v_pair_code := UPPER(REGEXP_REPLACE(v_first_name, '\W+', '', 'g')) || '-' || v_code_suffix;
        
        -- Check if unique
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE pair_code = v_pair_code) THEN
            EXIT; 
        END IF;
    END LOOP;

    INSERT INTO public.users (id, first_name, last_name, email, pair_code)
    VALUES (
        new.id,
        v_first_name,
        v_last_name,
        new.email,
        v_pair_code
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users
-- This requires permissions on the auth schema (standard in Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
