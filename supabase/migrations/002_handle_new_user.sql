-- Migration 002: Handle new user signup
-- Creates profiles table and a trigger that fires on new auth.users inserts
-- to bootstrap company, subscription, and profile rows.

-- ─────────────────────────────────────────────
-- 1. profiles table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name    TEXT,
  company_name TEXT,
  email        TEXT,
  onboarded    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────
-- 2. Trigger function
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- 2a. Insert profile
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',   split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1))
  );

  -- 2b. Insert company
  v_company_id := gen_random_uuid();
  INSERT INTO public.companies (id, owner_id, name, created_at, updated_at)
  VALUES (
    v_company_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- 2c. Insert subscription (trialing)
  INSERT INTO public.subscriptions (id, company_id, status, trial_ends_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_company_id,
    'trialing',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- 3. Trigger on auth.users
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
