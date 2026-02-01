# ChefIApp — Integration Hub e Camada de Integrações (SPEC)

**Data:** 2026-01-29
**Objetivo:** Definir a camada de Integrações & Extensibilidade como **primeira classe** do sistema. Não é “integrar WhatsApp” ou “integrar Stripe” — é criar o espaço oficial onde **qualquer** integração existe sem contaminar o Core.

---

## 1. Distinção crítica

### ❌ Não é

- “Vamos integrar WhatsApp”
- “Vamos integrar Stripe”
- “Vamos integrar delivery”
- “Vamos integrar API X”

Cada uma como feature solta vira: spaghetti de webhooks, regras espalhadas, dependência de fornecedor, dor técnica infinita.

### ✅ É

**Uma camada de Integrações** onde:

- O **Core** não conhece Stripe, WhatsApp, iFood, nada.
- O Core só conhece **eventos** e **comandos**.
- Integrações são **plugáveis, ativáveis, isoladas**.

Resultado: plataforma, marketplace possível, lock-in saudável, escala real.

---

## 2. Modelo mental

```
ChefIApp Core
   │
   ├── Runtime / State
   │
   ├── Event Bus (interno)
   │
   ├── Integrations Layer  ◄── AQUI
   │        ├── Pagamentos (Stripe, etc.)
   │        ├── WhatsApp (mensagens, pedidos, alertas)
   │        ├── Delivery (GloriaFood, Glovo, etc.)
   │        ├── APIs & Webhooks (terceiros, ERP, BI)
   │        └── Outros sistemas
```

- **Eventos** alimentam: Dashboard, IA, Webhooks OUT, Integrações.
- **Comandos** (API IN): criar pedido, confirmar pagamento, atualizar status, etc. — tudo via **gateway**, nunca direto no Core.

---

## 3. Integration Hub (UI)

### 3.1 Onde fica

No **Backoffice** (Config ou área dedicada), espaço reservado ou menu novo:

**Integrações**

### 3.2 Estrutura do menu (conceitual)

| Secção              | Conteúdo                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| **Pagamentos**      | Stripe (e futuros); config, status, logs.                                      |
| **WhatsApp**        | Canal de entrada, notificações, automações; ativar, configurar, ver histórico. |
| **APIs & Webhooks** | Webhooks OUT (endpoint, eventos, assinatura); API IN (chaves, limites).        |
| **Delivery**        | GloriaFood, Glovo, Uber Eats, etc.; um card por adapter, ativar/desativar.     |
| **Outros sistemas** | ERP, fiscal, BI, analytics; stubs ou links para config.                        |

Cada integração é **plugável, ativável, isolada**. A UI mostra estado (disabled | configured | active | error) e capacidades.

### 3.3 Implementação (fase 1)

- Página ou secção **Integrações** com UI vazia ou com **stubs** por tipo (pagamentos, WhatsApp, webhooks, delivery, outros).
- Links para configurar cada uma; estado lido do Registry/backend quando existir.

---

## 4. Modelo de Integração (contrato)

Toda integração segue o mesmo contrato mental. Alinhado ao que já existe em código (`IntegrationAdapter`, `IntegrationInfo`).

### 4.1 Entidade Integration (visão produto / backoffice)

```ts
interface Integration {
  id: string; // slug único (ex.: stripe, whatsapp, gloriafood)
  type: "payment" | "messaging" | "delivery" | "analytics" | "custom";
  status: "disabled" | "configured" | "active" | "error";
  capabilities: string[]; // ex.: orders.receive, payments.process
  // opcional: config, lastHealthCheck, etc.
}
```

Nada fora disso para o “registro” de uma integração. Detalhes (credenciais, webhook URL) ficam em config por integração.

### 4.2 Contrato técnico (já existente)

- **Adapter:** `IntegrationAdapter` (`integrations/core/IntegrationContract.ts`) — id, name, capabilities, onEvent, healthCheck, initialize, dispose.
- **Estado:** `IntegrationStatus` / `IntegrationInfo` (`integrations/types/IntegrationStatus.ts`).
- **Registo:** `IntegrationRegistry` — register, unregister, setEnabled, dispatch.

