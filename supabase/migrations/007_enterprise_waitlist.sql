CREATE TABLE public.enterprise_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_waitlist ENABLE ROW LEVEL SECURITY;
