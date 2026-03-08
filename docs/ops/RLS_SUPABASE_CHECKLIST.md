# Checklist RLS — Supabase como Core (Fase 2)

**Objetivo:** Em projetos que usam **Supabase** (supabase/migrations) como backend único, garantir isolamento por tenant equivalente ao Docker Core.

**Ref:** [RLS_AUDIT_2026.md](../audit/RLS_AUDIT_2026.md).

---

## 1. Migrações obrigatórias

- [ ] **webhook_events:** Aplicar `supabase/migrations/20260222120000_rls_webhook_events_supabase.sql` (acesso apenas service_role; anon sem acesso).

## 2. Tabelas gm_* e sensíveis

Se o Supabase for o Core de produção (PostgREST exposto ao frontend), aplicar políticas equivalentes às do Docker Core:

- [ ] **gm_restaurants, gm_orders, gm_order_items, gm_payments, gm_restaurant_members:** RLS com `has_restaurant_access(restaurant_id)` (ou equivalente) para SELECT/INSERT/UPDATE/DELETE; service_role bypass.
- [ ] **gm_onboarding_state, gm_restaurant_settings, gm_integration_credentials, api_keys:** Políticas por tenant.
- [ ] **gm_cash_register_transactions, gm_refunds, gm_fiscal_documents, gm_audit_logs, event_store, core_event_log:** RLS por restaurant_id.
- [ ] **webhook_out_config, webhook_out_delivery_log:** Por tenant conforme 20260301_webhook_out_config.sql.

Referência das políticas: ficheiros em `docker-core/schema/migrations/` (20260321_day2_rls_policies.sql, 20260220_*, 20260212_*).

## 3. Critério de conclusão (Fase 2)

- Zero queries a tabelas gm_* sem guard de tenant (RLS ou filtro explícito por restaurant_id).
- webhook_events acessível apenas via RPC com service_role.
