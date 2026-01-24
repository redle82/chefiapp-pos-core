# ✅ FASE 1 — Guia de Verificação e Testes

**Data:** 2026-01-30  
**Status:** 🟡 **85% COMPLETO** - Pronto para verificação e testes

---

## 📋 Checklist de Verificação

### 1. Verificar Banco de Dados

#### Tabelas Necessárias

Execute no Supabase SQL Editor:

```sql
-- Verificar se tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');

-- Resultado esperado: 3 linhas
```

#### Verificar Estrutura da Tabela `subscriptions`

```sql
-- Verificar colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Colunas esperadas:
-- subscription_id (uuid)
-- restaurant_id (uuid)
-- plan_id (text)
-- plan_tier (text)
-- status (text)
-- trial_ends_at (timestamp)
-- current_period_start (timestamp)
-- current_period_end (timestamp)
-- next_payment_at (timestamp)
-- enabled_features (text[])
-- max_terminals (integer)
-- max_tables (integer)
```

#### Verificar RLS Policies

```sql
-- Verificar policies
SELECT * FROM pg_policies 
WHERE tablename IN ('subscriptions', 'billing_events', 'billing_payments');

-- Deve ter pelo menos:
-- - SELECT policy para restaurant owners
-- - INSERT policy para restaurant owners
-- - UPDATE policy para restaurant owners
```

---

### 2. Verificar Edge Functions

#### Listar Funções Deployadas

```bash
npx supabase functions list
```

**Resultado esperado:**
- `create-subscription`
- `update-subscription-status`
- `cancel-subscription`
- `change-plan`

#### Verificar Variáveis de Ambiente

No Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- ✅ `STRIPE_SECRET_KEY` (obrigatório)
- ✅ `SUPABASE_URL` (automático)
- ✅ `SUPABASE_ANON_KEY` (automático)

---

### 3. Verificar Frontend

#### Variáveis de Ambiente

No arquivo `.env` do `merchant-portal`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Verificar se está sendo usada:**

```typescript
// merchant-portal/src/pages/Onboarding/CheckoutStep.tsx
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
```

#### Componentes Criados

Verificar se existem:

- ✅ `merchant-portal/src/pages/Onboarding/BillingStep.tsx`
- ✅ `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`
- ✅ `merchant-portal/src/pages/Onboarding/TrialStart.tsx`
- ✅ `merchant-portal/src/hooks/useSubscription.ts`

#### Rotas Configuradas

Verificar em `merchant-portal/src/App.tsx`:

```typescript
// Deve ter rotas:
<Route path="/onboarding/billing" element={<BillingStep />} />
<Route path="/onboarding/checkout" element={<CheckoutStep />} />
<Route path="/onboarding/trial-start" element={<TrialStart />} />
```

---

## 🧪 Testes Manuais

### Teste 1: Fluxo Trial Completo

**Objetivo:** Verificar se trial é criado corretamente

**Passos:**
1. Criar novo restaurante (ou usar restaurante sem subscription)
2. Completar onboarding básico
3. Ser redirecionado para `/onboarding/billing`
4. Selecionar plano STARTER
5. Clicar em "Começar Trial"
6. Verificar se redireciona para `/onboarding/trial-start`
7. Verificar se subscription foi criada no banco:

```sql
SELECT * FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
```

**Resultado esperado:**
- Status: `TRIAL`
- `trial_ends_at` definido (14 dias no futuro)
- `enabled_features` contém features do plano

---

### Teste 2: Fluxo Pago Completo

**Objetivo:** Verificar se checkout funciona

**Passos:**
1. Criar novo restaurante
2. Completar onboarding básico
3. Selecionar plano PROFESSIONAL
4. Clicar em "Pagar Agora"
5. Preencher cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - CVC: Qualquer 3 dígitos
   - Data: Qualquer data futura
6. Confirmar pagamento
7. Verificar se subscription foi ativada:

```sql
SELECT status, enabled_features FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
```

**Resultado esperado:**
- Status: `ACTIVE`
- `enabled_features` contém features do plano PROFESSIONAL

---

### Teste 3: Bloqueio sem Subscription

**Objetivo:** Verificar se `RequireActivation` bloqueia corretamente

**Passos:**
1. Criar restaurante sem subscription
2. Tentar acessar `/app/tpv` diretamente
3. Verificar se redireciona para `/onboarding/billing`

**Resultado esperado:**
- Redirecionamento para billing
- Mensagem de erro ou bloqueio visível

---

### Teste 4: Bloqueio com Subscription SUSPENDED

**Objetivo:** Verificar bloqueio de subscription suspensa

**Passos:**
1. Criar subscription com status `TRIAL`
2. Atualizar manualmente para `SUSPENDED`:

```sql
UPDATE subscriptions 
SET status = 'SUSPENDED' 
WHERE restaurant_id = '<restaurant_id>';
```

