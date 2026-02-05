# Auditoria: Supabase → Docker Core

**Data:** 2026-02-04  
**Propósito:** Relatório completo e detalhado sobre a remoção do Supabase e a mudança para Docker Core (tudo o que foi feito). Inclui definição e checklist do teste passivo completo.

**Referências:** [DOCKER_CORE_ONLY.md](../architecture/DOCKER_CORE_ONLY.md), [TESTE_TOTAL_POS_REMOÇÃO_SUPABASE.md](TESTE_TOTAL_POS_REMOÇÃO_SUPABASE.md), [VALIDACAO_POS_DROP_LEGACY_LOCAL.md](VALIDACAO_POS_DROP_LEGACY_LOCAL.md).

---

## 1. Resumo executivo

- **Backend actual:** Exclusivamente **Docker Core** (PostgREST em 3001, via proxy `/rest` em dev). Não existe fallback para Supabase BaaS.
- **Supabase:** Removido do fluxo activo. A pasta `supabase/` foi relocada para **`legacy_supabase/`** (Edge Functions, migrations); não é usada quando o app corre em Docker Core.
- **Auth:** Keycloak + sessão mock (demo/pilot). Sem Supabase Auth.
- **Dados:** Cliente fetch (`dockerCoreFetchClient`) e `coreRpc` (getTableClient / invokeRpc). Sem `@supabase/supabase-js` no bundle do merchant-portal.

---

## 2. O que foi removido (Supabase)

| Item | Estado |
|------|--------|
| **Cliente `@supabase/supabase-js`** | Removido de [merchant-portal/package.json](../../merchant-portal/package.json). Não consta em dependencies nem devDependencies. |
| **getSupabaseClient() / supabaseClient.ts** | Eliminado do fluxo activo. Nenhum ficheiro em `merchant-portal/src` importa `getSupabaseClient` ou `supabaseClient`. O ficheiro foi removido ou deixou de ser importado. |
| **Auth Supabase** | Substituído por Keycloak + sessão mock. [useCoreAuth.ts](../../merchant-portal/src/core/auth/useCoreAuth.ts), [authAdapter.ts](../../merchant-portal/src/core/auth/authAdapter.ts); [useSupabaseAuth.ts](../../merchant-portal/src/core/auth/useSupabaseAuth.ts) re-exporta useCoreAuth para compatibilidade. |
| **BackendType.supabase** | Removido de [backendAdapter.ts](../../merchant-portal/src/core/infra/backendAdapter.ts). Enum actual: `docker` \| `none`. |

---

## 3. O que foi implementado (Docker Core)

| Área | Implementação |
|------|----------------|
| **Config** | [config.ts](../../merchant-portal/src/config.ts): `CORE_URL`, `CORE_ANON_KEY`; compatibilidade com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em leitura. Em DEV no browser usa `window.location.origin` (proxy same-origin). |
| **Infra** | [coreRpc.ts](../../merchant-portal/src/core/infra/coreRpc.ts) (ex-coreOrSupabaseRpc): getTableClient / invokeRpc (Core only). [dockerCoreFetchClient.ts](../../merchant-portal/src/core/infra/dockerCoreFetchClient.ts): cliente fetch para PostgREST. [connection.ts](../../merchant-portal/src/core-boundary/docker-core/connection.ts): `dockerCoreClient = getDockerCoreFetchClient()`. |
| **Auth** | Tipos em [authTypes.ts](../../merchant-portal/src/core/auth/authTypes.ts) (CoreSession, CoreUser). [useCoreAuth](../../merchant-portal/src/core/auth/useCoreAuth.ts): sessão Keycloak ou mock. |
| **Shim core/supabase** | [core/supabase/index.ts](../../merchant-portal/src/core/supabase/index.ts): exporta `supabase` como alias de `getDockerCoreFetchClient()` (from, rpc, channel); `auth` e `functions` são no-op ou rejeitam com mensagem "Use useCoreAuth()" / "Use getAuthActions()". Sem import de `@supabase/supabase-js`. |

---

## 4. Pasta supabase e referências

- **Pasta:** `supabase/` relocada para **`legacy_supabase/`** na raiz do repositório.
- **Paths actualizados:**
  - [.github/CODEOWNERS](../../.github/CODEOWNERS): `/legacy_supabase/migrations/`
  - [.github/workflows/core-validation.yml](../../.github/workflows/core-validation.yml): `legacy_supabase/functions/**`
  - [scripts/prepare-schema-parts.sh](../../scripts/prepare-schema-parts.sh): `legacy_supabase/migrations/*.sql`
  - [scripts/lineage-check.sh](../../scripts/lineage-check.sh): `REPO_ROOT/legacy_supabase/migrations`
  - [scripts/check-phase-guardian.sh](../../scripts/check-phase-guardian.sh): `legacy_supabase/functions/...`

Scripts em `scripts/` que ainda importam `@supabase/supabase-js` (ex.: test-realtime-kds.ts, demo-mode-automatic.sh, visual-validation-test.sh) são ferramentas de teste/simulação; o **merchant-portal** não depende deles no bundle.

---

## 5. Serviços e stores migrados

