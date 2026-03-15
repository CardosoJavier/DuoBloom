-- =============================================
-- Table: user_recovery
-- Version: 2
-- Description: Decommissions the user_recovery table introduced in v1.
--              This table stored encrypted private key vaults for BIP39-based
--              E2EE recovery. E2EE has been removed from the application;
--              security is now enforced entirely through Supabase RLS.
-- =============================================

-- ── Drop RLS Policies ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own recovery data" ON public.user_recovery;
DROP POLICY IF EXISTS "Users can view their own recovery data"   ON public.user_recovery;
DROP POLICY IF EXISTS "Users can update their own recovery data" ON public.user_recovery;
DROP POLICY IF EXISTS "Users can delete their own recovery data" ON public.user_recovery;

-- ── Drop Table ────────────────────────────────────────────────────────────────
-- CASCADE removes the foreign key reference from public.users and any other
-- objects that depend on this table.
DROP TABLE IF EXISTS public.user_recovery CASCADE;
