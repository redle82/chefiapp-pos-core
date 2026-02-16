# ChefIApp — Contrato da API Pública (parceiros)

**Data:** 2026-02  
**Referências:** [CHEFIAPP_API_PUBLICA_V1_SPEC.md](CHEFIAPP_API_PUBLICA_V1_SPEC.md), [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md), [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)  
**Objetivo:** Documento único para parceiros (ERP, BI, integrações): base URL, autenticação, rate limit, catálogo de eventos, formato de Webhook OUT e rotas API IN.

---

## 1. Base URL e versão

- **Base (produção):** `https://api.chefiapp.pt` (ou domínio do produto).
- **Versão:** prefixo de path `/api/v1`. Versões futuras: `/api/v2`; v1 mantém-se estável.

Exemplo: `POST https://api.chefiapp.pt/api/v1/orders`

---

## 2. Autenticação (API Key)

- **Onde obter:** Backoffice ChefIApp → Integrações → APIs & Webhooks → secção "API IN" → "Criar chave". A chave é mostrada **uma única vez**; guarde-a em segurança.
- **Header:** `Authorization: Bearer <api_key>` ou `X-API-Key: <api_key>`.
- **Resposta a chave inválida ou ausente:** **401 Unauthorized** com corpo JSON (ver §7).

A API key está associada a um restaurante; todas as operações são feitas no contexto desse restaurante.

---

## 3. Rate limit

- **Valor:** 100 pedidos por minuto por API key.
- **Resposta ao exceder:** **429 Too Many Requests** com header `Retry-After` (segundos) e corpo JSON.
- **Formato de resposta (sucesso):** opcionalmente `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 4. Catálogo de eventos (Webhooks OUT)

Quando configurar um Webhook OUT (Integrações → APIs & Webhooks), pode escolher quais eventos receber. Lista canónica:

| Tipo | Descrição |
|------|-----------|
| `order.created` | Pedido criado |
| `order.updated` | Status do pedido alterado |
| `order.completed` | Pedido concluído |
| `order.paid` | Pagamento confirmado |
| `order.ready` | Pedido pronto (ex.: cozinha) |
| `order.closed` | Pedido fechado |
| `payment.confirmed` | Pagamento confirmado (Stripe, etc.) |
| `menu.updated` | Cardápio atualizado |
| `delivery.status` | Status de entrega atualizado |
| `shift.started` | Turno iniciado |
| `shift.ended` | Turno terminado |
| `alert.raised` | Alerta crítico |
| `task.created` | Tarefa criada |

Detalhe dos payloads: [contracts/INTEGRATION_EVENT_CATALOG.md](contracts/INTEGRATION_EVENT_CATALOG.md).

---

## 5. Formato do payload de Webhook OUT

Cada entrega é um **POST** com `Content-Type: application/json` para a URL configurada.

**Exemplo de corpo:**

```json
{
  "id": "wh_evt_550e8400-e29b-41d4-a716-446655440000",
  "event": "order.paid",
  "restaurant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-15T14:30:00.000Z",
  "payload": {
    "orderId": "ord_xyz",
    "totalCents": 2500,
    "paymentMethod": "card",
    "completedAt": 1738157400000
  }
}
```

**Assinatura HMAC:** o header `X-ChefIApp-Signature` contém `sha256=<hex>`, onde `<hex>` é o HMAC-SHA256 do corpo **raw** (UTF-8) com o secret configurado no webhook. Verificação: recalcular HMAC com o mesmo secret e comparar em tempo constante.

---

## 6. Rotas API IN (request / response)

Todas as respostas são JSON. Em erro, ver §7.

### 6.1 Criar pedido

- **POST** `/api/v1/orders`
- **Body:** `{ "items": [ { "product_id": "uuid", "quantity": 1, "unit_price": 1000 } ], "table_id?: "uuid", "source?: "api" }`
- **201:** `{ "orderId": "uuid", "status": "new" }`

### 6.2 Atualizar status do pedido

- **PATCH** `/api/v1/orders/:orderId`
- **Body:** `{ "status": "new" | "preparing" | "ready" | "served" | "paid" | "cancelled" }`
- **200:** `{ "orderId": "uuid", "status": "..." }`

### 6.3 Confirmar pagamento

- **POST** `/api/v1/orders/:orderId/payment`
- **Body:** `{ "amountCents?: number, "paymentMethod"?: string, "externalId"?: string }`
- **200:** `{ "orderId": "uuid", "paymentStatus": "confirmed" }`

### 6.4 Webhook WhatsApp (entrada)

- **POST** `/api/v1/integrations/whatsapp/incoming`
- **Body:** payload do provedor (ex.: Meta). Opcional: header `X-Hub-Signature-256` para validação.
- **200:** `{ "received": true }`

### 6.5 Criar tarefa

- **POST** `/api/v1/tasks`
- **Body:** `{ "title": string, "description"?: string, "priority"?: string, "assigneeRole"?: string }`
- **201:** `{ "taskId": "uuid" }`

---

## 7. Formato de erros

Respostas 4xx/5xx em JSON:

```json
{
  "error": "código_curto",
  "message": "Mensagem legível",
  "details": { }
}
```

| Código HTTP | error (ex.) | Descrição |
|-------------|-------------|-----------|
| 400 | `validation_error` | Body inválido ou campos em falta |
| 401 | `unauthorized` | API key ausente ou inválida |
| 403 | `forbidden` | Sem permissão para o recurso |
| 404 | `not_found` | Recurso não encontrado |
| 429 | `rate_limit_exceeded` | Limite de pedidos excedido; usar `Retry-After` |
| 500 | `internal_error` | Erro interno |

---

## 8. Referências no repositório

- [CHEFIAPP_API_PUBLICA_V1_SPEC.md](CHEFIAPP_API_PUBLICA_V1_SPEC.md) — Spec detalhada da API v1
- [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) — Event Bus e Webhooks OUT (HMAC, retry, logs)
- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — Hub de integrações
- [contracts/INTEGRATION_EVENT_CATALOG.md](contracts/INTEGRATION_EVENT_CATALOG.md) — Catálogo de eventos e payloads

Implementação do gateway: `server/integration-gateway.ts` (porta 4320 em desenvolvimento).
