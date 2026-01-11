# Análise Técnica Real do TPV - ChefIApp

**Data**: 2025-01-27  
**Analista**: Arquiteto Sênior de Sistemas de Pagamento  
**Base**: Código atual do repositório

---

## 🎯 RESUMO EXECUTIVO

**Status Atual**: 🟡 **OPERÁVEL COM ASSISTÊNCIA**

O TPV tem **fundação técnica sólida** (transação atômica, caixa funcional, modais completos) mas **falta proteção contra edge cases críticos** (double payment, replay attacks, idempotency).

**Gap Principal**: Segurança financeira em cenários de concorrência e falhas de rede.

---

## ✅ O QUE ESTÁ CORRETO (Base Sólida)

### 1. Schema Completo ✅
- **Tabelas existem**: `gm_orders`, `gm_order_items`, `cash_registers`, `gm_payments` (migrations 070, 032)
- **Constraints corretas**: CHECK constraints em valores, status válidos
- **RLS policies**: Proteção de acesso implementada
- **Triggers**: Auto-calculo de total, auto-update de status

### 2. Transação Atômica ✅
- **Função SQL transacional**: `process_order_payment` (071_atomic_payment_transaction.sql)
- **SELECT FOR UPDATE**: Lock pessimista implementado (linha 44)
- **Validações completas**: 7 validações antes de processar
- **ROLLBACK automático**: PostgreSQL garante tudo ou nada

### 3. Caixa Funcional ✅
- **Modais completos**: `OpenCashRegisterModal`, `CloseCashRegisterModal`
- **Variância tracking**: Calcula diferença esperado vs real
- **Resumo do dia**: Mostra saldo inicial, vendas, esperado
- **Validações**: Input validation, error handling

### 4. Payment Modal ✅
- **Loading state**: `processing` state implementado
- **Métodos claros**: Cash, Card, PIX com UI clara
- **Error handling**: Try/catch com re-throw para UI

### 5. Botões Funcionais ✅
- **Handlers corrigidos**: `onOpenCashRegister`, `onCloseCashRegister`, `onOpenTables` com logs
- **Event propagation**: `preventDefault()` e `stopPropagation()` adicionados

---

## 🔴 BLOQUEADORES CRÍTICOS (Segurança Financeira)

### 1. FALTA UNIQUE CONSTRAINT - Double Payment ⚠️ CRÍTICO

**LOCALIZAÇÃO**: `supabase/migrations/032_sovereign_tpv.sql`

**PROBLEMA**:
```sql
CREATE TABLE IF NOT EXISTS public.gm_payments (
    -- ...
    order_id UUID NOT NULL REFERENCES public.gm_orders(id),
    -- ❌ FALTA: UNIQUE constraint
);
```

**CENÁRIO REAL**:
- Garçom clica "Cobrar" 2x rapidamente
- Dois requests quase simultâneos
- `SELECT FOR UPDATE` na função SQL protege, MAS:
  - Se dois requests chegam em momentos diferentes (1ms de diferença)
  - Primeiro request libera lock
  - Segundo request passa pela validação `payment_status = 'PAID'` ANTES do primeiro commit
  - **Resultado**: 2 payments criados

**IMPACTO**: 💰 Dinheiro duplicado no caixa, relatório errado

**FIX OBRIGATÓRIO**:
```sql
-- Migration: 072_payment_unique_constraint.sql
ALTER TABLE public.gm_payments
ADD CONSTRAINT uq_one_paid_payment_per_order 
UNIQUE (order_id) 
WHERE status = 'paid';
```

**PRIORIDADE**: 🔥 P0 - CRÍTICO

---

### 2. FALTA IDEMPOTENCY KEY - Replay Attack ⚠️ ALTO

**LOCALIZAÇÃO**: `merchant-portal/src/core/tpv/PaymentEngine.ts:43`

**PROBLEMA**:
```typescript
const { data, error } = await supabase.rpc('process_order_payment', {
    p_order_id: input.orderId,
    p_restaurant_id: input.restaurantId,
    p_method: input.method,
    p_amount_cents: input.amountCents,
    // ❌ FALTA: idempotency_key
});
```

**CENÁRIO REAL**:
- Attacker intercepta request (man-in-the-middle, log leak)
- Reenvia request 10x
- Cada request tem timestamp diferente, então `SELECT FOR UPDATE` não previne
- **Resultado**: 10 payments (se unique constraint não existir)

**IMPACTO**: 💰 Dinheiro multiplicado artificialmente

