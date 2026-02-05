# Busca profunda — Supabase residual

**Data:** 2025-02-03  
**Propósito:** Inventariar todas as referências a Supabase no repositório após a migração para Docker Core.

---

## 1. Resumo

| Categoria | Quantidade | Risco |
|-----------|------------|--------|
| **Código activo (merchant-portal)** | Nome/hook `useSupabaseAuth`, shim `core/supabase`, compatibilidade config, fallbacks em CoreOrdersApi | Baixo (shim = Core; fallbacks só quando backend ≠ docker) |
| **Código que usa o shim** | Vários ficheiros importam `supabase` de `core/supabase` — em runtime é o cliente Docker Core | Nenhum (alias intencional) |
| **Fallback Supabase em CoreOrdersApi** | Blocos `(supabase as any).rpc(...)` quando não Docker | Médio (código morto em modo Docker; pode confundir) |
| **Scripts e ferramentas** | Scripts em `scripts/` com `@supabase/supabase-js` ou lógica Supabase | Baixo (fora do bundle; testes/demo) |
| **Documentação** | Muitas menções em docs (auditoria, contratos, migração) | Nenhum |
| **Docker/legacy** | `legacy_supabase/`, imagem `supabase/realtime`, publicação `supabase_realtime` | Nenhum (legado ou compatibilidade PostgREST) |

**Conclusão:** Não existe **cliente `@supabase/supabase-js`** no bundle do merchant-portal. O que resta são: (1) nome do hook e do shim por compatibilidade, (2) leitura de `VITE_SUPABASE_*` na config, (3) fallbacks em CoreOrdersApi (inactivos quando backend = docker), (4) scripts de teste/demo fora do app, (5) documentação e (6) legacy_supabase + realtime com nome supabase.

---

## 2. Merchant-portal — código

### 2.1 Intencional / compatibilidade (manter)

