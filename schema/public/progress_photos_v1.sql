-- =============================================
-- Table: progress_photos
-- Version: 1
-- Description: Progress photo entries (Front, Side, Back) per user.
--              Standard Supabase Storage paths in the user_media bucket.
--              Weight and body fat fields are optional — a user may log
--              photos without recording measurements on a given day.
--              Partner visibility is controlled by the owner's privacy_mode
--              in user_settings. When privacy_mode = true (default), no rows
--              are returned to the partner at the DB level — the UI must
--              display an appropriate locked/privacy notice.
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "progress_photos" (
    "id"               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id"          uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,

    -- Supabase Storage paths (user_media bucket, e.g. progress/{userId}/{date}_{uuid}_{view}.jpg)
    "front_photo_url"  text NOT NULL,
    "side_photo_url"   text NOT NULL,
    "back_photo_url"   text NOT NULL,

    "captured_date"    date NOT NULL,

    -- Optional measurement data for the captured day
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

-- Composite index: powers the gallery view (user's photos ordered by date)
CREATE INDEX IF NOT EXISTS "idx_progress_photos_user_captured"
    ON "progress_photos" ("user_id", "captured_date" DESC);

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "progress_photos" ENABLE ROW LEVEL SECURITY;

-- Policy: ALL operations (INSERT, SELECT, UPDATE, DELETE) on own rows
-- A user has full control over their own photo entries.
CREATE POLICY "Users can manage their own photos"
ON "progress_photos"
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Partner SELECT gated by privacy_mode
-- User A can SELECT User B's photos ONLY when:
--   1. A and B share a row in the relationships table, AND
--   2. User B has privacy_mode = false in their user_settings.
-- When privacy_mode = true (default), the EXISTS subquery returns no rows,
-- so the partner sees nothing. The UI is responsible for showing a notice.
--
-- NOTE: This policy also covers own rows (auth.uid() = user_id) as a fast
-- first branch so the JOIN is bypassed for self-reads.
CREATE POLICY "Partner visibility based on Privacy Mode"
ON "progress_photos"
FOR SELECT
USING (
    -- Always allow reading own photos
    auth.uid() = user_id
    OR
    -- Allow reading partner's photos only when they have unlocked privacy
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
-- Dedicated trigger function for tables using 'updated_at'.
-- (update_last_updated_on() sets NEW.last_updated_on — a column on 'users'
-- that does not exist here; using it would cause a runtime error.)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "update_progress_photos_timestamp" ON "progress_photos";
CREATE TRIGGER "update_progress_photos_timestamp"
BEFORE UPDATE ON "progress_photos"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
