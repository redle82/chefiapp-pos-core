# SPRINT 3 — DIA 9 — TESTES DE CARGA

**Data:** 2026-01-17  
**Objetivo:** Validar sistema com 20 pedidos simultâneos  
**Status:** ⏳ **INICIANDO**

---

## 📋 OBJETIVO

Validar que o sistema consegue processar **20 pedidos simultâneos** sem:
- Race conditions
- Deadlocks
- Perda de dados
- Inconsistências de estado

---

## 📋 CENÁRIOS DE TESTE

### 1. Criação Simultânea de Pedidos (20x)
**Objetivo:** Validar que múltiplos pedidos podem ser criados ao mesmo tempo sem conflitos.

**Cenário:**
- 20 threads criam pedidos simultaneamente
- Cada pedido em uma mesa diferente (mesa 1-20)
- Verificar que todos os 20 pedidos foram criados
- Verificar que não há pedidos duplicados
- Verificar que todos têm status correto

**Métricas:**
- Taxa de sucesso: 100%
- Tempo médio de criação: < 2s
- Sem erros de race condition

---

### 2. Adição Simultânea de Itens (20x)
**Objetivo:** Validar que múltiplos itens podem ser adicionados ao mesmo pedido simultaneamente.

**Cenário:**
- 1 pedido existente
- 20 threads adicionam itens simultaneamente
- Verificar que todos os 20 itens foram adicionados
- Verificar que o total do pedido está correto
- Verificar que não há itens duplicados

**Métricas:**
- Taxa de sucesso: 100%
- Total do pedido correto
- Sem itens duplicados

---

### 3. Atualização Simultânea de Status (20x)
**Objetivo:** Validar que múltiplas atualizações de status não causam conflitos.

**Cenário:**
- 20 pedidos existentes
- 20 threads atualizam status simultaneamente (preparing → ready)
- Verificar que todos os status foram atualizados
- Verificar que não há status inconsistentes

**Métricas:**
- Taxa de sucesso: 100%
- Todos os status corretos
- Sem inconsistências

---

### 4. Pagamento Simultâneo (20x)
**Objetivo:** Validar que múltiplos pagamentos podem ser processados simultaneamente.

**Cenário:**
- 20 pedidos prontos para pagamento
- 20 threads processam pagamentos simultaneamente
- Verificar que todos os pagamentos foram processados
- Verificar que não há pagamentos duplicados
- Verificar idempotência

**Métricas:**
- Taxa de sucesso: 100%
- Sem pagamentos duplicados
- Idempotência garantida

---

### 5. Cenário Completo (20 pedidos end-to-end)
**Objetivo:** Validar fluxo completo de 20 pedidos simultâneos.

**Cenário:**
- 20 threads executam fluxo completo:
  1. Criar pedido
  2. Adicionar 3 itens
  3. Atualizar status (preparing → ready)
  4. Processar pagamento
- Verificar que todos os 20 pedidos completaram o fluxo
- Verificar integridade dos dados

**Métricas:**
- Taxa de sucesso: 100%
- Tempo total: < 30s
- Integridade dos dados: 100%

---

## 📋 IMPLEMENTAÇÃO

### Arquivo: `tests/load/load-test-orders.test.ts`

