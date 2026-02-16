# Catálogo de Eventos de Integração

**Referência:** [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](../CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) §1.3, [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](../CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)  
**Código:** `merchant-portal/src/integrations/types/IntegrationEvent.ts`

Nomes e formas de payload usados no Event Bus, em Webhooks OUT e na configuração "eventos selecionáveis".

---

## Tabela evento → descrição → payload resumido

| Tipo (string)       | Descrição                                      | Payload resumido                                                                 |
|---------------------|------------------------------------------------|-----------------------------------------------------------------------------------|
| `order.created`     | Pedido criado                                  | `orderId`, `source`, `items[]`, `totalCents`, `tableId?`, `customerName?`, `createdAt` |
| `order.updated`     | Status do pedido alterado                       | `orderId`, `status`, `updatedAt`                                                 |
| `order.completed`   | Pedido concluído (entregue/servido)            | `orderId`, `totalCents`, `paymentMethod`, `completedAt`                           |
| `order.paid`        | Pagamento confirmado (alias dedicado)          | `orderId`, `totalCents`, `paymentMethod?`, `completedAt`                         |
| `order.ready`       | Pedido pronto (ex.: KDS)                       | `orderId`, `readyAt`                                                             |
| `order.closed`      | Pedido fechado                                 | `orderId`, `closedAt`                                                            |
| `payment.confirmed` | Pagamento confirmado (Stripe, etc.)             | `orderId?`, `subscriptionId?`, `amountCents?`, `confirmedAt`, `metadata?`       |
| `menu.updated`      | Cardápio atualizado                            | `restaurantId`, `categories[]`, `updatedAt`                                      |
| `delivery.status`   | Status de entrega atualizado                   | `orderId`, `externalId`, `status`, `updatedAt`                                   |
| `shift.started`     | Turno iniciado                                 | `restaurantId`, `shiftId?`, `startedAt`                                          |
| `shift.ended`       | Turno terminado                                 | `restaurantId`, `shiftId?`, `endedAt`                                            |
| `alert.raised`      | Alerta crítico disparado                       | `alertId`, `severity`, `message`, `raisedAt`, `metadata?`                       |
| `task.created`      | Tarefa criada                                  | `taskId`, `title`, `description?`, `priority?`, `assigneeRole?`, `createdAt`      |

---

## Uso em Webhooks OUT

No payload de Webhook OUT, o campo `event` é uma string igual a `event.type` acima. O campo `payload` é o objeto interno do evento (estrutura conforme a tabela). Ver [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](../CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) §3.

## Uso em configuração

Para "eventos selecionáveis" por webhook, usar a lista canónica exportada em código: `INTEGRATION_EVENT_TYPES` em `IntegrationEvent.ts`.
