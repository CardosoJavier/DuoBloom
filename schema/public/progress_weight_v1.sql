-- =============================================
-- Table: progress_weight
-- Version: 1
-- Description: User weight and body composition logs
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "progress_weight" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    "weight_kg" decimal NOT NULL,
    "weight_lb" decimal NOT NULL,
    "body_fat" decimal,
    
    "recorded_date" date NOT NULL,
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_progress_weight_user_id" ON "progress_weight" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_progress_weight_date" ON "progress_weight" ("recorded_date");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "progress_weight" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own weight and partner's
CREATE POLICY "Users can view own and partner weight"
ON "progress_weight"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = progress_weight.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = progress_weight.user_id)
    )
);

-- Policy: Insert
-- Users can log their own weight
CREATE POLICY "Users can insert own weight"
ON "progress_weight"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Delete
-- Users can delete their own logs
CREATE POLICY "Users can delete own weight"
ON "progress_weight"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required.
