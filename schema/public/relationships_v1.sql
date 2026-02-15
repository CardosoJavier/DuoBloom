-- =============================================
-- Table: relationships
-- Version: 1
-- Description: Stores the permanent link between two users
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "relationships" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_one_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id"),
    "user_two_id" uuid UNIQUE NOT NULL REFERENCES "users" ("id"),
    "created_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "no_self_relationship" CHECK (user_one_id != user_two_id)
);

-- 2. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_relationships_user_one" ON "relationships" ("user_one_id");
CREATE INDEX IF NOT EXISTS "idx_relationships_user_two" ON "relationships" ("user_two_id");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "relationships" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can only view their own relationship
CREATE POLICY "Users can view own relationship"
ON "relationships"
FOR SELECT
USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- Policy: Insert
-- Only system functions (SECURITY DEFINER) should insert here, 
-- but if direct insert is needed, ensure user is part of it.
-- Generally, we rely on the confirm_partner_sync function.

-- Policy: Delete (Breakup)
-- Users can delete their own relationship
CREATE POLICY "Users can delete own relationship"
ON "relationships"
FOR DELETE
USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

-- 4. Functions
-- ---------------------------------------------
-- Helper to get partner ID for a given user
CREATE OR REPLACE FUNCTION get_partner_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_partner_id UUID;
BEGIN
    SELECT 
        CASE 
            WHEN user_one_id = p_user_id THEN user_two_id
            WHEN user_two_id = p_user_id THEN user_one_id
        END INTO v_partner_id
    FROM "relationships"
    WHERE user_one_id = p_user_id OR user_two_id = p_user_id;
    
    RETURN v_partner_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
