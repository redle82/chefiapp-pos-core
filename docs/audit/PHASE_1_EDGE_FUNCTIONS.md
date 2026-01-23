# 🔧 FASE 1 — Edge Functions Criadas

**Data:** 2026-01-30  
**Status:** ✅ **CRIADAS**

---

## Edge Functions Implementadas

### 1. create-subscription ✅

**Arquivo:** `supabase/functions/create-subscription/index.ts`

**Funcionalidades:**
- Autentica usuário
- Verifica se é owner do restaurante
- Verifica se já existe subscription
- Busca plano (STARTER, PROFESSIONAL, ENTERPRISE)
- Cria subscription na tabela `subscriptions`
- Emite evento na tabela `billing_events`
- Se não for trial, cria PaymentIntent no Stripe e retorna `client_secret`

**Endpoint:** `POST /functions/v1/create-subscription`

**Body:**
```json
{
  "restaurant_id": "uuid",
  "plan_id": "plan_starter_v1 | plan_professional_v1 | plan_enterprise_v1",
  "start_trial": true | false
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { ... },
  "client_secret": "pi_xxx_secret_xxx" | null,
  "next_step": "TRIAL_STARTED" | "CONFIGURE_PAYMENT_METHOD"
}
```

**Deploy:**
```bash
npx supabase functions deploy create-subscription
```

---

### 2. update-subscription-status ✅

**Arquivo:** `supabase/functions/update-subscription-status/index.ts`

**Funcionalidades:**
- Autentica usuário
- Verifica se é owner do restaurante
- Busca subscription
- Atualiza status (ACTIVE, SUSPENDED, CANCELLED, etc.)
- Se status é ACTIVE e tinha TRIAL, atualiza datas
- Se `payment_intent_id` fornecido, busca informações do Stripe
- Emite evento na tabela `billing_events`

**Endpoint:** `POST /functions/v1/update-subscription-status`

**Body:**
```json
{
  "restaurant_id": "uuid",
  "subscription_id": "uuid" (opcional),
  "status": "ACTIVE" | "SUSPENDED" | "CANCELLED",
  "payment_intent_id": "pi_xxx" (opcional)
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { ... }
}
```

**Deploy:**
```bash
npx supabase functions deploy update-subscription-status
```

---

## Dependências

### Tabelas Necessárias

1. **subscriptions** (billing-core/event-store.ts)
   - Deve existir no banco
   - Campos: subscription_id, restaurant_id, plan_id, plan_tier, status, trial_ends_at, etc.

2. **billing_events** (billing-core/event-store.ts)
   - Deve existir no banco
   - Campos: event_id, type, subscription_id, restaurant_id, occurred_at, payload, metadata

### Variáveis de Ambiente

**Edge Functions:**
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase

**Frontend:**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe

---

## Próximos Passos

1. ✅ **Deploy das Edge Functions**
   ```bash
   npx supabase functions deploy create-subscription
   npx supabase functions deploy update-subscription-status
   ```

2. ✅ **Verificar/Criar Tabelas**
   - Executar SQL de `billing-core/event-store.ts` (BILLING_SCHEMA_SQL)
   - Verificar RLS policies

3. ✅ **Configurar Variáveis de Ambiente**
   - Configurar `STRIPE_SECRET_KEY` no Supabase Dashboard
   - Configurar `VITE_STRIPE_PUBLISHABLE_KEY` no frontend

4. ✅ **Testar Fluxo Completo**
   - Testar criação de subscription (trial)
   - Testar criação de subscription (pago)
   - Testar atualização de status

---

## Notas de Implementação

### Planos Hardcoded

Os planos estão hardcoded na Edge Function `create-subscription`. Em produção, considere:
- Buscar planos do banco de dados
- Ou usar constantes compartilhadas

### PaymentIntent vs Subscription

Atualmente, a Edge Function cria um `PaymentIntent` para o primeiro pagamento. Em produção, considere:
- Criar uma `Subscription` no Stripe
- Sincronizar com webhooks do Stripe

### Segurança

- ✅ Verificação de autenticação
- ✅ Verificação de ownership (owner_id)
- ✅ Validação de entrada
- ⚠️ RLS policies devem estar configuradas nas tabelas

---

**Status:** Edge Functions criadas e prontas para deploy ✅
