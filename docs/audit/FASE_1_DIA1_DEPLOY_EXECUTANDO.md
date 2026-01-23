# FASE 1 — DIA 1 — DEPLOY EM EXECUÇÃO

**Data:** 2026-01-18  
**Status:** 🟡 Em execução

---

## 📋 PASSO 1: Login no Supabase CLI (MANUAL)

**Ação necessária:**

Execute no terminal:
```bash
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
- [ ] Projetos listados corretamente

---

## 📋 PASSO 2: Linkar Projeto (Se Necessário)

**Verificar se está linkado:**
```bash
supabase status
```

**Se não estiver linkado:**
```bash
supabase link --project-ref [SEU_PROJECT_REF]
```

**Como encontrar project-ref:**
- Supabase Dashboard → Settings → General → Reference ID

**✅ Marcar quando concluído:**
- [ ] Projeto linkado
- [ ] Status mostra projeto correto

---

## 📋 PASSO 3: Verificar Tabelas (MANUAL)

**Ação necessária:**

1. Abra Supabase Dashboard → SQL Editor
2. Execute: `scripts/verify-billing-tables.sql`
3. **Me informe o resultado:**
   - ✅ 3 tabelas existem → Seguir para PASSO 4
   - ❌ Tabelas não existem → Executar migration primeiro

**Se tabelas não existem:**
1. Abra: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Execute
5. Verifique novamente

**✅ Marcar quando concluído:**
- [ ] Tabelas verificadas
- [ ] Migration executada (se necessário)
- [ ] 3 tabelas confirmadas

---

## 📋 PASSO 4: Deploy Edge Functions

**Após concluir passos 1-3, executar:**

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy stripe-billing
npx supabase functions deploy stripe-billing

# Deploy stripe-billing-webhook
npx supabase functions deploy stripe-billing-webhook
```

**✅ Marcar quando concluído:**
- [ ] `stripe-billing` deployado sem erros
- [ ] `stripe-billing-webhook` deployado sem erros

---

## ⏳ AGUARDANDO

**Aguardando execução dos passos 1-3 (manuais)**

Após concluir, seguimos com o deploy automatizado.

---

**ATUALIZADO:** 2026-01-18
