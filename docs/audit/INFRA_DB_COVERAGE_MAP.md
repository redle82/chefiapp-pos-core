# Mapa de cobertura: Infra + DB — irrelevantes vs perigosos

Documento de apoio ao plano "Infra + DB até ~60%". Classifica ficheiros em **irrelevantes** (baixo ROI, podem ficar vermelhos) e **perigosos** (prioridade para testes; meta branches ≥ 60%).

**Referência:** [REFACTOR_PLAN_2026_INCREMENTAL.md](../refactor/REFACTOR_PLAN_2026_INCREMENTAL.md), gate server em [SERVER_COVERAGE_TARGETS.md](../ops/SERVER_COVERAGE_TARGETS.md).

---

## 1. Irrelevantes (baixo ROI para testes agora)

Ficheiros que podem ficar vermelhos sem aumentar risco operacional. Não entram no cálculo do gate infra+db ou são explicitamente excluídos do target.

| Ficheiro | Motivo |
|----------|--------|
| `merchant-portal/src/infra/schemas/index.ts` | Barrel + re-export Zod; sem lógica. |
| `merchant-portal/src/infra/schemas/restaurant.ts` | Schema Zod puro. |
| `merchant-portal/src/infra/schemas/order.ts` | Schema Zod puro. |
| `merchant-portal/src/infra/schemas/payment.ts` | Schema Zod puro. |
| `merchant-portal/src/infra/docker-core/types.ts` | Tipos e interfaces apenas. |
| `merchant-portal/src/infra/payments/index.ts` | Barrel; re-exports. |
| `merchant-portal/src/infra/payments/interface.ts` | Interfaces TypeScript. |
| `merchant-portal/src/core/infra/container.ts` | Wiring/factories; delegam. |
| `merchant-portal/src/core/infra/eventTypes.ts` | Tipos/constantes. |
| `merchant-portal/src/core/infra/eventBusIntegrationExamples.ts` | Exemplos/documentação. |

---

## 2. Perigosos (prioridade para ~60% branches)

Onde falha = impacto em pedidos, pagamentos ou dados. **Métrica alvo:** branches ≥ 60% no conjunto destes ficheiros (medido pelo gate infra+db).

### 2.1 DB e Core client

| Ficheiro | Métrica alvo | Notas |
|----------|--------------|--------|
| `merchant-portal/src/core/db/index.ts` | ≥ 60% branches | `getCoreSafe` stub vs real; `db.from`, `db.rpc`, `db.auth` paths. |
| `merchant-portal/src/core/infra/dockerCoreFetchClient.ts` | ≥ 60% | Client Core; erros de rede, 4xx/5xx. |
| `merchant-portal/src/core/infra/CoreOrdersApi.ts` | ≥ 60% | Criação/atualização de pedidos; RPC. |
| `merchant-portal/src/core/infra/coreRpc.ts` | ≥ 60% | Chamadas RPC ao Core. |
| `merchant-portal/src/core/infra/coreClient.ts` | ≥ 60% | Cliente Core. |
| `merchant-portal/src/core/infra/backendAdapter.ts` | ≥ 60% | Adaptador backend; usado em fluxos críticos. |
| `merchant-portal/src/core/infra/backendClient.ts` | ≥ 60% | Cliente backend. |

### 2.2 Readers (pedidos, menu, restaurante, runtime)

| Ficheiro | Métrica alvo | Notas |
|----------|--------------|--------|
| `merchant-portal/src/infra/readers/OrderReader.ts` | ≥ 60% | Leitura de pedidos. |
| `merchant-portal/src/infra/readers/RuntimeReader.ts` | ≥ 60% | Runtime/restaurante ativo. |
| `merchant-portal/src/infra/readers/MenuCatalogReader.ts` | ≥ 60% | Catálogo de menu. |
| `merchant-portal/src/infra/readers/RestaurantReader.ts` | ≥ 60% | Dados do restaurante. |
| `merchant-portal/src/infra/readers/ProductReader.ts` | ≥ 60% | Produtos. |
| `merchant-portal/src/infra/readers/TaskReader.ts` | ≥ 60% | Tarefas. |
| `merchant-portal/src/infra/readers/InventoryStockReader.ts` | ≥ 60% | Stock. |

### 2.3 Writers