3. Tentar acessar `/app/tpv`
4. Verificar redirecionamento

**Resultado esperado:**
- Redirecionamento para `/onboarding/billing`
- Mensagem indicando subscription suspensa

---

### Teste 5: Cancelamento

**Objetivo:** Verificar se cancelamento funciona

**Passos:**
1. Acessar `/app/settings/billing` (ou página de billing)
2. Clicar em "Cancelar Assinatura"
3. Confirmar cancelamento
4. Verificar status no banco:

```sql
SELECT status FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
```

**Resultado esperado:**
- Status: `CANCELLED`
- Evento criado em `billing_events`

---

## 🔍 Verificações de Código

### 1. Verificar Integração BillingStep → Edge Function

**Arquivo:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx`

```typescript
// Linha ~67: Deve chamar create-subscription
const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: {
        restaurant_id: restaurantId,
        plan_id: selectedPlan,
        start_trial: true,
    }
});
```

✅ **Verificar:** Código está correto

---

### 2. Verificar Integração CheckoutStep → Edge Function

**Arquivo:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`

```typescript
// Linha ~79: Deve chamar update-subscription-status
const { data, error } = await supabase.functions.invoke('update-subscription-status', {
    body: {
        restaurant_id: restaurantId,
        subscription_id: subscription?.subscription_id,
        status: 'ACTIVE',
        payment_intent_id: paymentIntent.id,
    }
});
```

✅ **Verificar:** Código está correto

---

### 3. Verificar RequireActivation

**Arquivo:** `merchant-portal/src/core/activation/RequireActivation.tsx`

```typescript
// Linha ~56: Deve verificar subscription
const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('restaurant_id', restaurant.id)
    .single();

// Linha ~77: Deve bloquear se SUSPENDED ou CANCELLED
const hasValidSubscription = subscriptionStatus === 'TRIAL' || subscriptionStatus === 'ACTIVE';
const isBlockedBySubscription = subscriptionStatus === 'SUSPENDED' || subscriptionStatus === 'CANCELLED';
```

✅ **Verificar:** Código está correto

---

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: Edge Function retorna 401

**Sintoma:** `User not authenticated`

**Solução:**
- Verificar se usuário está logado
- Verificar se `Authorization` header está sendo enviado
- Verificar se `SUPABASE_ANON_KEY` está configurado

---

### Problema 2: Tabela `subscriptions` não existe

**Sintoma:** `relation "subscriptions" does not exist`

**Solução:**
1. Executar migration:
```bash
# Via Supabase Dashboard → SQL Editor
# Copiar conteúdo de: supabase/migrations/20260130000000_create_billing_core_tables.sql
```

---

### Problema 3: Stripe retorna erro

**Sintoma:** `No such customer` ou erro de API

**Solução:**
- Verificar se `STRIPE_SECRET_KEY` está configurado corretamente
- Verificar se está usando chave de teste (`sk_test_`) ou produção (`sk_live_`)
- Verificar se chave corresponde ao ambiente (teste vs produção)

---

### Problema 4: RLS bloqueia acesso

**Sintoma:** `new row violates row-level security policy`

**Solução:**
1. Verificar policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

2. Se não existir, criar policy:
```sql
-- Permitir SELECT para owners
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (restaurant_id IN (
    SELECT id FROM gm_restaurants WHERE owner_id = auth.uid()
));

-- Permitir INSERT para owners
CREATE POLICY "Users can create own subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (restaurant_id IN (
    SELECT id FROM gm_restaurants WHERE owner_id = auth.uid()
));
```

---

## ✅ Critérios de Sucesso

A FASE 1 está **100% completa** quando:

1. ✅ Tabelas criadas no banco
2. ✅ Edge Functions deployadas
3. ✅ Variáveis de ambiente configuradas
4. ✅ Fluxo trial funciona end-to-end
5. ✅ Fluxo pago funciona end-to-end
6. ✅ Bloqueio sem subscription funciona
7. ✅ Bloqueio com SUSPENDED funciona
8. ✅ Cancelamento funciona
9. ✅ Upgrade/downgrade funciona (se implementado)

---

## 📊 Status Atual

| Item | Status | Notas |
|------|--------|-------|
| Tabelas DB | 🟡 | Verificar se migration foi executada |
| Edge Functions | 🟡 | Verificar se foram deployadas |
| Variáveis Env | 🟡 | Verificar configuração |
| Frontend | ✅ | Código completo |
| Integração | ✅ | Código completo |
| Testes | 🔴 | Pendente testes manuais |

---

## 🚀 Próximos Passos

1. **Executar migration** (se não foi executada)
2. **Deploy Edge Functions** (se não foram deployadas)
3. **Configurar variáveis de ambiente**
4. **Executar testes manuais** (Teste 1-5)
5. **Corrigir problemas encontrados**
6. **Marcar FASE 1 como 100% completa**

---

**Última atualização:** 2026-01-30
