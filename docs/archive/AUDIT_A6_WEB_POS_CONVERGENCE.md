# AUDITORIA A6 — Web ↔ POS Convergence
**Produto:** ChefIApp POS — Core
**Data:** 2025-12-23
**Objetivo:** provar que o Web Module não é um sistema paralelo: todo pedido Web gera eventos em `event_store` e o POS/Kitchen pode reconstruir estado via replay.

---

## 1) Definição de “Convergência” (mínimo aceitável)

Para cada pedido criado via Web:

- Existe `ORDER_CREATED` no stream `ORDER:{order_id}`
- Existe `ORDER_LOCKED` no stream `ORDER:{order_id}` com `total_cents`
- Existem `ORDER_ITEM_ADDED` (>=1)
- Existe `PAYMENT_CREATED` no stream `PAYMENT:{payment_id}` (payment_id = payment_intent_id do Stripe do merchant)

Para pagamento confirmado via webhook (quando testado):

- Existe `PAYMENT_CONFIRMED` no stream `PAYMENT:{payment_id}`
- Existe `ORDER_PAID` no stream `ORDER:{order_id}`

Todos os eventos web carregam `origin=WEB` e `source=WEB_PAGE` no payload.

---

## 2) Como rodar

Pré-requisitos:

- Migração do core event store aplicada (tabela `event_store` existente)
- Web Module API rodando: `npm run server:web-module`
- Seed do web module rodado: `npm run seed:web-module`

Rodar auditoria:

- `npm run audit:a6`

---

## 3) Status final

- ✅ **APROVADO**: convergência mínima confirmada (ORDER_* + PAYMENT_CREATED)
- ⚠️ **APROVADO COM RESSALVAS**: eventos base ok, mas faltam eventos de pagamento confirmado (se webhook não foi testado)
- ❌ **BLOQUEADO**: não há `event_store` ou não há eventos emitidos para o pedido Web
