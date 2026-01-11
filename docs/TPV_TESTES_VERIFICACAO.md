# TPV - Guia de Testes e Verificação

**Data**: 2025-01-27  
**Objetivo**: Validar que todas as proteções estão funcionando

---

## 🧪 TESTES CRÍTICOS

### 1. Teste: Double Payment Prevention

**Cenário**: Clicar "Cobrar" 2x rapidamente

**Esperado**:
- ✅ Apenas 1 payment criado
- ✅ Unique constraint previne segundo payment
- ✅ Debounce previne segundo request

**Como testar**:
1. Criar pedido
2. Clicar "Cobrar" 2x rapidamente (< 500ms)
3. Verificar: apenas 1 payment na tabela `gm_payments`

**SQL para verificar**:
```sql
SELECT COUNT(*) FROM gm_payments WHERE order_id = 'ORDER_ID';
-- Deve retornar 1
```

---

### 2. Teste: Idempotency Key

**Cenário**: Reenviar mesmo request com mesma idempotency key

**Esperado**:
- ✅ Função retorna `already_processed: true`
- ✅ Não cria payment duplicado

**Como testar**:
1. Processar payment (notar idempotency_key no log)
2. Reenviar mesmo request com mesma key
3. Verificar: função retorna sucesso idempotente

---

### 3. Teste: Re-fetch Order do DB

**Cenário**: Alterar `order.totalCents` no DevTools antes de pagar

**Esperado**:
- ✅ Sistema re-fetch order do DB
- ✅ Recalcula total baseado em items
- ✅ Validação detecta tampering e lança erro

**Como testar**:
1. Abrir DevTools
2. Alterar `order.totalCents` no state React
3. Tentar pagar
4. Verificar: erro "Total mismatch - possible tampering"

---

### 4. Teste: Caixa Fechado Bloqueia Order

**Cenário**: Tentar criar order com caixa fechado

**Esperado**:
- ✅ Trigger SQL bloqueia criação
- ✅ Erro: "No open cash register found"
- ✅ UI mostra botão "ABRIR CAIXA"

**Como testar**:
1. Fechar caixa
2. Tentar criar order
3. Verificar: erro e botão desabilitado

---

### 5. Teste: Orders Abertos Bloqueiam Fechamento

**Cenário**: Tentar fechar caixa com orders abertos

**Esperado**:
- ✅ Trigger SQL bloqueia fechamento
- ✅ UI mostra aviso: "⚠️ X pedido(s) aberto(s)"
- ✅ Botão "Fechar Caixa" desabilitado

**Como testar**:
1. Criar order (não pagar)
2. Tentar fechar caixa
3. Verificar: erro e aviso visual

---

### 6. Teste: Estados Alinhados

**Cenário**: Pagar order e verificar se desaparece da lista

**Esperado**:
- ✅ Order com `payment_status = 'PAID'` não aparece em lista ativa
- ✅ Filtro funciona corretamente

**Como testar**:
1. Criar e pagar order
2. Verificar lista de orders ativos
3. Verificar: order pago não aparece

---

### 7. Teste: Feedback Visual

**Cenário**: Processar payment e ver feedback

**Esperado**:
- ✅ Mensagem de sucesso: "✓ Pagamento registrado com sucesso!"
- ✅ Modal fecha após 2 segundos
- ✅ Em caso de erro: mensagem de erro clara

**Como testar**:
1. Processar payment
2. Verificar: mensagem de sucesso aparece
3. Verificar: modal fecha automaticamente

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após aplicar migrations, verificar:

- [ ] Unique constraint criada: `uq_one_paid_payment_per_order`
- [ ] Coluna `idempotency_key` existe em `gm_payments`
- [ ] Trigger `tr_validate_cash_register_before_order` existe
- [ ] Trigger `tr_validate_orders_before_close_register` existe
- [ ] Função `process_order_payment` tem parâmetro `p_idempotency_key`
- [ ] Função `fn_check_cash_register_open` existe
- [ ] Função `fn_validate_orders_before_close` existe

**SQL para verificar**:
```sql
-- Verificar constraints
SELECT conname FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';

-- Verificar colunas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'gm_payments' AND column_name = 'idempotency_key';

-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name IN (
    'tr_validate_cash_register_before_order',
    'tr_validate_orders_before_close_register'
);

-- Verificar funções
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN (
    'process_order_payment',
    'fn_check_cash_register_open',
    'fn_validate_orders_before_close'
);
```

---

## 🎯 RESULTADO ESPERADO

**Todos os testes devem passar**

**Sistema blindado financeiramente**

**Pronto para operação assistida**

---

**FIM DO GUIA**

