# ChefIApp — Integração WhatsApp (modelo correto)

**Data:** 2026-01-29
**Referência:** [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)
**Objetivo:** Definir o WhatsApp como **integração** (adapter tipo messaging), não como feature solta. Canal de entrada (pedidos) e de saída (notificações/alertas); escuta eventos e envia mensagens; emite eventos quando recebe pedidos.

---

## 1. O que o WhatsApp NÃO é

- **Não é** “chat” nem feature isolada.
- **Não é** um módulo que o Core chama diretamente por todo o lado.

---

## 2. O que o WhatsApp é (integração)

- **Canal de entrada:** recebe pedidos (ou comandos) via WhatsApp e emite `order.created` (e eventos relacionados) no Event Bus.
- **Canal de notificação:** escuta eventos do sistema (ex.: order.ready, alert.raised) e envia mensagens (aviso de pedido pronto, alerta crítico).
- **Canal de automação:** ex.: lembretes, comunicação com gerente, confirmações.

Ele **escuta eventos** e dispara mensagens; **recebe mensagens** e emite eventos. Nada mais. Isolado no Integration Registry como qualquer outro adapter.

---

## 3. Modelo no Integration Hub

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **id**           | `whatsapp`                                             |
| **type**         | `messaging`                                            |
| **name**         | WhatsApp                                               |
| **description**  | Canal de pedidos e notificações via WhatsApp Business. |
| **status**       | disabled \| configured \| active \| error              |
| **capabilities** | `orders.receive`, `notifications.send` (ver secção 4)  |

Config (por restaurante): número/ID do WhatsApp Business, token ou credenciais da API, opções de templates, etc. Tudo na secção Integrações → WhatsApp do Backoffice.

---

## 4. Capacidades

### 4.1 orders.receive

- **Significado:** Pode receber pedidos (ou comandos) de fora e transformá-los em eventos no sistema.
- **Uso WhatsApp:** Mensagem do cliente com pedido (texto ou botão) → adapter valida e emite `order.created` com `source: 'whatsapp'` no payload.
- **Já existe** em `IntegrationContract` como `IntegrationCapability`.

### 4.2 notifications.send

- **Significado:** Pode enviar notificações para fora (cliente, gerente, equipa) com base em eventos.
- **Uso WhatsApp:** Ao receber evento `order.ready`, `alert.raised`, etc., adapter envia mensagem via WhatsApp Business API.
- **Nota:** Se o contrato atual só tiver as capabilities existentes, adicionar `notifications.send` ao tipo `IntegrationCapability` em `IntegrationContract.ts`. Alternativa temporária: usar `orders.status` para “atualizar status ao cliente” (ex.: pedido pronto), mas um nome dedicado (`notifications.send`) deixa o modelo mais claro.

---

## 5. Fluxo OUT (sistema → WhatsApp)

O adapter WhatsApp está **registado** no IntegrationRegistry. Quando o Event Bus emite um evento:

1. O Registry faz **dispatch** a todos os adapters habilitados.
2. O adapter WhatsApp (se configurado e ativo) recebe o evento em `onEvent(event)`.
3. Conforme o **tipo de evento**, decide se envia mensagem e para quem.

### 5.1 Eventos que disparam mensagem (exemplos)

| Evento            | Ação típica                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `order.ready`     | Enviar ao cliente: “O seu pedido está pronto.” (número associado ao pedido ou à mesa). |
| `order.completed` | Opcional: “Obrigado. Pedido concluído.”                                                |
| `alert.raised`    | Enviar ao gerente: “Alerta crítico: [resumo].”                                         |
| `task.created`    | Opcional: notificar responsável (se configurado).                                      |

Configuração: o restaurante escolhe quais eventos geram notificação e para que número(s) ou grupo(s). O adapter não decide sozinho; usa config (ex.: “notificar gerente em alert.raised”, “notificar cliente em order.ready”).

### 5.2 Forma da mensagem

- **API:** WhatsApp Business API (Cloud ou On-Premise) — envio via HTTP para o provedor.
- **Conteúdo:** texto ou template aprovado (conforme política do WhatsApp). Sem dados sensíveis desnecessários; sem identificação de pessoas para além do necessário (ex.: número do cliente para entrega).
- **Falhas:** se o envio falhar, o adapter regista o erro e opcionalmente retenta (conforme política). Não propaga exceção ao Event Bus; falhas ficam isoladas (logs, métricas, status da integração).

---

## 6. Fluxo IN (WhatsApp → sistema)

O cliente (ou bot) envia mensagem no WhatsApp. Algo **externo ao frontend** (webhook do provedor ou API IN do ChefIApp) recebe o POST.

### 6.1 Opção A — Webhook do provedor chama API IN do ChefIApp

