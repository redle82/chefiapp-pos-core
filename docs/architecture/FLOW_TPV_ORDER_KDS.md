# Fluxo TPV → Order → KDS (Fase 3 — Explícito)

Documento de verdade: onde o pedido nasce, onde muda de estado e quem é autoridade em cada transição. **Não altera comportamento** — apenas torna o fluxo legível.

**Autoridade soberana:** Docker Core (gm_orders, gm_order_items). TPV e KDS são clientes que escrevem via RPC ou PostgREST.

---

## 1. Nascimento do pedido (TPV)

| Onde                             | O quê                                                                                                                         | Autoridade                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **TPV**                          | Utilizador adiciona primeiro item (handleAddItem) ou cria pedido no mapa (handleCreateOrderViaMap).                           | UI → OrderContextReal           |
| **OrderContextReal.createOrder** | Online: chama `dockerCoreClient.rpc("create_order_atomic", ...)`. Offline: enfileira na IndexedDB (SyncEngine aplica depois). | Core (RPC create_order_atomic)  |
| **Core**                         | RPC `create_order_atomic` insere em gm_orders + gm_order_items. Constraint: uma mesa = um pedido aberto.                      | Core (única escrita de criação) |

**Ficheiros:** `TPV.tsx` (handleAddItem, handleCreateOrderViaMap) → `OrderContextReal.tsx` (createOrder) → Core RPC.

---

## 2. “Enviado à cozinha” (transição OPEN → IN_PREP)

| Onde                                               | O quê                                                                                                                       | Autoridade                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **TPV**                                            | Ação "prepare" (handleAction) ou "Iniciar preparo" no StreamTunnel.                                                         | UI → performOrderAction        |
| **OrderContextReal.performOrderAction("prepare")** | Atualiza gm_orders: `status = 'IN_PREP'` via PostgREST (dockerCoreClient.from("gm_orders").update).                         | Core (tabela gm_orders)        |
| **KDS**                                            | Botão "Iniciar preparo" (handleStartPreparation) chama `updateOrderStatus(orderId, "IN_PREP", restaurantId)` (OrderWriter). | Core (RPC update_order_status) |

**Duas vias hoje:** TPV usa PostgREST direto em OrderContextReal; KDS usa RPC update_order_status (OrderWriter). Ambas escrevem no Core. Comportamento final igual.

---

## 3. Transições de estado (resumo)

| Estado Core | Quem dispara                                                                           | Onde                                                                   |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| OPEN        | create_order_atomic (nascimento)                                                       | OrderContextReal.createOrder, SyncEngine                               |
| IN_PREP     | TPV "prepare" ou KDS "Iniciar preparo"                                                 | OrderContextReal.performOrderAction, KDSMinimal.handleStartPreparation |
| READY       | TPV "ready" ou KDS marca todos os itens prontos (mark_item_ready pode promover pedido) | OrderContextReal.performOrderAction("ready"), KDS markItemReady        |
| CLOSED      | TPV "serve"                                                                            | OrderContextReal.performOrderAction("serve")                           |
| PAYMENT     | TPV "pay" → PaymentEngine (transação atómica)                                          | OrderContextReal.performOrderAction("pay")                             |

**Item pronto (KDS):** `markItemReady(itemId, restaurantId)` → RPC mark_item_ready no Core (atualiza gm_order_items.ready_at; se todos prontos, pedido pode passar a READY).

---

## 4. Autoridade por transição

- **Criar pedido:** só via `create_order_atomic` (Core). TPV e Web/QR chamam esse RPC (direct ou via OrderWriter).
- **Mudar status (prepare / ready / serve):** TPV usa PostgREST em OrderContextReal; KDS usa RPC update_order_status. Core é sempre o que persiste.
- **Marcar item pronto:** só KDS (ou quem chamar OrderWriter.markItemReady) → RPC mark_item_ready.
- **Pagar:** PaymentEngine (Core); TPV apenas dispara performOrderAction("pay", payload).

---

## 5. Referência rápida de ficheiros

| Papel                  | Ficheiro                             | Função / ponto de entrada                              |
| ---------------------- | ------------------------------------ | ------------------------------------------------------ |
| Nascimento (TPV)       | TPV.tsx                              | handleAddItem, handleCreateOrderViaMap                 |
| Nascimento (persist)   | OrderContextReal.tsx                 | createOrder → rpc create_order_atomic                  |
| Transições TPV         | OrderContextReal.tsx                 | performOrderAction("prepare"\|"ready"\|"serve"\|"pay") |
| Transições KDS         | KDSMinimal.tsx                       | handleStartPreparation, handleMarkItemReady            |
| Escrita Core (KDS)     | core-boundary/writers/OrderWriter.ts | updateOrderStatus, markItemReady                       |
| Escrita Core (criação) | CoreOrdersApi.ts, OrderProjection.ts | createOrderAtomic, persistOrder                        |

---

Última atualização: Fase 3 (fluxo explícito). Sem alteração de comportamento.
