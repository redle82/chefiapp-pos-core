# 🔱 PROTOCOLO CANÔNICO — FEATURE 3: BILLING AUTOMATIZADO (STRIPE)

**Data:** 2026-01-15  
**Feature:** Billing Automatizado (Stripe Subscriptions) — Q2 2026  
**Método:** Protocolo Canônico (Verificar → Analisar → Corrigir → Testar → Validar)

---

## 1️⃣ VERIFICAR SE JÁ FOI FEITO

### ✅ O Que Existe:

**Backend Core:**
- ✅ **`billing-core/StripeBillingService.ts`** — Serviço completo para Stripe Billing
  - `createCustomer()` — Cria customer no Stripe
  - `createSubscription()` — Cria subscription no Stripe
  - `cancelSubscription()` — Cancela subscription
  - `getOrCreatePrice()` — Gerencia prices no Stripe
  - `createBillingPortalSession()` — Cria sessão do Customer Portal
  - `handleWebhook()` — Processa webhooks do Stripe

**Tipos e Planos:**
- ✅ **`billing-core/types.ts`** — Tipos e planos definidos
  - `DEFAULT_PLANS`: STARTER (€29), PROFESSIONAL (€59), ENTERPRISE (€149)
  - `DEFAULT_ADDONS`: RESERVATIONS, WEB_PAGE, MULTI_LOCATION, etc.
  - `FeatureFlag` enum com todas as features

**Feature Gates:**
- ✅ **`billing-core/FeatureGateService.ts`** — Controle de features por plano
  - `TIER_FEATURES`: Features por tier
  - `ADDON_FEATURES`: Features por add-on
  - `canUseFeature()` — Verifica se feature está disponível

**Schema SQL:**
- ✅ **`billing-core/event-store.ts`** — Schema SQL completo
  - `billing_events` — Event-sourced billing history
  - `subscriptions` — Current subscription state
  - `billing_payments` — Payment records

**Edge Functions:**
- ✅ **`supabase/functions/stripe-billing/index.ts`** — Edge Function para billing
  - `create-checkout-session` — Cria checkout session
  - `create-portal-session` — Cria Customer Portal session
  - Cria customer automaticamente se não existir

**Webhooks:**
- ✅ **`supabase/functions/stripe-billing-webhook/index.ts`** — Webhook handler
  - `checkout.session.completed` — Linka subscription ao restaurant
  - `customer.subscription.updated` — Atualiza status
  - `customer.subscription.deleted` — Cancela subscription

**UI:**
- ✅ **`merchant-portal/src/pages/Settings/components/SubscriptionWidget.tsx`** — Widget de subscription
  - Mostra plano atual (SOVEREIGN/FREE)
  - Botão "Upgrade Now" ou "Manage Subscription"
  - Integra com Edge Function `stripe-billing`

**Arquivos Envolvidos:**
- `billing-core/StripeBillingService.ts`
- `billing-core/types.ts`
- `billing-core/FeatureGateService.ts`
- `billing-core/event-store.ts`
- `supabase/functions/stripe-billing/index.ts`
- `supabase/functions/stripe-billing-webhook/index.ts`
- `merchant-portal/src/pages/Settings/components/SubscriptionWidget.tsx`

---

## 2️⃣ ANALISAR SE O QUE EXISTE ESTÁ CORRETO

### ⚠️ ANÁLISE:

**StripeBillingService:**
- ✅ **CORRETO** — Implementação completa e correta
- ✅ Separação clara: Billing Stripe vs Merchant Stripe
- ✅ Webhook verification implementado
- ✅ Customer Portal implementado
- ⚠️ **GAP:** Não está sendo usado no sistema atual (apenas código isolado)

**Edge Function (stripe-billing):**
- ✅ **FUNCIONAL** — Implementação correta
- ✅ Cria checkout session
- ✅ Cria Customer Portal session
- ⚠️ **GAP:** Usa apenas `plan: 'SOVEREIGN'` hardcoded, não usa `DEFAULT_PLANS`
- ⚠️ **GAP:** Não integra com `StripeBillingService` (duplicação de lógica)