- Provedor WhatsApp (Meta, etc.) envia webhook para **API IN** do ChefIApp (ex.: `POST /api/v1/integrations/whatsapp/incoming`).
- API IN valida assinatura, parseia a mensagem, e chama o **adapter** ou um **service** que emite evento no Event Bus.
- Adapter (ou mesmo o handler da API) emite `order.created` com `source: 'whatsapp'` e payload normalizado (orderId, items, totalCents, customerPhone, etc.).

### 6.2 Opção B — Worker/backend do ChefIApp consome fila do provedor

- Provedor coloca mensagens numa fila ou o ChefIApp faz poll; o worker processa e emite eventos.
- Mesmo resultado: evento `order.created` (ou outro) no Event Bus com origem WhatsApp.

Em ambos os casos, o **Core não conhece WhatsApp**; só vê eventos. Quem “traduz” mensagem → evento é a API IN ou o adapter (conforme desenho).

### 6.3 Payload de order.created com source whatsapp

Alinhado a `IntegrationEvent.ts`:

```ts
{
  type: 'order.created',
  payload: {
    orderId: string;           // gerado pelo sistema ao receber
    source: 'whatsapp';
    items: Array<{ id, name, quantity, priceCents }>;
    totalCents: number;
    customerPhone?: string;   // número WhatsApp do cliente
    customerName?: string;
    tableId?: string;
    createdAt: number;
  }
}
```

O TPV e outros módulos já tratam `source: 'whatsapp'` como qualquer outra origem (delivery, online, tpv) porque o contrato é o mesmo.

---

## 7. Adapter (contrato técnico)

O adapter WhatsApp implementa `IntegrationAdapter`:

- **id:** `whatsapp`
- **name:** `WhatsApp`
- **description:** Canal de pedidos e notificações via WhatsApp Business.
- **capabilities:** `['orders.receive', 'notifications.send']` (adicionar `notifications.send` ao enum se necessário).
- **onEvent(event):** para cada evento recebido, se for um dos que disparam notificação (order.ready, alert.raised, etc.) e a config permitir, envia mensagem via API do provedor. Não emite novos eventos neste fluxo; só envia para fora.
- **initialize():** carregar config (credenciais, números, templates), validar conectividade.
- **dispose():** limpar recursos, não deixar listeners abertos.
- **healthCheck():** verificar se a API do provedor responde (ex.: endpoint de health ou um ping). Devolver `IntegrationStatus` (ok / degraded / down).

Inbound (mensagem → evento): pode ser tratado no mesmo adapter (se tiver API para “receber” chamada) ou num endpoint da API IN que chama `emitIntegrationEvent(createOrderCreatedEvent({ ... }))` com source whatsapp. O importante é que o evento entre pelo Event Bus e o resto do sistema não sabe que veio do WhatsApp.

---

## 8. Configuração (UI — Integrações → WhatsApp)

Campos mínimos sugeridos (podem ser estendidos):

| Campo              | Tipo            | Descrição                                       |
| ------------------ | --------------- | ----------------------------------------------- |
| enabled            | boolean         | Integração ativa ou não.                        |
| phoneNumberId      | string          | ID do número WhatsApp Business (API).           |
| token              | string (secret) | Token de acesso à API.                          |
| notifyOnOrderReady | boolean         | Enviar mensagem ao cliente quando order.ready.  |
| notifyOnAlert      | boolean         | Enviar alerta crítico ao gerente.               |
| managerPhone       | string          | Número do gerente para alertas (opcional).      |
| webhookVerifyToken | string          | Token para verificação do webhook (Meta exige). |

Armazenamento: secrets (token, webhookVerifyToken) encriptados; resto em config por restaurante.

---

## 9. Resumo

- **WhatsApp = integração** (adapter tipo `messaging`), não feature solta.
- **OUT:** adapter escuta eventos (order.ready, alert.raised, etc.) e envia mensagens via API do provedor.
- **IN:** API IN ou webhook recebe mensagem do provedor; emite `order.created` (e outros) com `source: 'whatsapp'`.
- **Capacidades:** `orders.receive`, `notifications.send` (adicionar ao contrato se ainda não existir).
- **Config:** na secção Integrações → WhatsApp; ativar/desativar, escolher eventos que disparam notificação, números e tokens.
- **Isolamento:** falhas no envio ou no recebimento não derrubam o Core; erros são logados e refletidos no status da integração.

---

## Referências

- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — Camada de integrações, WhatsApp como integração
- [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) — Event Bus e eventos canónicos
- `merchant-portal/src/integrations/core/IntegrationContract.ts` — IntegrationAdapter, IntegrationCapability
- `merchant-portal/src/integrations/types/IntegrationEvent.ts` — OrderCreatedEvent, source: 'whatsapp'
