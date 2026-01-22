# ⚡ Quick Start — Finalizar FASE 1 (Billing)

**Tempo:** 2-3 horas  
**Objetivo:** Desbloquear vendas self-service

---

## 🎯 O Que Fazer Agora

### Passo 1: Executar Migration (15 min)

1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Abra arquivo: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
3. Copie e cole o conteúdo completo
4. Execute a query
5. Verifique se funcionou:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('subscriptions', 'billing_events', 'billing_payments');
   ```
   **Resultado esperado:** 3 linhas

---

### Passo 2: Deploy Edge Functions (15 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy cada função
npx supabase functions deploy create-subscription
npx supabase functions deploy update-subscription-status
npx supabase functions deploy cancel-subscription
npx supabase functions deploy change-plan

# Verificar
npx supabase functions list
```

**Resultado esperado:** 4 funções listadas

---

### Passo 3: Configurar Variáveis (10 min)

#### Supabase Dashboard (Edge Functions)

1. **Project Settings** → **Edge Functions** → **Secrets**
2. Adicionar:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   ```
   (Use `sk_live_xxx` em produção)

#### Frontend (.env)

1. Criar/editar `.env` em `merchant-portal/`
2. Adicionar:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```
   (Use `pk_live_xxx` em produção)

---

### Passo 4: Testes Manuais (1-2 horas)

Seguir `PHASE_1_VERIFICATION_GUIDE.md`:

#### Teste 1: Fluxo Trial (20 min)
1. Criar novo restaurante
2. Completar onboarding
3. Selecionar plano STARTER
4. Clicar "Começar Trial"
5. Verificar redirecionamento para `/onboarding/trial-start`
6. Verificar subscription no banco:
   ```sql
   SELECT * FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
   ```
   **Esperado:** Status = `TRIAL`, `trial_ends_at` definido

#### Teste 2: Fluxo Pago (30 min)
1. Criar novo restaurante
2. Selecionar plano PROFESSIONAL
3. Clicar "Pagar Agora"
4. Preencher cartão de teste:
   - Número: `4242 4242 4242 4242`
   - CVC: `123`
   - Data: Qualquer data futura
5. Confirmar pagamento
6. Verificar subscription:
   ```sql
   SELECT status FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
   ```
   **Esperado:** Status = `ACTIVE`

#### Teste 3: Bloqueio sem Subscription (10 min)
1. Criar restaurante sem subscription
2. Tentar acessar `/app/tpv`
3. **Esperado:** Redirecionamento para `/onboarding/billing`

#### Teste 4: Bloqueio com SUSPENDED (10 min)
1. Atualizar subscription para SUSPENDED:
   ```sql
   UPDATE subscriptions 
   SET status = 'SUSPENDED' 
   WHERE restaurant_id = '<restaurant_id>';
   ```
2. Tentar acessar `/app/tpv`
3. **Esperado:** Redirecionamento para `/onboarding/billing`

#### Teste 5: Cancelamento (20 min)
1. Acessar `/app/settings/billing`
2. Clicar "Cancelar Assinatura"
3. Confirmar
4. Verificar status:
   ```sql
   SELECT status FROM subscriptions WHERE restaurant_id = '<restaurant_id>';
   ```
   **Esperado:** Status = `CANCELLED`

---

## ✅ Critérios de Sucesso

FASE 1 está completa quando:

- [x] Código implementado ✅
- [ ] Migration executada
- [ ] Edge Functions deployadas
- [ ] Variáveis configuradas
- [ ] Teste 1 passando (Trial)
- [ ] Teste 2 passando (Pago)
- [ ] Teste 3 passando (Bloqueio sem subscription)
- [ ] Teste 4 passando (Bloqueio SUSPENDED)
- [ ] Teste 5 passando (Cancelamento)

---

## 🐛 Troubleshooting

### Erro: "relation subscriptions does not exist"
**Solução:** Executar migration (Passo 1)

### Erro: "Function not found"
**Solução:** Deploy Edge Functions (Passo 2)

### Erro: "Stripe API error"
**Solução:** Verificar `STRIPE_SECRET_KEY` configurado (Passo 3)

### Erro: "Stripe Elements not loading"
**Solução:** Verificar `VITE_STRIPE_PUBLISHABLE_KEY` no `.env` (Passo 3)

---

## 📚 Documentação Completa

- **Guia Detalhado:** `PHASE_1_VERIFICATION_GUIDE.md`
- **Guia de Deploy:** `PHASE_1_DEPLOYMENT_GUIDE.md`
- **Status Final:** `PHASE_1_FINAL_VERIFICATION.md`

---

## 🎯 Resultado Final

Após completar todos os passos:

- ✅ ChefIApp pode ser vendido self-service
- ✅ Trial automático funcionando
- ✅ Checkout Stripe funcionando
- ✅ Bloqueio sem plano funcionando
- ✅ Cancelamento funcionando

**Status:** MVP Comercial completo 🎉

---

**Última atualização:** 2026-01-30
