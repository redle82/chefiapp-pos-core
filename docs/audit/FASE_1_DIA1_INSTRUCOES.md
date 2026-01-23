# FASE 1 — DIA 1 — INSTRUÇÕES PASSO A PASSO

**Data:** 2026-01-18  
**Status:** 🟡 Em execução

---

## ✅ PASSO 1: Verificar Migrations — CONCLUÍDO

**Resultado:**
- ✅ Migration encontrada: `20260130000000_create_billing_core_tables.sql`
- ✅ Cria tabelas: `subscriptions`, `billing_events`, `billing_payments`
- ✅ Inclui RLS policies e triggers

---

## 🔄 PASSO 2: Verificar se Tabelas Existem no Banco

### Ação Necessária:

1. **Abrir Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Executar Script de Verificação**
   - Abra o arquivo: `scripts/verify-billing-tables.sql`
   - Copie e cole no SQL Editor
   - Clique em "Run"

4. **Interpretar Resultado:**
   - Se ver 3 linhas com `✅ EXISTE` → Tabelas já existem, pular para PASSO 3
   - Se ver menos de 3 linhas → Tabelas não existem, executar migration

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

---

## ⏳ PRÓXIMO PASSO (Após verificar tabelas)

**PASSO 3: Deploy Edge Functions**

Aguardando confirmação de que tabelas existem antes de prosseguir.

---

## 📝 CHECKLIST

- [ ] Tabelas verificadas no Supabase Dashboard
- [ ] Migration executada (se necessário)
- [ ] Tabelas confirmadas: `subscriptions`, `billing_events`, `billing_payments`
- [ ] RLS policies verificadas

---

**INSTRUÇÕES CRIADAS:** 2026-01-18  
**AGUARDANDO:** Verificação de tabelas no banco
