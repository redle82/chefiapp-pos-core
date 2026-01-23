# FASE 1 — DIA 1 — RESUMO EXECUTIVO

**Data:** 2026-01-18  
**Status:** 🟡 Aguardando execução

---

## 🎯 OBJETIVO

Deploy completo do billing: tabelas, Edge Functions, variáveis, webhook.

---

## 📋 CHECKLIST RÁPIDO

### 1. Tabelas (Supabase Dashboard)
- [ ] Executar `scripts/verify-billing-tables.sql`
- [ ] Se não existirem, executar migration `20260130000000_create_billing_core_tables.sql`

### 2. Supabase CLI
- [ ] `supabase login`
- [ ] `supabase link --project-ref [ref]` (se necessário)

### 3. Deploy Edge Functions
- [ ] `npx supabase functions deploy stripe-billing`
- [ ] `npx supabase functions deploy stripe-billing-webhook`

### 4. Variáveis (Supabase Dashboard)
- [ ] `STRIPE_SECRET_KEY` → sk_test_xxx
- [ ] `STRIPE_BILLING_WEBHOOK_SECRET` → whsec_xxx (após PASSO 6)

### 5. Webhook (Stripe Dashboard)
- [ ] Criar endpoint: `https://[projeto].supabase.co/functions/v1/stripe-billing-webhook`
- [ ] Selecionar eventos
- [ ] Copiar secret → adicionar em `STRIPE_BILLING_WEBHOOK_SECRET`

### 6. Frontend (.env)
- [ ] `merchant-portal/.env.local` → `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx`

### 7. Smoke Test
- [ ] Testar Edge Function manualmente
- [ ] Verificar logs

---

## 📖 DOCUMENTAÇÃO COMPLETA

**Guia detalhado:** `docs/audit/FASE_1_DIA1_GUIA_COMPLETO.md`

---

## ⏱️ TEMPO ESTIMADO

- **Tabelas:** 10 minutos
- **CLI Setup:** 5 minutos
- **Deploy Functions:** 10 minutos
- **Variáveis:** 5 minutos
- **Webhook:** 15 minutos
- **Frontend:** 5 minutos
- **Smoke Test:** 10 minutos

**Total:** ~60 minutos

---

**RESUMO CRIADO:** 2026-01-18