| Ficheiro | Métrica alvo | Notas |
|----------|--------------|--------|
| `merchant-portal/src/infra/writers/OrderWriter.ts` | ≥ 60% | Escrita de pedidos. |
| `merchant-portal/src/infra/writers/TaskWriter.ts` | ≥ 60% | Escrita de tarefas. |
| `merchant-portal/src/infra/writers/RuntimeWriter.ts` | ≥ 60% | Runtime. |
| `merchant-portal/src/infra/writers/StockWriter.ts` | ≥ 60% | Stock. |
| `merchant-portal/src/infra/writers/MenuWriter.ts` | ≥ 60% | Menu. |

### 2.4 Payments infra

| Ficheiro | Métrica alvo | Notas |
|----------|--------------|--------|
| `merchant-portal/src/infra/payments/registry.ts` | ≥ 60% | Registo de providers. |
| `merchant-portal/src/infra/payments/providers/pix.ts` | ≥ 60% | Fluxo PIX. |
| `merchant-portal/src/infra/payments/providers/sumup.ts` | ≥ 60% | Fluxo SumUp. |
| `merchant-portal/src/infra/payments/providers/stripe.ts` | ≥ 60% | Fluxo Stripe. |

### 2.5 Outros infra (médio risco)

| Ficheiro | Métrica alvo | Notas |
|----------|--------------|--------|
| `merchant-portal/src/infra/docker-core/connection.ts` | ≥ 60% | Conexão Docker Core. |
| `merchant-portal/src/core/infra/featureFlags.ts` | ≥ 60% | Feature flags. |
| `merchant-portal/src/core/infra/analyticsClient.ts` | ≥ 60% | Analytics. |
| `merchant-portal/src/core/infra/eventBus.ts` | ≥ 60% | Event bus. |
| `merchant-portal/src/core/infra/validateInsforgeSetup.ts` | ≥ 60% | Validação setup. |
| `merchant-portal/src/infra/clients/OnboardingClient.ts` | ≥ 60% | Onboarding. |

---

## 3. Restantes (infra/db não críticos)

Ficheiros em `infra/` ou `core/infra/` que não são prioritários para a primeira vaga de 60%; podem ser incluídos no gate mas sem meta individual obrigatória.

| Ficheiro | Notas |
|----------|--------|
| `merchant-portal/src/infra/readers/ProductAssetReader.ts` | Assets; menor impacto direto em pedidos. |
| `merchant-portal/src/infra/readers/ShiftReader.ts` | Turnos. |
| `merchant-portal/src/infra/readers/ShiftChecklistReader.ts` | Checklist. |
| `merchant-portal/src/infra/readers/MenuPresetReader.ts` | Presets. |
| `merchant-portal/src/infra/readers/EquipmentReader.ts` | Equipamento. |
| `merchant-portal/src/infra/readers/MapReader.ts` | Mapas. |
| `merchant-portal/src/infra/readers/TaskPackReader.ts` | Packs de tarefas. |
| `merchant-portal/src/infra/readers/RestaurantPeopleReader.ts` | Pessoas. |
| `merchant-portal/src/infra/readers/ShoppingListReader.ts` | Lista de compras. |
| `merchant-portal/src/infra/writers/MapWriter.ts` | Mapas. |
| `merchant-portal/src/infra/writers/TaskPackWriter.ts` | Packs. |
| `merchant-portal/src/infra/writers/ShiftChecklistWriter.ts` | Checklist. |
| `merchant-portal/src/infra/menuPilotFallback.ts` | Fallback menu. |
| `merchant-portal/src/infra/payments/providers/mbway.ts` | MB Way; menor prioridade. |
| `merchant-portal/src/infra/payments/providers/manual.ts` | Manual. |
| `merchant-portal/src/core/infra/insforgeClient.ts` | Insforge. |
| `merchant-portal/src/core/infra/cognitiveSubscriber.ts` | Subscriber. |

---

## 4. Resumo

- **Irrelevantes:** 10 ficheiros; excluídos do gate ou sem meta.
- **Perigosos:** 26 ficheiros; meta agregada **branches ≥ 60%** no gate infra+db.
- **Restantes:** 18 ficheiros; contam para o gate mas sem meta individual; contribuem para o 60% global.

O script `scripts/check-infra-db-coverage.ts` filtra por paths (`merchant-portal/src/infra/`, `merchant-portal/src/core/infra/`, `merchant-portal/src/core/db/`) e aplica o target ao conjunto (perigosos + restantes), sem excluir irrelevantes do path (schemas, types, barrels continuam dentro de infra/; pode-se excluir por sufixo ou path exato numa versão futura se necessário).