| Serviço / Store | Alteração |
|-----------------|-----------|
| **Fiscal** | SupabaseFiscalEventStore → [CoreFiscalEventStore.ts](../../merchant-portal/src/core/fiscal/CoreFiscalEventStore.ts): uso do cliente Core (getTableClient/invokeRpc ou dockerCoreClient). |
| **GlovoAdapter** | Remoção de import directo de Supabase; uso de cliente Core. |
| **MenuBootstrapService** | Remoção de import directo de Supabase; uso de tipos/cliente Core. |

---

## 6. Testes e validação já executados

Resumo do que está em [TESTE_TOTAL_POS_REMOÇÃO_SUPABASE.md](TESTE_TOTAL_POS_REMOÇÃO_SUPABASE.md):

- **Build:** `npm run build` — PASS; sem `@supabase/supabase-js` no bundle.
- **Type-check:** `tsc --noEmit` — PASS.
- **Testes unitários:** Vitest — 23 ficheiros passed, 2 skipped; 119 testes passed, 6 skipped.
- **Lint:** Sem erros nos ficheiros da migração; BetaFeedbackWidget passou a usar dockerCoreClient.
- **E2E:** Smoke e sovereign-navigation parcialmente passaram; falhas restantes ligadas a UI/landing e fluxos que podem depender do Core. Correções aplicadas: AuthPage (`isSupabase` → `hasCore`), BetaFeedbackWidget (dockerCoreClient).

**Smoke automático:** [scripts/test_post_drop_local.sh](../../scripts/test_post_drop_local.sh):

1. Docker Core (chefiapp-core-postgres) healthy.
2. Contagem de tabelas `gm_%` (CORE/OPERATIONAL).
3. Verificação de ausência de tabelas legacy (mentor_suggestions, mentor_recommendations, restaurant_groups, reservations, cash_flow).
4. `npm run test` (merchant-portal).
5. HTTP GET http://localhost:5175/app/dashboard e /app/install → 200 (porta oficial do merchant-portal; variável `VITE_PORT` para override).

---

## 7. Estado actual

- **Documento de referência:** [DOCKER_CORE_ONLY.md](../architecture/DOCKER_CORE_ONLY.md).
- **Variáveis de ambiente:** Produção: `VITE_CORE_URL`, `VITE_CORE_ANON_KEY`. Local: em dev sem vars, o Vite usa proxy `/rest` para o Core em 3001.
- **Backend:** [backendAdapter.ts](../../merchant-portal/src/core/infra/backendAdapter.ts) — getBackendType() retorna `docker` ou `none`.
- **Cliente de dados:** [core-boundary/docker-core/connection.ts](../../merchant-portal/src/core-boundary/docker-core/connection.ts) — dockerCoreClient.

---

## 8. Referências cruzadas

- [CORE_DOCKER_MIGRATION.md](../CORE_DOCKER_MIGRATION.md) — Guia de migração Core → Docker.
- [SUPABASE_EM_MODO_DOCKER.md](../SUPABASE_EM_MODO_DOCKER.md) — Esclarecimento sobre referências a "Supabase" em modo Docker.
- [VALIDACAO_POS_DROP_LEGACY_LOCAL.md](VALIDACAO_POS_DROP_LEGACY_LOCAL.md) — Ritual de validação pós-DROP (teste humano).
- [FASE_2.5_USO_REAL_FREEZE.md](../plans/FASE_2.5_USO_REAL_FREEZE.md) — Checklist pré-piloto e freeze.

---

## 9. Teste passivo completo

### Definição

**Teste passivo:** Verificações que **não alteram estado** — apenas leitura (GET, SELECT, carregar páginas, observar UI). Nenhuma escrita no Core (INSERT/UPDATE/DELETE, RPCs de escrita), nenhuma acção de criação/edição no frontend que persista.

### Checklist do teste passivo

| # | Componente | Comando / Acção | Critério de sucesso |
|---|------------|------------------|----------------------|
| 1 | **Smoke automático** | Dev server em 5175; depois `bash scripts/test_post_drop_local.sh` | Script termina com «TESTE AUTOMÁTICO PASSOU». |
| 2 | **Leitura DB (opcional)** | `docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'gm_%';"` | Retorna número (ex.: 17). Sem INSERT/UPDATE/DELETE. |
| 3 | **Navegação e UI (somente leitura)** | Abrir http://localhost:5175/, /app/dashboard, /app/install, /op/kds. Observar conteúdo e consola. **Não** criar restaurante, **não** instalar terminais, **não** criar pedidos. | Páginas carregam; sem erros vermelhos na consola; sem loop de redirect. |
| 4 | **Testes unitários** | `cd merchant-portal && npm run test` | Incluído no passo 1; 119 passed, 6 skipped (ou valor actual). |

### Registo do resultado (teste passivo)

- **Data da execução:** 2025-02-03
- **Passo 1 (smoke):** PASSOU
- **Passo 2 (psql SELECT):** PASSOU (17 tabelas gm_%)
- **Passo 3 (navegação passiva):** A verificar manualmente
- **Passo 4 (unitários):** PASSOU (119 passed, 6 skipped)
- **Conclusão:** Teste automático (passos 1, 2 e 4) passou. Passo 3 requer validação manual conforme [TESTE_PASSIVO_COMPLETO.md](TESTE_PASSIVO_COMPLETO.md).

Detalhe do teste passivo completo (checklist e registo) está em [TESTE_PASSIVO_COMPLETO.md](TESTE_PASSIVO_COMPLETO.md).
