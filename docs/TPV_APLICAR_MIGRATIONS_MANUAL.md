# TPV - Aplicar Migrations Manualmente

**Status Atual**: 🔴 NO-GO (Migrations não aplicadas)

**Validação**: `npm run validate:tpv` identificou:
- ❌ Unique constraint `uq_one_paid_payment_per_order` não existe
- ❌ Coluna `idempotency_key` não existe
- ✅ Função `process_order_payment` OK
- ✅ Trigger de caixa OK

---

## 🚀 APLICAR MIGRATIONS (2 opções)

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. **Acessar Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl
   - Navegar: SQL Editor

2. **Aplicar Migration 072** (Segurança de Pagamento)
   - Abrir arquivo: `supabase/migrations/072_payment_security.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor
   - Executar (Run)

3. **Aplicar Migration 073** (Validação de Caixa)
   - Abrir arquivo: `supabase/migrations/073_cash_register_validation.sql`
   - Copiar TODO o conteúdo
   - Colar no SQL Editor
   - Executar (Run)

4. **Validar**
   ```bash
   npm run validate:tpv
   ```
   **Esperado**: ✅ GO

---

### Opção 2: Via Supabase CLI (Se tiver linkado)

```bash
# Linkar projeto (se não linkado)
supabase link --project-ref qonfbtwsxeggxbkhqnxl

# Aplicar migrations
supabase db push
```

---

## ✅ VERIFICAÇÃO PÓS-APLICAÇÃO

Execute no SQL Editor:

```sql
-- Deve retornar 1 linha
SELECT conname FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';

-- Deve retornar 1 linha
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'gm_payments' AND column_name = 'idempotency_key';

-- Deve retornar 1 linha
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'tr_validate_cash_register_before_order';

-- Deve retornar 1 linha
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'tr_validate_orders_before_close_register';
```

**Todos devem retornar 1 linha** ✅

---

## 🎯 PRÓXIMO PASSO

Após aplicar migrations:

1. **Validar novamente**:
   ```bash
   npm run validate:tpv
   ```

2. **Se GO**: Sistema pronto para operação assistida 🟢

3. **Se ainda NO-GO**: Verificar erros no SQL Editor e corrigir

---

**FIM DO GUIA**

