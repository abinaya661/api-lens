CREATE TABLE IF NOT EXISTS public.access_passes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('15_day', '30_day')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_pass_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pass_id UUID REFERENCES public.access_passes(id),
  user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  trial_extended_to TIMESTAMPTZ NOT NULL,
  UNIQUE (pass_id, user_id)
);

ALTER TABLE public.access_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_pass_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "read_active_passes" ON public.access_passes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY IF NOT EXISTS "insert_redemptions" ON public.access_pass_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "read_own_redemptions" ON public.access_pass_redemptions
  FOR SELECT USING (user_id = auth.uid());