A spec do Hub não substitui o contrato técnico; **reforça** que toda integração (Stripe, WhatsApp, delivery, webhook) é um adapter registado com tipo e status visíveis na UI.

---

## 5. Event Bus e Catálogo de Eventos

### 5.1 Princípio

O Core (e módulos) **emitem** eventos. O Event Bus distribui para:

- Dashboard
- IA (contexto para inferência)
- Webhooks OUT
- Adapters de integração (delivery, WhatsApp, etc.)

Já existe: `IntegrationEventBus`, `emitIntegrationEvent`, `IntegrationRegistry.dispatch`.

### 5.2 Eventos canónicos (catálogo)

Eventos que alimentam integrações, webhooks e IA. Alinhar com tipos em `IntegrationEvent.ts` e estender quando necessário.

| Evento              | Descrição                                                      |
| ------------------- | -------------------------------------------------------------- |
| `order.created`     | Pedido criado (TPV, delivery, WhatsApp, etc.)                  |
| `order.updated`     | Status do pedido alterado                                      |
| `order.completed`   | Pedido concluído (entregue/servido)                            |
| `order.paid`        | Pagamento confirmado (ou alias de order.completed com payment) |
| `order.ready`       | Pedido pronto (ex.: KDS)                                       |
| `order.closed`      | Pedido fechado                                                 |
| `payment.confirmed` | Pagamento confirmado (Stripe, etc.)                            |
| `shift.started`     | Turno iniciado                                                 |
| `shift.ended`       | Turno terminado                                                |
| `alert.raised`      | Alerta crítico disparado                                       |
| `task.created`      | Tarefa criada (ex.: pelo sistema ou integração)                |
| `menu.updated`      | Cardápio atualizado                                            |
| `delivery.status`   | Status de entrega atualizado                                   |

**Nota:** Parte já existe em `IntegrationEvent.ts` (order.created, order.updated, order.completed, menu.updated, delivery.status). Os restantes entram no catálogo e na doc; implementação pode ser estendida por fases.

---

## 6. Webhooks OUT (obrigatório para plataforma)

Para **terceiros** (ERP, BI, Zapier, Make, automações) receberem eventos do ChefIApp.

### 6.1 Contrato

- **Endpoint:** configurável por restaurante (URL do cliente).
- **Payload:** JSON com evento, restaurant_id, timestamp, payload.
- **Assinatura:** HMAC no header (ex.: `X-ChefIApp-Signature`) para o cliente validar.
- **Eventos selecionáveis:** o restaurante escolhe quais eventos enviar (order.created, order.paid, etc.).
- **Retry + logs:** retentativas com backoff; log de entregas (sucesso/falha) para debug.

### 6.2 Forma do payload (exemplo)

```json
{
  "event": "order.paid",
  "restaurant_id": "uuid",
  "timestamp": "2026-01-29T12:00:00Z",
  "payload": { ... }
}
```

Isso sozinho permite: ERP, BI, automações, integrações futuras, sem o Core conhecer cada um.

---

## 7. APIs IN (gateway)

Para **terceiros** enviarem coisas ao sistema:

- Criar pedido
- Confirmar pagamento
- Atualizar status
- Enviar mensagem (ex.: WhatsApp)
- Criar tarefa

Tudo via **gateway** (autenticação, rate limit, validação), **nunca** direto no Core. A spec do Hub declara que este gateway existe (ou existirá); detalhes técnicos (rotas, auth) ficam para doc de API pública v1.

---

## 8. WhatsApp como INTEGRAÇÃO (não feature)

WhatsApp não é “chat”. É:

- **Canal de entrada:** pedidos, comandos.
- **Canal de notificação:** aviso de pedido pronto, alerta crítico.
- **Canal de automação:** comunicação com gerente, lembretes.

Ele **escuta eventos** e dispara mensagens; ou recebe mensagens e emite eventos (order.created, etc.). Nada mais. Implementação: adapter com tipo `messaging`, capacidades adequadas, registado no Registry.

---

## 9. Pagamentos como integração plugável