| Ficheiro | O que tem | Nota |
|----------|-----------|------|
| `core/supabase/index.ts` | Exporta `supabase` = alias de getDockerCoreFetchClient() | Shim; sem BaaS. |
| `core/auth/useSupabaseAuth.ts` | Re-exporta `useCoreAuth` como `useSupabaseAuth` | Compatibilidade de nome. |
| `core/auth/useCoreAuth.ts` | Comentário "No Supabase" | Doc. |
| `core/auth/authTypes.ts` | Comentário "Sem dependência de @supabase/supabase-js" | Doc. |
| `core/auth/authAdapter.ts` | Comentário "Sem Supabase" | Doc. |
| `config.ts` | `VITE_CORE_URL \|\| VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Compatibilidade env. |
| `core/infra/backendAdapter.ts` | Fallback de URL: `VITE_SUPABASE_URL` se não houver `VITE_CORE_URL` | Compatibilidade env. |
| `core/infra/dockerCoreFetchClient.ts` | Comentário "ZERO @supabase/supabase-js" | Doc. |
| `core-boundary/docker-core/connection.ts` | Comentário "No Supabase BaaS" | Doc. |
| `package.json` | Script `audit:supabase-domain` → check-financial-supabase.sh | CI contra regressão. |

### 2.2 Uso do shim (em runtime = Core)

Estes ficheiros importam `supabase` de `core/supabase` ou `../supabase`. Em execução, `supabase` é o cliente PostgREST (Docker Core), não o BaaS.

| Ficheiro | Uso |
|----------|-----|
| `core/financial/FinancialEngine.ts` | `supabase.from(...)`, depois `invokeRpc("calculate_product_margin")` — shim. |
| `core/fiscal/CoreFiscalEventStore.ts` | `supabase.from("gm_fiscal_events")` — shim. |
| `core/diagnostics/DiagnosticEngine.ts` | `supabase.auth.getSession()` — shim (no-op ou useCoreAuth). |
| `integrations/adapters/glovo/GlovoAdapter.ts` | `supabase.channel`, `supabase.removeChannel` — shim. |
| `core/modules/tpv/TPVInstaller.ts` | `supabase.from` + `invokeRpc` — shim. |
| `core/wizardProgress.ts` | `supabase` para escrita — shim. |
| `core/people/ShiftComparisonEngine.ts` | LEGACY/LAB; shim. |
| `core/people/PerformanceCorrelationEngine.ts` | LEGACY/LAB; shim. |
| `core/ai/MenuOptimizationService.ts` | LEGACY/LAB; shim. |
| `core/fiscal/FiscalBackupService.ts` | LEGACY/LAB; shim. |
| `core/audit/logAuditEvent.ts` | LEGACY/LAB; supabase.auth.getSession — shim. |
| `core/logger/Logger.ts` | LEGACY/LAB; (supabase as any).from("app_logs") — shim. |
| `core/collaboration/RealtimeCollaborationService.ts` | LEGACY/LAB; shim. |
| `core/collaboration/CollaborationFeaturesService.ts` | LEGACY/LAB; shim. |
| `core/fiscal/ATIntegrationService.ts` | LEGACY/LAB; shim. |
| `core/security/AdvancedSecurityService.ts` | LEGACY/LAB; shim. |
| `core/gamification/GamificationService.ts` | LEGACY/LAB; shim. |
| `core/logger/AuditService.ts` | LEGACY/LAB; shim. |
| `core/menu/SponsoredMenu/SponsorshipService.ts` | LEGACY/LAB; shim. |
| `core/menu/DynamicMenu/DynamicMenuService.ts` | LEGACY/LAB; shim. |
| `pages/BootstrapPage.tsx` | `supabase.auth.getSession()` — sessão; comentário "Domain only via Core". |
| `pages/TPV/TPV.tsx` | `supabase.auth.getSession()` — sessão. |

### 2.3 Fallback Supabase (removido 2025-02-03)

**CoreOrdersApi.ts** — Os blocos transicionais que importavam `../supabase` e chamavam `(supabase as any).rpc(...)` foram **removidos**. Todas as funções (createOrderAtomic, addOrderItem, removeOrderItem, updateOrderItemQty, updateOrderStatus) usam apenas Docker Core; quando `getBackendType() !== BackendType.docker` retornam erro explícito `BACKEND_NOT_DOCKER` com mensagem "Backend must be Docker Core. Configure VITE_CORE_URL (or run dev with proxy)."

### 2.4 Outros (comentários, mensagens, env.example)

- `core/billing/coreBillingApi.ts` — Comentário "NO SUPABASE"; throw se não Docker.
- `core/fiscal/FiscalService.ts` — Propriedade `useSupabase` (boolean); comentário.
- `pages/AuthPage.tsx`, `Onboarding/sections/IdentitySection.tsx` — Comentários "Sem Supabase" / "Domain writes ONLY via Core".
- `pages/TPVMinimal/TPVMinimal.tsx`, `pages/KDSMinimal/KDSMinimal.tsx` — Comentários ou texto UI "Supabase".
- `pages/TPV/context/OrderContextReal.tsx` — Comentário "RISK: Se Supabase Realtime falhar...".
- `core/menu/MenuBootstrapService.ts` — Parâmetro `private supabase: DockerCoreClientShape` (nome; tipo é Core).
- `core/inventory/AutomatedInventoryService.ts` — Comentário "ANTI-SUPABASE §4".
- `core/errors/ErrorMessages.ts` — Menção a dockerCoreClient (não Supabase directo).
- `.env.example`, `.env.example.production` — Texto sobre Supabase/Anon Key (documentação env).
- `core/storage/storageAdapter.ts` — Comentários "Supabase Storage não usado".
- `core/auth/authKeycloak.ts` — Comentário "substitui Supabase Auth".
- `core/health.ts` — Mensagem de erro "Supabase domain fallback is forbidden".
- `core/pages/AppStaff/core/ReflexEngine.ts` — Comentário "ANTI-SUPABASE §4".
- Testes E2E — Comentários "NO SUPABASE CLIENT" / "Bypass Backend/Supabase".

---

## 3. Scripts (fora do bundle)

| Script | Uso Supabase | Nota |
|--------|----------------|------|
| `scripts/check-financial-supabase.sh` | Nome e padrões que proíbem supabase.from(gm_*) | CI; válido. |
| `scripts/check-phase-guardian.sh` | Paths `legacy_supabase/functions/` | Referência à pasta. |
| `scripts/lineage-check.sh` | `legacy_supabase/migrations` | Referência à pasta. |
| `scripts/prepare-schema-parts.sh` | `legacy_supabase/migrations/*.sql` | Referência à pasta. |
| `scripts/sovereignty-gate.sh` | Padrão supabase.rpc('create_order_atomic') | Bloqueia regressão. |
| `scripts/test-realtime-kds.ts` | `createClient('@supabase/supabase-js')` | Ferramenta de teste; não está no merchant-portal. |
| `scripts/demo-mode-automatic.sh` | createClient + supabase.from | Demo; inline JS. |
| `scripts/visual-validation-test.sh` | createClient + supabase.from/rpc | Validação visual. |
| `scripts/visual-validation-orchestrator.sh` | Supabase CLI, createClient | Orquestrador de testes. |
| `scripts/validate-realtime.sh` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | Check env. |
| `scripts/validate-ui-core-connection.ts` | getSupabaseClient(), @supabase/supabase-js | Teste de conexão. |
| `scripts/seed-massive-test.ts` | SupabaseClient, supabase.from/rpc | Seed de testes. |
| `scripts/run-massive-concurrent-test.sh` | SUPABASE_URL, SUPABASE_ANON_KEY | Env para testes. |
| `scripts/quick-visual-check.sh` | supabase CLI, VITE_SUPABASE_URL | Check visual. |
| `scripts/check-db-status.sh` | Nome "Supabase Local (Legado)" | Mensagem. |
| `scripts/teste-massivo-nivel-*` / `test-realtime-connection.sh` | pubname = 'supabase_realtime' | Publicação Postgres (nome mantido). |

Nenhum destes faz parte do build do merchant-portal.

---

## 4. Docker-core e legacy

| Local | O que tem |
|-------|-----------|
| `docker-core/docker-compose.core.yml` | Comentário porta diferente do Supabase local; comentário "compatibilidade com Supabase client"; imagem `supabase/realtime:v2.34.47`; Keycloak "substitui Supabase Auth"; MinIO "substitui Supabase Storage". |
| `docker-core/schema/*.sql` | Comentários "sem Supabase"; referência a migrations antigas. |
| `docker-core/schema/realtime_setup.sql` | Publicação `supabase_realtime` (nome compatível com cliente realtime). |
| `docker-core/README.md`, `show-everything.sh` | VITE_SUPABASE_URL/ANON_KEY em exemplos de env. |
| `legacy_supabase/` | Pasta com migrations e functions; não usada quando o app corre em Docker Core. |

---

## 5. Documentação

Muitos ficheiros em `docs/` referem Supabase no contexto de:

- Auditoria e migração (AUDITORIA_SUPABASE_DOCKER_CORE.md, TESTE_TOTAL_POS_REMOÇÃO_SUPABASE.md, etc.)
- Contratos (proibição, soberania, anti-Supabase)
- Rotas, ops, pilots, architecture

São referências históricas ou de política; não são código.

---

## 6. .github

- `CODEOWNERS`: `/legacy_supabase/migrations/`
- `workflows/core-validation.yml`: `legacy_supabase/functions/**`
- `workflows/ci.yml`: passo "Check financial Supabase" → `check-financial-supabase.sh`

---

## 7. Recomendações

1. **CoreOrdersApi.ts** — **Feito (2025-02-03).** Blocos Supabase removidos; só Docker Core; erro `BACKEND_NOT_DOCKER` quando não Docker.
2. **Nomes** — Manter `useSupabaseAuth` e `core/supabase` como estão (compatibilidade e documentação já explicam que é Core).
3. **Scripts** — Manter como estão; são ferramentas de teste/demo/CI; não afetam o bundle. Opcional: renomear ou comentar scripts que usam `@supabase/supabase-js` para "legacy/demo only".
4. **Docs** — Sem acção; referências são úteis para contexto e auditoria.
5. **Realtime** — A publicação `supabase_realtime` e a imagem `supabase/realtime` são compatibilidade de protocolo; não implicam uso do BaaS Supabase.

---

**Última actualização:** 2025-02-03 — Busca profunda concluída.
