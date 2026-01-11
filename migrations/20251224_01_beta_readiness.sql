-- Beta Readiness Migration
-- Date: 2025-12-24
-- Purpose: Auth tokens, audit logs, slug uniqueness enforcement

-- 1) Auth tokens table (Magic Link implementation)
create table if not exists auth_magic_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  restaurant_id uuid,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_tokens_lookup on auth_magic_tokens(token, expires_at) where used_at is null;
create index if not exists idx_auth_tokens_email on auth_magic_tokens(email, created_at desc);

-- 2) Audit log table (structured logging for beta observation)
create table if not exists onboarding_audit_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  event_type text not null,
  event_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_restaurant on onboarding_audit_log(restaurant_id, created_at desc);
create index if not exists idx_audit_event_type on onboarding_audit_log(event_type, created_at desc);

-- 3) Add audit columns to restaurant_web_profiles for better tracking
alter table restaurant_web_profiles 
  add column if not exists web_level text not null default 'BASIC' 
    check (web_level in ('BASIC', 'PRO', 'EXPERIENCE'));

-- 4) Ensure slug uniqueness with explicit constraint name for better error handling
-- (Already exists but let's ensure it's there with proper naming)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'restaurant_web_profiles_slug_unique'
  ) then
    alter table restaurant_web_profiles 
      add constraint restaurant_web_profiles_slug_unique unique (slug);
  end if;
end $$;

-- 5) Add function to clean expired tokens (housekeeping)
create or replace function cleanup_expired_auth_tokens() returns void as $$
  delete from auth_magic_tokens 
  where expires_at < now() - interval '24 hours';
$$ language sql;

-- 6) Comments for documentation
comment on table auth_magic_tokens is 'Magic link authentication tokens for passwordless login';
comment on table onboarding_audit_log is 'Structured event log for beta observation and debugging';
comment on column restaurant_web_profiles.web_level is 'Web page tier: BASIC (free), PRO, or EXPERIENCE';
