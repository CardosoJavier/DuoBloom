-- =============================================
-- Table: nutrition_streaks
-- Version: 1
-- Description: Tracks daily logging streaks for nutrition
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "nutrition_streaks" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "log_date" date NOT NULL,
    
    "created_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "unique_user_log_date" UNIQUE ("user_id", "log_date")
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_nutrition_streaks_user_id" ON "nutrition_streaks" ("user_id");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "nutrition_streaks" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own streaks and partner's streaks
CREATE POLICY "Users can view own and partner streaks"
ON "nutrition_streaks"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = nutrition_streaks.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = nutrition_streaks.user_id)
    )
);

-- Policy: Insert
-- Users can insert their own streaks (usually system managed)
CREATE POLICY "Users can insert own streaks"
ON "nutrition_streaks"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required. Logic for streak calculation usually in application layer or scheduled function.
