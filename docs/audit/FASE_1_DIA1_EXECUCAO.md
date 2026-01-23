# FASE 1 — DIA 1 — EXECUÇÃO EM TEMPO REAL

**Data:** 2026-01-18  
**Status:** 🟡 Em execução  
**Objetivo:** Deploy completo do billing

---

## ✅ PRÉ-REQUISITOS VERIFICADOS

- ✅ Supabase CLI instalado (`/Users/goldmonkey/.local/bin/supabase`)
- ✅ Edge Functions existem:
  - ✅ `supabase/functions/stripe-billing/index.ts`
  - ✅ `supabase/functions/stripe-billing-webhook/index.ts`
- ✅ Migration existe: `supabase/migrations/20260130000000_create_billing_core_tables.sql`
- ✅ Script de verificação: `scripts/verify-billing-tables.sql`

---

## 📋 PASSO 1: Verificar Tabelas no Banco

### Ação Necessária (Você):

1. **Abrir Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Executar Script de Verificação**
   - Abra: `scripts/verify-billing-tables.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em "Run"

4. **Me informe o resultado:**
   - Se ver **3 linhas** com `✅ EXISTE` → Tabelas já existem, pular para PASSO 2
   - Se ver **menos de 3 linhas** → Tabelas não existem, executar migration

---

## ⏳ AGUARDANDO: Resultado da verificação de tabelas

**Próximo passo será determinado após verificar se tabelas existem.**

---

**ATUALIZADO:** 2026-01-18
