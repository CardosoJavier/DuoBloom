-- =============================================
-- Table: consumed_meals
-- Version: 1
-- Description: Logs of meals eaten by users
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "consumed_meals" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    "name" varchar(100) NOT NULL,
    "kcal" integer,
    "consumption_date" timestamptz NOT NULL, -- Renamed from 'date' to 'consumption_date' for clarity and changed to timestamp for precision
    "photo_url" text NOT NULL,
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_consumed_meals_user_id" ON "consumed_meals" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_consumed_meals_date" ON "consumed_meals" ("consumption_date");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "consumed_meals" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own meals AND their partner's meals (if linked)
CREATE POLICY "Users can view own and partner meals"
ON "consumed_meals"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = consumed_meals.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = consumed_meals.user_id)
    )
);

-- Policy: Insert
-- Users can only log meals for themselves
CREATE POLICY "Users can insert own meals"
ON "consumed_meals"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Update
-- Users can update only their own meal logs
CREATE POLICY "Users can update own meals"
ON "consumed_meals"
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Delete
-- Users can delete their own meal logs
CREATE POLICY "Users can delete own meals"
ON "consumed_meals"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required.
