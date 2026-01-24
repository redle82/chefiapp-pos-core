# 🥇 MERCHANT ONBOARDING CHECKLIST

> **Objetivo:** Ativar o primeiro merchant real no ChefIApp  
> **Data:** 23 Dezembro 2025  
> **Status:** PRONTO PARA EXECUÇÃO

---

## 📍 PRÉ-REQUISITOS (JÁ COMPLETOS)

- [x] A1 — Products/Prices no Stripe ✅
- [x] A2 — Subscription Lifecycle ✅
- [x] A3 — Webhooks de Billing ✅
- [x] A4 — Feature Gates ✅
- [x] Separação Billing vs Payments ✅

---

## 🎯 PASSO 1: Onboarding do Primeiro Merchant

### 1.1 Escolher Merchant

**Opção A: Merchant Real (Sofia Gastrobar)**
```
Business Name: Sofia Gastrobar
Type: RESTAURANT
Email: sofia@gastrobar.pt
Plan: PROFESSIONAL (€59/mês)
Add-ons: RESERVATIONS (€19/mês)
Trial: 14 dias
```

**Opção B: Dev Test Merchant**
```
Business Name: DevSolo Test Restaurant
Type: RESTAURANT
Email: dev@chefiapp.com
Plan: STARTER (€29/mês)
Add-ons: None
Trial: 14 dias
```

### 1.2 Executar Onboarding

```bash
# Definir variáveis
export STRIPE_SECRET_KEY=sk_test_51SgVOwEOB1Od9eib...

# Executar script
node onboard-first-merchant.js
```

### 1.3 Verificar Resultados

- [ ] Customer criado no Stripe Dashboard
- [ ] Subscription ativa (status: trialing)
- [ ] `merchant-001-record.json` gerado
- [ ] `onboarding-results.json` sem erros

---

## 🎯 PASSO 2: Subscription → Feature Gates → UI

### 2.1 Verificar Feature Gates

```javascript
// Contexto do merchant onboarded
const context = {
  status: 'TRIAL',           // Do Stripe webhook
  tier: 'PROFESSIONAL',      // Do plano
  addons: ['RESERVATIONS'],  // Do subscription
};

// Testes
canUse('CORE_POS')        // → true (tier PROFESSIONAL)
canUse('RESERVATIONS')    // → true (addon)
canUse('MULTI_VENUE')     // → false (não tem addon)
canUse('API_ACCESS')      // → true (tier PROFESSIONAL)
```

### 2.2 Simular Mudanças de Status

| Cenário | Status | Resultado Esperado |
|---------|--------|-------------------|
| Trial normal | `TRIAL` | Todas features do tier + addons |
| Pagamento ok | `ACTIVE` | Todas features do tier + addons |
| Atraso leve | `PAST_DUE` | Continua funcionando (grace) |
| Suspenso | `SUSPENDED` | **TUDO BLOQUEADO** |
| Cancelado | `CANCELLED` | **TUDO BLOQUEADO** |

### 2.3 API Endpoints (mínimos)

```
GET  /api/subscription          → status, tier, addons
POST /api/subscription/upgrade  → mudar de plano
POST /api/subscription/addon    → adicionar addon
GET  /api/features              → lista de features permitidas
POST /api/features/check        → verificar feature específica
```

---

## 🎯 PASSO 3: Página de Gestão (Merchant-facing)

### 3.1 Elementos UI

```
┌─────────────────────────────────────────────────┐
│  💳 SUA ASSINATURA                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Plano: PROFESSIONAL          €59/mês          │
│  Status: ● TRIAL              (12 dias restam) │
│                                                 │
│  Add-ons:                                       │
│  ✅ Reservations              €19/mês          │
│                                                 │
│  Total: €78/mês                                │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Upgrade  │ │ Add-ons  │ │ Atualizar        ││
│  │  Plano   │ │          │ │  Pagamento       ││
│  └──────────┘ └──────────┘ └──────────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3.2 Ações

| Botão | Ação |
|-------|------|
| Upgrade Plano | Stripe Checkout → novo price |
| Add-ons | Modal com addons disponíveis |
| Atualizar Pagamento | Stripe Customer Portal |

---

## 🎯 PASSO 4: Payments Gateway (Só Depois)

> **QUANDO:** Apenas após merchant estar a usar o sistema

### 4.1 Merchant recebe pagamentos

```javascript
// Merchant processa venda de €45.50
const intent = await stripe.paymentIntents.create({
  amount: 4550,
  currency: 'eur',
  // Chave do MERCHANT, não do ChefI
  // Ou Stripe Connect com destination
});
```

### 4.2 Webhook do Merchant

```
Evento: payment_intent.succeeded
→ Atualizar order status
→ Emitir documento fiscal
→ Registrar no sistema
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Passo 1 — Onboarding
- [ ] Merchant no Stripe com subscription ativa
- [ ] Record persistido com IDs corretos
- [ ] Email de boas-vindas (opcional)

### Passo 2 — Feature Gates Live
- [ ] Merchant usa feature permitida → OK
- [ ] Merchant tenta feature bloqueada → Erro claro
- [ ] Webhook atualiza status em tempo real

### Passo 3 — UI Funcional
- [ ] Merchant vê seu plano
- [ ] Merchant consegue fazer upgrade
- [ ] Merchant adiciona addon

### Passo 4 — Payments
- [ ] Cliente paga no POS
- [ ] Dinheiro vai para conta do merchant
- [ ] ChefI não toca no dinheiro do cliente

---

## 🚫 NÃO FAZER AGORA

- ❌ Certificação fiscal (SAF-T, etc)
- ❌ Multi-venue / Franquias
- ❌ White-label
- ❌ Integrações externas
- ❌ App mobile nativo
- ❌ AI features

---

## 📅 TIMELINE SUGERIDA

| Dia | Tarefa |
|-----|--------|
| Hoje | Passo 1 — Onboarding primeiro merchant |
| +1 | Passo 2 — Feature Gates conectados |
| +2 | Passo 3 — UI de gestão básica |
| +7 | Passo 4 — Payments gateway (se merchant precisar) |

---

## 🎯 COMANDO PARA COMEÇAR

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

export STRIPE_SECRET_KEY=sk_test_51SgVOwEOB1Od9eibr4UEWPbWPtpXo4H2bsT9sO9bBGqz0rIJHFLZlAG8Wwe0vXp9CrPTVbHF1u1UtT3bPDcFe56B00Y0FD7n8Y

node onboard-first-merchant.js
```

---

**Pronto para executar Passo 1?**
