# Regras de Simulação - ChefIApp Core

**Data:** 2026-01-25
**Status:** ✅ Ativo e Enforçado

---

## 🎯 Propósito

Este documento define as **regras constitucionais** que o simulador e todos os testes devem respeitar.

Estas não são sugestões — são constraints de negócio implementadas no banco de dados e validadas pelo Core.

---

## 📋 Regras Constitucionais

### 1. Uma Mesa = Um Pedido Aberto

**Constraint:** `idx_one_open_order_per_table`

**Regra:**




- Uma mesa pode ter apenas **UM pedido com status `OPEN`** por vez
- Múltiplos pedidos `CLOSED`/`PAID` são permitidos (histórico)

- Aplica-se apenas quando `table_id IS NOT NULL`



**Implementação:**

```sql

CREATE UNIQUE INDEX idx_one_open_order_per_table
ON public.gm_orders (table_id)

WHERE status = 'OPEN' AND table_id IS NOT NULL;
```



**Erro Esperado:**


```

duplicate key value violates unique constraint "idx_one_open_order_per_table"
Key (table_id)=(...) already exists.

```


**Comportamento Correto:**

- Antes de criar novo pedido em uma mesa, verificar se há pedido `OPEN`


- Se houver, fechar o pedido anterior OU usar mesa diferente
- Scripts de teste devem limpar pedidos `OPEN` antes de criar novos

**Razão de Negócio:**



- Previne race condition quando TPV e Web criam pedidos simultaneamente
- Garante integridade: uma mesa não pode ter dois pedidos ativos
- Protege contra duplicação acidental



---

### 2. Integridade Referencial


**Regra:**


- `gm_orders.restaurant_id` → deve existir em `gm_restaurants`
- `gm_orders.table_id` → deve existir em `gm_tables` (se não NULL)
- `gm_order_items.order_id` → deve existir em `gm_orders`


- `gm_order_items.product_id` → deve existir em `gm_products` (referência lógica)

**Comportamento:**

- Foreign keys com `ON DELETE CASCADE` onde apropriado
- Constraints garantem que não há órfãos



---


### 3. RLS (Row Level Security)

**Status:** Ativo em tabelas críticas

**Tabelas Protegidas:**


- `gm_orders`


- `gm_order_items`
- `gm_restaurants`
- `gm_products`
- `gm_tables`
- `gm_payments`

**Para Testes:**

- Use `service_role_key` para bypass de RLS


- Em produção, RLS garante isolamento multi-tenant

---


## 🧪 Regras para Scripts de Teste

### ✅ O QUE FAZER

1. **Limpar Estado Antes de Testar**



   ```typescript
   // Fechar pedidos OPEN existentes
   await supabase
     .from('gm_orders')

     .update({ status: 'CLOSED', payment_status: 'PAID' })
     .eq('restaurant_id', restaurantId)
     .eq('status', 'OPEN');
   ```


2. **Verificar Constraints Antes de Inserir**


   ```typescript
   // Verificar se mesa tem pedido aberto
   const { data: existing } = await supabase
     .from('gm_orders')


     .select('id')
     .eq('table_id', tableId)
     .eq('status', 'OPEN')
     .single();


   if (existing) {

     // Fechar ou usar mesa diferente
   }

   ```

3. **Usar Mesas Diferentes para Pedidos Paralelos**


   ```typescript
   // Distribuir pedidos entre mesas
   const table = tables[i % tables.length];
   ```


4. **Limpar Dados Após Testes**

   ```typescript
   // Cleanup

   await supabase
     .from('gm_orders')
     .delete()
     .eq('source', 'test_marker');

   ```

### ❌ O QUE NÃO FAZER

1. **Não criar múltiplos pedidos OPEN na mesma mesa**

   ```typescript
   // ❌ ERRADO
   for (let i = 0; i < 10; i++) {
     await createOrder(restaurantId, sameTableId, ...);

   }
   ```

2. **Não ignorar erros de constraint**

   ```typescript
   // ❌ ERRADO
   try {
     await createOrder(...);
   } catch (e) {
     // Ignorar erro de constraint
   }
   ```

3. **Não assumir que constraints podem ser violadas**

   ```typescript
   // ❌ ERRADO
   // "Vou criar 10 pedidos na mesa 1, o banco vai aceitar"
   ```

---

## 🔍 Asserts do Simulador

O simulador deve validar explicitamente:


