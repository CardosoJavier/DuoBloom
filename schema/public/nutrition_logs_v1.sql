-- =============================================
-- Table: nutrition_logs
-- Version: 1
-- Description: Daily nutrition completion log (one row per user per day they logged a meal).
--              Replaces the old "nutrition_streaks" table, which was misnamed.
--              The "nutrition_streaks" table now stores streak state only.
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE
    IF NOT EXISTS "nutrition_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
        "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "log_date" date NOT NULL,
        "created_at" timestamptz DEFAULT now (),
        CONSTRAINT "unique_user_log_date" UNIQUE ("user_id", "log_date")
    );

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_nutrition_logs_user_id" ON "nutrition_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_nutrition_logs_log_date" ON "nutrition_logs" ("log_date");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "nutrition_logs" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own logs and their partner's logs
CREATE POLICY "Users can view own and partner nutrition logs" ON "nutrition_logs" FOR
SELECT
    USING (
        auth.uid () = user_id
        OR EXISTS (
            SELECT
                1
            FROM
                "relationships"
            WHERE
                (
                    user_one_id = auth.uid ()
                    AND user_two_id = nutrition_logs.user_id
                )
                OR (
                    user_two_id = auth.uid ()
                    AND user_one_id = nutrition_logs.user_id
                )
        )
    );

-- Policy: Insert
-- Users can insert their own log entries
CREATE POLICY "Users can insert own nutrition logs" ON "nutrition_logs" FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Policy: Delete
-- Users can delete their own log entries
CREATE POLICY "Users can delete own nutrition logs" ON "nutrition_logs" FOR DELETE
USING (auth.uid () = user_id);
