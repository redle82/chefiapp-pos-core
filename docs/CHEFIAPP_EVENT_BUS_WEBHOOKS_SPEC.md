# ChefIApp — Event Bus e Webhooks OUT (contrato técnico)

**Data:** 2026-01-29  
**Referência:** [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)  
**Objetivo:** Contrato técnico do Event Bus interno e dos Webhooks OUT (payload, assinatura HMAC, retry, logs). Permite ERP, BI, Zapier/Make e integrações futuras sem o Core conhecer cada um.

---

## 1. Event Bus (interno)

### 1.1 Papel

- **Ponto único de emissão:** módulos (TPV, KDS, Billing, Integrações) emitem eventos via `emitIntegrationEvent(event)`.
- **Consumidores:** IntegrationRegistry (adapters), futuramente Webhooks OUT, Dashboard, IA.
- **Princípio:** Eventos são imutáveis e auto-descritivos; ninguém altera o evento após emissão.

### 1.2 API atual (referência)

- `emitIntegrationEvent(event: IntegrationEvent): Promise<void>` — emite e aguarda dispatch aos adapters.
- `emitIntegrationEventAsync(event)` — fire-and-forget.
- Helpers: `emitOrderCreated`, `emitOrderUpdated`, `emitOrderCompleted`.

Código: `merchant-portal/src/integrations/core/IntegrationEventBus.ts`, `IntegrationRegistry.dispatch`.

### 1.3 Catálogo de eventos (tipos canónicos)

Nomes de evento usados no payload de Webhook OUT e na configuração “eventos selecionáveis”. Alinhado a `IntegrationEvent.ts`; eventos adicionais para expansão futura.

| Tipo (string) | Descrição | Já em IntegrationEvent? |
|---------------|-----------|---------------------------|
| `order.created` | Pedido criado | ✅ |
| `order.updated` | Status do pedido alterado | ✅ |
| `order.completed` | Pedido concluído (entregue/servido) | ✅ |
| `order.paid` | Pagamento confirmado (alias ou evento dedicado) | extensão |
| `order.ready` | Pedido pronto (ex.: KDS) | extensão |
| `order.closed` | Pedido fechado | extensão |
| `payment.confirmed` | Pagamento confirmado (Stripe, etc.) | extensão |
| `shift.started` | Turno iniciado | extensão |
| `shift.ended` | Turno terminado | extensão |
| `alert.raised` | Alerta crítico disparado | extensão |
| `task.created` | Tarefa criada | extensão |
| `menu.updated` | Cardápio atualizado | ✅ |
| `delivery.status` | Status de entrega atualizado | ✅ |

Implementação: manter `IntegrationEvent` como union TypeScript; para Webhooks OUT usar o campo `event` (string) igual a `event.type` e `payload` igual ao objeto interno do evento. Novos tipos podem ser adicionados ao union e ao catálogo em paralelo.

---

## 2. Webhooks OUT — visão geral

- **Quem usa:** ERP, BI, Zapier, Make, scripts do cliente, integrações custom.
- **Fluxo:** O Event Bus (ou um listener no Registry) envia HTTP POST para a URL configurada pelo restaurante, com payload normalizado e assinatura HMAC.
- **Config por restaurante:** URL do webhook, secret para HMAC, lista de eventos a enviar (ou “todos”).

---

## 3. Payload do Webhook OUT

### 3.1 Formato

Sempre **POST** com `Content-Type: application/json`. Corpo:

```ts
interface WebhookOutPayload {
  /** Identificador único desta entrega (para idempotência e logs) */
  id: string;
  /** Tipo do evento (order.created, order.paid, etc.) */
  event: string;
  /** ID do restaurante */
  restaurant_id: string;
  /** Timestamp ISO 8601 da geração do evento */
  timestamp: string;
  /** Dados do evento (estrutura depende de `event`) */
  payload: Record<string, unknown>;
}
```

### 3.2 Exemplo

```json
{
  "id": "wh_evt_550e8400-e29b-41d4-a716-446655440000",
  "event": "order.paid",
  "restaurant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-01-29T14:30:00.000Z",
  "payload": {
    "orderId": "ord_xyz",
    "totalCents": 2500,
    "paymentMethod": "card",
    "completedAt": 1738157400000
  }
}
```

### 3.3 Regras

- `id`: único por entrega (UUID ou prefixo `wh_evt_` + UUID). O cliente pode usar para idempotência (evitar processar o mesmo evento duas vezes).
- `timestamp`: sempre ISO 8601 em UTC.
- `payload`: para eventos já tipados em `IntegrationEvent`, coincide com o `payload` do tipo correspondente; para outros, objeto JSON genérico.

---

## 4. Assinatura HMAC

### 4.1 Objetivo

