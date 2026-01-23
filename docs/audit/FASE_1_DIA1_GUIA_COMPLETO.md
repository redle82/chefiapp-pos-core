# FASE 1 — DIA 1 — GUIA COMPLETO DE EXECUÇÃO

**Data:** 2026-01-18  
**Status:** 🟡 Em execução  
**Tempo estimado:** 2-3 horas

---

## 🎯 OBJETIVO DO DIA 1

1. ✅ Verificar/Criar tabelas de billing no banco
2. ✅ Deploy das Edge Functions
3. ✅ Configurar variáveis de ambiente
4. ✅ Configurar webhook no Stripe Dashboard
5. ✅ Smoke test básico

---

## 📋 PASSO 1: Verificar Tabelas no Banco

### Ação: Executar no Supabase Dashboard

1. **Abrir Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecionar seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor
   - "New query"

3. **Executar Script de Verificação**
   - Abrir: `scripts/verify-billing-tables.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor
   - Clicar em "Run"

4. **Interpretar Resultado:**
   - **Se ver 3 linhas com `✅ EXISTE`** → Tabelas já existem, pular para PASSO 2
   - **Se ver menos de 3 linhas** → Tabelas não existem, executar migration

### Se Tabelas NÃO Existem:

1. **Abrir Migration**
   - Arquivo: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
   - Copiar TODO o conteúdo

2. **Executar no SQL Editor**
   - Colar no SQL Editor
   - Clicar em "Run"
   - Verificar se não há erros

3. **Verificar Novamente**
   - Executar `scripts/verify-billing-tables.sql` novamente
   - Confirmar que 3 tabelas existem

**✅ Marcar quando concluído:**
- [ ] Tabelas verificadas
- [ ] Migration executada (se necessário)
- [ ] 3 tabelas confirmadas: `subscriptions`, `billing_events`, `billing_payments`

---

## 📋 PASSO 2: Login no Supabase CLI

### Ação: Executar no Terminal

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase login
```

**O que acontece:**
- Abre navegador para autenticação
- Após login, volta ao terminal

**Verificar:**
```bash
supabase projects list
```

**✅ Marcar quando concluído:**
- [ ] Login realizado
- [ ] Projeto listado corretamente

---

## 📋 PASSO 3: Linkar Projeto (Se Necessário)

### Ação: Executar no Terminal

```bash
# Se projeto não estiver linkado
supabase link --project-ref [SEU_PROJECT_REF]
```

**Como encontrar project-ref:**
- Supabase Dashboard → Settings → General → Reference ID

**Verificar:**
```bash
supabase status
```

**✅ Marcar quando concluído:**
- [ ] Projeto linkado
- [ ] Status mostra projeto correto

---

## 📋 PASSO 4: Deploy Edge Functions

### Ação: Executar no Terminal

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy stripe-billing
npx supabase functions deploy stripe-billing

# Deploy stripe-billing-webhook
npx supabase functions deploy stripe-billing-webhook
```

**O que esperar:**
- Build da função
- Upload para Supabase
- Mensagem de sucesso

**Verificar:**
```bash
npx supabase functions list
```

**✅ Marcar quando concluído:**
- [ ] `stripe-billing` deployado sem erros
- [ ] `stripe-billing-webhook` deployado sem erros
- [ ] Functions aparecem na lista

---

## 📋 PASSO 5: Configurar Variáveis de Ambiente

### Ação: Executar no Supabase Dashboard

1. **Abrir Edge Functions Settings**
   - Supabase Dashboard → Edge Functions → Settings
   - Ou: Settings → Edge Functions

2. **Adicionar Variáveis:**
   - `STRIPE_SECRET_KEY` → Sua API key do Stripe (sk_test_xxx ou sk_live_xxx)
   - `STRIPE_BILLING_WEBHOOK_SECRET` → Webhook secret (será configurado no PASSO 6)
   
   **Nota:** A Edge Function usa `STRIPE_BILLING_WEBHOOK_SECRET` (não `STRIPE_WEBHOOK_SECRET`)

**Como obter:**
- Stripe Dashboard → Developers → API keys
- `STRIPE_SECRET_KEY` → Secret key (sk_test_xxx ou sk_live_xxx)

**✅ Marcar quando concluído:**
- [ ] `STRIPE_SECRET_KEY` configurada
- [ ] `STRIPE_BILLING_WEBHOOK_SECRET` será configurada no PASSO 6

---

## 📋 PASSO 6: Configurar Webhook no Stripe Dashboard

### Ação: Executar no Stripe Dashboard

1. **Abrir Stripe Dashboard**
   - https://dashboard.stripe.com
   - Developers → Webhooks

2. **Criar Novo Endpoint**
   - "Add endpoint"
   - URL: `https://[seu-projeto].supabase.co/functions/v1/stripe-billing-webhook`
   - Como encontrar URL:
     - Supabase Dashboard → Edge Functions → `stripe-billing-webhook` → URL

