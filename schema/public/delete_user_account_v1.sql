-- delete_user_account_v1.sql
-- SECURITY DEFINER RPC: deletes the calling user's auth record.
-- public.users has ON DELETE CASCADE to auth.users, so all downstream tables
-- (progress_photos, meals, relationships, user_settings, etc.) cascade automatically.

-- Drop if exists (idempotent migration)
DROP FUNCTION IF EXISTS public.delete_user_account();

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() ensures a user can only delete their own account.
  -- Deleting from auth.users cascades to public.users and all downstream tables.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Only authenticated users may call this function.
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon, public;
