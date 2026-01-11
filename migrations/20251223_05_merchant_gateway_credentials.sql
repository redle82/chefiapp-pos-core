-- Web Module — Merchant Gateway Credentials (Stripe)
-- Date: 2025-12-23
-- Notes:
-- - Stores merchant credentials outside public profile
-- - Encrypted at application layer (AES-256-GCM), stored as BYTEA

create extension if not exists pgcrypto;

create table if not exists merchant_gateway_credentials (
  restaurant_id uuid primary key,
  company_id uuid,
  gateway text not null check (gateway in ('STRIPE')),

  publishable_key_enc bytea,
  secret_key_enc bytea not null,
  webhook_secret_enc bytea,

  is_test_mode boolean not null default true,
  last_health_check_at timestamptz,
  last_webhook_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_merchant_gateway_credentials_company
  on merchant_gateway_credentials(company_id);
