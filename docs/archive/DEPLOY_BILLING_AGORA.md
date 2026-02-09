# 🚀 DEPLOY BILLING — EXECUTAR AGORA

**Data:** 2026-01-18  
**Tempo estimado:** 15-20 minutos

---

## ✅ CHECKLIST RÁPIDO

### 1️⃣ Login no Supabase CLI
```bash
supabase login
```
**Aguarde:** Navegador abre → Faça login → Volta ao terminal

---

### 2️⃣ Linkar Projeto
```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase link --project-ref [SEU_PROJECT_REF]
```
**Onde encontrar project-ref:** Supabase Dashboard → Settings → General → Reference ID

---

### 3️⃣ Verificar/Criar Tabelas

**A. Verificar se existem:**
- Supabase Dashboard → SQL Editor
- Execute: `scripts/verify-billing-tables.sql`
- **Se mostrar 3 tabelas:** ✅ Pular para passo 4
- **Se mostrar menos de 3:** ⬇️ Criar tabelas

**B. Criar tabelas (se necessário):**
- SQL Editor → New query
- Abra: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
- Copie TODO o conteúdo → Cole no SQL Editor → Execute

---

### 4️⃣ Deploy Edge Functions
```bash
npx supabase functions deploy stripe-billing
npx supabase functions deploy stripe-billing-webhook
```

---

### 5️⃣ Configurar Variáveis (Supabase Dashboard)
- Edge Functions → Settings
- Adicionar:
  - `STRIPE_SECRET_KEY` = `sk_test_xxx` (Stripe Dashboard → API keys)
  - `STRIPE_BILLING_WEBHOOK_SECRET` = `whsec_xxx` (será configurado no passo 6)

---

### 6️⃣ Configurar Webhook (Stripe Dashboard)
- Developers → Webhooks → Add endpoint
- **URL:** `https://[project-ref].supabase.co/functions/v1/stripe-billing-webhook`
- **Eventos:** `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- **Copiar secret** → Voltar ao passo 5 e atualizar `STRIPE_BILLING_WEBHOOK_SECRET`

---

## 📖 DOCS COMPLETAS

- **Guia passo a passo:** `docs/audit/FASE_1_DIA1_DEPLOY_PASSO_A_PASSO.md`
- **Guia completo:** `docs/audit/FASE_1_DIA1_GUIA_COMPLETO.md`
- **Script automatizado:** `scripts/deploy-billing-phase1.sh`

---

## ✅ APÓS CONCLUIR

Execute para verificar:
```bash
npx supabase functions list
```

**Deve mostrar:** `stripe-billing` e `stripe-billing-webhook`

---

**PRÓXIMO:** Dia 2 — Testes manuais
