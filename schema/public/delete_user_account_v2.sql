CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove relationship row (FK has no ON DELETE CASCADE on auth.users)
  DELETE FROM public.relationships
    WHERE user_one_id = auth.uid() OR user_two_id = auth.uid();

  -- Deleting from auth.users cascades to public.users and all downstream tables
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon, public;
