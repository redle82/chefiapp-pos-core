# Inventário pré-migração Supabase Zero — core-engine

**Data:** 2026-02-03

## rg "@supabase/supabase-js|supabaseClient|getSupabaseClient|BackendType\.supabase|createClient\(" core-engine

- **dockerCoreFetchClient.ts:** comentário "ZERO @supabase/supabase-js"
- **supabaseClient.ts:** getSupabaseClient() que faz throw (proibitivo)

## rg "supabase|Supabase|SUPABASE" core-engine

- **backendAdapter.ts:** BackendType docker|none apenas; fallback VITE_SUPABASE_URL em getRawBaseUrl
- **supabase/index.ts:** alias "supabase" = getDockerCoreFetchClient(); comentários "Sem Supabase BaaS"
- **coreOrSupabaseRpc.ts:** Core only; comentário "Sem Supabase"
- **DbWriteGate.ts:** import supabase; (supabase as any).from(table).insert/update/delete/upsert
- **Logger.ts:** (supabase as any).from("app_logs").upsert
- **AuditService.ts:** supabase.auth.getSession(); supabase.from('gm_audit_logs').insert
- **Kernel.ts:** import supabase; supabase.from()
- **LiveRealityCheck.ts:** supabase.from()
- **effects/index.ts:** import supabase from '../supabase'; supabase.rpc()
- **SovereigntyService.ts:** getTableClient; comentário "legacy_supabase functions"
- **dockerCoreFetchClient.ts:** VITE_SUPABASE_URL/ANON fallback
- **ReconciliationEngine.ts:** comentário "Supabase client"
- **repo/types.ts:** comentário "Supabase"
- **README.md:** "PostgreSQL/Supabase"

## Critérios pós-migração

- coreOrSupabaseRpc renomeado para coreRpc; imports actualizados
- DbWriteGate, Logger, AuditService, Kernel, LiveRealityCheck: usar getTableClient() em vez de supabase
- Zero getSupabaseClient() em uso (supabaseClient.ts pode manter throw)
- rg "@supabase/supabase-js|BackendType\.supabase|createClient\(|getSupabaseClient\(" core-engine => ZERO (excepto comentários e throw em supabaseClient)
