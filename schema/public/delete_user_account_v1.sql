-- =============================================
-- Function: delete_user_account
-- Version: 1 (consolidated — v2 changes incorporated)
-- Description: SECURITY DEFINER RPC that fully removes the calling user's account.
--              Step 1: deletes the relationship row (FK has no ON DELETE CASCADE
--              to auth.users, so this must be done explicitly).
--              Step 2: deletes from auth.users, cascading to public.users
--              and all downstream tables.
-- =============================================

DROP FUNCTION IF EXISTS public.delete_user_account();

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Step 1: Remove relationship row — FK has no ON DELETE CASCADE on auth.users
  DELETE FROM public.relationships
    WHERE user_one_id = auth.uid() OR user_two_id = auth.uid();

  -- Step 2: Deletes from auth.users cascades to public.users and all
  --         downstream tables that reference users with ON DELETE CASCADE.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon, public;
