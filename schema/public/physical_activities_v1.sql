-- =============================================
-- Table: physical_activities
-- Version: 1
-- Description: Workout logs
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "physical_activities" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    
    "name" varchar(100) NOT NULL,
    "date" date NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "photo_url" text NOT NULL,
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_physical_activities_user_date" ON "physical_activities" ("user_id", "date");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "physical_activities" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can see their own workouts and partner's
CREATE POLICY "Users can view own and partner workouts"
ON "physical_activities"
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM "relationships" 
        WHERE (user_one_id = auth.uid() AND user_two_id = physical_activities.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = physical_activities.user_id)
    )
);

-- Policy: Insert
-- Users can log their own workouts
CREATE POLICY "Users can insert own workouts"
ON "physical_activities"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Update
-- Users can update their own logs
CREATE POLICY "Users can update own workouts"
ON "physical_activities"
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------
-- None currently required.
