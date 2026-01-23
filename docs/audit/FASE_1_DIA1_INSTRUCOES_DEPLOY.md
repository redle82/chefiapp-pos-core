# FASE 1 — DIA 1 — INSTRUÇÕES DE DEPLOY

**Data:** 2026-01-18  
**Status:** 🟡 Aguardando execução manual

---

## 🎯 OBJETIVO

Deploy completo do billing: tabelas, Edge Functions, variáveis, webhook.

---

## 📋 CHECKLIST DE EXECUÇÃO

### ✅ PASSO 1: Login no Supabase CLI

**Execute no terminal:**
```bash
supabase login
```

**Verificar:**
```bash
supabase projects list
```

**Status:** ⏳ Aguardando execução

---

### ✅ PASSO 2: Linkar Projeto

**Verificar:**
```bash
supabase status
```

**Se não estiver linkado:**
```bash
supabase link --project-ref [SEU_PROJECT_REF]
```

**Status:** ⏳ Aguardando execução

---

### ✅ PASSO 3: Verificar/Criar Tabelas

**Ação manual no Supabase Dashboard:**
1. SQL Editor → New query
2. Executar: `scripts/verify-billing-tables.sql`
3. **Informar resultado:**
   - ✅ 3 tabelas existem
   - ❌ Tabelas não existem (executar migration)

**Status:** ⏳ Aguardando verificação

---

### ⏳ PASSO 4: Deploy Edge Functions

**Aguardando conclusão dos passos 1-3**

**Comandos (após login e link):**
```bash
npx supabase functions deploy stripe-billing
npx supabase functions deploy stripe-billing-webhook
```

---

### ⏳ PASSO 5: Configurar Variáveis

**Aguardando deploy das functions**

**No Supabase Dashboard:**
- Edge Functions → Settings
- Adicionar: `STRIPE_SECRET_KEY`, `STRIPE_BILLING_WEBHOOK_SECRET`

---

### ⏳ PASSO 6: Configurar Webhook

**Aguardando variáveis configuradas**

**No Stripe Dashboard:**
- Webhooks → Add endpoint
- URL: `https://[projeto].supabase.co/functions/v1/stripe-billing-webhook`

---

## 🚀 COMO PROCEDER

**Opção A: Executar manualmente**
- Siga o checklist acima passo a passo
- Me informe quando concluir cada passo

**Opção B: Executar script automatizado**
```bash
./scripts/deploy-billing-phase1.sh
```
- O script guia você pelos passos manuais
- Depois executa os comandos automatizados

---

**AGUARDANDO:** Execução dos passos manuais (1-3)
