-- =============================================
-- Table: progress_photos
-- Version: 2
-- Description: Encrypted progress photo entries (Front, Side, Back) per user.
--              v2 adds three JSONB encryption metadata columns
--              (front_photo_metadata, side_photo_metadata, back_photo_metadata)
--              required to decrypt each image client-side. Each object stores:
--                - iv:          AES-GCM initialisation vector (base64)
--                - authTag:     AES-GCM authentication tag (base64)
--                - wrappedKeys: Record<userId, base64-RSA-OAEP-wrapped-AES-key>
--                               keyed for both the owner and partner (E2EE).
--              All other columns, indexes, RLS policies, and triggers are
--              unchanged from v1 and are included here for a full standalone
--              definition.
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "progress_photos" (
    "id"               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id"          uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,

    -- Encrypted Supabase Storage paths (client sets these after E2EE upload)
    "front_photo_url"          text NOT NULL,
    "side_photo_url"           text NOT NULL,
    "back_photo_url"           text NOT NULL,

    -- Cryptographic metadata required to decrypt each image (v2)
    "front_photo_metadata"     jsonb,
    "side_photo_metadata"      jsonb,
    "back_photo_metadata"      jsonb,

    "captured_date"    date NOT NULL,

    -- Optional measurements for the captured day
    "weight_kg"        DECIMAL(6,2),
    "weight_lb"        DECIMAL(6,2),
    "body_fat"         DECIMAL(4,2),

    "created_at"       timestamptz DEFAULT now(),
    "updated_at"       timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
-- Single-column index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS "idx_progress_photos_user_id"
    ON "progress_photos" ("user_id");

-- Composite index: powers the gallery view (photos ordered by date)
CREATE INDEX IF NOT EXISTS "idx_progress_photos_user_captured"
    ON "progress_photos" ("user_id", "captured_date" DESC);

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "progress_photos" ENABLE ROW LEVEL SECURITY;

-- Policy: ALL operations (INSERT, SELECT, UPDATE, DELETE) on own rows.
-- A user has full control over their own photo entries.
CREATE POLICY "Users can manage their own photos"
ON "progress_photos"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Partner SELECT gated by the owner's privacy_mode.
-- User A can SELECT User B's photos ONLY when:
--   1. A and B share a row in the relationships table, AND
--   2. User B has privacy_mode = false in their user_settings.
-- When privacy_mode = true (the default), the EXISTS subquery returns no rows
-- and the partner sees nothing at the DB level. The UI must display a notice.
--
-- Note: The user_settings SELECT policy in user_settings_v1.sql must include
-- a partner visibility clause so this subquery can read the owner's privacy_mode.
CREATE POLICY "Partner visibility based on Privacy Mode"
ON "progress_photos"
FOR SELECT
USING (
    -- Fast path: always allow reading own photos
    auth.uid() = user_id
    OR
    -- Partner path: visible only when the owner has unlocked privacy
    EXISTS (
        SELECT 1
        FROM "relationships" r
        JOIN "user_settings" us ON us.user_id = progress_photos.user_id
        WHERE (
            (r.user_one_id = auth.uid() AND r.user_two_id = progress_photos.user_id)
            OR
            (r.user_two_id = auth.uid() AND r.user_one_id = progress_photos.user_id)
        )
        AND us.privacy_mode = false
    )
);

-- 4. Triggers
-- ---------------------------------------------
-- Automatically update 'updated_at' on every row modification.
-- Reuses the update_last_updated_on() function defined in users_v2.sql.
CREATE TRIGGER "update_progress_photos_timestamp"
BEFORE UPDATE ON "progress_photos"
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_on();
