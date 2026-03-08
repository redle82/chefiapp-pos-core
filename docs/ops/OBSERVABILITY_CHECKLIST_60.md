# Checklist de observabilidade — meta 60%

Checklist operacional mínimo para considerar a meta **60% branches + observabilidade** cumprida. Alinhado com [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md).

**Critério “pronto para produção” (nesta meta):** todos os itens abaixo verificados; sem obrigação de implementar novos instrumentos além do que já existe em OBSERVABILITY_SETUP.

---

## 1. Sentry ativo

| Item | Onde | Estado |
|------|------|--------|
| Merchant-portal envia erros para Sentry | `merchant-portal` (Logger → SentryTransport; ErrorBoundary) | ✅ Configurado (OBSERVABILITY_SETUP) |
| DSN em produção | `VITE_SENTRY_DSN` em `.env.production` | A verificar por ambiente |
| Edge / gateway | Sem Sentry no integration-gateway (Node); Edge Functions Deno — ver OBSERVABILITY_SETUP | Opcional para esta meta |

---

## 2. Tags obrigatórias em erros

Em todos os pontos onde erros são reportados ao Sentry, devem estar disponíveis (no scope) as tags abaixo quando o contexto existir:

| Tag | Onde é definida | Estado |
|-----|-----------------|--------|
| `app` | Inicialização (ex.: `merchant-portal`) | ✅ `main_debug.tsx` / init Sentry |
| `restaurant_id` | Após resolver identidade/tenant | ✅ `configureSentryScope` em `SentryTransport.ts`; chamado onde o runtime/identidade está disponível |
| `route` | Pathname atual (SPA) | ✅ `SentryTagsSync` em `App.tsx` — `setTag("route", location.pathname)` |
| `connectivity` | Estado da rede (online / offline / degraded) | ✅ `SentryTagsSync` em `App.tsx` — `setTag("connectivity", SyncEngine.getConnectivity())` |

**Referência de código:** `merchant-portal/src/App.tsx` (SentryTagsSync), `merchant-portal/src/core/logger/transports/SentryTransport.ts` (configureSentryScope).

---

## 3. Logs estruturados nos pontos críticos

| Ponto | Onde | Estado |
|-------|------|--------|
| Sync (offline queue, processamento) | SyncEngine; Logger com contexto | ✅ OBSERVABILITY_SETUP Parte 3 |
| Billing (checkout, webhook) | integration-gateway; Logger / console estruturado | ✅ Logs no gateway; front via Logger |
| Webhook (SumUp, Stripe) | integration-gateway; Edge | ✅ Logs no server; Edge em Deno |

Não é obrigatório alterar código; apenas confirmar que sync, billing e webhook têm logs com contexto (restaurant_id, action, etc.) onde já existem.

---

## 4. Health e diagnóstico acessíveis para suporte

| Item | Onde | Estado |
|------|------|--------|
| Connectivity (online/offline/degraded) | SyncEngine.getConnectivity(); UI (OfflineIndicator, ObservabilityPage) | ✅ OBSERVABILITY_SETUP; ObservabilityPage |
| Fila pendente (order queue, print queue) | Admin → Observabilidade; SyncHealthPanel | ✅ OBSERVABILITY_SETUP — painel diagnóstico |
| Health check do gateway | `GET /health` (integration-gateway) | ✅ Existente no server |

---

## 5. Referência cruzada — meta “60% + observabilidade”

A meta considera-se **cumprida** quando:

1. **Server branch coverage ≥ 60%** — medido por `test:server-coverage` + `check:server-coverage` (target 60). Ver [SERVER_COVERAGE_TARGETS.md](./SERVER_COVERAGE_TARGETS.md).
2. **Gate CI verde** — inclui `test:server-coverage` e `check:server-coverage` no job validate; `audit:release:portal` inclui o mesmo gate.
3. **Checklist de observabilidade verificado** — este documento; itens acima assinalados (verificado ou “a fazer” com prioridade).

---

**Última verificação:** 2026-02 (criação do checklist; tags e logs conforme OBSERVABILITY_SETUP).
