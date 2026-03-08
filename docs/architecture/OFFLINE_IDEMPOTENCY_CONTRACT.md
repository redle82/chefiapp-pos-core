# Contrato de Idempotência Offline (Fase 3)

**Fonte única:** Fila de sync em `SyncEngine`; cada item tem `idempotency_key` estável.

---

## Regra

1. **Cada evento offline** (criar pedido, registar pagamento) tem um **idempotency_key** estável (ex.: `order-create-{localId}`, `order-pay-{orderId}-{amountCents}-{method}`).
2. O **Core** (RPCs) deve ser idempotente por essa chave: reenvio do mesmo key não duplica pedido nem pagamento.
3. **SyncEngine** passa `idempotencyKey` em `syncOrderCreate` e `syncOrderPay`; o cliente Core usa `p_idempotency_key` onde suportado.
4. **Webhooks** (Edge): RPC `process_webhook_event` é idempotente por `(provider, event_id)`.

---

## Onde está implementado

- **SyncEngine** (`merchant-portal/src/core/sync/SyncEngine.ts`): fila com `idempotency_key` por item; `syncOrderCreate(payload, idempotencyKey)`, `syncOrderPay(payload, idempotencyKey)`.
- **PaymentEngine** / Core RPC: `process_order_payment(..., p_idempotency_key)`; índices UNIQUE em `gm_payments.idempotency_key` (docker-core/schema).
- **Testes:** `SyncEngine.test.ts` (idempotency: ORDER_PAY usa item idempotency_key); `plpgsql-core-rpcs.test.ts` (idempotency reject duplicate payment key).

---

## Checklist

- [x] Fila offline tem idempotency_key por item.
- [x] Core RPCs aceitam e respeitam idempotency_key.
- [x] Webhooks Edge idempotentes por event_id.
- [ ] (Opcional) Lint/rule que exige idempotency_key em novos tipos de evento offline.
