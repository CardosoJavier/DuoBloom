-- =============================================
-- Table: progress_photos
-- Version: 1
-- Description: User progress photos (Front, Side, Back)
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "progress_photos" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    "front_photo_url" text NOT NULL,
    "side_photo_url" text NOT NULL,
    "back_photo_url" text NOT NULL,
    "captured_date" date NOT NULL,
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_progress_photos_user_id" ON "progress_photos" ("user_id");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "progress_photos" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own photos.
-- Privacy consideration: Should partner see these? 
-- Assuming YES based on relationship, but could be restricted by privacy settings later.
CREATE POLICY "Users can view own and partner photos"
ON "progress_photos"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = progress_photos.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = progress_photos.user_id)
    )
);

-- Policy: Insert
-- Users can upload their own photos
CREATE POLICY "Users can insert own photos"
ON "progress_photos"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Delete
-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON "progress_photos"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required.
