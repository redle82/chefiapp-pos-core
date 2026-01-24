# 🎯 FASE 1 — Próximos Passos Imediatos

**Data:** 2026-01-30  
**Status Atual:** 40% completo  
**Próximo:** Criar Edge Functions e finalizar integração

---

## 🔴 Pendências Críticas (Bloqueadores)

### 1. Edge Function: create-subscription

**Arquivo:** `supabase/functions/create-subscription/index.ts` (NOVO)

**Funcionalidade:**
- Recebe `restaurant_id`, `plan_id`, `start_trial`
- Chama `RestaurantOnboardingService.createSubscription()`
- Retorna subscription criada + `client_secret` (se não trial)

**Código base:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { RestaurantOnboardingService } from '../../../billing-core/onboarding'

serve(async (req) => {
  // Autenticar usuário
  // Verificar se é owner do restaurante
  // Chamar RestaurantOnboardingService.createSubscription()
  // Retornar subscription + client_secret
})
```

**Tempo estimado:** 2-3 horas

---

### 2. Edge Function: update-subscription-status

**Arquivo:** `supabase/functions/update-subscription-status/index.ts` (NOVO)

**Funcionalidade:**
- Recebe `restaurant_id`, `subscription_id`, `status`
- Atualiza subscription no banco
- Emite evento de billing

**Tempo estimado:** 1-2 horas

---

### 3. Verificar/Criar Tabela subscriptions

**Ação:**
- Verificar se tabela `subscriptions` existe
- Se não existir, executar SQL de `billing-core/event-store.ts` (BILLING_SCHEMA_SQL)
- Verificar RLS policies

**Tempo estimado:** 30 minutos

---

### 4. Configurar Variáveis de Ambiente

**Variáveis necessárias:**
- `VITE_STRIPE_PUBLISHABLE_KEY` (frontend)
- `STRIPE_SECRET_KEY` (Edge Functions)
- `STRIPE_WEBHOOK_SECRET` (Edge Functions)

**Tempo estimado:** 15 minutos

---

## 🟡 Pendências Não-Bloqueadoras

### 5. Atualizar BillingPage.tsx

**Funcionalidades:**
- Mostrar subscription atual (usar `useSubscription`)
- Botão "Cancelar Assinatura"
- Botão "Upgrade" / "Downgrade"
- Integração com Stripe Customer Portal

**Tempo estimado:** 2-3 horas

---

### 6. Feature Gates para PAST_DUE

**Funcionalidade:**
- Bloquear Analytics Pro, API Access quando `PAST_DUE`
- Implementar em `FeatureGateService` ou criar guard específico

**Tempo estimado:** 1 hora

---

## 📋 Ordem de Execução Recomendada

### Hoje (4-5 horas)
1. ✅ Criar Edge Function `create-subscription` (2-3h)
2. ✅ Criar Edge Function `update-subscription-status` (1-2h)
3. ✅ Verificar/criar tabela `subscriptions` (30min)
4. ✅ Configurar variáveis de ambiente (15min)

### Amanhã (2-3 horas)
5. ✅ Testar fluxo completo (trial)
6. ✅ Testar fluxo completo (pago)
7. ✅ Testar bloqueio sem plano
8. ✅ Ajustes e correções

### Esta Semana (2-3 horas)
9. ✅ Atualizar BillingPage.tsx
10. ✅ Implementar feature gates para PAST_DUE
11. ✅ Testes finais

---

## 🧪 Checklist de Testes

### Teste 1: Trial Flow
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (trial)
- [ ] Verificar subscription criada (status = TRIAL)
- [ ] Acessar TPV (deve funcionar)

### Teste 2: Paid Flow
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (pagar agora)
- [ ] Configurar pagamento (Stripe)
- [ ] Verificar subscription ACTIVE
- [ ] Acessar TPV (deve funcionar)

### Teste 3: Blocked Access
- [ ] Criar subscription SUSPENDED manualmente
- [ ] Tentar acessar TPV
- [ ] Verificar redirecionamento para `/onboarding/billing`

---

## 📊 Progresso Esperado

**Hoje:** 40% → 70% (após criar Edge Functions)  
**Amanhã:** 70% → 90% (após testes)  
**Esta Semana:** 90% → 100% (após BillingPage e feature gates)

---

**Próximo passo imediato:** Criar Edge Function `create-subscription`
