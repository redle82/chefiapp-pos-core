-- Merchant Subscriptions (replaces merchant-001-record.json file)
-- Date: 2026-02-07
-- Purpose: Store merchant billing state in database instead of local JSON file

CREATE TABLE IF NOT EXISTS merchant_subscriptions (
  merchant_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name         TEXT NOT NULL,
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier             TEXT NOT NULL DEFAULT 'STARTER'
    CHECK (plan_tier IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  status                TEXT NOT NULL DEFAULT 'TRIAL'
    CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED')),
  addons                JSONB NOT NULL DEFAULT '[]',
  current_period_end    TIMESTAMPTZ,
  trial_end             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_stripe_customer
  ON merchant_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status
  ON merchant_subscriptions(status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_merchant_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchant_subscriptions_updated
  BEFORE UPDATE ON merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_merchant_subscription_timestamp();
