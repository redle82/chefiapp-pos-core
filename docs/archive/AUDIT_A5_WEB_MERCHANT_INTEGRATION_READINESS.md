# AUDITORIA A5 — Web & Merchant Integration Readiness
**Produto:** ChefIApp POS — Core
**Data:** 2025-12-23
**Objetivo:** validar que o ciclo “Web → pedido → pagamento (merchant-owned) → POS” não quebra nada crítico ao ligar o primeiro merchant (Sofia) em sandbox.

Esta é uma **Auditoria de Transição** (pré-onboarding real), não auditoria fiscal/compliance/pentest.

---

## 0) Definições (para evitar confusão)

**Billing (ChefIApp):** você cobra o restaurante (assinatura). Stripe usado via `STRIPE_SECRET_KEY`.

**Payments (Merchant):** o cliente paga o restaurante (pedido web/mesa). Stripe/SumUp usado via `MERCHANT_STRIPE_KEY` + `MERCHANT_STRIPE_WEBHOOK_SECRET`.

**Regra de ouro:** Billing e Payments nunca se misturam.

---

## 1) Pré-requisitos

### 1.1 Variáveis de ambiente

Obrigatórias para rodar esta auditoria local:

- `DATABASE_URL` (Postgres)
- `WEB_MODULE_SLUG` (ex.: `sofia-gastrobar`)
- `WEB_MODULE_RESTAURANT_ID` (UUID)

Para validar gates (Billing):

- `STRIPE_SECRET_KEY` (ChefI billing)
- `BILLING_STRIPE_SUBSCRIPTION_ID` (sub_... do merchant no seu Stripe)

Para validar createPaymentIntent (Payments do merchant):

- `MERCHANT_STRIPE_KEY` (Stripe do restaurante)
- `MERCHANT_STRIPE_WEBHOOK_SECRET` (whsec_... do Stripe do restaurante)

### 1.2 Serviços locais

- Web Module API: `npm run server:web-module`

### 1.3 Dados seed (menu + profile)

- `npm run seed:web-module`

---

## 2) Como rodar (roteiro)

1. Rodar migração (se aplicável no seu ambiente).
2. `npm run seed:web-module`
3. `npm run server:web-module`
4. Em outro terminal: `npm run audit:a5`

---

## 3) Resultado esperado

### Status final

- ✅ **APROVADO**: todos os blocos críticos passam.
- ⚠️ **APROVADO COM RESSALVAS**: passa o crítico, mas há pendências não-bloqueantes.
- ❌ **BLOQUEADO**: qualquer falha crítica.

### Evidências geradas

- Saída do script `audit-a5-web-integration.js` (copiar no final deste doc, seção 8).
- Lista de IDs gerados: `order_id`, `payment_intent_id` (quando aplicável).

---

## 4) BLOCO 1 — Web Module Integrity (CRÍTICO)

**Objetivo:** provar que o módulo web não vira um “mini POS inseguro”.

Checklist:

1. **Publicação/visibilidade**
   - `GET /public/:slug/menu` retorna **404** se profile estiver `draft`.
   - `GET /public/:slug/menu` retorna **200** se `published` e gate OK.
   - Se gate `WEB_PAGE` bloqueado, endpoint deve retornar **402 FEATURE_BLOCKED** (não 200).

2. **Criação de pedido**
   - `POST /public/:slug/orders` não aceita `restaurant_id` arbitrário (somente `slug`).
   - Pedido criado inicia como `status=PLACED` e `payment_status=REQUIRES_PAYMENT`.

3. **Snapshot de itens (invariante)**
   - Após criar pedido, alterar `menu_items.name`/`price_cents` **não** altera `web_order_items.name_snapshot`/`price_cents` do pedido.

Critério de aprovação:

- Passa se 1, 2 e 3 acima forem verdade.

---

## 5) BLOCO 2 — Billing ↔ Feature Gate ↔ Web (CRÍTICO)

**Objetivo:** garantir que “dinheiro manda no código” e não existe feature fantasma.

Checklist:

1. `TRIAL` → `WEB_PAGE` funciona.
2. `PAST_DUE` → `WEB_PAGE` funciona (grace).
3. `SUSPENDED` → publish e pedidos bloqueados.
4. `CANCELLED` → página e pedidos bloqueados.
5. Add-on `WEB_PAGE` removido → endpoints públicos bloqueiam.

Como validar (prático):

- Validar status via Stripe dashboard/test-mode e repetir:
  - `GET /public/:slug/menu`
  - `POST /public/:slug/orders`

Critério de aprovação:

- Passa se `WEB_PAGE` realmente controla o acesso, com retorno consistente (402/404) e sem bypass.

---

## 6) BLOCO 3 — Payments Correctness (Merchant-Owned) (CRÍTICO)

**Objetivo:** garantir que ChefI não toca no dinheiro nem por acidente.

Checklist:

1. `payment_intent` é criado **somente** com `MERCHANT_STRIPE_KEY`.
2. Não existe rota pública para “marcar pago” manualmente.
3. Webhook de payments:
   - valida assinatura com `MERCHANT_STRIPE_WEBHOOK_SECRET`.
   - não aceita eventos de billing.
4. `web_orders.payment_status` só muda para `PAID`/`FAILED` via webhook válido.

Critério de aprovação:

- Passa se não houver endpoint de bypass e se a transição para `PAID` depender do webhook validado.

---

## 7) BLOCO 4 — POS Convergence (BLOQUEANTE PARA “GloriaFood killer”) 

**Objetivo:** provar que Web não é sistema paralelo.

Checklist:

1. Pedido web cai no mesmo pipeline/event-log do POS.
2. Cozinha vê o pedido no feed padrão.
3. Audit log registra origem = `WEB`.

**Observação honesta (estado atual):** se ainda não existe “emissão de CoreEvent / ingest no POS” a partir do Web Module, este bloco fica **❌ BLOQUEADO** até implementar a ponte (próximo passo natural).

---

## 8) Output / evidências

Cole aqui o output do comando:

`npm run audit:a5`

---

## 9) Ações obrigatórias antes de ligar o Sofia

Preencher após execução:

- [ ] Ajustes críticos (se houver)
- [ ] Pendências não-bloqueantes (se houver)
- [ ] Decisão final: APROVADO / RESSALVAS / BLOQUEADO
