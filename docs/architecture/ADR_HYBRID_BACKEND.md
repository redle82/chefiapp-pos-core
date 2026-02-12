# ADR: Arquitetura Híbrida de Backend (Docker Core + InsForge)

**Status:** Accepted
**Date:** 2026-02-11
**Deciders:** Engineering Team
**Context:** InsForge integration + POS offline-first requirements

---

## Contexto e Problema

Durante a integração do InsForge como backend hosted, identificamos uma contradição arquitetural crítica:

### Problema Original:

```typescript
// backendClient switch baseado em env var
const backendClient = isInsforge ? insforge.database : dockerCore;

// Mas CoreOrdersApi rejeita non-Docker
if (getBackendType() !== BackendType.docker) {
  return error("Backend must be Docker Core");
}
```

**Consequência:** Se `VITE_INSFORGE_URL` estiver configurado em produção, pedidos falham porque `backendClient` aponta para InsForge, mas `createOrderAtomic` rejeita.

### Requisitos Não Negociáveis:

1. **POS deve operar offline** (restaurante sem internet continua funcionando)
2. **Latência crítica < 100ms** (pedidos, pagamentos, updates)
3. **Disponibilidade 99.9%** (downtime de cloud não pode parar operação)
4. **CORE_FINANCIAL_SOVEREIGNTY_CONTRACT** (Core é autoridade de pedidos/pagamentos)

---

## Decisão

Implementar **Arquitetura Híbrida** com separação clara:

### Docker Core = Espinha Dorsal (Critical Path)

**Cliente:** `coreClient.ts`
**Sempre:** Docker Core local (PostgREST)
**Usado para:**

- `create_order_atomic` (pedidos)
- `process_order_payment` (pagamentos)
- `update_order_status` (transições)
- `add_order_item`, `remove_order_item` (modificações)
- `manage_shift` (turnos de caixa)
- `gm_tables`, `gm_cash_registers` (operação real-time)

**Garantia:** Funciona 100% offline, latência < 10ms, disponibilidade 99.9%

### InsForge = Satélite Cognitivo (Analytics Path)

**Cliente:** `analyticsClient.ts`
**Estratégia:** InsForge quando disponível, fallback Docker
**Usado para:**

- Dashboard metrics (revenue, orders_count)
- Historical reports (trends, aggregations)
- Export data (CSV, PDF)
- AI/ML feature extraction
- Insights e recomendações

**Garantia:** Melhor performance quando disponível, graceful degradation quando offline

---

## Implementação

### Estrutura de Arquivos:

```
merchant-portal/src/core/infra/
├── coreClient.ts          ← Novo: Sempre Docker (operações críticas)
├── analyticsClient.ts     ← Novo: InsForge com fallback (leituras)
├── backendClient.ts       ← Deprecated: Manter temporariamente
├── insforgeClient.ts      ← Existente: InsForge SDK wrapper
└── dockerCoreFetchClient.ts ← Existente: Docker Core fetch client
```

### coreClient.ts

```typescript
export const coreClient = getDockerCoreFetchClient();
export function checkCoreHealth(): Promise<boolean>;
```

**Garantia:** SEMPRE retorna Docker Core, independente de env vars.

### analyticsClient.ts

```typescript
export const analyticsClient = isInsforgeEnabled
  ? insforge.database
  : getDockerCoreFetchClient();
export function checkAnalyticsHealth(): Promise<HealthStatus>;
```

**Garantia:** InsForge primeiro, Docker fallback, logs de latência.

### backendClient.ts (Deprecated)

Mantido para compatibilidade, mas marcado como deprecated.
Futuras migrações devem usar `coreClient` ou `analyticsClient` diretamente.

---

## Consequências

### Positivas ✅

