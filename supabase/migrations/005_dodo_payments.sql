-- Remove Razorpay columns if they exist
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS razorpay_subscription_id,
  DROP COLUMN IF EXISTS razorpay_customer_id;

-- Add Dodo Payments columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id
  ON public.subscriptions(dodo_subscription_id)
  WHERE dodo_subscription_id IS NOT NULL;
