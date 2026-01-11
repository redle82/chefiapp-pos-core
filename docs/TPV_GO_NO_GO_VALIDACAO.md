# TPV - Validação GO/NO-GO (15 minutos)

**Data**: 2025-01-27  
**Objetivo**: Validar se TPV está pronto para operação assistida

---

## 🎯 CHECKLIST EXECUTÁVEL

### FASE 1: AMBIENTE (2 min)

- [ ] **1.1** Verificar variáveis de ambiente
  ```bash
  cd merchant-portal
  npm run debug:supabase
  ```
  **Esperado**: URL e Key válidos, conexão OK

- [ ] **1.2** Confirmar ambiente Supabase
  - Local (`supabase start`) ou Cloud (`qonfbtwsxeggxbkhqnxl`)?
  - **Ação**: Verificar console do script acima

---

### FASE 2: MIGRATIONS (3 min)

- [ ] **2.1** Verificar se migrations foram aplicadas
  ```bash
  supabase migration list
  ```
  **Esperado**: `072_payment_security.sql` e `073_cash_register_validation.sql` aparecem como aplicadas

- [ ] **2.2** Se não aplicadas, aplicar agora:
  ```bash
  supabase db push
  ```
  **Esperado**: Sucesso sem erros

---

### FASE 3: VALIDAÇÃO SQL (5 min)

Execute no Supabase SQL Editor:

```sql
-- ✅ CHECK 1: Unique constraint existe
SELECT conname 
FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';
-- Esperado: 1 linha

-- ✅ CHECK 2: Coluna idempotency_key existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'gm_payments' 
  AND column_name = 'idempotency_key';
-- Esperado: 1 linha

-- ✅ CHECK 3: Trigger de caixa existe
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'tr_validate_cash_register_before_order';
-- Esperado: 1 linha

-- ✅ CHECK 4: Trigger de fechamento existe
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'tr_validate_orders_before_close_register';
-- Esperado: 1 linha

-- ✅ CHECK 5: Função process_order_payment tem idempotency
SELECT pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'process_order_payment';
-- Esperado: deve conter 'p_idempotency_key'

-- ✅ CHECK 6: Funções de validação existem
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name IN (
    'fn_check_cash_register_open',
    'fn_validate_orders_before_close'
);
-- Esperado: 2 linhas
```

**Resultado**: Todos os 6 checks devem passar ✅

---

### FASE 4: TESTES FUNCIONAIS (5 min)

#### Teste 1: Caixa Fechado Bloqueia Order
1. Abrir TPV (`/app/tpv`)
2. **NÃO** abrir caixa
3. Tentar criar order (adicionar item)
4. **Esperado**: Erro "No open cash register found" ou botão desabilitado

#### Teste 2: Double Payment Prevention
1. Abrir caixa
2. Criar order com 1 item
3. Clicar "Cobrar" 2x rapidamente (< 500ms)
4. **Esperado**: Apenas 1 payment criado, segundo request retorna `already_processed: true`

#### Teste 3: Orders Abertos Bloqueiam Fechamento
1. Criar order (não pagar)
2. Tentar fechar caixa
3. **Esperado**: Erro "Cannot close cash register with X open order(s)"

#### Teste 4: Pagamento = Fechamento Atômico
1. Criar order
2. Pagar order
3. **Esperado**: 
   - Order status = `PAID`
   - Payment status = `PAID`
   - Order desaparece da lista ativa
   - Apenas 1 payment na tabela

---

## 🚦 VEREDITO FINAL

### ✅ GO (Operação Assistida)
**Se todos os checks passarem:**
- ✅ Migrations aplicadas
- ✅ Constraints/Triggers/Funções existem
- ✅ Testes funcionais passam
- ✅ Feedback visual funciona

**Status**: 🟢 **PRONTO PARA PILOTO ASSISTIDO**

---

### 🔴 NO-GO (Bloqueador)
**Se qualquer check falhar:**
- ❌ Migrations não aplicadas → **BLOQUEADOR**
- ❌ Constraints/Triggers faltando → **BLOQUEADOR**
- ❌ Testes funcionais falham → **BLOQUEADOR**

**Status**: 🔴 **NÃO OPERAR COM DINHEIRO REAL**

**Ação**: Corrigir bloqueadores antes de continuar

---

## 📊 RESULTADO ESPERADO

**Tempo total**: 15 minutos  
**Resultado**: GO/NO-GO claro e objetivo

**Se GO**: Sistema blindado financeiramente, pronto para operação assistida  
**Se NO-GO**: Bloqueadores identificados, correção necessária antes de deploy

---

**FIM DO CHECKLIST**

