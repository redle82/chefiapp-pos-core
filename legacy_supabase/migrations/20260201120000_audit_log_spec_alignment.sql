-- Onda 2 · A1 — Alinhar gm_audit_logs à AUDIT_LOG_SPEC
-- Adiciona event_type, actor_type, result; reforça imutabilidade com trigger.
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- 1. Novas colunas (compatíveis com registos existentes)
alter table gm_audit_logs
  add column if not exists event_type text default '',
  add column if not exists actor_type text default 'user',
  add column if not exists result text;

comment on column gm_audit_logs.event_type is 'AUDIT_LOG_SPEC: e.g. login_success, config_changed, payment_recorded';
comment on column gm_audit_logs.actor_type is 'AUDIT_LOG_SPEC: user | system | support_admin';
comment on column gm_audit_logs.result is 'AUDIT_LOG_SPEC: success | failure (optional)';

-- 2. Índice para consultas por event_type (auditoria e export)
create index if not exists idx_audit_logs_event_type
  on gm_audit_logs(tenant_id, event_type, created_at desc)
  where event_type <> '';

-- 3. Imutabilidade a nível de base de dados: proibir UPDATE e DELETE
create or replace function gm_audit_logs_immutable()
returns trigger
language plpgsql
security invoker
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'gm_audit_logs: updates not allowed (immutable audit trail)';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'gm_audit_logs: deletes not allowed (immutable audit trail). Use authorised purge job.';
  end if;
  return null;
end;
$$;

drop trigger if exists tr_gm_audit_logs_immutable on gm_audit_logs;
create trigger tr_gm_audit_logs_immutable
  before update or delete on gm_audit_logs
  for each row execute function gm_audit_logs_immutable();
