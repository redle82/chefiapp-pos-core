# Auditoria InsForge — Checklist de Conformidade

**Data:** 2026-02-11  
**Objetivo:** Avaliar e organizar o uso do InsForge como backend na app ChefIApp, alinhado às instruções oficiais (MCP `fetch-docs` / `fetch-sdk-docs`) e preparar correções incrementais.

**Referências:** Plano de auditoria (alto nível); instruções InsForge (instructions); docs auth-sdk, db-sdk (TypeScript).

---

## 1. Mapeamento da integração atual

### 1.1 Onde o cliente InsForge é criado

| Item | Estado | Detalhe |
|------|--------|---------|
| Módulo único de cliente | ✅ Conforme | `merchant-portal/src/core/infra/insforgeClient.ts` — único `createClient()` com `CONFIG.INSFORGE_URL` e `CONFIG.INSFORGE_ANON_KEY`. |
| baseUrl e anonKey | ✅ Conforme | Vêm de `config.ts` → `import.meta.env.VITE_INSFORGE_URL` e `VITE_INSFORGE_ANON_KEY`. Sem valores fixos no código. |
| SDK oficial | ✅ Conforme | `@insforge/sdk` em `merchant-portal/package.json` (^1.1.5). Uso de `createClient` e `insforge.database`, `insforge.auth`, etc. |
| Chamadas REST manuais ao InsForge | ✅ Nenhuma | Toda a interação com InsForge passa pelo SDK (insforgeClient, analyticsClient, backendClient, scripts). |

### 1.2 Arquitetura híbrida (Core vs InsForge)

- **coreClient** (`coreClient.ts`): sempre Docker Core (PostgREST local). Operações críticas: pedidos, pagamentos, turnos.
- **analyticsClient** (`analyticsClient.ts`): InsForge quando `VITE_INSFORGE_URL` está definido; senão fallback Docker Core. Leituras, analytics, event bus.
- **backendClient** (`backendClient.ts`): **deprecated**. Expõe `backendClient` (DB), `getAuthClient()`, `getStorageClient()`, `getRealtimeClient()` quando InsForge está ativo. Mantido por compatibilidade; preferir coreClient/analyticsClient.

---

## 2. Uso de SDK vs MCP

| Área | Esperado (instruções) | Estado no projeto |
|------|------------------------|-------------------|
| Lógica de aplicação (auth, CRUD, storage, AI, functions) | SDK/REST no código | ✅ Auth, DB, storage, realtime acedidos via SDK (`insforge.*`, `backendClient`/`analyticsClient`). Sem uso de MCP para dados em runtime. |
| Infraestrutura (templates, schemas, buckets, functions, deployments, metadata) | MCP | ⚠️ MCP usado externamente (ex.: run-raw-sql, get-backend-metadata para RLS/schema; ver INSFORGE_RLS_AUDIT_REPORT.md). Nenhum uso de MCP dentro do código da app para lógica de negócio. |

**Conclusão:** Separação correta — SDK para aplicação; MCP para setup e operações de infra.

---

## 3. Fluxos principais de backend

### 3.1 Autenticação

| Item | Estado | Detalhe |
|------|--------|---------|
| Fluxo principal na app | Keycloak | Auth operacional usa Keycloak (OIDC). InsForge auth não é o fluxo principal na UI. |
| InsForge Auth quando usado | ✅ Alinhado | Script E2E `merchant-portal/scripts/insforge-e2e-rls.ts` usa `insforge.auth.signInWithPassword`; padrão `{ data, error }` respeitado. |
| getAuthClient() | ✅ | `backendClient.getAuthClient()` devolve `insforge.auth` quando InsForge ativo; disponível para fluxos futuros (ex.: auth InsForge em produção). |
| Tokens e segurança | ✅ | anonKey apenas em variáveis de ambiente; não há chaves hardcoded no código. |

### 3.2 Base de dados

| Item | Estado | Detalhe |
|------|--------|---------|
| CRUD via SDK | ✅ | `insforge.database.from(...).select/insert/update/delete`, `insforge.database.rpc(...)`. Padrão PostgREST compatível. |
| Formato de inserts | ✅ | Docs InsForge DB: aceitam objeto ou array. Código usa tanto `.insert({...})` como `.insert([...])` conforme contexto; compatível. |
| Uso de `{ data, error }` | ✅ | Chamadas auditadas (insforgeClient, analyticsClient, eventBus, insforge-e2e-rls) usam desestruturação e verificação de `error`. |
| Tabelas principais | ✅ | gm_restaurants, gm_orders, gm_order_items, gm_events, etc. Alinhado a schema e RLS (ver INSFORGE_RLS_AUDIT_REPORT.md). |

### 3.3 Storage

| Item | Estado | Detalhe |
|------|--------|---------|
| Cliente exposto | ✅ | `backendClient.getStorageClient()` devolve `insforge.storage` quando InsForge ativo. |
| Uso na app | ⚠️ Não implementado | Nenhum uso direto de `insforge.storage` na app; uploads atuais via MinIO/VITE_MINIO_URL (storageAdapter). Para produção InsForge, migrar uploads para buckets InsForge e guardar URLs em tabelas. |

### 3.4 Funções (Edge Functions)

| Item | Estado | Detalhe |
|------|--------|---------|
| Chamadas a serverless | ⚠️ Não usado | Nenhuma chamada a `insforge.functions.invoke` no código. cognitiveSubscriber.ts documenta uso de `@insforge/functions` para deploy, não para invocação no frontend. |
| Endpoint único (sem subpaths) | N/A | Quando implementado, seguir docs functions-sdk (endpoint único por função). |

