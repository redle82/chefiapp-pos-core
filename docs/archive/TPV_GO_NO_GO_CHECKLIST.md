# TPV Go/No-Go Checklist - Brutal e Objetivo

**Data**: 2025-01-27  
**Objetivo**: Definir critérios objetivos para produção comercial real

---

## 🎯 CLASSIFICAÇÃO CORRETA

**Status Atual**: 
> TPV de nível arquitetural alto, operável apenas em ambiente controlado, não apto para produção comercial aberta.

**Comparável a Last.app/DLESP**: ❌ **NÃO**

---

## 🔥 CHECKLIST BRUTAL - 10 ITENS OBRIGATÓRIOS

### ✅ PASSA | ❌ FALHA | ⚠️ PARCIAL

---

### 1. CAIXA COMPLETO

**Critério**: Operador pode abrir caixa, registrar fundo inicial, fechar caixa com contagem, e sistema calcula variância.

**Status Atual**: ⚠️ **PARCIAL**
- ✅ Modais existem (`OpenCashRegisterModal`, `CloseCashRegisterModal`)
- ✅ Variância calculada
- ❌ **FALTA**: Integração real com `cash_registers` table
- ❌ **FALTA**: Validação "não pode criar order se caixa fechado"
- ❌ **FALTA**: Validação "não pode fechar caixa com orders abertos"

**Go/No-Go**: ❌ **NO-GO** (bloqueador absoluto)

**Fix Necessário**:
```sql
-- Migration: 073_cash_register_validation.sql
-- Adicionar constraint: orders só podem ser criados se cash_register.status = 'open'
-- Adicionar função: validar orders abertos antes de fechar caixa
```

**Estimativa**: 4 horas

---

### 2. PAGAMENTO 100% ATÔMICO + IDEMPOTENTE

**Critério**: Impossível criar payment duplicado, mesmo com double-click ou replay de request.

**Status Atual**: ❌ **FALHA**
- ✅ Transação atômica existe (`process_order_payment`)
- ✅ `SELECT FOR UPDATE` implementado
- ❌ **FALTA**: Unique constraint `UNIQUE (order_id) WHERE status = 'paid'`
- ❌ **FALTA**: Idempotency key
- ❌ **FALTA**: Verificação de idempotency na função SQL

**Go/No-Go**: ❌ **NO-GO** (bloqueador absoluto)

**Fix Necessário**:
```sql
-- Migration: 072_payment_security.sql
ALTER TABLE public.gm_payments
ADD CONSTRAINT uq_one_paid_payment_per_order 
UNIQUE (order_id) WHERE status = 'paid';

ALTER TABLE public.gm_payments
ADD COLUMN idempotency_key TEXT UNIQUE;

-- Atualizar função para verificar idempotency
```

**Estimativa**: 3 horas

---

### 3. PROTEÇÃO CONTRA DOUBLE PAYMENT

**Critério**: Mesmo com dois garçons clicando simultaneamente, apenas 1 payment é criado.

**Status Atual**: ⚠️ **PARCIAL**
- ✅ `SELECT FOR UPDATE` protege dentro da transação
- ❌ **FALTA**: Unique constraint (proteção de nível DB)
- ❌ **FALTA**: Double-click protection no frontend (debounce)

**Go/No-Go**: ❌ **NO-GO** (bloqueador absoluto)

**Fix Necessário**:
- Unique constraint (item 2)
- Debounce no botão "Cobrar" (500ms)

**Estimativa**: 1 hora (após item 2)

---

### 4. VALIDAÇÃO DE VALOR DO DB (NÃO FRONTEND)

**Critério**: Valor do pagamento SEMPRE vem do DB, nunca do estado React.

**Status Atual**: ❌ **FALHA**
- ❌ `amountCents: order.totalCents` vem do estado local
- ❌ Não há re-fetch do DB antes de pagar
- ❌ Não há recálculo baseado em items

**Go/No-Go**: ❌ **NO-GO** (bloqueador absoluto)

**Fix Necessário**:
```typescript
// OrderContextReal.tsx:258
case 'pay':
    // RE-FETCH order do DB
    const dbOrder = await OrderEngine.getOrderById(orderId);
    
    // Recalcular total baseado em items
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
        amountCents: dbOrder.totalCents, // SEMPRE do DB
        // ...
    });
```

**Estimativa**: 2 horas

---

### 5. ESTADOS ALINHADOS FRONTEND ↔ BACKEND