```typescript
// Assert: Uma mesa não pode ter dois pedidos abertos

const openOrders = await supabase
  .from('gm_orders')
  .select('table_id')
  .eq('status', 'OPEN')

  .eq('restaurant_id', restaurantId);

const tableCounts = new Map<string, number>();

openOrders.data?.forEach(order => {
  if (order.table_id) {
    tableCounts.set(order.table_id, (tableCounts.get(order.table_id) || 0) + 1);
  }
});


// Verificar que nenhuma mesa tem mais de 1 pedido aberto
for (const [tableId, count] of tableCounts.entries()) {
  assert(count === 1, `Table ${tableId} has ${count} open orders (expected 1)`);

}
```

---


## 📊 Métricas Esperadas


### Com Constraints Respeitadas

- ✅ Taxa de sucesso: **≥ 99%**
- ✅ Pedidos perdidos: **0**
- ✅ Latência média: **< 500ms**
- ✅ P95 latência: **< 1000ms**


### Resultados Reais (Pós-Correção)


- ✅ Taxa de sucesso: **100%** (25/25)
- ✅ Pedidos perdidos: **0**
- ✅ Latência média: **8ms**
- ✅ P95 latência: **14ms**

- ✅ Throughput: **34.77 pedidos/segundo**

---


## 🚨 Quando um Teste Falha

### Checklist de Diagnóstico

1. **Verificar Constraint Violada**

   ```bash
   npx ts-node scripts/test-single-order.ts
   ```

   - Se falhar, verificar qual constraint
   - Verificar se regra de negócio está sendo respeitada

2. **Verificar Estado do Banco**

   ```bash
   npx ts-node scripts/diagnose-test-environment.ts
   ```

   - Verificar se há pedidos OPEN órfãos
   - Verificar se mesas existem
   - Verificar se produtos existem

3. **Verificar RLS**
   - Se usando `anon_key`, verificar se RLS permite
   - Se usando `service_role_key`, RLS é bypassado

4. **Verificar Schema**
   - Colunas existem?
   - Tipos corretos?
   - Constraints aplicadas?

---

## 📝 Exemplos de Testes Corretos

### Teste 1: Criar Pedido Único

```typescript
// ✅ CORRETO
async function testSingleOrder() {
  // 1. Limpar pedidos existentes
  await closeOpenOrders(restaurantId);

  // 2. Criar pedido
  const order = await createOrder(restaurantId, tableId, products);


  // 3. Verificar sucesso
  assert(order.id !== null);

  // 4. Cleanup

  await closeOrder(order.id);
}
```

### Teste 2: Múltiplos Pedidos Paralelos

```typescript

// ✅ CORRETO
async function testMultipleOrders() {
  // 1. Limpar todos os pedidos OPEN
  await closeAllOpenOrders(restaurantId);

  // 2. Distribuir entre mesas diferentes
  const orders = await Promise.all(

    tables.map((table, i) =>

      createOrder(restaurantId, table.id, products)
    )
  );

  // 3. Verificar que cada mesa tem apenas 1 pedido OPEN

  await assertOneOpenOrderPerTable(restaurantId);

  // 4. Cleanup
  await closeAllOrders(orders.map(o => o.id));
}
```


### Teste 3: Stress Test

```typescript
// ✅ CORRETO
async function stressTest() {
  // 1. Limpar estado inicial
  await closeAllOpenOrders(restaurantId);



  // 2. Criar pedidos em sequência, fechando antes de criar novo na mesma mesa
  for (let i = 0; i < 100; i++) {
    const table = tables[i % tables.length];

    // Fechar pedido anterior nesta mesa (se existir)

    await closeOpenOrderOnTable(restaurantId, table.id);

    // Criar novo pedido
    await createOrder(restaurantId, table.id, products);
  }
}
```


---

## 🎓 Lições Aprendidas

### 1. Constraints são Features, não Bugs


Quando o banco retorna:

```
duplicate key value violates unique constraint
```

Isso significa:

- ✅ A regra de negócio está funcionando
- ✅ O sistema está protegendo integridade
- ✅ O teste precisa ser ajustado, não o sistema

### 2. Simulador Deve Ser Mais Rigoroso que Produção

O simulador deve:

- Validar todas as regras
- Falhar cedo e claramente
- Não mascarar problemas

### 3. Diagnóstico Antes de Conclusão

Sempre:

1. Isolar o problema (teste único)
2. Diagnosticar o ambiente
3. Entender a regra violada
4. Corrigir o teste, não o sistema

---

## 🔗 Referências

- **Migration:** `supabase/migrations/082_one_open_order_per_table.sql`
- **Diagnóstico:** `scripts/diagnose-test-environment.ts`
- **Teste Único:** `scripts/test-single-order.ts`
- **Documentação:** `docs/testing/TEST_ENVIRONMENT_DIAGNOSIS.md`

---

*"O Core não tolera incoerência. O simulador não passa pano. Isso é exatamente o que queremos."*
