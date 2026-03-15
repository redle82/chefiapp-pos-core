# Frente encerrada: 5 testes unitários (SyncEngine + AdminRoutes)

## Estado

- **Encerrada em:** 2026-03 (validação local).
- **Não reabrir** esta frente; não misturar com o bloqueio do E2E `config-general.spec.ts`.

## O que estava a falhar (antes)

1. **SyncEngine.test.ts** — 1 teste: `degraded: processQueue still processes pending items when connectivity is degraded` (`createOrderAtomic` não era chamado).
2. **AdminRoutes.test.tsx** — 4 testes em timeout (5000 ms): redirects `/admin/catalog`, `/admin/catalog/setup`, e "renders the admin modules route".

## O que foi verificado (agora)

- `src/core/sync/SyncEngine.test.ts` → **passando** (8 testes).
- `src/routes/modules/AdminRoutes.test.tsx` → **passando** (9 testes).
- Suite completa `merchant-portal`: **816 passed, 4 skipped, 0 failed.**

## Regra

- Não alterar SyncEngine, AdminRoutes nem a suite unitária geral para “corrigir” esta frente — está verde.
- O foco segue exclusivamente para o bloqueio ainda aberto: **E2E `config-general.spec.ts`** (erro `disabled_at` / Supabase/PostgREST). Ver **docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md** §1.1.