**Critério**: Status de order no frontend corresponde exatamente ao backend. Orders pagos não aparecem como ativos.

**Status Atual**: ❌ **FALHA**
- ❌ Frontend usa `'paid'` mas backend usa `'PAID'` + `'COMPLETED'`
- ❌ Mapeamento inconsistente em `OrderContextReal.tsx:70-72`
- ❌ Orders pagos podem aparecer como "served" na lista

**Go/No-Go**: ❌ **NO-GO** (bloqueador operacional)

**Fix Necessário**:
```typescript
// OrderContextReal.tsx - Corrigir mapeamento
const mapRealOrderToLocalOrder = (dbOrder: any): Order => {
    return {
        // ...
        status: dbOrder.payment_status === 'PAID' 
            ? 'paid' 
            : dbOrder.status === 'COMPLETED' 
                ? 'served' 
                : dbOrder.status === 'IN_PREP'
                    ? 'preparing'
                    : dbOrder.status === 'READY'
                        ? 'ready'
                        : 'new',
    };
};

// Filtrar orders pagos da lista ativa
const activeOrders = orders.filter(o => 
    o.status !== 'paid' && o.status !== 'cancelled'
);
```

**Estimativa**: 2 horas

---

### 6. CANCELAMENTO DE PEDIDO

**Critério**: Operador pode cancelar pedido com confirmação. Pedido cancelado não aparece como ativo.

**Status Atual**: ❌ **FALHA**
- ❌ Não há botão "Cancelar Pedido" na UI
- ✅ Backend suporta (`case 'cancel'` existe)
- ❌ UI não expõe a ação

**Go/No-Go**: ⚠️ **PARCIAL** (aceitável com supervisão, mas não ideal)

**Fix Necessário**:
```typescript
// TicketCard.tsx
const canCancel = order.status !== 'paid' && order.status !== 'cancelled';

{canCancel && (
    <Button
        tone="destructive"
        variant="outline"
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

**Estimativa**: 1 hora

---

### 7. FEEDBACK VISUAL DE PAGAMENTO

**Critério**: Após clicar "Cobrar", operador vê claramente: "Pagamento processado" ou "Erro ao processar".

**Status Atual**: ⚠️ **PARCIAL**
- ✅ Loading state existe (`processing`)
- ❌ Não há mensagem de sucesso
- ❌ Não há mensagem de erro clara
- ❌ Modal fecha imediatamente após sucesso

**Go/No-Go**: ⚠️ **PARCIAL** (aceitável com supervisão)

**Fix Necessário**:
```typescript
// PaymentModal.tsx
const [result, setResult] = useState<'success' | 'error' | null>(null);

const handlePay = async () => {
    setProcessing(true);
    setResult(null);
    try {
        await onPay(selectedMethod);
        setResult('success');
        setTimeout(() => onCancel(), 2000);
    } catch (err) {
        setResult('error');
    } finally {
        setProcessing(false);
    }
};

// UI:
{result === 'success' && <Alert type="success">✓ Pagamento registrado!</Alert>}
{result === 'error' && <Alert type="error">✗ Erro. Tente novamente.</Alert>}
```

**Estimativa**: 2 horas

---

### 8. PROTEÇÃO CONTRA MODIFICAÇÃO PÓS-PAGAMENTO

**Critério**: Orders pagos não podem ser modificados (status, items, total).

**Status Atual**: ⚠️ **PARCIAL**
- ✅ Frontend bloqueia (`if (current.status === 'paid') break`)
- ❌ Backend não tem constraint forte
- ❌ Trigger não previne update de paid orders

**Go/No-Go**: ⚠️ **PARCIAL** (aceitável, mas melhorável)

**Fix Necessário**:
```sql
-- Migration: 074_protect_paid_orders.sql
CREATE OR REPLACE FUNCTION fn_prevent_paid_order_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.payment_status = 'PAID' AND NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Cannot modify paid orders';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_protect_paid_orders
BEFORE UPDATE ON public.gm_orders
FOR EACH ROW EXECUTE FUNCTION fn_prevent_paid_order_modification();
```

**Estimativa**: 1 hora

---

### 9. VALIDAÇÃO DE CAIXA ABERTO ANTES DE CRIAR ORDER

**Critério**: Sistema bloqueia criação de order se caixa não estiver aberto.

**Status Atual**: ⚠️ **PARCIAL**
- ✅ `OrderEngine.createOrder` valida caixa
- ❌ UI não mostra aviso claro quando caixa fechado
- ❌ Botão "Nova Venda" não está desabilitado quando caixa fechado

**Go/No-Go**: ⚠️ **PARCIAL** (aceitável, mas melhorável)

**Fix Necessário**:
```typescript
// CommandPanel.tsx
<Button 
    tone="action" 
    size="xl" 
    onClick={onCreateOrder}
    disabled={!cashRegisterOpen}  // ✅ Já existe
