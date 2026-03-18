-- Add unique constraint for usage record upserts
-- The sync engine uses onConflict: 'key_id,date,model' when upserting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usage_records_key_id_date_model_key'
  ) THEN
    ALTER TABLE usage_records
    ADD CONSTRAINT usage_records_key_id_date_model_key
    UNIQUE (key_id, date, model);
  END IF;
END
$$;

-- Add index for faster budget checking queries
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date
ON usage_records (user_id, date);

-- Add index for faster key sync queries
CREATE INDEX IF NOT EXISTS idx_api_keys_active_provider
ON api_keys (is_active, provider)
WHERE is_active = true;

-- Add unique constraint on subscriptions.user_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_user_id_key
    UNIQUE (user_id);
  END IF;
END
$$;
