-- =============================================
-- Table: progress_stats
-- Version: 1
-- Description: User weight and body composition logs.
--              Renamed from progress_weight (see updates.sql for migration).
--              Partner visibility is gated by the owner's privacy_mode.
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "progress_stats" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,

    "weight_kg" decimal,
    "weight_lb" decimal,
    "body_fat" decimal,

    -- One row per user per calendar day (upsert on conflict)
    "recorded_date" date NOT NULL,

    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),

    CONSTRAINT "uq_progress_stats_user_date" UNIQUE ("user_id", "recorded_date")
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_progress_stats_user_id"   ON "progress_stats" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_progress_stats_date"       ON "progress_stats" ("recorded_date");
CREATE INDEX IF NOT EXISTS "idx_progress_stats_user_date"  ON "progress_stats" ("user_id", "recorded_date" DESC);

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "progress_stats" ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (own records)
CREATE POLICY "Users can view own stats"
ON "progress_stats"
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: SELECT (partner records — gated by owner's privacy_mode)
CREATE POLICY "Partners can view stats when privacy is off"
ON "progress_stats"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "relationships"
        WHERE (user_one_id = auth.uid() AND user_two_id = progress_stats.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = progress_stats.user_id)
    )
    AND NOT EXISTS (
        SELECT 1 FROM "user_settings"
        WHERE user_id = progress_stats.user_id
          AND privacy_mode = true
    )
);

-- Policy: INSERT (own records only)
CREATE POLICY "Users can insert own stats"
ON "progress_stats"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE (own records only)
CREATE POLICY "Users can update own stats"
ON "progress_stats"
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: DELETE (own records only)
CREATE POLICY "Users can delete own stats"
ON "progress_stats"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Triggers
-- ---------------------------------------------
DROP TRIGGER IF EXISTS "update_progress_stats_timestamp" ON "progress_stats";
CREATE TRIGGER "update_progress_stats_timestamp"
BEFORE UPDATE ON "progress_stats"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
