# TPV - Como Aplicar as Migrations

**Data**: 2025-01-27  
**Importante**: Aplicar migrations na ordem correta

---

## 📋 ORDEM DE APLICAÇÃO

As migrations devem ser aplicadas nesta ordem:

1. ✅ `070_tpv_real_order_engine.sql` - Schema base (já aplicada)
2. ✅ `071_atomic_payment_transaction.sql` - Transação atômica (já aplicada)
3. ⚠️ `072_payment_security.sql` - **APLICAR AGORA** (substitui função de 071)
4. ⚠️ `073_cash_register_validation.sql` - **APLICAR AGORA** (validações de caixa)

---

## ⚠️ IMPORTANTE

**Migration 072 substitui a função `process_order_payment` da migration 071.**

A função na migration 072 inclui:
- ✅ Parâmetro `p_idempotency_key`
- ✅ Verificação de idempotency
- ✅ Double-check de payment existente
- ✅ Todas as validações da migration 071

**Isso é correto**: `CREATE OR REPLACE FUNCTION` substitui a função anterior.

---

## 🚀 COMANDOS PARA APLICAR

### Opção 1: Via Supabase CLI

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase db push
```

### Opção 2: Via Supabase Dashboard

1. Acessar Supabase Dashboard
2. Ir em "SQL Editor"
3. Executar `072_payment_security.sql`
4. Executar `073_cash_register_validation.sql`

---

## ✅ VERIFICAÇÃO PÓS-APLICAÇÃO

Após aplicar as migrations, verificar:

```sql
-- Verificar unique constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';

-- Verificar coluna idempotency_key
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gm_payments' AND column_name = 'idempotency_key';

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
    'tr_validate_cash_register_before_order',
    'tr_validate_orders_before_close_register'
);

-- Verificar funções
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'process_order_payment',
    'fn_check_cash_register_open',
    'fn_validate_orders_before_close'
);
```

---

## 🎯 APÓS APLICAÇÃO

**Status**: ✅ Sistema pronto para operação assistida

**Próximos passos**:
1. Testar fluxo completo de pagamento
2. Testar validações de caixa
3. Testes de stress

---

**FIM DO DOCUMENTO**