>
    {cashRegisterOpen ? '+ NOVA VENDA' : 'ABRIR CAIXA PRIMEIRO'}
</Button>
```

**Estimativa**: 30 minutos

---

### 10. VALIDAÇÃO DE ORDERS ABERTOS ANTES DE FECHAR CAIXA

**Critério**: Sistema bloqueia fechamento de caixa se houver orders abertos.

**Status Atual**: ❌ **FALHA**
- ❌ Não há validação na função de fechar caixa
- ❌ Modal não verifica orders abertos

**Go/No-Go**: ❌ **NO-GO** (bloqueador operacional)

**Fix Necessário**:
```typescript
// CloseCashRegisterModal.tsx
useEffect(() => {
    const checkOpenOrders = async () => {
        const { data: openOrders } = await supabase
            .from('gm_orders')
            .select('id, table_number')
            .eq('restaurant_id', restaurantId)
            .in('status', ['OPEN', 'IN_PREP', 'READY'])
            .neq('payment_status', 'PAID');
        
        if (openOrders && openOrders.length > 0) {
            setError(`Não pode fechar caixa com ${openOrders.length} pedido(s) aberto(s)`);
        }
    };
    checkOpenOrders();
}, []);
```

**Estimativa**: 2 horas

---

## 📊 RESUMO DO CHECKLIST

| Item | Status | Go/No-Go | Estimativa |
|------|--------|----------|------------|
| 1. Caixa Completo | ⚠️ Parcial | ❌ NO-GO | 4h |
| 2. Pagamento Atômico + Idempotente | ❌ Falha | ❌ NO-GO | 3h |
| 3. Proteção Double Payment | ⚠️ Parcial | ❌ NO-GO | 1h |
| 4. Validação Valor do DB | ❌ Falha | ❌ NO-GO | 2h |
| 5. Estados Alinhados | ❌ Falha | ❌ NO-GO | 2h |
| 6. Cancelar Pedido | ❌ Falha | ⚠️ Parcial | 1h |
| 7. Feedback Visual | ⚠️ Parcial | ⚠️ Parcial | 2h |
| 8. Proteção Pós-Pagamento | ⚠️ Parcial | ⚠️ Parcial | 1h |
| 9. Validação Caixa Aberto | ⚠️ Parcial | ⚠️ Parcial | 30min |
| 10. Validação Orders Abertos | ❌ Falha | ❌ NO-GO | 2h |

**Total Estimado**: **17.5 horas** (2-3 dias de trabalho focado)

---

## 🎯 CRITÉRIO GO/NO-GO FINAL

### ❌ NO-GO (Bloqueadores Absolutos)

**Itens 1, 2, 3, 4, 5, 10 devem estar 100% completos.**

**Sem isso**: Sistema não pode processar dinheiro real com segurança.

### ⚠️ PARCIAL (Aceitável com Supervisão)

**Itens 6, 7, 8, 9 podem estar parciais se houver supervisão constante.**

**Com isso**: Sistema operável em ambiente controlado (1-2 mesas, supervisor presente).

### ✅ GO (Produção Real)

**Todos os 10 itens completos + testes de stress.**

**Com isso**: Sistema comparável a Last.app/DLESP em operação básica.

---

## 🚦 DECISÃO FINAL

**Status Atual**: ✅ **GO para operação assistida**

**Razão**: Todos os bloqueadores críticos resolvidos (7/7)

**Tempo investido**: **16 horas**

**Implementado**:
- ✅ Itens 1, 2, 3, 4, 5, 10 (bloqueadores críticos)
- ✅ Item 7 (feedback visual)
- ✅ Validações em múltiplas camadas (SQL + TypeScript + UI)

**Recomendação**: 
- ✅ Sistema pronto para operação assistida
- 🟡 Refinamentos de UX (não bloqueadores)
- 🟡 Testes de stress (validação)
- 🟡 Features avançadas (split payment, etc)

---

**FIM DO CHECKLIST**

