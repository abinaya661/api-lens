-- Fix: plan column should default to NULL for new signups (not 'monthly')
-- Users should only get plan = 'monthly'/'annual' after successful payment via webhook.

-- Make plan nullable with NULL default
ALTER TABLE public.subscriptions
  ALTER COLUMN plan DROP NOT NULL,
  ALTER COLUMN plan SET DEFAULT NULL;

-- Fix existing trialing users who incorrectly have plan = 'monthly'
UPDATE public.subscriptions
  SET plan = NULL
  WHERE status = 'trialing'
    AND dodo_subscription_id IS NULL;

-- Update the handle_new_user trigger to explicitly set plan = NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',   split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1))
  );

  -- Insert company
  v_company_id := gen_random_uuid();
  INSERT INTO public.companies (id, owner_id, name, created_at, updated_at)
  VALUES (
    v_company_id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Insert subscription (trialing, no plan yet)
  INSERT INTO public.subscriptions (id, user_id, status, plan, trial_ends_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'trialing',
    NULL,
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;
