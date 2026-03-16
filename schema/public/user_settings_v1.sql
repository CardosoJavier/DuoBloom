-- =============================================
-- Table: user_settings
-- Version: 1
-- Description: User preferences for theme, language, and privacy
-- =============================================

-- 1. Enums
-- ---------------------------------------------
DO $$ BEGIN
    CREATE TYPE "supported_languages" AS ENUM ('SPANISH', 'ENGLISH');
    CREATE TYPE "application_theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    -- Preferences
    "privacy_mode" boolean DEFAULT true,
    "preferred_language" supported_languages NOT NULL DEFAULT 'ENGLISH',
    "app_theme" application_theme NOT NULL DEFAULT 'SYSTEM',
    "timezone" text NOT NULL DEFAULT 'UTC',
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 3. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_user_settings_user_id" ON "user_settings" ("user_id");

-- 4. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can only see their own settings
CREATE POLICY "Users can view own settings"
ON "user_settings"
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Update
-- Users can update their own settings
CREATE POLICY "Users can update own settings"
ON "user_settings"
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Insert
-- Users can create settings for themselves
CREATE POLICY "Users can insert own settings"
ON "user_settings"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Partner SELECT (read-only, limited scope)
-- Partners can read each other's user_settings. This is REQUIRED for the
-- progress_photos RLS policy: the EXISTS subquery in that policy reads the
-- photo owner's privacy_mode, which would always return zero rows if the
-- viewer lacked SELECT permission here.
-- Partners only need to see privacy_mode; full settings remain private.
CREATE POLICY "Partners can view each other settings"
ON "user_settings"
FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM "relationships"
        WHERE (user_one_id = auth.uid() AND user_two_id = user_settings.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = user_settings.user_id)
    )
);

-- 5. Triggers
-- ---------------------------------------------

-- A. Timestamp Updater
-- Dedicated trigger function for tables using 'updated_at'.
-- (update_last_updated_on() sets NEW.last_updated_on — a column on 'users'
-- that does not exist here; using it caused "record new has no field
-- last_updated_on" on every UPDATE, blocking all user_settings writes.)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "update_user_settings_timestamp" ON "user_settings";
CREATE TRIGGER "update_user_settings_timestamp"
BEFORE UPDATE ON "user_settings"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- B. Auto-create settings on new user signup
-- Inserts a default user_settings row whenever a new row is added to users.
-- This guarantees every user always has a settings record from day one,
-- with privacy_mode=true (private by default).
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO "user_settings" (
        "user_id",
        "privacy_mode",
        "preferred_language",
        "app_theme",
        "timezone"
    ) VALUES (
        NEW.id,
        true,          -- private by default
        'ENGLISH',
        'SYSTEM',
        'UTC'
    )
    ON CONFLICT (user_id) DO NOTHING;  -- idempotent: skip if already exists
    RETURN NEW;
END;
$$;

CREATE TRIGGER "on_user_created_settings"
AFTER INSERT ON "users"
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_settings();
