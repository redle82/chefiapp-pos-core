# Auditoria RLS — DoD 2026

**Data:** 2026-02-22  
**Ref:** Plano Migração + DoD 2026, Parte B1. Arquitetura: ARCHITECTURE_OFFICIAL_2026.md.

---

## 1. Objetivo

Confirmar que todas as tabelas relevantes (`gm_*`, `webhook_events`, `gm_payments`, etc.) têm **ENABLE ROW LEVEL SECURITY** e políticas por `restaurant_id` (ou equivalente), garantindo isolamento por tenant.

---

## 2. Docker Core (docker-core/schema)

O Core em Docker aplica migrações em `docker-core/schema/migrations/`. Estado:

| Tabela / grupo | RLS | Políticas |
|----------------|-----|----------|
| gm_restaurants, gm_orders, gm_order_items, gm_payments, gm_restaurant_members | Sim | 20260321_day2_rls_policies.sql — SELECT/INSERT/UPDATE/DELETE por `has_restaurant_access(restaurant_id)`, service_role bypass |
| gm_onboarding_state | Sim | 20260322_day3_onboarding_flow.sql |
| webhook_events | Não (sistema) | Acesso apenas via RPC `process_webhook_event` (service_role). REVOKE anon. Tabela sem restaurant_id (eventos globais). |
| webhook_out_config, webhook_out_delivery_log | Sim | 20260301_webhook_out_config.sql |
| gm_integration_credentials | Sim | 20260305_integration_credentials.sql |
| api_keys | Sim | 20260301_api_keys.sql |
| gm_restaurant_settings, inventory_items, gm_order_requests, gm_reconciliation_queue | Sim | 20260220_rls_operational_hardening.sql |
| gm_cash_register_transactions | Sim | 20260220_rls_financial_hardening.sql |
| event_store, legal_seals | Sim | 20260220_event_store_tenant_hardening.sql |
| core_event_log | Sim | 20260221_core_event_log.sql |
| gm_device_heartbeats | Sim | 20260221_device_heartbeats_and_runtime_views.sql |
| gm_refunds, gm_fiscal_documents, gm_audit_logs | Sim | 20260212_rls_phase2_tables.sql |
| merchant_code_mapping | Sim | 20260331_day6_payment_integration.sql |
| Outras gm_*, backup, export, fiscal, etc. | Sim | Várias migrações (20260212_*, 20260220_*) |

**Conclusão Docker Core:** RLS ativo nas tabelas de negócio com políticas por tenant. `webhook_events` é tabela de sistema (apenas service_role escreve/lê via RPC); não tem `restaurant_id`.

---

## 3. Supabase (supabase/migrations)

O baseline em `supabase/migrations/20260222111218_baseline_existing_production_schema.sql` cria tabelas **sem** RLS. O ficheiro `20260222113000_security_hardening.sql` apenas **reforça** RLS em tabelas que já tenham `relrowsecurity = true` (e SECURITY DEFINER); não adiciona RLS a tabelas que nunca o tiveram.

- **Projetos que usam só supabase/migrations:** As tabelas do baseline (gm_*, webhook_events, etc.) ficam sem RLS até ser aplicada uma migração que as active.
- **Migração criada:** `supabase/migrations/20260222120000_rls_webhook_events_supabase.sql` — activa RLS em `webhook_events` com política de acesso apenas para `service_role` (e anon sem acesso), alinhado com o uso via Edge Functions / RPC.

Para isolamento completo por tenant em projetos Supabase, é necessário aplicar as políticas equivalentes às do Docker Core (por ex. com `has_restaurant_access(restaurant_id)` se o projeto tiver auth e `restaurant_users`), ou aplicar o mesmo conjunto de migrações do docker-core quando o Supabase for usado como Core.

---

## 4. Checklist

- [x] Docker Core: tabelas gm_* e sensíveis com RLS e políticas por restaurant_id documentadas.
- [x] webhook_events: uso apenas por service_role (RPC); sem exposição anon.
- [x] Supabase: migração para RLS em webhook_events criada; documento de auditoria actualizado.
