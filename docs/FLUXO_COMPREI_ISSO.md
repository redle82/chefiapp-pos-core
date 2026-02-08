# Fluxo "Comprei Isso" — Ciclo Fechado de Estoque

**Data:** 2026-01-26  
**Status:** 🎯 DESIGN

---

## 🎯 Objetivo

Fechar o ciclo operacional completo:

```
Pedido → Consumo → Estoque → Compra → Reposição → Pedido
```

---

## 📐 Arquitetura do Fluxo

### Estado Atual (Já Funcionando)

1. **Lista de Compras** (`generate_shopping_list`)
   - ✅ Identifica ingredientes abaixo do mínimo
   - ✅ Calcula quantidade sugerida (com buffer)
   - ✅ Ordena por urgência

### Novo Fluxo (A Implementar)

2. **Confirmar Compra** (`confirm_purchase`)
   - Recebe: `ingredient_id`, `location_id`, `qty_received`, `purchase_price?`
   - Atualiza: `gm_stock_levels.qty += qty_received`
   - Registra: `gm_stock_ledger` (action: 'IN', reason: 'PURCHASE')
   - Fecha: Tarefas de `ESTOQUE_CRITICO` relacionadas
   - Retorna: Novo estoque, tarefas fechadas

3. **UI de Confirmação**
   - Botão "✅ Comprei" em cada item da lista
   - Modal/Input para quantidade recebida (default: sugerida)
   - Opcional: Preço (para histórico futuro)
   - Feedback visual: estoque atualizado, tarefas fechadas

---

## 🔧 Implementação

### 1. RPC Backend: `confirm_purchase`

```sql
CREATE OR REPLACE FUNCTION public.confirm_purchase(
  p_restaurant_id UUID,
  p_ingredient_id UUID,
  p_location_id UUID,
  p_qty_received NUMERIC,
  p_purchase_price_cents INTEGER DEFAULT NULL,
  p_reason TEXT DEFAULT 'PURCHASE'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_new_qty NUMERIC;
  v_tasks_closed INTEGER := 0;
BEGIN
  -- 1. Atualizar estoque (atomicamente)
  UPDATE public.gm_stock_levels
  SET qty = qty + p_qty_received,
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND ingredient_id = p_ingredient_id
    AND location_id = p_location_id
  RETURNING qty INTO v_new_qty;

  IF NOT FOUND THEN
    -- Criar nível de estoque se não existir
    INSERT INTO public.gm_stock_levels (
      restaurant_id, location_id, ingredient_id, qty, min_qty
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id, p_qty_received, 0
    )
    RETURNING qty INTO v_new_qty;
  END IF;

  -- 2. Registrar no ledger
  INSERT INTO public.gm_stock_ledger (
    restaurant_id, location_id, ingredient_id,
    action, qty, reason, created_by_role
  )
  VALUES (
    p_restaurant_id, p_location_id, p_ingredient_id,
    'IN', p_qty_received, p_reason, 'manager'
  );

  -- 3. Fechar tarefas de estoque crítico relacionadas
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND task_type = 'ESTOQUE_CRITICO'
    AND status = 'OPEN'
    AND context->>'ingredient_id' = p_ingredient_id::TEXT
  RETURNING id INTO v_tasks_closed;

  GET DIAGNOSTICS v_tasks_closed = ROW_COUNT;

  -- 4. Retornar resultado
  SELECT jsonb_build_object(
    'success', true,
    'new_qty', v_new_qty,
    'tasks_closed', v_tasks_closed,
    'ingredient_id', p_ingredient_id,
    'location_id', p_location_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

### 2. Writer Frontend: `confirmPurchase`

```typescript
// merchant-portal/src/core-boundary/writers/StockWriter.ts
export async function confirmPurchase(
  restaurantId: string,
  ingredientId: string,
  locationId: string,
  qtyReceived: number,
  purchasePriceCents?: number
): Promise<{
  success: boolean;
  new_qty: number;
  tasks_closed: number;
}> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/confirm_purchase`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': DOCKER_CORE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
      p_ingredient_id: ingredientId,
      p_location_id: locationId,
      p_qty_received: qtyReceived,
      p_purchase_price_cents: purchasePriceCents || null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to confirm purchase: ${response.status} ${errorText}`);
  }

  return await response.json();
}
```

### 3. UI: Botão "Comprei" na ShoppingListMinimal

- Adicionar botão "✅ Comprei" em cada item
- Modal simples para confirmar quantidade (default: `suggested_qty`)
- Feedback: "Estoque atualizado! X tarefas fechadas."
- Recarregar lista automaticamente

---

## 🔄 Fluxo Completo

```
1. Sistema detecta estoque baixo
   ↓
2. Gera tarefa ESTOQUE_CRITICO
   ↓
3. Lista de Compras mostra item
   ↓
4. Usuário clica "✅ Comprei"
   ↓
5. Sistema atualiza estoque (gm_stock_levels)
   ↓
6. Sistema registra no ledger (gm_stock_ledger)
   ↓
7. Sistema fecha tarefas relacionadas (gm_tasks)
   ↓
8. Item sai da lista de compras
   ↓
9. Ciclo fechado ✅
```

---

## ✅ Benefícios

1. **Ciclo Fechado**: Compra → Estoque → Tarefa resolvida
2. **Auditoria**: Ledger registra todas as entradas
3. **Automático**: Tarefas fecham sozinhas
4. **Rastreável**: Histórico completo de compras

---

## 🧪 Validação

Após implementação:
1. Reduzir estoque manualmente (abaixo do mínimo)
2. Verificar que tarefa é gerada
3. Verificar que aparece na lista de compras
4. Clicar "Comprei" com quantidade sugerida
5. Verificar que:
   - Estoque foi atualizado
   - Tarefa foi fechada
   - Item saiu da lista

---

**Próximo passo:** Implementar RPC + Writer + UI