**Webhook Handler:**
- ✅ **FUNCIONAL** — Processa eventos corretamente
- ✅ Atualiza `gm_restaurants` com subscription status
- ⚠️ **GAP:** Lógica simplificada (apenas SOVEREIGN/FREE), não usa planos completos
- ⚠️ **GAP:** Não atualiza tabela `subscriptions` do schema billing-core

**SubscriptionWidget:**
- ✅ **FUNCIONAL** — UI básica implementada
- ⚠️ **GAP:** Usa apenas `VITE_STRIPE_SOVEREIGN_PRICE_ID` hardcoded
- ⚠️ **GAP:** Não mostra múltiplos planos (STARTER, PROFESSIONAL, ENTERPRISE)
- ⚠️ **GAP:** Não mostra add-ons disponíveis

**Schema SQL:**
- ✅ **CORRETO** — Schema completo definido
- ⚠️ **GAP:** Tabelas não foram criadas via migration (apenas código TypeScript)

**Feature Gates:**
- ✅ **CORRETO** — Lógica de features por plano implementada
- ⚠️ **GAP:** Não está sendo usado no sistema (não há guards nas rotas/features)

**Classificação:**
- ✅ **StripeBillingService:** CORRETO (mas não integrado)
- ⚠️ **Edge Function:** FUNCIONAL MAS INCOMPLETO (lógica simplificada)
- ⚠️ **Webhook Handler:** FUNCIONAL MAS INCOMPLETO (não usa schema completo)
- ⚠️ **SubscriptionWidget:** FUNCIONAL MAS INCOMPLETO (apenas SOVEREIGN)
- ⚠️ **Schema SQL:** CORRETO MAS NÃO APLICADO (sem migration)
- ⚠️ **Feature Gates:** CORRETO MAS NÃO USADO (sem guards)

---

## 3️⃣ CORRIGIR (SE NECESSÁRIO)

### ✅ GAPS IDENTIFICADOS:

1. **Schema SQL não aplicado**
   - Criar migration para `billing_events`, `subscriptions`, `billing_payments`

2. **Edge Function não usa StripeBillingService**
   - Refatorar para usar `StripeBillingService` ao invés de lógica duplicada

3. **Webhook não atualiza schema billing-core**
   - Atualizar webhook para usar tabelas `subscriptions` e `billing_events`

4. **UI não mostra múltiplos planos**
   - Criar UI completa para seleção de planos (STARTER, PROFESSIONAL, ENTERPRISE)
   - Mostrar add-ons disponíveis

5. **Feature Gates não implementados**
   - Adicionar guards nas rotas/features baseado no plano

6. **Price IDs não configurados**
   - Criar prices no Stripe e configurar via ENV ou DB

**Status:** ⚠️ **REQUER INTEGRAÇÃO E COMPLETUDE**

---

## 4️⃣ TESTAR O QUE EXISTE / FOI CORRIGIDO

**Testes Necessários:**
- [ ] Criar subscription via StripeBillingService
- [ ] Processar webhook de subscription
- [ ] Abrir Customer Portal
- [ ] Verificar Feature Gates funcionando
- [ ] Testar upgrade/downgrade de planos
- [ ] Testar adição de add-ons

**Status:** ⚠️ **PENDENTE** (requer integração primeiro)

---

## 5️⃣ VALIDAR SE ESTÁ "BOM O SUFICIENTE"

**Pergunta:** "Isso sustenta uso real sem vergonha técnica?"

**Resposta:** ⚠️ **NÃO** (ainda)
- ⚠️ Schema SQL não aplicado
- ⚠️ Lógica duplicada entre Edge Function e StripeBillingService
- ⚠️ UI simplificada (apenas SOVEREIGN)
- ⚠️ Feature Gates não implementados
- ⚠️ Não integrado com sistema atual

**Status:** ⚠️ **REQUER INTEGRAÇÃO COMPLETA**

---

## 6️⃣ PASSAR PARA O PRÓXIMO ITEM

**Status do Item:**
- ✅ **CÓDIGO EXISTE** — Estrutura completa implementada
- ⚠️ **NÃO INTEGRADO** — Não está sendo usado no sistema
- ⚠️ **INCOMPLETO** — UI e lógica simplificadas

**Próximo Item:** Integrar e completar billing automatizado

---

**Última atualização:** 2026-01-15  
**Status:** ⚠️ **CÓDIGO EXISTE MAS NÃO INTEGRADO** — Requer integração completa