3. **Selecionar Eventos:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

4. **Copiar Webhook Secret**
   - Após criar, copiar "Signing secret" (whsec_xxx)
   - Adicionar no Supabase Dashboard como `STRIPE_BILLING_WEBHOOK_SECRET`

**✅ Marcar quando concluído:**
- [ ] Webhook criado no Stripe
- [ ] Eventos selecionados
- [ ] Webhook secret copiado
- [ ] Variáveis configuradas no Supabase

---

## 📋 PASSO 7: Configurar Frontend (.env)

### Ação: Editar Arquivo

**Arquivo:** `merchant-portal/.env.local` (criar se não existir)

**Adicionar:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Nota:** O `.env.example` tem `VITE_STRIPE_PK`, mas o código usa `VITE_STRIPE_PUBLISHABLE_KEY`. Use `VITE_STRIPE_PUBLISHABLE_KEY`.

**Como obter:**
- Stripe Dashboard → Developers → API keys
- `VITE_STRIPE_PUBLISHABLE_KEY` → Publishable key (pk_test_xxx ou pk_live_xxx)

**Verificar:**
- Arquivo existe
- Variável adicionada
- Sem espaços extras

**✅ Marcar quando concluído:**
- [ ] `.env` atualizado
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configurada

---

## 📋 PASSO 8: Smoke Test Básico

### Ação: Testar Edge Function Manualmente

**Teste 1: Verificar se Edge Function responde**

```bash
curl -X POST https://[seu-projeto].supabase.co/functions/v1/stripe-billing \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

**O que esperar:**
- Resposta (mesmo que erro de autenticação, significa que função está rodando)

**Teste 2: Verificar logs**

- Supabase Dashboard → Edge Functions → `stripe-billing` → Logs
- Verificar se não há erros críticos

**✅ Marcar quando concluído:**
- [ ] Edge Function responde
- [ ] Logs não mostram erros críticos

---

## ✅ CHECKLIST FINAL DO DIA 1

- [ ] Tabelas verificadas/criadas
- [ ] Supabase CLI logado e linkado
- [ ] Edge Functions deployadas
- [ ] Variáveis de ambiente configuradas (Supabase)
- [ ] Webhook configurado no Stripe
- [ ] Frontend `.env` configurado
- [ ] Smoke test básico passou

---

## 🚨 TROUBLESHOOTING

### Erro: "Access token not provided"
**Solução:** Executar `supabase login`

### Erro: "Project not linked"
**Solução:** Executar `supabase link --project-ref [ref]`

### Erro: "Function deploy failed"
**Solução:** 
- Verificar se está no diretório correto
- Verificar se arquivo `index.ts` existe
- Verificar logs de build

### Erro: "Webhook signature verification failed"
**Solução:**
- Verificar se `STRIPE_BILLING_WEBHOOK_SECRET` está configurada corretamente
- Verificar se URL do webhook está correta
- Verificar se eventos estão selecionados
- Verificar se secret copiado está completo (whsec_xxx)

---

## 📝 PRÓXIMO PASSO (Dia 2)

Após concluir Dia 1, seguir para:
- `docs/audit/FASE_1_BILLING_CHECKLIST_DIARIO.md` → Dia 2 (Testes)

---

**GUIA CRIADO:** 2026-01-18