### 3.5 Realtime

| Item | Estado | Detalhe |
|------|--------|---------|
| Cliente exposto | ✅ | `backendClient.getRealtimeClient()` devolve `insforge.realtime` quando InsForge ativo. |
| Uso na app | ⚠️ Não implementado | Nenhum uso direto de `insforge.realtime` (subscrições/canais) no código. Se necessário, alinhar com docs real-time. |

### 3.6 AI

| Item | Estado | Detalhe |
|------|--------|---------|
| InsForge AI (chat/imagem) | ⚠️ Não usado | Nenhuma chamada ao módulo AI do InsForge no código. IA atual via VITE_AI_GATEWAY_ENDPOINT / VITE_LLM_VISION_ENDPOINT (gateway próprio). Para usar InsForge AI, seguir ai-integration-sdk (OpenAI-compatible). |

---

## 4. Configuração, segurança e envs

| Item | Estado | Detalhe |
|------|--------|---------|
| anonKey / chaves no código | ✅ Conforme | Nenhuma chave hardcoded. CONFIG.INSFORGE_ANON_KEY e CONFIG.INSFORGE_URL vêm de env. |
| Variáveis de ambiente | ✅ | `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY` documentadas em `.env.example`, `.env.local.example`, `.env.example.production`. |
| Separação dev/stage/prod | ✅ | .env.local para dev; .env.example.production com placeholders (URL e `<insforge-anon-key>`). Código não depende de uma URL fixa. |
| Exposição de chaves no frontend | ✅ | Apenas anon key (segura para cliente). Nenhuma service role ou API key no frontend. |

---

## 5. Alinhamento com templates oficiais

| Item | Estado | Detalhe |
|------|--------|---------|
| Inicialização via download-template | ❌ Não | Projeto existente (monorepo: merchant-portal, core-engine, docker-core, etc.). Não foi criado com `download-template` InsForge. |
| Estrutura (pastas, serviços, providers) | ⚠️ Divergente mas aceitável | Estrutura própria (core/infra, core-boundary, config.ts). Cliente InsForge concentrado em `insforgeClient.ts` e uso via analyticsClient/backendClient. Não bloqueia integração; pode-se adoptar padrões dos templates em novos módulos se desejado. |

---

## 6. Checklist de conformidade (resumo)

### Configuração (SDK, baseUrl, anonKey, envs)

- [x] SDK `@insforge/sdk` instalado e usado
- [x] baseUrl e anonKey via env (VITE_INSFORGE_*)
- [x] Cliente criado num único módulo (insforgeClient.ts)
- [x] Sem URLs ou chaves fixas no código

### Uso por domínio

- [x] **Auth:** SDK usado em script E2E; app principal usa Keycloak; getAuthClient() disponível para InsForge auth
- [x] **DB:** CRUD e RPC via SDK; padrão `{ data, error }`; inserts objeto/array conforme docs
- [ ] **Storage:** Cliente exposto; uso na app ainda não implementado (MinIO em uso)
- [ ] **Functions:** Não invocadas na app
- [ ] **Realtime:** Cliente exposto; subscrições não implementadas
- [ ] **AI:** Não usado via InsForge

### Segurança

- [x] Sem anon key hardcoded
- [x] Sem service role no frontend
- [x] Envs documentados em .env.example*

### SDK vs MCP

- [x] Lógica de aplicação usa apenas SDK
- [x] MCP reservado para infra (schemas, metadata, etc.)

---

## 7. O que está conforme

- Um único ponto de criação do cliente InsForge (`insforgeClient.ts`) com baseUrl e anonKey a partir de env.
- Uso consistente do SDK para DB (e auth no E2E); padrão `{ data, error }` respeitado.
- Separação clara entre coreClient (sempre Docker Core) e analyticsClient (InsForge ou Docker).
- Chaves e URLs só em variáveis de ambiente; exemplos de produção com placeholders.
- RLS e schema InsForge já auditados (docs/INSFORGE_RLS_AUDIT_REPORT.md).

---

## 8. O que precisa de correção ou implementação (próxima fase)

- **Normalização:** Continuar a migrar consumidores do `backendClient` (deprecated) para `coreClient` / `analyticsClient` onde aplicável.
- **Storage:** Se produção usar InsForge, implementar upload/download via `insforge.storage`, buckets criados via MCP, e guardar URLs em tabelas.
- **Realtime:** Se necessário, implementar subscrições com `insforge.realtime` conforme docs real-time.
- **Functions:** Se for necessário invocar Edge Functions a partir do frontend, usar SDK conforme functions-sdk (endpoint único, tratamento de erro).
- **AI:** Se for adoptado InsForge AI, alinhar com ai-integration-sdk (OpenAI-compatible).

---

## 9. Referências no repositório

- Cliente e health: `merchant-portal/src/core/infra/insforgeClient.ts`
- Configuração: `merchant-portal/src/config.ts`
- Analytics (InsForge ou Docker): `merchant-portal/src/core/infra/analyticsClient.ts`
- Core (sempre Docker): `merchant-portal/src/core/infra/coreClient.ts`
- Backend deprecado: `merchant-portal/src/core/infra/backendClient.ts`
- Validação de setup: `merchant-portal/src/core/infra/validateInsforgeSetup.ts`
- E2E RLS: `merchant-portal/scripts/insforge-e2e-rls.ts`
- RLS e schema: `docs/INSFORGE_RLS_AUDIT_REPORT.md`
- ADR híbrido: `docs/architecture/ADR_HYBRID_BACKEND.md`