**FIX OBRIGATÓRIO**:
```typescript
// PaymentEngine.ts
const idempotencyKey = `${input.orderId}-${Date.now()}-${crypto.randomUUID()}`;

const { data, error } = await supabase.rpc('process_order_payment', {
    // ... existing params
    p_idempotency_key: idempotencyKey,
});
```

```sql
-- Migration: 072_payment_idempotency.sql
ALTER TABLE public.gm_payments
ADD COLUMN idempotency_key TEXT UNIQUE;

-- Atualizar função
CREATE OR REPLACE FUNCTION public.process_order_payment(
    -- ... existing params
    p_idempotency_key TEXT
) RETURNS JSONB AS $$
BEGIN
    -- Check idempotency FIRST
    IF EXISTS (
        SELECT 1 FROM public.gm_payments 
        WHERE idempotency_key = p_idempotency_key
    ) THEN
        RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;
    
    -- ... rest of function
END;
$$;
```

**PRIORIDADE**: 🔥 P0 - CRÍTICO

---

### 3. VALIDAÇÃO DE AMOUNT NO FRONTEND ⚠️ MÉDIO

**LOCALIZAÇÃO**: `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx:267`

**PROBLEMA**:
```typescript
amountCents: order.totalCents,  // ❌ Vem do estado local (React)
```

**CENÁRIO REAL**:
- Developer tools → alterar `order.totalCents` no state
- Payment processa com valor manipulado
- **Resultado**: Payment de €0.01 em vez de €50

**PROTEÇÃO PARCIAL**: Função SQL valida `p_amount_cents != v_order_total_cents`, MAS:
- Se attacker conhece o total real, pode passar validação
- Se frontend está comprometido, pode enviar valor correto mas registrar diferente

**FIX OBRIGATÓRIO**:
```typescript
// OrderContextReal.tsx:258
case 'pay':
    // RE-FETCH order da DB ANTES de pagar (nunca confiar no frontend)
    const dbOrder = await OrderEngine.getOrderById(orderId);
    
    // Recalcular total baseado em items (double-check)
    const { data: items } = await supabase
        .from('gm_order_items')
        .select('price_snapshot, quantity')
        .eq('order_id', orderId);
    
    const calculatedTotal = items.reduce(
        (sum, i) => sum + (i.price_snapshot * i.quantity), 
        0
    );
    
    if (calculatedTotal !== dbOrder.totalCents) {
        throw new Error('Total mismatch - possible tampering');
    }
    
    await PaymentEngine.processPayment({
        orderId,
        restaurantId,
        amountCents: dbOrder.totalCents, // SEMPRE do DB
        // ...
    });
```

**PRIORIDADE**: 🟡 P1 - ALTO

---

### 4. TIMER FAKE - Não Mostra Tempo Real ⚠️ BAIXO

**LOCALIZAÇÃO**: `merchant-portal/src/ui/design-system/domain/TicketCard.tsx:87`

**PROBLEMA**:
```typescript
const timeElapsed = "12:45"; // ❌ HARDCODED
```

**IMPACTO**: Operador não sabe há quanto tempo pedido está esperando

**FIX SIMPLES**:
```typescript
const getElapsedTime = (createdAt: string) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff/60)}h${diff%60}m`;
};

const timeElapsed = getElapsedTime(order.createdAt);
```

**PRIORIDADE**: 🟢 P2 - BAIXO (não bloqueador)

---

### 5. FALTA BOTÃO "CANCELAR PEDIDO" ⚠️ MÉDIO

**LOCALIZAÇÃO**: `merchant-portal/src/ui/design-system/domain/TicketCard.tsx:129-149`

**PROBLEMA**:
- Só tem botões: "Enviar Cozinha", "Marcar Pronto", "Fechar Conta"
- **FALTA**: Botão "Cancelar Pedido"

**IMPACTO**: Pedidos errados ficam presos, não podem ser cancelados

**FIX**:
```typescript
const canCancel = order.status !== 'paid' && order.status !== 'cancelled';

{canCancel && (
    <Button
        tone="destructive"
        variant="outline"
        size="sm"
        onClick={() => {
            if (confirm('Cancelar pedido? Não pode desfazer.')) {
                onAction('cancel');
            }
        }}
    >
        Cancelar Pedido
    </Button>
)}
```

**PRIORIDADE**: 🟡 P1 - MÉDIO (aceitável com supervisão)

---

### 6. FALTA FEEDBACK VISUAL APÓS PAGAMENTO ⚠️ MÉDIO

**LOCALIZAÇÃO**: `merchant-portal/src/pages/TPV/components/PaymentModal.tsx:31-40`

**PROBLEMA**:
```typescript
const handlePay = async () => {
    setProcessing(true);
    try {
        await onPay(selectedMethod);
        // ❌ Modal fecha imediatamente, sem feedback
    } catch (err) {
        console.error('Payment failed:', err);
        throw err; // Re-throw, mas UI não mostra erro claramente
    } finally {
        setProcessing(false);
    }
};
```

**IMPACTO**: Garçom não sabe se payment foi processado ou falhou

**FIX**:
```typescript
const [result, setResult] = useState<'success' | 'error' | null>(null);

