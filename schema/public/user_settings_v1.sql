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

-- 5. Functions
-- ---------------------------------------------
-- None currently required.
