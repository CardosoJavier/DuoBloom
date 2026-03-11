-- =============================================
-- Table: nutrition_streaks
-- Version: 3
-- Description: Adds last_check_in_date column to track the last date the
--              user answered the daily check-in modal (Yes or No). This is
--              independent of nutrition_logs (which only contains successful
--              days) so the modal can be suppressed cross-device even when
--              the user answered "No".
-- Migration from v2: ALTER TABLE only (non-destructive).
-- =============================================

-- 1. Migration
-- ---------------------------------------------
ALTER TABLE "nutrition_streaks"
  ADD COLUMN IF NOT EXISTS "last_check_in_date" date;

-- 2. Index
-- ---------------------------------------------
-- Speeds up the hook's lookup: getStreakState already queries by user_id
-- (covered by the existing unique index), so no additional index is needed.

-- 3. Update recalculate_nutrition_streak to preserve last_check_in_date
-- ---------------------------------------------
-- The recalculation function uses ON CONFLICT DO UPDATE and must not
-- overwrite last_check_in_date with NULL when rebuilt from nutrition_logs.
CREATE OR REPLACE FUNCTION recalculate_nutrition_streak (p_user_id uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dates         date[];
    v_date          date;
    v_prev_date     date;
    v_current       integer := 0;
    v_all_time      integer := 0;
    v_last_day      date;
    v_today         date := CURRENT_DATE;
BEGIN
    -- Fetch all completed log dates for the user up to today, sorted ascending
    SELECT ARRAY_AGG(log_date ORDER BY log_date ASC)
    INTO v_dates
    FROM nutrition_logs
    WHERE user_id = p_user_id
      AND log_date <= v_today;

    IF v_dates IS NULL OR array_length(v_dates, 1) = 0 THEN
        INSERT INTO nutrition_streaks (user_id, current_streak_count, all_time_streak_count, last_streak_day, last_updated_date)
        VALUES (p_user_id, 0, 0, NULL, now())
        ON CONFLICT (user_id) DO UPDATE
            SET current_streak_count = 0,
                last_streak_day      = NULL,
                last_updated_date    = now();
        -- last_check_in_date intentionally excluded: preserved as-is
        RETURN;
    END IF;

    v_last_day := v_dates[array_length(v_dates, 1)];
    v_prev_date := NULL;
    v_current := 0;

    FOREACH v_date IN ARRAY v_dates LOOP
        IF v_prev_date IS NULL OR v_date = v_prev_date + INTERVAL '1 day' THEN
            v_current := v_current + 1;
        ELSE
            v_current := 1;
        END IF;

        IF v_current > v_all_time THEN
            v_all_time := v_current;
        END IF;

        v_prev_date := v_date;
    END LOOP;

    -- If the last log day is neither today nor yesterday, the streak is broken
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

GRANT EXECUTE ON FUNCTION recalculate_nutrition_streak (uuid) TO authenticated;
