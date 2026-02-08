# Scripts legados com Supabase

**Propósito:** Listar scripts em `scripts/` que ainda usam Supabase (SDK ou CLI) e classificá-los como legado ou migrado. Runtime do projeto usa apenas Docker Core.

**Referência:** [SUBSTITUICAO_SUPABASE_POR_PROJETO.md](../qa/SUBSTITUICAO_SUPABASE_POR_PROJETO.md), [DOCKER_CORE_ONLY.md](../architecture/DOCKER_CORE_ONLY.md).

---

## Resumo

- **Aplicações (merchant-portal, mobile-app, core-engine):** Backend único Docker Core; sem `@supabase/supabase-js` em runtime.
- **Scripts em `scripts/`:** Vários testes/demos/ferramentas ainda usam `@supabase/supabase-js` ou Supabase CLI. Não fazem parte do bundle das aplicações. Podem ser migrados para falar com o Core (fetch/PostgREST) ou mantidos como legado com esta documentação.

---

## Scripts que usam `@supabase/supabase-js`

| Script | Uso | Migração sugerida |
|--------|-----|-------------------|
| `test-realtime-kds.ts` | Teste Realtime KDS | Usar Core Realtime ou marcar legado; Core pode expor WebSocket equivalente. |
| `seed-massive-test.ts` | Seed de dados para testes massivos | Substituir `createClient` por fetch/PostgREST contra `CORE_URL/rest/v1` ou script que chame API do Core. |
| `demo-mode-automatic.sh` | Demo automático (inline JS com createClient) | Reescrever para usar `CORE_URL` + fetch ou marcar legado. |
| `visual-validation-test.sh` | Validação visual (inline JS Supabase) | Idem: CORE_URL + fetch. |
| `visual-validation-orchestrator.sh` | Orquestrador + Supabase CLI + inline JS | Idem; `supabase status`/`supabase start` podem ser substituídos por verificação do Docker Core. |
| `validate-ui-core-connection.ts` | Valida UI ↔ Core (RPC, orders, realtime) | Já valida “Core”; migrar para usar apenas fetch/PostgREST contra Core (remover `@supabase/supabase-js`). |
| `setup-pilot-restaurant.ts` | Cria restaurante piloto | Usar Core API ou PostgREST contra Core. |
| `stress-orders-massive.ts` | Stress de pedidos | Idem. |
| `test-single-order.ts` | Teste de um pedido | Idem. |
| `diagnose-test-environment.ts` | Diagnóstico do ambiente de teste | Usar Core (CORE_URL) em vez de SUPABASE_URL. |
| `chaos-test-massive.ts` | Caos + Realtime | Migrar para Core ou marcar legado. |

---

## Scripts que referenciam Supabase (paths, CLI, publicação Postgres)

| Script | Referência | Nota |
|--------|------------|------|
| `check-phase-guardian.sh` | `legacy_supabase/functions/...` | Path legado; não é runtime Supabase. |
| `lineage-check.sh` | `legacy_supabase/migrations` | Idem. |
| `prepare-schema-parts.sh` | `legacy_supabase/migrations` | Idem. |
| `check-financial-supabase.sh` | Nome do script + padrões `supabase.from`/`supabase.rpc` | CI: falha se código usar Supabase para domínio financeiro; alinhado a “só Docker Core”. |
| `sovereignty-gate.sh` | Padrão `supabase.rpc('create_order_atomic')` | Idem: exige CoreOrdersApi, não supabase.rpc. |
| `teste-massivo-nivel-3/fase-6-realtime.ts` | `pubname = 'supabase_realtime'` | Nome da publicação Postgres (pode existir no Core); não é SDK. |
| `teste-massivo-nivel-4/fase-0-preflight.ts`, `fase-7-realtime.ts` | `supabase_realtime` | Idem. |
| `teste-massivo-nivel-5/fase-0-preflight.ts` | `supabase_realtime` | Idem. |
| `test-realtime-connection.sh` | `supabase_realtime` no Postgres | Idem. |
| `check-db-status.sh` | Container `supabase_db_*` | Nome do container; em ambiente Docker Core pode ser outro nome. |
| `quick-visual-check.sh` | CLI `supabase` (status, start) | Legado; em ambiente só Docker usar `docker-core`/health do Core. |

---

## Scripts Docker Core / neutros

- `test_post_drop_local.sh` — Smoke pós-drop: Core saudável, tabelas `gm_%`, sem tabelas legadas.
- `chaos-test-docker.ts` — Caos contra Docker Core.
- Outros que só usam `CORE_URL`, fetch ou ferramentas do Core (ex.: `docker-core/Makefile`, scripts em `docker-core/`).

---

## Como migrar um script legado

1. Substituir `createClient(SUPABASE_URL, SUPABASE_KEY)` por chamadas fetch a `CORE_URL/rest/v1` (PostgREST) com header `apikey: CORE_ANON_KEY`.
2. Para RPC: `POST CORE_URL/rest/v1/rpc/<nome_rpc>` com body JSON dos parâmetros.
3. Remover dependência `@supabase/supabase-js` do script (ou do package.json do monorepo/script se existir).
4. Realtime: se o Core expor WebSocket/SSE, usar essa API; caso contrário, marcar script como legado até haver equivalente.

---

**Última actualização:** 2025-02-03 — Listagem e classificação dos scripts com Supabase.