**Estrutura:**
```typescript
import { OrderEngine } from '../../merchant-portal/src/core/tpv/OrderEngine';
import { PaymentEngine } from '../../merchant-portal/src/core/tpv/PaymentEngine';
import { CashRegisterEngine } from '../../merchant-portal/src/core/tpv/CashRegister';

// Configuração
const RESTAURANT_ID = 'test-restaurant-id';
const OPERATOR_ID = 'test-operator-id';
const CONCURRENT_REQUESTS = 20;

// Cenário 1: Criação Simultânea
async function testConcurrentOrderCreation() {
    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => 
        OrderEngine.createOrder({
            restaurantId: RESTAURANT_ID,
            tableNumber: i + 1,
            operatorId: OPERATOR_ID,
            items: [{
                productId: 'test-product',
                name: 'Test Product',
                priceCents: 1000,
                quantity: 1,
            }],
        })
    );

    const results = await Promise.allSettled(promises);
    // Validar resultados...
}

// Cenário 2: Adição Simultânea de Itens
async function testConcurrentItemAddition() {
    // Criar 1 pedido
    const order = await OrderEngine.createOrder({...});
    
    // 20 threads adicionam itens
    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
        OrderEngine.addItemToOrder(order.id, {
            productId: `product-${i}`,
            name: `Product ${i}`,
            priceCents: 500,
            quantity: 1,
        }, RESTAURANT_ID)
    );

    const results = await Promise.allSettled(promises);
    // Validar resultados...
}

// Cenário 3: Atualização Simultânea de Status
async function testConcurrentStatusUpdate() {
    // Criar 20 pedidos
    const orders = await Promise.all(...);
    
    // 20 threads atualizam status
    const promises = orders.map(order =>
        OrderEngine.updateOrderStatus(order.id, 'preparing', RESTAURANT_ID)
    );

    const results = await Promise.allSettled(promises);
    // Validar resultados...
}

// Cenário 4: Pagamento Simultâneo
async function testConcurrentPayment() {
    // Criar 20 pedidos prontos
    const orders = await Promise.all(...);
    
    // Abrir caixa
    const cashRegister = await CashRegisterEngine.openCashRegister({...});
    
    // 20 threads processam pagamentos
    const promises = orders.map(order =>
        PaymentEngine.processPayment({
            orderId: order.id,
            restaurantId: RESTAURANT_ID,
            cashRegisterId: cashRegister.id,
            amountCents: order.total,
            method: 'CASH',
        })
    );

    const results = await Promise.allSettled(promises);
    // Validar resultados...
}

// Cenário 5: Fluxo Completo
async function testFullFlow() {
    const promises = Array.from({ length: CONCURRENT_REQUESTS }, async (_, i) => {
        // 1. Criar pedido
        const order = await OrderEngine.createOrder({...});
        
        // 2. Adicionar 3 itens
        await OrderEngine.addItemToOrder(order.id, {...}, RESTAURANT_ID);
        await OrderEngine.addItemToOrder(order.id, {...}, RESTAURANT_ID);
        await OrderEngine.addItemToOrder(order.id, {...}, RESTAURANT_ID);
        
        // 3. Atualizar status
        await OrderEngine.updateOrderStatus(order.id, 'preparing', RESTAURANT_ID);
        await OrderEngine.updateOrderStatus(order.id, 'ready', RESTAURANT_ID);
        
        // 4. Processar pagamento
        await PaymentEngine.processPayment({...});
        
        return order;
    });

    const results = await Promise.allSettled(promises);
    // Validar resultados...
}
```

---

## 📋 VALIDAÇÕES

### Para cada cenário:

1. **Taxa de Sucesso:**
   ```typescript
   const successRate = (results.filter(r => r.status === 'fulfilled').length / results.length) * 100;
   expect(successRate).toBe(100);
   ```

2. **Sem Duplicados:**
   ```typescript
   const orderIds = results.map(r => r.value.id);
   const uniqueIds = new Set(orderIds);
   expect(uniqueIds.size).toBe(orderIds.length);
   ```

3. **Integridade dos Dados:**
   ```typescript
   // Verificar que todos os pedidos existem no banco
   const orders = await OrderEngine.getActiveOrders(RESTAURANT_ID);
   expect(orders.length).toBe(CONCURRENT_REQUESTS);
   ```

4. **Tempo de Resposta:**
   ```typescript
   const startTime = Date.now();
   await Promise.all(promises);
   const duration = Date.now() - startTime;
   expect(duration).toBeLessThan(30000); // 30s
   ```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup (30min)
- [ ] Criar arquivo `tests/load/load-test-orders.ts`
- [ ] Configurar variáveis de ambiente (RESTAURANT_ID, etc.)
- [ ] Criar helper functions para validação

### Fase 2: Cenários (2h)
- [ ] Cenário 1: Criação Simultânea
- [ ] Cenário 2: Adição Simultânea de Itens
- [ ] Cenário 3: Atualização Simultânea de Status
- [ ] Cenário 4: Pagamento Simultâneo
- [ ] Cenário 5: Fluxo Completo

### Fase 3: Validações (1h)
- [ ] Taxa de sucesso
- [ ] Sem duplicados
- [ ] Integridade dos dados
- [ ] Tempo de resposta

### Fase 4: Relatório (30min)
- [ ] Gerar relatório de resultados
- [ ] Documentar métricas
- [ ] Identificar gargalos

---

## 🎯 RESULTADOS ESPERADOS

| Cenário | Taxa de Sucesso | Tempo Médio | Status |
|---------|----------------|-------------|--------|
| Criação Simultânea | 100% | < 2s | ⏳ |
| Adição de Itens | 100% | < 1s | ⏳ |
| Atualização de Status | 100% | < 1s | ⏳ |
| Pagamento Simultâneo | 100% | < 3s | ⏳ |
| Fluxo Completo | 100% | < 30s | ⏳ |

---

## 📊 TEMPO ESTIMADO

**Total:** 4h
- Setup: 30min
- Cenários: 2h
- Validações: 1h
- Relatório: 30min

---

**Tempo Estimado:** 4h  
**Status:** ⏳ **AGUARDANDO IMPLEMENTAÇÃO**