- **Stripe / Billing** já existem; o passo seguinte é **isolá-los** como Integration tipo `payment`.
- Mesmo contrato: id, type, status, capabilities; config (chaves, webhook) por integração.
- Permite futuros provedores (outro gateway de pagamento) sem contaminar o Core.

---

## 10. IA e integrações

A **IA não fala com integrações** diretamente.

Ela:

- **Observa eventos** (incluindo os que vêm de integrações).
- **Explica** o que aconteceu.
- **Sugere** ações.

Exemplo: _“Pedido pago via WhatsApp, mas não entrou no TPV. Verificar integração.”_

Ou seja: eventos gerados por integrações entram no mesmo Event Bus e no contexto da IA (e do Dashboard).

---

## 11. O que já existe no código (referência)

| Componente                               | Caminho                                    | Nota                                                                         |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| IntegrationAdapter, IntegrationContract  | `integrations/core/IntegrationContract.ts` | Contrato de adapter, capabilities                                            |
| IntegrationEvent, tipos de evento        | `integrations/types/IntegrationEvent.ts`   | order.created, order.updated, order.completed, menu.updated, delivery.status |
| IntegrationRegistry                      | `integrations/core/IntegrationRegistry.ts` | register, unregister, dispatch, setEnabled                                   |
| IntegrationEventBus                      | `integrations/core/IntegrationEventBus.ts` | emitIntegrationEvent                                                         |
| IntegrationStatus, IntegrationInfo       | `integrations/types/IntegrationStatus.ts`  | status, enabled, capabilities                                                |
| Adapters (GloriaFood, Glovo, Mock, etc.) | `integrations/adapters/`                   | Exemplos de integrações delivery                                             |

O Integration Hub (UI) e o **catálogo de eventos** formalizam e estendem isto; Webhooks OUT e API IN são a próxima camada.

---

## 12. Fase Integrações (lista clara)

| #   | Passo                                                                                        |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | Criar Integration Hub no Backoffice (UI vazia + stubs por secção).                           |
| 2   | Definir Event Catalog (doc + tipos; estender `IntegrationEvent.ts` se necessário).           |
| 3   | Implementar Webhooks OUT (endpoint configurável, HMAC, eventos selecionáveis, retry + logs). |
| 4   | Implementar API IN (mínimo: criar pedido, confirmar pagamento, atualizar status).            |
| 5   | Mover Stripe/Billing para o modelo de integração (adapter tipo payment, registado no Hub).   |
| 6   | Criar integração WhatsApp como listener de eventos (adapter tipo messaging).                 |
| 7   | Documentar tudo (contrato público para parceiros).                                           |

Isso transforma o ChefIApp de **produto fechado** em **plataforma operacional**.

---

## 13. Próximos documentos (escolher ordem)

| Opção | Conteúdo                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| **A** | ~~Spec oficial do Integration Hub~~ ✅ Este documento                                                      |
| **B** | ~~Event Bus + Webhooks~~ ✅ [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md)     |
| **C** | ~~WhatsApp Integration~~ ✅ [CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md](CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md) |
| **D** | ~~Pagamentos como integração plugável~~ ✅ [CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md](CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md) |
| **E** | ~~API pública v1 (mínima)~~ ✅ [CHEFIAPP_API_PUBLICA_V1_SPEC.md](CHEFIAPP_API_PUBLICA_V1_SPEC.md) |

---

## Referências

- [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md](CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) — Event Bus e Webhooks OUT (contrato técnico)
- [CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md](CHEFIAPP_WHATSAPP_INTEGRATION_SPEC.md) — WhatsApp como integração (adapter, eventos, capacidades)
- [CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md](CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md) — Pagamentos plugável (Stripe no modelo Integration)
- [CHEFIAPP_API_PUBLICA_V1_SPEC.md](CHEFIAPP_API_PUBLICA_V1_SPEC.md) — API pública v1 (rotas, auth, rate limit)
- `merchant-portal/src/integrations/` — Código atual: adapters, Event Bus, Registry, tipos
- [CHEFIAPP_AI_GATEWAY_SPEC.md](CHEFIAPP_AI_GATEWAY_SPEC.md) — IA observa eventos, não fala com integrações
- Config: secção “Integrações” (ou equivalente) no backoffice
