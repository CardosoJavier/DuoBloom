-- =============================================
-- Table: nutrition_streaks
-- Version: 1 (consolidated)
-- Description: Streak state for each user's nutrition logging habit.
--              One row per user. Updated by the client after each meal log.
--              Retroactive logs trigger a full recalculation via the
--              recalculate_nutrition_streak() RPC.
--              last_check_in_date tracks the last date the user answered
--              the daily check-in modal (Yes or No), enabling cross-device
--              modal suppression without polluting nutrition_logs.
-- =============================================

-- 1. Table Definition
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS "nutrition_streaks" (
    "id"                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id"               uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "current_streak_count"  integer NOT NULL DEFAULT 0,
    "all_time_streak_count" integer NOT NULL DEFAULT 0,
    "last_streak_day"       date,
    "last_updated_date"     timestamptz DEFAULT now(),
    "last_check_in_date"    date,
    CONSTRAINT "unique_user_streak" UNIQUE ("user_id")
);

-- 2. Indexes
-- ---------------------------------------------
-- user_id is already unique-indexed via the UNIQUE constraint above.
-- Explicit index retained for fast single-column lookups.
CREATE INDEX IF NOT EXISTS "idx_nutrition_streaks_user_id" ON "nutrition_streaks" ("user_id");

-- 3. Row Level Security (RLS)
-- ---------------------------------------------
ALTER TABLE "nutrition_streaks" ENABLE ROW LEVEL SECURITY;

-- SELECT: own streak and partner's streak (for shared streak display)
CREATE POLICY "Users can view own and partner streak state"
ON "nutrition_streaks"
FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM "relationships"
        WHERE (user_one_id = auth.uid() AND user_two_id = nutrition_streaks.user_id)
           OR (user_two_id = auth.uid() AND user_one_id = nutrition_streaks.user_id)
    )
);

-- INSERT: own streak row only
CREATE POLICY "Users can insert own streak state"
ON "nutrition_streaks"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: own streak row only
CREATE POLICY "Users can update own streak state"
ON "nutrition_streaks"
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Functions
-- ---------------------------------------------

-- recalculate_nutrition_streak
-- Called by the client (via RPC) when a retroactive log is inserted
-- (i.e. log_date < last_streak_day). Loops through ALL nutrition_logs for
-- the user sorted ascending, rebuilds current_streak_count and
-- all_time_streak_count, then upserts the result.
--
-- last_check_in_date is intentionally excluded from all ON CONFLICT DO UPDATE
-- clauses so that recalculating streaks never resets when the user last
-- answered the daily check-in modal.
CREATE OR REPLACE FUNCTION recalculate_nutrition_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dates     date[];
    v_date      date;
    v_prev_date date;
    v_current   integer := 0;
    v_all_time  integer := 0;
    v_last_day  date;
    v_today     date := CURRENT_DATE;
BEGIN
    -- Fetch all completed log dates for the user up to today, sorted ascending
    SELECT ARRAY_AGG(log_date ORDER BY log_date ASC)
    INTO v_dates
    FROM nutrition_logs
    WHERE user_id = p_user_id
      AND log_date <= v_today;

    IF v_dates IS NULL OR array_length(v_dates, 1) = 0 THEN
        -- No logs at all — reset streak counts, preserve last_check_in_date
        INSERT INTO nutrition_streaks (user_id, current_streak_count, all_time_streak_count, last_streak_day, last_updated_date)
        VALUES (p_user_id, 0, 0, NULL, now())
        ON CONFLICT (user_id) DO UPDATE
            SET current_streak_count = 0,
                last_streak_day      = NULL,
                last_updated_date    = now();
        -- last_check_in_date intentionally excluded: preserved as-is
        RETURN;
    END IF;

    v_last_day  := v_dates[array_length(v_dates, 1)];
    v_prev_date := NULL;
    v_current   := 0;

    FOREACH v_date IN ARRAY v_dates LOOP
        IF v_prev_date IS NULL OR v_date = v_prev_date + INTERVAL '1 day' THEN
            v_current := v_current + 1;
        ELSE
            -- Gap found — start a new streak segment
            v_current := 1;
        END IF;

        IF v_current > v_all_time THEN
            v_all_time := v_current;
        END IF;

        v_prev_date := v_date;
    END LOOP;

    -- If the last log day is neither today nor yesterday, the current streak is broken
    IF v_last_day < v_today - INTERVAL '1 day' THEN
        v_current := 0;
    END IF;

    INSERT INTO nutrition_streaks (user_id, current_streak_count, all_time_streak_count, last_streak_day, last_updated_date)
    VALUES (p_user_id, v_current, v_all_time, v_last_day, now())
    ON CONFLICT (user_id) DO UPDATE
        SET current_streak_count  = EXCLUDED.current_streak_count,
            all_time_streak_count = GREATEST(nutrition_streaks.all_time_streak_count, EXCLUDED.all_time_streak_count),
            last_streak_day       = EXCLUDED.last_streak_day,
            last_updated_date     = now();
    -- last_check_in_date intentionally excluded: preserved as-is
END;
$$;

-- Grant execute to authenticated users so the client can invoke via RPC
GRANT EXECUTE ON FUNCTION recalculate_nutrition_streak(uuid) TO authenticated;
