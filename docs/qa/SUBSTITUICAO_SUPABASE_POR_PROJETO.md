# Substituição Supabase → Docker Core por módulo

**Propósito:** Estado da substituição Supabase por Docker Core em cada parte do projeto.

**Referência:** [DOCKER_CORE_ONLY.md](../architecture/DOCKER_CORE_ONLY.md), [AUDITORIA_SUPABASE_DOCKER_CORE.md](AUDITORIA_SUPABASE_DOCKER_CORE.md).

---

## Resumo

| Módulo            | Substituição completa? | Notas |
|-------------------|------------------------|--------|
| **merchant-portal** | **Sim**                | Backend único Docker Core; CoreOrdersApi sem fallback Supabase; sem `@supabase/supabase-js` no bundle. |
| **mobile-app**      | **Sim**                | `services/supabase.ts` exporta `coreClient` (Docker Core PostgREST); auth mock/demo; sem dependência `@supabase/supabase-js`. |
| **core-engine**     | **Sim**                | BackendType só `docker` \| `none`; supabaseClient/supabase index são stubs ou alias do Docker Core; CoreOrdersApi e RPC só Docker. |
| **scripts/**        | Parcial                | Muitos scripts de teste/demo ainda usam `@supabase/supabase-js`; documentados em [LEGACY_SCRIPTS_SUPABASE.md](../scripts/LEGACY_SCRIPTS_SUPABASE.md). |
| **legacy_supabase/**| N/A                    | Pasta legada (migrations, functions); não usada em runtime. |

**Conclusão:** A substituição está **completa nas aplicações** (merchant-portal, mobile-app, core-engine). Os scripts em `scripts/` que ainda usam Supabase estão documentados como legado e podem ser migrados conforme [LEGACY_SCRIPTS_SUPABASE.md](../scripts/LEGACY_SCRIPTS_SUPABASE.md).

---

## merchant-portal — Completo

- BackendType: `docker` | `none` (sem `supabase`).
- CoreOrdersApi, coreRpc, dockerCoreFetchClient: só Docker Core; erro `BACKEND_NOT_DOCKER` quando não Docker.
- Auth: Keycloak + mock; useSupabaseAuth é alias de useCoreAuth.
- Shim `core/supabase`: alias para getDockerCoreFetchClient(); não é BaaS.
- Sem dependência `@supabase/supabase-js` no package.json.

---

## mobile-app — Completo

- **package.json:** Sem `@supabase/supabase-js`.
- **services/supabase.ts:** Exporta `coreClient` (cliente PostgREST fetch contra Docker Core); compatível com imports existentes.
- **services/coreClient.ts:** Cliente Core para React Native/Expo: `.from()`, `.rpc()`, `.auth` (mock/demo), `.functions.invoke()`.
- **Auth:** Mock/demo; `EXPO_PUBLIC_DEMO_AUTH=true` ou email `demo@demo` para login sem backend.
- **Env:** EXPO_PUBLIC_CORE_URL / EXPO_PUBLIC_CORE_ANON_KEY (fallback EXPO_PUBLIC_SUPABASE_*).

---

## core-engine — Completo

- **BackendType:** Apenas `docker` | `none`; removidos `supabase`, `isSupabaseBackend()`, `assertSupabaseAllowed()`.
- **infra/supabaseClient.ts:** Stub que lança erro; uso deve ser via Docker Core client.
- **infra/coreRpc.ts:** getTableClient / invokeRpc (Docker Core apenas); sem fallback Supabase.
- **CoreOrdersApi.ts:** Só Docker Core; erro `BACKEND_NOT_DOCKER` quando não Docker.
- **Kernel.ts, LiveRealityCheck.ts:** Usam cliente Core (PostgREST); sem opção `count`, uso de `.limit(N)`.
- **DbWriteGate, SovereigntyService, etc.:** Escritas/reconcile via Core (fetch/RPC).
- **supabase/index.ts (core-engine):** Alias do cliente Docker Core; auth/functions como stub ou fetch ao Core.

---

## Scripts

- Scripts em `scripts/` que ainda usam `@supabase/supabase-js` ou Supabase CLI estão listados e classificados em [LEGACY_SCRIPTS_SUPABASE.md](../scripts/LEGACY_SCRIPTS_SUPABASE.md). Não fazem parte do bundle das aplicações. Migração opcional: usar CORE_URL + fetch/PostgREST.

---

**Última actualização:** 2025-02-03 — merchant-portal, mobile-app e core-engine completos; scripts documentados como legado.
