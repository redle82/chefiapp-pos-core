# Plano P0 — Fluxo Soberano Integrado

## Objetivo

Implementar todos os itens P0 do backlog em `FLUXO_SOBERANO_INTEGRADO.md`, fechando o fluxo soberano mínimo em ambiente Supabase/Core.

---

## Estado por item

| Item | Descrição | Estado |
|------|-----------|--------|
| **P0.1** | Seed canónico OWNER + RESTAURANTE + MEMBERSHIP | ✅ Implementado (`seed-e2e-user.ts` + schema `gm_companies`) |
| **P0.2** | Validar fluxo no Admin com user seeded | ✅ Implementado (login Supabase, JWT, runbook, schema aplicado) |
| **P0.3** | TenantContext via membership como fonte única | ✅ Implementado |
| **P0.4** | TPV fim a fim com RPCs mínimas | ✅ Implementado (`scripts/smoke-tpv-rpcs.ts`) |
| **P0.5** | Docs operacionais mínimas | ✅ Implementado (Bootstrap 5 passos + referências) |

---

## Plano de implementação

### P0.3 — TenantContext (modo soberano)

- **O que fazer:** No `TenantContext`, quando `CONFIG.isSupabaseBackend`:
  1. Sem sessão: não usar bypass debug/trial; definir estado com `tenantId: null` e `error` claro (ex.: "Inicie sessão para aceder ao restaurante.").
  2. Com sessão mas sem memberships: definir `error` explícito (ex.: "Nenhum restaurante associado a esta conta.") em vez de falha silenciosa.
- **Ficheiros:** `merchant-portal/src/core/tenant/TenantContext.tsx` (importar `CONFIG`, ajustar ramos sem sessão e `members.length === 0`).

### P0.4 — TPV RPCs e smoke-test

- **O que fazer:**
  1. Script de smoke-test em Node que, com `.env.local` (Supabase):
     - Chama RPC `create_order_atomic` com `restaurant_id` válido e payload mínimo.
     - Opcionalmente chama `create_device_pairing_code` se existir no schema (Supabase baseline pode não ter; reportar se 404).
  2. Documentar no runbook: que RPCs estão disponíveis no Supabase atual e o que falta (ex.: `create_device_pairing_code`) se aplicável.
- **Ficheiros:** novo `merchant-portal/scripts/smoke-tpv-rpcs.ts`; referência em `docs/ops/SUPABASE_SCHEMA_FLUXO_SOBERANO.md` ou `FLUXO_SOBERANO_INTEGRADO.md`.

### P0.5 — Docs operacionais

- **O que fazer:**
  1. Em `FLUXO_SOBERANO_INTEGRADO.md`: adicionar secção "Bootstrap em 5 passos" com comandos exatos (schema, seed, dev, login, Admin).
  2. Garantir que `SEED_OWNER_SOBERANO.md` e `FLUXO_SOBERANO_VALIDACAO_ADMIN.md` estão referenciados e coerentes com o fluxo atual.

---

## Ordem de execução

1. P0.3 (TenantContext)  
2. P0.4 (smoke-test RPCs)  
3. P0.5 (docs + bootstrap no roadmap)

P0.1 e P0.2 já estão fechados.
