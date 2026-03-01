-- =============================================
-- Table: user_recovery
-- Version: 1
-- Description: Stores encrypted private keys for device migration
-- =============================================

-- Add public_key to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS public_key TEXT;

CREATE TABLE IF NOT EXISTS public.user_recovery (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    encrypted_private_key TEXT NOT NULL,
    salt TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_recovery ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own recovery data"
ON public.user_recovery
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recovery data"
ON public.user_recovery
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery data"
ON public.user_recovery
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery data"
ON public.user_recovery
FOR DELETE
USING (auth.uid() = user_id);