const handlePay = async () => {
    setProcessing(true);
    setResult(null);
    try {
        await onPay(selectedMethod);
        setResult('success');
        setTimeout(() => onCancel(), 2000); // Auto-close após success
    } catch (err) {
        setResult('error');
        setTimeout(() => setResult(null), 3000);
    } finally {
        setProcessing(false);
    }
};

// UI:
{result === 'success' && (
    <Alert type="success">✓ Pagamento registrado!</Alert>
)}
{result === 'error' && (
    <Alert type="error">✗ Erro ao processar. Tente novamente.</Alert>
)}
```

**PRIORIDADE**: 🟡 P1 - MÉDIO (aceitável com supervisão)

---

## 🟡 ACEITÁVEL EM OPERAÇÃO ASSISTIDA

### Features Faltantes (Não Bloqueadores)

1. **Split Payment**: Dividir conta entre múltiplos pagamentos
2. **Change Calculation**: Calcular troco automaticamente (cliente deu X, troco = X - total)
3. **Editar/Anular Items**: Remover items após enviar para cozinha
4. **Transferir Mesa**: Mover pedido de uma mesa para outra
5. **Z-Report Print**: Impressão de relatório fiscal
6. **Refunds**: Estornar pagamentos

**Status**: Aceitável para operação assistida (1-2 mesas, supervisor presente)

---

## 📊 MATRIZ DE RISCOS

| Risco | Impacto $ | Impacto Op | Status | Prioridade |
|-------|-----------|------------|--------|------------|
| Double Payment | 🔴 Alto | 🟡 Médio | ⚠️ Vulnerável | P0 |
| Replay Attack | 🔴 Alto | 🟡 Médio | ⚠️ Vulnerável | P0 |
| Frontend Tampering | 🔴 Alto | ❌ Baixo | ⚠️ Parcial | P1 |
| Timer Fake | ❌ Nenhum | 🟡 Médio | ✅ Aceitável | P2 |
| Sem Cancelar | ❌ Nenhum | 🟡 Médio | ✅ Aceitável | P1 |
| Sem Feedback | ❌ Nenhum | 🟡 Médio | ✅ Aceitável | P1 |

---

## 🎯 PRÓXIMAS AÇÕES (Priorizadas)

### 🔥 P0 - CRÍTICO (4 horas)

1. **Unique Constraint para Payments** (1h)
   - Migration: `072_payment_unique_constraint.sql`
   - Adicionar `UNIQUE (order_id) WHERE status = 'paid'`

2. **Idempotency Key** (3h)
   - Adicionar coluna `idempotency_key` em `gm_payments`
   - Atualizar `PaymentEngine` para gerar key
   - Atualizar função SQL para verificar idempotency

### 🟡 P1 - ALTO (6 horas)

3. **Re-fetch Order do DB** (2h)
   - Modificar `OrderContextReal.tsx` para sempre buscar order do DB antes de pagar
   - Recalcular total baseado em items

4. **Feedback Visual no Payment** (2h)
   - Adicionar estados `success`/`error` no `PaymentModal`
   - Toast notifications

5. **Botão Cancelar Pedido** (1h)
   - Adicionar botão em `TicketCard`
   - Confirmação antes de cancelar

6. **Timer Real** (1h)
   - Substituir hardcoded por cálculo real baseado em `createdAt`

---

## 🏁 CONCLUSÃO

**Status Técnico**: ✅ **BASE SÓLIDA** | ⚠️ **FALTA PROTEÇÃO CONTRA EDGE CASES**

**O que funciona**:
- Transação atômica correta
- Caixa funcional completo
- Schema completo
- UI operacional

**O que falta**:
- Proteção contra double payment (unique constraint)
- Proteção contra replay attacks (idempotency)
- Validação de valores do frontend (re-fetch do DB)

**Tempo para Produção Real**: **10 horas** (P0 + P1 críticos)

**Recomendação**: 
- ✅ **Operação assistida**: ACEITÁVEL (com supervisão)
- 🔴 **Produção real**: BLOQUEADOR até implementar P0

---

**FIM DA ANÁLISE**

