# 3 Evoluções Estruturais do Core-Engine

> **Propósito:** Propostas concretas para aumentar capacidade de evolução do motor, sem priorizar coverage. Alinhado com CORE_OS_LAYERS, CORE_EVENTS_CONTRACT, CORE_EXECUTION_TOPOLOGY.

---

## Estado atual (fev 2026)

- CoreExecutor: reduce imutável, concurrency placeholder
- EventBus: fire-and-forget → analyticsClient (hardcoded)
- SyncEngine: singleton, IndexedDBQueue, ConflictResolver acoplados
- CoreKernel: layers, signal/status, listeners
- EventStore: em memória (EventEnvelope), sem persistência real

---

## Evolução 1 — Plugin System para Effects

### O quê

Registo de **plugins** que reagem a eventos do Core. O EventBus deixa de chamar `analyticsClient` diretamente; em vez disso, notifica todos os plugins registados.

### Porquê

- Hoje: `eventBus.publish()` → só analytics (InsForge)
- Amanhã: audit logger, webhooks, métricas internas, dead-letter handler — cada um como plugin independente
- Sem tocar no Core para adicionar novos consumers

### Scope

| Componente        | Alteração                                              |
|-------------------|--------------------------------------------------------|
| `eventBus.ts`     | Substituir chamada direta por `pluginRegistry.emit()`  |
| `pluginRegistry`  | Novo módulo: `registerEffect(name, handler)`           |
| `analyticsPlugin` | Wrapper que encaminha para analyticsClient             |
| Contratos         | CORE_EVENTS_CONTRACT — eventos canónicos já existem   |

### Esforço

- **Estimativa:** 2–3 dias
- **Risco:** Baixo (EventBus já é fire-and-forget)
- **Dependências:** Nenhuma

### ROI

- Adicionar novo effect = 1 ficheiro + 1 linha de registo
- Testes unitários por plugin, isolados
- Preparação para webhooks, audit trail, dashboards internos

---

## Evolução 2 — Event Stream Estruturado (Observabilidade)

### O quê

**Ring buffer** de eventos recentes em memória, indexável por `restaurantId`, `eventType`, `timestamp`. Opcional: persistência em IndexedDB para sessão/debug.

### Porquê

- Hoje: eventos são publicados e desaparecem
- Debug de incidentes: "o que aconteceu nos últimos 5 min no restaurante X?"
- Dashboards operacionais: heatmap de eventos por hora
- Replay limitado para testes ou repro

### Scope

| Componente       | Alteração                                                   |
|------------------|-------------------------------------------------------------|
| `EventStream`    | Novo módulo: `append()`, `query({ restaurantId, since, type })` |
| `eventBus.ts`    | Após publish, `EventStream.append(envelope)`                |
| `RingBuffer`     | Tamanho fixo (ex: 10 000 eventos), LRU                      |
| Contratos        | CORE_EVENTS_CONTRACT — payloads já definidos                |

### Esforço

- **Estimativa:** 3–4 dias
- **Risco:** Médio (volume de eventos; cuidado com memória)
- **Dependências:** Evolução 1 opcional (EventStream pode ser plugin)

### ROI

- Debug sem logs espalhados
- Base para dashboards de operação
- Suporte a incidentes com contexto temporal

---

## Evolução 3 — SyncEngine com Injeção de Dependências

### O quê

`SyncEngine` deixa de ser singleton com dependências hardcoded. Recebe `Queue`, `ConflictResolver`, `ApiBridge` no construtor ou via factory.

### Porquê

- Hoje: `IndexedDBQueue`, `ConflictResolver`, `CoreOrdersApi` importados diretamente
- OfflineStressTest: 2 testes skipped por "singleton isolation"
- Multi-tenant: futura fila isolada por restaurante
- Testes: mocks injetados, sem IndexedDB real

### Scope

| Componente     | Alteração                                                        |
|----------------|------------------------------------------------------------------|
| `SyncEngine`   | Interface `SyncEngineDeps { queue, conflictResolver, apiBridge }` |
| `createSyncEngine(deps)` | Factory que retorna instância configurada                    |
| Singleton      | `getSyncEngine()` usa deps default (IndexedDBQueue, etc.)        |
| Consumidores   | Sem alteração (continuam a usar `SyncEngine.processQueue()`)     |

### Esforço

- **Estimativa:** 4–5 dias
- **Risco:** Médio (refactor de singleton; testes de regressão)
- **Dependências:** Nenhuma

### ROI

- OfflineStressTest passa a correr (2 testes desbloqueados)
- Preparação para filas por tenant
- Testes mais rápidos e determinísticos

---

## Ordem de execução sugerida

| Ordem | Evolução              | Motivo                                              |
|-------|------------------------|-----------------------------------------------------|
| 1     | Plugin System          | Baixo risco, desbloqueia extensibilidade            |
| 2     | SyncEngine DI          | Desbloqueia testes; impacto direto em confiança     |
| 3     | Event Stream           | Maior esforço; beneficia de 1 e 2 estáveis          |

---

## Resumo

| Evolução      | Esforço | Risco | Impacto imediato                    |
|---------------|---------|-------|-------------------------------------|
| Plugin System | 2–3 d   | Baixo | Extensibilidade sem alterar Core    |
| Event Stream  | 3–4 d   | Médio | Debug, dashboards, incidentes       |
| SyncEngine DI | 4–5 d   | Médio | 2 testes desbloqueados, multi-tenant|

**Total estimado:** ~10–12 dias para as 3 evoluções.

---

## Referências

- [CORE_OS_LAYERS](../architecture/CORE_OS_LAYERS.md)
- [CORE_EVENTS_CONTRACT](../architecture/CORE_EVENTS_CONTRACT.md)
- [CORE_EXECUTION_TOPOLOGY](../architecture/CORE_EXECUTION_TOPOLOGY.md)
- [COVERAGE_52_DELTA](../audit/COVERAGE_52_DELTA.md)
