-- Web Module — Web Page Levels (BASIC/PRO/EXPERIENCE)
-- Date: 2025-12-23

alter table restaurant_web_profiles
  add column if not exists web_level text not null default 'BASIC'
    check (web_level in ('BASIC','PRO','EXPERIENCE'));
