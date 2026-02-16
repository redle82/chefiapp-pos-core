# ChefIApp — API Pública v1 (mínima)

**Data:** 2026-01-29  
**Referência:** [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)  
**Objetivo:** Definir a API pública mínima para **terceiros** enviarem dados ao sistema (criar pedido, confirmar pagamento, atualizar status, etc.). Tudo via **gateway** (autenticação, rate limit, validação), nunca direto no Core.

---

## 1. Princípio

- **Gateway único:** Todas as chamadas externas entram por um conjunto de rotas versionadas (ex.: `/api/v1/...`).
- **Autenticação obrigatória:** API key ou JWT por cliente (restaurante ou integração).
- **Rate limit:** Por cliente ou por restaurante, para evitar abuso.
- **Validação:** Payload validado à entrada; erros devolvidos em formato uniforme.
- **Core intacto:** O gateway traduz pedidos HTTP em eventos/comandos internos; o Core não expõe detalhes de implementação.

---

## 2. Base URL e versão

- **Base:** `https://api.chefiapp.pt` (ou domínio do produto).
- **Versão:** prefixo de path `/api/v1`. Versões futuras: `/api/v2`, etc.; v1 mantém-se estável.

Exemplo: `POST https://api.chefiapp.pt/api/v1/orders`

---

## 3. Autenticação

### 3.1 API Key (recomendado para integrações)

- **Header:** `Authorization: Bearer <api_key>` ou `X-API-Key: <api_key>`.
- **Api key:** Gerada por restaurante no Backoffice (Integrações → APIs & Webhooks). Associada ao `restaurant_id`; pode ser revogada.
- **Segredo:** A key não deve ser partilhada em frontend público; apenas em backend do parceiro ou em fluxos server-to-server.

### 3.2 Alternativa: JWT

- **Header:** `Authorization: Bearer <jwt>`.
- **JWT:** Emitido após auth (ex.: login ou OAuth); claims incluem `restaurant_id` e scope (ex.: `api:orders`, `api:payments`). Útil para sessões de utilizador ou parceiros com OAuth.

Para v1 mínima, **API Key** é suficiente; JWT pode ser adicionado depois.

### 3.3 Resposta a auth inválida

- **401 Unauthorized:** Key ausente ou inválida.
- **403 Forbidden:** Key válida mas sem permissão para o recurso (ex.: restaurant_id não coincide).

---

## 4. Rate limit

- **Objetivo:** Evitar abuso e garantir justiça entre clientes.
- **Unidade:** Por API key (ou por `restaurant_id`) por janela de tempo.
- **Exemplo:** 100 pedidos por minuto por key; ou 1000 por hora.
- **Headers de resposta:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (timestamp).
- **Resposta ao exceder:** **429 Too Many Requests** com `Retry-After` (segundos).

Valores concretos (100/min, 1000/h, etc.) definidos na implementação; a spec só exige que exista rate limit e que a resposta seja 429 com informação de retry.

---

## 5. Formato de erros

Respostas de erro (4xx, 5xx) em JSON:

```ts
interface ApiError {
  error: string;           // código curto (ex.: "validation_error", "unauthorized")
  message: string;         // mensagem legível
  details?: Record<string, unknown>;  // opcional (ex.: campos que falharam)
}
```

Exemplos:

- 400: `{ "error": "validation_error", "message": "Campos inválidos", "details": { "items": "Obrigatório" } }`
- 401: `{ "error": "unauthorized", "message": "API key inválida ou ausente" }`
- 429: `{ "error": "rate_limit_exceeded", "message": "Limite de pedidos excedido" }`
- 500: `{ "error": "internal_error", "message": "Erro interno" }`

---

## 6. Rotas mínimas v1

Rotas que permitem aos terceiros enviar dados ao sistema (APIs IN do Hub). Cada rota recebe JSON, valida, e traduz em evento/comando interno.

### 6.1 Criar pedido

