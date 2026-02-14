-- Users Table Definition
-- This table extends the standard Supabase auth.users table
-- It stores additional profile information for the application users

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pair_code VARCHAR(8) UNIQUE NOT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated_on TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" 
    ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users can update own profile" 
    ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Function to handle new user creation
-- This function is called by the trigger after a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_pair_code VARCHAR(8);
BEGIN
    -- Generate a unique pair code with collision handling
    LOOP
        -- Generate a random 8-character string (uppercase hex from md5)
        new_pair_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if the code already exists in the users table
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE pair_code = new_pair_code) THEN
            EXIT; -- Unique code found, break the loop
        END IF;
    END LOOP;

    INSERT INTO public.users (id, first_name, last_name, email, pair_code)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'firstName', 'User'), -- Default fallback
        COALESCE(new.raw_user_meta_data->>'lastName', ''),
        new.email,
        new_pair_code
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call the function on new user sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
