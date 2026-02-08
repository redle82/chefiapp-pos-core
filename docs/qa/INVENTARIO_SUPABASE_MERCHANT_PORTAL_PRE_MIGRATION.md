# Inventário pré-migração Supabase Zero / Docker Core Only (merchant-portal)

**Data:** 2026-02-03  
**Objetivo:** Registo do estado antes da migração para confirmar zero depois.

## 1. rg "supabase|SUPABASE|@supabase/supabase-js|getSupabaseClient|createClient\(" em merchant-portal/src

- Vários ficheiros importam `supabase` de `../../core/supabase` (alias para getDockerCoreFetchClient).
- Nenhum import de `@supabase/supabase-js` em src (package.json já não tem a dependência).
- Nenhuma chamada a `getSupabaseClient()`.
- `createClient(` apenas em scripts (fora de src) e em core/scripts (Deno).

## 2. VITE_SUPABASE / SUPABASE_URL / SUPABASE_ANON em merchant-portal

- **config.ts:** CORE_URL usa VITE_CORE_URL || VITE_SUPABASE_URL; CORE_ANON_KEY usa VITE_CORE_ANON_KEY || VITE_SUPABASE_ANON_KEY.
- **backendAdapter.ts:** getRawBaseUrl() usa VITE_CORE_URL e VITE_SUPABASE_URL como fallback.
- **TPVMinimal.tsx:** linha 753 VITE_CORE_URL || VITE_SUPABASE_URL para texto "Ativa".
- **.env:** VITE_SUPABASE_URL=/rest, VITE_SUPABASE_ANON_KEY=...
- **.env.example:** já tem VITE_CORE_* como canónico; sem VITE_SUPABASE_*.
- Scripts em merchant-portal/scripts: muitos usam VITE_SUPABASE_* (fora de src; documentar como legacy).

## 3. BackendType.supabase

- **backendAdapter.ts:** já só tem `BackendType.docker` e `BackendType.none`. Sem supabase.

## 4. core/supabase/index.ts

- Exporta `supabase` = cliente Core (getDockerCoreFetchClient) com auth/channel stubs.
- Sem dependência de @supabase/supabase-js.

## 5. Auth

- useCoreAuth.ts já existe (CoreSession, CoreUser, mock + Keycloak).
- Vários ficheiros ainda chamam `supabase.auth.getSession()` ou `supabase.auth.getUser()` — o stub devolve null/reject. Migração: fazer auth.getSession() devolver sessão Core (getCoreSessionAsync) para não alterar todos os call sites.

## Critérios pós-migração (verificação final)

- Zero imports de @supabase/supabase-js em merchant-portal/src (exceto src/core/scripts = Deno standalone legado).
- Zero getSupabaseClient() / createClient() em src (exceto core/scripts).
- Zero BackendType.supabase.
- ENVs: VITE_CORE_* canónico; VITE_SUPABASE_* apenas fallback com warning @legacy-remove.
- Build + testes passam.
- Script `scripts/check-no-supabase.sh` passa.
- LEGACY_CODE_BLACKLIST inclui proibição de reintroduzir supabase-js e getSupabaseClient.