- **POST** `/api/v1/orders`
- **Body:** payload normalizado de pedido (items, totalCents, source, customerName, tableId, etc.). Alinhar ao payload de `order.created` em `IntegrationEvent.ts`.
- **Resposta 201:** `{ "orderId": "...", "status": "new" }`
- **Lado interno:** Validação; emissão de `order.created` no Event Bus (ou inserção no Core conforme arquitetura). O sistema trata como qualquer outro pedido (TPV, KDS, etc.).

### 6.2 Atualizar status do pedido

- **PATCH** `/api/v1/orders/:orderId` ou **PUT** `/api/v1/orders/:orderId/status`
- **Body:** `{ "status": "preparing" | "ready" | "served" | "paid" | "cancelled" }`
- **Resposta 200:** `{ "orderId": "...", "status": "..." }`
- **Lado interno:** Emissão de `order.updated` ou comando equivalente.

### 6.3 Confirmar pagamento

- **POST** `/api/v1/orders/:orderId/payment` ou `/api/v1/payments/confirm`
- **Body:** `{ "orderId"?, "amountCents", "paymentMethod", "externalId?" }` (conforme necessidade mínima).
- **Resposta 200:** `{ "orderId": "...", "paymentStatus": "confirmed" }`
- **Lado interno:** Emissão de `payment.confirmed` e/ou `order.paid`; atualização de estado no Core.

### 6.4 Enviar mensagem (ex.: WhatsApp)

- **POST** `/api/v1/integrations/whatsapp/incoming` (ou `/api/v1/messages/incoming`)
- **Body:** payload do provedor (ex.: webhook da Meta). Validação de assinatura (provedor); depois tradução para evento (ex.: order.created se for pedido) ou armazenamento para o adapter processar.
- **Resposta 200:** `{ "received": true }`
- **Nota:** Esta rota pode ser específica do provedor (webhook) com validação de assinatura própria; a API key pode ser por integração (WhatsApp).

### 6.5 Criar tarefa

- **POST** `/api/v1/tasks`
- **Body:** `{ "title", "description?", "priority?", "assigneeRole?" }` (mínimo).
- **Resposta 201:** `{ "taskId": "..." }`
- **Lado interno:** Criação de tarefa no Core (gm_tasks ou equivalente); opcionalmente emissão de `task.created`.

---

## 7. Respostas de sucesso

- **200 OK:** Corpo conforme rota (ex.: objeto com orderId, status).
- **201 Created:** Corpo com id do recurso criado (orderId, taskId).
- **Content-Type:** `application/json`.

---

## 8. Segurança e boas práticas

- **HTTPS** obrigatório em produção.
- **API keys** armazenadas de forma segura; nunca em frontend público.
- **Logs:** Registrar chamadas (rota, restaurant_id, status, sem corpo sensível completo) para auditoria e debug.
- **CORS:** Configurar origens permitidas se a API for chamada de browser (geralmente API v1 é server-to-server).

---

## 9. Resumo

| Item | Descrição |
|------|------------|
| Base | `https://api.chefiapp.pt/api/v1` |
| Auth | API Key (header) ou JWT |
| Rate limit | Por key/restaurante; 429 + Retry-After |
| Erros | JSON com error, message, details? |
| Rotas mínimas | POST /orders, PATCH /orders/:id, POST payment, POST whatsapp/incoming, POST /tasks |

Implementação pode ser feita por fases (ex.: primeiro só POST /orders e PATCH /orders/:id; depois payment, messages, tasks).

---

## Referências

- **[CHEFIAPP_PUBLIC_API_CONTRACT.md](CHEFIAPP_PUBLIC_API_CONTRACT.md)** — Contrato público único para parceiros (base URL, auth, rate limit, eventos, rotas, erros)
- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — APIs IN (gateway)
- [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) — Eventos canónicos (order.created, order.updated, etc.)
- [CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md](CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md) — Webhook WhatsApp → evento
- `merchant-portal/src/integrations/types/IntegrationEvent.ts` — Payload de order.created, order.updated