1. **Resiliência Total**: POS funciona 100% offline (Docker sempre ativo)
2. **Latência Zero**: Operações críticas < 10ms (sem rede)
3. **Separação Clara**: Critical path vs analytics path bem definidos
4. **Observabilidade**: Logs de latência/fallback por cliente
5. **Graceful Degradation**: InsForge down → analytics usam Docker

### Negativas ❌

1. **Complexidade**: Dois clientes para gerenciar
2. **Sincronização**: Futuramente precisamos Docker → InsForge sync
3. **Testes**: Precisa validar ambos os paths
4. **Documentação**: Devs precisam saber qual cliente usar

### Mitigações:

| Risco                    | Mitigação                          |
| ------------------------ | ---------------------------------- |
| Devs usam cliente errado | Deprecation warnings + docs claras |
| Sync Docker ↔ InsForge   | Event-driven sync (fase futura)    |
| Testes complexos         | Suite de testes de falha (Fase 2)  |
| Observabilidade          | Health checks + latency logs       |

---

## Roadmap de Migração

### Fase 1: Core Crítico (Concluído ✅)

- [x] Criar `coreClient.ts`
- [x] Criar `analyticsClient.ts`
- [x] Atualizar `CoreOrdersApi.ts` → usar `coreClient`
- [x] Atualizar `connection.ts` → apontar para `coreClient`
- [x] Deprecar `backendClient.ts`
- [x] Documentar ADR

### Fase 2: Testes de Falha (Próximo)

- [ ] Suite de testes: InsForge offline
- [ ] Suite de testes: InsForge latência 800ms
- [ ] Suite de testes: InsForge retorna 429/500
- [ ] Validar fallback automático
- [ ] Medir latência p95, p99

### Fase 3: Observabilidade (Futuro)

- [ ] Health check contínuo (Docker + InsForge)
- [ ] Logs de latência por operação
- [ ] Alertas se > 10% fallbacks
- [ ] Dashboard de backend health

### Fase 4: Sincronização (Futuro)

- [ ] Event-driven sync Docker → InsForge
- [ ] Analytics queries otimizadas (InsForge)
- [ ] Cache strategy (Redis/local)

---

## Alternativas Consideradas

### Opção A: InsForge como Núcleo Total

**Rejeitada porque:**

- POS não pode depender de internet
- Downtime de cloud = POS parado
- Latência de rede perceptível (> 300ms)

### Opção B: Docker Core Apenas

**Rejeitada porque:**

- Perde benefícios de InsForge (auth, storage, AI)
- Analytics queries lentas em Docker local
- Não aproveita escala de cloud para histórico

### Opção C: Arquitetura Híbrida (Escolhida ✅)

**Vantagens:**

- Best of both worlds (offline + cloud)
- Critical path isolado
- Opcional: InsForge adiciona value sem bloquear

---

## Validação

### Critérios de Sucesso:

- [ ] TPV cria pedidos com Docker Core offline (< 10ms)
- [ ] Dashboard carrega métricas de InsForge (< 500ms)
- [ ] InsForge down → Dashboard usa Docker (graceful)
- [ ] Zero breaking changes em produção
- [ ] Latência p95 < 300ms (analytics)
- [ ] Latência p99 < 50ms (core operations)

### Métricas:

| Métrica                      | Target  | Atual |
| ---------------------------- | ------- | ----- |
| Core operations latency      | < 10ms  | TBD   |
| Analytics latency (InsForge) | < 500ms | TBD   |
| Analytics latency (Docker)   | < 100ms | TBD   |
| Fallback rate                | < 1%    | TBD   |
| Uptime (core operations)     | 99.9%   | TBD   |

---

## Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](../../CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)
- [InsForge Validation Report](../INSFORGE_VALIDATION_REPORT.md)
- [InsForge Deployment Checklist](../INSFORGE_DEPLOYMENT_CHECKLIST.md)

---

**Última Atualização:** 2026-02-11
**Próxima Revisão:** Após Fase 2 (Testes de Falha)
**Responsável:** CTO / Engineering Lead