O cliente verifica que o POST veio do ChefIApp e que o corpo não foi alterado.

### 4.2 Algoritmo

- **HMAC-SHA256** do corpo **raw** do pedido (bytes da string JSON), com o **secret** configurado pelo restaurante para esse webhook.

### 4.3 Header

- **Nome:** `X-ChefIApp-Signature` (ou `X-Webhook-Signature` se quiser nome genérico).
- **Valor:** prefixo opcional + assinatura em hex. Exemplo de formato:
  - `sha256=<hex_digest>`  
  Ex.: `sha256=a1b2c3d4e5f6...` (64 caracteres hex).

### 4.4 Cálculo (servidor ChefIApp)

```
signature = HMAC-SHA256(secret, body_utf8_bytes)
header   = "sha256=" + hex(signature)
```

### 4.5 Verificação (cliente)

1. Obter o corpo raw do POST (antes de parsear JSON).
2. Calcular `HMAC-SHA256(secret, body)` e converter para hex.
3. Comparar com o valor em `X-ChefIApp-Signature` (removendo o prefixo `sha256=`), em comparação constante (evitar timing attacks).

Se não coincidir, rejeitar o pedido.

---

## 5. Configuração do Webhook (por restaurante)

Campos mínimos (persistidos no Core ou em config):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `url` | string | URL absoluta do endpoint (HTTPS recomendado). |
| `secret` | string | Secret para HMAC; gerado pelo sistema ou definido pelo utilizador. |
| `events` | string[] | Lista de tipos de evento a enviar (ex.: `["order.created", "order.paid"]`). Vazio ou ausente = “todos”. |
| `enabled` | boolean | Se o webhook está ativo. |
| `description` | string (opcional) | Nome/descrição para o utilizador (ex.: “ERP”, “Zapier”). |

Múltiplos webhooks por restaurante: permitido (várias URLs, cada uma com seu secret e opção de eventos).

---

## 6. Retry e resiliência

### 6.1 Política sugerida

- **Tentativas:** até 3 (total 4 chamadas: 1 inicial + 3 retries).
- **Backoff:** exponencial — ex.: 1s, 2s, 4s após falha (ou 2^attempt segundos).
- **Condição de retry:** status HTTP 5xx ou timeout; 4xx (exceto 429) não fazer retry.
- **429 (Too Many Requests):** respeitar `Retry-After` se presente; senão usar backoff.

### 6.2 Timeout

- Timeout por request: ex.: 10s. Após timeout, considerar falha e aplicar retry.

### 6.3 Ordem

- Entregas são assíncronas (fila ou worker). Ordem de eventos deve ser preservada por restaurante (mesma URL) quando fizer sentido; implementação pode usar fila por webhook.

---

## 7. Logs de entrega

Registar cada tentativa (para debug e suporte):

| Campo | Descrição |
|-------|-----------|
| `id` | Id da entrega (igual ao `id` do payload). |
| `webhook_config_id` | Referência à config do webhook. |
| `restaurant_id` | Restaurante. |
| `event` | Tipo do evento. |
| `url` | URL chamada (pode mascarar query params se houver). |
| `status_code` | HTTP status da resposta (ou null se timeout/erro de rede). |
| `attempt` | Número da tentativa (1-based). |
| `attempted_at` | Timestamp da tentativa. |
| `next_retry_at` | Próxima retentativa (se aplicável). |
| `error_message` | Mensagem de erro ou corpo de resposta em falha (truncado se necessário). |

Retenção: definir política (ex.: 7 ou 30 dias). Não logar o corpo completo do payload em texto plano se contiver dados sensíveis; preferir referência ao evento.

---

## 8. Fluxo de implementação (resumo)

1. **Event Bus:** Já existe; garantir que todos os eventos relevantes passam por `emitIntegrationEvent` (ou equivalente).
2. **Config Webhook:** Tabela ou store por restaurante (url, secret, events[], enabled, description).
3. **Worker ou listener:** Ao emitir evento interno, para cada webhook do restaurante com `enabled` e `event` na lista (ou lista vazia = todos), construir `WebhookOutPayload`, assinar com HMAC, fazer POST, aplicar retry e registar log.
4. **UI:** Na secção Integrações → APIs & Webhooks, permitir criar/editar webhooks (URL, eventos selecionáveis, ver secret, ativar/desativar) e consultar últimos logs.

---

## 9. Referências de código

| Componente | Caminho |
|------------|---------|
| IntegrationEvent tipos | `merchant-portal/src/integrations/types/IntegrationEvent.ts` |
| IntegrationEventBus | `merchant-portal/src/integrations/core/IntegrationEventBus.ts` |
| IntegrationRegistry | `merchant-portal/src/integrations/core/IntegrationRegistry.ts` |

---

## Referências

- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — Camada de integrações e Integration Hub
