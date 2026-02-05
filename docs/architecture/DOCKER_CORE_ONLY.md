# Docker Core Only — Backend único (project-wide)

## Substituição total: Supabase → Docker Core

**Âmbito:** merchant-portal, core-engine e mobile-app usam **apenas** Docker Core (PostgREST + RPCs). Nenhum caminho de código destas aplicações usa Supabase BaaS. Pedidos, caixa, pagamentos, fiscal, billing, auth (Keycloak/mock) e dados de domínio passam exclusivamente pelo Core. Shims `supabase` / `supabaseClient` são alias ou stubs; variáveis `*_SUPABASE_*` aceites apenas como fallback com warning `@legacy-remove`.

**Guardrail:** `scripts/check-no-supabase.sh` falha se existir import `@supabase/supabase-js` ou uso de `getSupabaseClient`/`createClient(Supabase)` em merchant-portal/src, core-engine ou mobile-app (com exclusões documentadas: scripts Deno legados, stub supabaseClient).

**Scripts:** Os que ainda usam Supabase estão em [LEGACY_SCRIPTS_SUPABASE.md](../scripts/LEGACY_SCRIPTS_SUPABASE.md). Ver [SUBSTITUICAO_SUPABASE_POR_PROJETO.md](../qa/SUBSTITUICAO_SUPABASE_POR_PROJETO.md) para o estado por módulo.

## Estado actual

O backend da aplicação é **exclusivamente Docker Core** (PostgREST em 3001, via proxy `/rest` em dev). Não existe fallback para Supabase BaaS.

- **Config**: `VITE_CORE_URL` e `VITE_CORE_ANON_KEY` canónicos; `VITE_SUPABASE_*` aceite apenas como fallback com warning `@legacy-remove`.
- **Auth**: Keycloak + sessão mock (demo/pilot). `getCoreSessionAsync()` + `supabase.auth.getSession()` delegam em Core; sem Supabase Auth.
- **Dados**: Cliente fetch (`dockerCoreFetchClient`) e `coreRpc` (getTableClient / invokeRpc). Sem `@supabase/supabase-js` no bundle.
- **Pasta Supabase**: A pasta `supabase/` foi relocada para **`legacy_supabase/`**. Edge Functions (billing, health, etc.) e migrations ficam em `legacy_supabase/`; não são usadas quando o app corre 100% em Docker Core. Podem ser reativadas noutro contexto (hospedagem Supabase) se necessário.

## Variáveis de ambiente

- **Produção**: `VITE_CORE_URL` (URL do Core/PostgREST), `VITE_CORE_ANON_KEY`.
- **Local**: Em dev sem vars, o Vite usa proxy `/rest` para o Core em 3001.

## Referências

- `merchant-portal/src/core/infra/backendAdapter.ts` — BackendType: `docker` | `none`.
- `merchant-portal/src/core/infra/coreRpc.ts` — getTableClient / invokeRpc (Core only).
- `merchant-portal/src/core-boundary/docker-core/connection.ts` — dockerCoreClient = getDockerCoreFetchClient().
- `core-engine/infra/coreRpc.ts` — getTableClient / invokeRpc (Core only).
- `core-engine/supabase/index.ts` — alias do cliente Docker Core; auth/functions stubs.
- `scripts/check-no-supabase.sh` — CI guardrail: zero Supabase em merchant-portal, core-engine, mobile-app.
