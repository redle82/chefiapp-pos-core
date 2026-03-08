# Contrato PrintQueue ↔ Order Sync (Fase 3)

**Regra:** Jobs da PrintQueue com `orderId` só são processados **depois** do pedido existir no Core (order sync confirmado).

---

## Implementação

- **PrintQueueProcessor** (`core/print/PrintQueueProcessor.ts`): para cada job pendente com `orderId`, chama `orderExistsInCore(orderId)`; se não existir, **não** processa (deixa em pending para a próxima rodada).
- **SyncEngine**: após processar a fila de pedidos (order queue), chama `processPrintQueue()`. Assim, prints de pedidos só são enviados quando o respetivo pedido já foi sincronizado.
- **UI offline**: ao imprimir em modo offline, o job é enfileirado na PrintQueue; quando a ligação voltar, SyncEngine processa a fila de pedidos primeiro e depois `processPrintQueue()` envia os jobs cujo `orderId` já existe no Core.

---

## Ordem de processamento

1. ConnectivityService indica online (ou degraded com Core a responder).
2. SyncEngine processa fila de ordem (order create / order pay).
3. SyncEngine chama `processPrintQueue()`.
4. PrintQueueProcessor processa apenas jobs cujo `orderId` já existe no Core (ou jobs sem orderId, ex.: z_report).
