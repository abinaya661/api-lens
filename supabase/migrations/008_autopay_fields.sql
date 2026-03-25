ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_method_collected BOOLEAN DEFAULT false;
