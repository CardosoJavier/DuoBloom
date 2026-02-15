-- =============================================
-- Table: hydration_logs
-- Version: 1
-- Description: Daily water intake logs
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "hydration_logs" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    "date" date NOT NULL,
    "amount_ml" integer NOT NULL DEFAULT 250,
    
    "logged_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_hydration_logs_user_date" ON "hydration_logs" ("user_id", "date");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "hydration_logs" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own hydration and partner's
CREATE POLICY "Users can view own and partner hydration"
ON "hydration_logs"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = hydration_logs.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = hydration_logs.user_id)
    )
);

-- Policy: Insert
-- Users can log their own water
CREATE POLICY "Users can insert own hydration"
ON "hydration_logs"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Update
-- Users can update their own logs
CREATE POLICY "Users can update own hydration"
ON "hydration_logs"
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required.
