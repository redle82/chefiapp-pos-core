# TPV Atomic Payment - Implementação

**Data**: 2025-01-27  
**Status**: ✅ **TRANSAÇÃO ATÔMICA IMPLEMENTADA**

---

## 🎯 Objetivo

Implementar transação atômica de pagamento que garante:
- Nenhum pagamento pode existir sem o pedido estar fechado
- Nenhum pedido pode ser fechado sem o pagamento existir
- Tudo ou nada (ROLLBACK em caso de erro)

---

## ✅ Implementação

### 1. Função SQL Transacional ✅

**Arquivo**: `supabase/migrations/071_atomic_payment_transaction.sql`

**Função**: `process_order_payment`

**O que faz:**
1. Valida pedido (existe, não cancelado, não pago, tem itens)
2. Valida valor (não excede total)
3. Valida método (cash/card/pix)
4. **TRANSAÇÃO ATÔMICA:**
   - Insere pagamento em `gm_payments`
   - Atualiza pedido para `PAID` em `gm_orders`
   - Tudo em uma transação SQL única
5. ROLLBACK automático em caso de erro

**Código:**
```sql
CREATE OR REPLACE FUNCTION public.process_order_payment(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_method TEXT,
    p_amount_cents INTEGER,
    p_operator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validações...
    -- Transação atômica:
    INSERT INTO gm_payments (...);
    UPDATE gm_orders SET payment_status = 'PAID', status = 'PAID';
    -- ROLLBACK automático em caso de erro
END;
$$;
```

---

### 2. PaymentEngine Refatorado ✅

**Arquivo**: `merchant-portal/src/core/tpv/PaymentEngine.ts`

**Mudança:**
- Antes: Criava pagamento, trigger atualizava status (não atômico)
- Agora: Chama função SQL transacional (tudo ou nada)

**Código:**
```typescript
static async processPayment(input: PaymentInput): Promise<Payment> {
    // Usar função SQL transacional (tudo ou nada)
    const { data, error } = await supabase.rpc('process_order_payment', {
        p_order_id: input.orderId,
        p_restaurant_id: input.restaurantId,
        p_method: input.method,
        p_amount_cents: input.amountCents,
        p_operator_id: input.metadata?.operatorId || null,
    });
    
    // Se erro, ROLLBACK automático já aconteceu
    if (error) throw new Error(`Failed to process payment: ${error.message}`);
    
    // Buscar pagamento criado
    return paymentData;
}
```

---

### 3. Ação "close" Eliminada ✅

**Mudança:**
- Antes: `pay` criava pagamento, `close` fechava pedido (separado)
- Agora: `pay` faz tudo (paga + fecha) em transação atômica

**Código:**
```typescript
case 'pay':
    // TRANSACTION ATOMICA: paga + fecha
    await PaymentEngine.processPayment({...});
    // Pedido já está fechado automaticamente
    break;

case 'close':
    // Mantido apenas para compatibilidade
    // Se pedido já está pago, apenas atualiza status (redundante)
    break;
```

**UI:**
- Botão "Fechar Conta" removido do TicketCard
- Apenas "Cobrar" (pay) existe agora

---

## 🔒 Garantias da Transação Atômica

### 1. Tudo ou Nada ✅
- Se pagamento falhar → pedido não fecha
- Se pedido não atualizar → pagamento não existe
- ROLLBACK automático em qualquer erro

### 2. Validações Completas ✅
- Pedido existe e pertence ao restaurante
- Pedido não está cancelado
- Pedido não está já pago
- Pedido tem itens (não vazio)
- Valor não excede total
- Método válido

### 3. Estado Consistente ✅
- Pagamento criado → pedido fechado (sempre)
- Pedido fechado → pagamento existe (sempre)
- Impossível ter estado parcial

---

## 📊 Antes vs Depois

### Antes (Não Atômico)
```
1. PaymentEngine.processPayment()
   → Cria pagamento em gm_payments
2. Trigger SQL
   → Atualiza status do pedido
3. ❌ RISCO: Se passo 2 falhar, pagamento existe mas pedido não fecha
```

### Depois (Atômico)
```
1. process_order_payment() (função SQL)
   → BEGIN
   → Valida tudo
   → Insere pagamento
   → Atualiza pedido
   → COMMIT
   → ✅ Se qualquer passo falhar, ROLLBACK automático
```

---

## 🎯 Resultado

**Agora é impossível:**
- ❌ Ter pagamento sem pedido fechado
- ❌ Ter pedido fechado sem pagamento
- ❌ Estado parcial em caso de erro

**Agora é garantido:**
- ✅ Pagamento = pedido fechado (sempre)
- ✅ Estado consistente (sempre)
- ✅ ROLLBACK automático em erro

---

## ✅ Checklist Atualizado

### Bloqueios Duros (5/5)
- [x] Sem caixa aberto → botão "Nova Venda" desativado (hard-block)
- [x] Uma mesa = um pedido ativo
- [x] Recuperar pedido ativo após reload
- [x] Pedido não vazio
- [x] Pagamento = fechamento (ação única, atômica) ✅

### Transações Atômicas
- [x] Pagamento como transação única ✅
- [x] Rollback em caso de falha ✅
- [x] Estado consistente sempre ✅

---

**Status**: ✅ **TRANSAÇÃO ATÔMICA IMPLEMENTADA**

**O TPV agora tem blindagem financeira completa.**

