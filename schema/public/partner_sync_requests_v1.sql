-- =============================================
-- Table: partner_sync_requests
-- Version: 1
-- Description: Manages the handshake process for partner syncing
-- =============================================

-- 1. Enums
-- ---------------------------------------------
DO $$ BEGIN
    CREATE TYPE "sync_request_status" AS ENUM ('PENDING', 'MATCHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "partner_sync_requests" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "requester_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "target_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "status" sync_request_status NOT NULL DEFAULT 'PENDING',
    
    -- Confirmation flags for the final step
    "requester_confirmed" boolean DEFAULT false,
    "target_confirmed" boolean DEFAULT false,
    
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),

    -- Prevent self-sync
    CONSTRAINT "no_self_sync" CHECK (requester_id != target_id)
);

-- 3. Indexes
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_sync_requests_requester" ON "partner_sync_requests" ("requester_id");
CREATE INDEX IF NOT EXISTS "idx_sync_requests_target" ON "partner_sync_requests" ("target_id");

-- Symmetric Unique Constraint (Prevent Race Conditions)
-- Ensures only one request exists per pair regardless of direction (A->B or B->A)
CREATE UNIQUE INDEX IF NOT EXISTS "one_active_request_per_pair" 
ON "partner_sync_requests" (LEAST("requester_id", "target_id"), GREATEST("requester_id", "target_id"));

-- 4. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "partner_sync_requests" ENABLE ROW LEVEL SECURITY;

-- Policy: View (SELECT)
-- Users can only see requests they are involved in
CREATE POLICY "Users can view own sync requests"
ON "partner_sync_requests"
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Policy: Insert
-- Users can only create requests where they are the requester
CREATE POLICY "Users can create sync requests"
ON "partner_sync_requests"
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Policy: Update
-- Users can only update requests they are involved in (for confirmation)
CREATE POLICY "Users can update own sync requests"
ON "partner_sync_requests"
FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- 5. Functions
-- ---------------------------------------------

-- Function: Attempt Sync (Step 3-4)
-- Handles the initial handshake safely with locking
CREATE OR REPLACE FUNCTION attempt_partner_sync(p_requester_id UUID, p_target_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_target_id UUID;
    v_existing_id UUID;
    v_current_status sync_request_status;
BEGIN
    -- Resolve Target User
    SELECT id INTO v_target_id FROM "users" WHERE "pair_code" = p_target_code;
    
    IF v_target_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_CODE');
    END IF;

    IF v_target_id = p_requester_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_SYNC_SELF');
    END IF;

    -- Lock and Check
    SELECT id, status INTO v_existing_id, v_current_status
    FROM "partner_sync_requests"
    WHERE (requester_id = p_requester_id AND target_id = v_target_id)
       OR (requester_id = v_target_id AND target_id = p_requester_id)
    FOR UPDATE;

    IF v_existing_id IS NOT NULL THEN
        -- Check if we are completing the match (the other person started it)
        IF v_current_status = 'PENDING' AND (
            SELECT requester_id FROM "partner_sync_requests" WHERE id = v_existing_id
        ) = v_target_id THEN
            -- Match found! Update status.
            UPDATE "partner_sync_requests"
            SET status = 'MATCHED', updated_at = now()
            WHERE id = v_existing_id;
            RETURN jsonb_build_object('success', true, 'status', 'MATCHED', 'request_id', v_existing_id);
        ELSE
            -- Already matched or we are the requester waiting
            RETURN jsonb_build_object('success', true, 'status', v_current_status, 'request_id', v_existing_id);
        END IF;
    ELSE
        -- Create new request
        INSERT INTO "partner_sync_requests" (requester_id, target_id, status)
        VALUES (p_requester_id, v_target_id, 'PENDING')
        RETURNING id INTO v_existing_id;
        RETURN jsonb_build_object('success', true, 'status', 'PENDING', 'request_id', v_existing_id);
    END IF;

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'RACE_CONDITION_RETRY');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Confirm Sync (Step 7)
-- Handles final confirmation and cleanup
CREATE OR REPLACE FUNCTION confirm_partner_sync(p_request_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
BEGIN
    -- Get request
    SELECT * INTO v_req FROM "partner_sync_requests" WHERE id = p_request_id;
    
    IF v_req IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'REQUEST_NOT_FOUND');
    END IF;

    -- Update confirmation flags based on who is calling
    IF v_req.requester_id = p_user_id THEN
        UPDATE "partner_sync_requests" SET requester_confirmed = true WHERE id = p_request_id;
        v_req.requester_confirmed := true;
    ELSIF v_req.target_id = p_user_id THEN
        UPDATE "partner_sync_requests" SET target_confirmed = true WHERE id = p_request_id;
        v_req.target_confirmed := true;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHORIZED');
    END IF;

    -- FINAL CHECK: Are both confirmed?
    IF v_req.requester_confirmed AND v_req.target_confirmed THEN
        -- 1. Create Relationship (Assuming relationships table exists via relationships_v1.sql)
        INSERT INTO "relationships" (user_one_id, user_two_id)
        VALUES (v_req.requester_id, v_req.target_id);

        -- 2. Delete the temporary request (Cleanup)
        DELETE FROM "partner_sync_requests" WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'status', 'SYNC_COMPLETED');
    ELSE
        RETURN jsonb_build_object('success', true, 'status', 'WAITING_FOR_PARTNER');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
