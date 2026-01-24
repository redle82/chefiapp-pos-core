# FASE 1 — DIA 1 — DEPLOY PASSO A PASSO

**Data:** 2026-01-18  
**Status:** 🟡 Guia de execução

---

## 🎯 OBJETIVO

Deploy completo do billing em produção.

---

## 📋 EXECUÇÃO PASSO A PASSO

### ✅ PASSO 1: Login no Supabase CLI

**No terminal, execute:**
```bash
supabase login
```

**O que acontece:**
- Abre navegador para autenticação
- Após login, volta ao terminal automaticamente

**Verificar se funcionou:**
```bash
supabase projects list
```

**✅ Deve mostrar:** Lista de projetos do Supabase

---

### ✅ PASSO 2: Linkar Projeto

**Verificar se já está linkado:**
```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase status
```

**Se mostrar erro "not linked":**

1. **Encontrar project-ref:**
   - Abra: https://supabase.com/dashboard
   - Vá em: Settings → General
   - Copie o "Reference ID"

2. **Linkar:**
   ```bash
   supabase link --project-ref [COLE_O_REF_AQUI]
   ```

**✅ Deve mostrar:** Status do projeto linkado

---

### ✅ PASSO 3: Verificar/Criar Tabelas

**Opção A: Verificar se já existem**

1. Abra: Supabase Dashboard → SQL Editor
2. Cole e execute:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');
   ```

**Resultado esperado:**
- ✅ 3 linhas = tabelas existem → Pular para PASSO 4
- ❌ 0 linhas ou menos de 3 = criar tabelas

---

**Opção B: Criar tabelas (se não existirem)**

1. Abra: Supabase Dashboard → SQL Editor
2. Abra arquivo: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Execute
6. Verifique novamente (Opção A)

**✅ Deve mostrar:** 3 tabelas criadas

---

### ✅ PASSO 4: Deploy Edge Functions

**Após concluir passos 1-3, execute:**

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy stripe-billing
npx supabase functions deploy stripe-billing

# Deploy stripe-billing-webhook
npx supabase functions deploy stripe-billing-webhook
```

**✅ Deve mostrar:** "Deployed Function stripe-billing" e "Deployed Function stripe-billing-webhook"

---

### ✅ PASSO 5: Configurar Variáveis de Ambiente

**No Supabase Dashboard:**

1. Vá em: Edge Functions → Settings
2. Adicione variáveis:

   **STRIPE_SECRET_KEY**
   - Valor: `sk_test_xxx` (ou `sk_live_xxx` em produção)
   - Onde encontrar: Stripe Dashboard → Developers → API keys

   **STRIPE_BILLING_WEBHOOK_SECRET**
   - Valor: `whsec_xxx` (será configurado no PASSO 6)
   - Por enquanto, deixe vazio ou use um valor temporário

**✅ Deve mostrar:** Variáveis salvas

---

### ✅ PASSO 6: Configurar Webhook no Stripe

**No Stripe Dashboard:**

1. Vá em: Developers → Webhooks
2. Clique: "Add endpoint"
3. **URL do endpoint:**
   ```
   https://[seu-project-ref].supabase.co/functions/v1/stripe-billing-webhook
   ```
   - Substitua `[seu-project-ref]` pelo seu project-ref
   - Exemplo: `https://abcdefghijklmnop.supabase.co/functions/v1/stripe-billing-webhook`

4. **Eventos para escutar:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Clique: "Add endpoint"
6. **Copie o "Signing secret":**
   - Formato: `whsec_xxx`
   - Volte ao PASSO 5 e atualize `STRIPE_BILLING_WEBHOOK_SECRET`

**✅ Deve mostrar:** Webhook criado e secret copiado

---

### ✅ PASSO 7: Verificar Deploy

**Listar functions deployadas:**
```bash
npx supabase functions list
```

**✅ Deve mostrar:** `stripe-billing` e `stripe-billing-webhook` na lista

---

## 🎉 CONCLUSÃO

**Deploy concluído quando:**
- ✅ Tabelas criadas (3)
- ✅ Edge Functions deployadas (2)
- ✅ Variáveis configuradas (2)
- ✅ Webhook configurado no Stripe

---

## 📖 DOCUMENTAÇÃO RELACIONADA

- Guia completo: `docs/audit/FASE_1_DIA1_GUIA_COMPLETO.md`
- Script automatizado: `scripts/deploy-billing-phase1.sh`
- Verificação de tabelas: `scripts/verify-billing-tables.sql`

---

**PRÓXIMO:** Após concluir todos os passos, seguir para Dia 2 (testes manuais)
