# ChefIApp Webhook API Reference

**Status**: Implemented (integration-gateway + Core RPC)  
**Last updated**: 2026-02-22

---

## 1. Inbound: SumUp payment webhook

O gateway recebe notificações de pagamento SumUp e persiste no Core (idempotente).

### Endpoint

- **URL**: `POST /api/v1/webhook/sumup`
- **Auth**: Nenhuma (chamado pelo SumUp). Opcional: verificação HMAC com `X-SumUp-Signature` se `SUMUP_WEBHOOK_SECRET` estiver definido.
- **Content-Type**: `application/json`

### Request (exemplo)

```json
{
  "paymentId": "unique-id-from-sumup",
  "status": "COMPLETED",
  "amount": 1500,
  "orderRef": "uuid-do-pedido",
  "currency": "EUR"
}
```

### Response

- **202 Accepted**: Evento recebido e registado (RPC `process_webhook_event`).
- **400**: JSON inválido.
- **401**: Assinatura HMAC inválida (quando `SUMUP_WEBHOOK_SECRET` está definido).
- **500**: Erro ao chamar o Core.

### Variáveis de ambiente (gateway)

| Variável | Descrição |
|----------|-----------|
| `SUMUP_WEBHOOK_SECRET` | (Opcional) Secret para validar `X-SumUp-Signature` (HMAC-SHA256 do body). |

### Core RPC

- `process_webhook_event(p_provider, p_event_type, p_event_id, p_payload, p_signature)`  
- Tabela: `webhook_events` (provider, event_type, event_id, raw_payload, status).  
- Idempotência: por `(provider, event_id)`.

---

## 2. Outbound: Internal events (Webhooks OUT)

O gateway envia eventos para URLs configuradas por restaurante (retry, HMAC, log).

### Endpoint (gateway)

- **URL**: `POST /internal/events`
- **Auth**: Header `X-Internal-Token` ou `Authorization: Bearer <INTERNAL_API_TOKEN>`.
- **Body**:

```json
{
  "event": "payment.confirmed",
  "restaurant_id": "uuid-restaurant",
  "payload": { "orderId": "...", "amount_cents": 1200 }
}
```

### Comportamento

1. Lê configurações em `webhook_out_config` (por `restaurant_id`, `enabled`, `events`).
2. Gera payload com `X-ChefIApp-Signature: sha256=<hmac>` (secret por config).
3. Envia POST para cada URL configurada; retry com backoff (até 4 tentativas).
4. Regista cada tentativa em `webhook_out_delivery_log`.

### Eventos suportados (exemplos)

- `order.created`
- `payment.confirmed`
- `task.created`

---

## 3. Tabelas Core (resumo)

| Tabela | Uso |
|--------|-----|
| `webhook_events` | Eventos recebidos (SumUp, etc.); idempotência por `event_id`. |
| `webhook_out_config` | URLs + secret por restaurante para envio. |
| `webhook_out_delivery_log` | Log de cada entrega (status_code, attempt, error_message). |

---

## 4. Referências

- Migrations: `docker-core/schema/migrations/20260323_day4_webhook_infrastructure.sql`, `20260329_day5_outbound_webhooks.sql`
- Gateway: `server/integration-gateway.ts` (`handleSumUpWebhook`, `handleInternalEvents`, `deliverOne`)
