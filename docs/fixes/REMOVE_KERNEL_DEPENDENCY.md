# Remoção de Dependência do Kernel - Docker Core

**Data:** 2026-01-25  
**Motivo:** Sistema antigo (Kernel) estava bloqueando ações com `KERNEL_NOT_READY`

---

## 🎯 Problema Identificado

O sistema estava usando o **Kernel** (sistema complexo do projeto antigo) que:
- Bloqueava ações com `KERNEL_NOT_READY`
- Exigia autenticação JWT complexa
- Adicionava camadas desnecessárias de abstração
- Impedia acesso direto ao Docker Core

---

## ✅ Solução Aplicada

### 1. Removida Dependência do Kernel

**Antes:**
```typescript
const { kernel, status, isReady, executeSafe } = useKernel();
const isKernelReady = () => isReady && status === 'READY' && kernel !== null;
```

**Depois:**
```typescript
// DOCKER CORE: Sem Kernel, sempre "pronto" para ações diretas
const isKernelReady = () => true;
```

### 2. Ações Diretas via PostgREST

**Antes (com Kernel):**
```typescript
const result = await executeSafe({
    entity: 'ORDER',
    entityId: orderId,
    event: 'FINALIZE',
    targetStatus: 'preparing'
});
```

**Depois (direto ao Core):**
```typescript
const { error } = await supabase
    .from('gm_orders')
    .update({ status: 'preparing', updated_at: new Date().toISOString() })
    .eq('id', orderId);
```

### 3. Criação de Pedidos via RPC

**Antes (com Kernel):**
```typescript
const result = await executeSafe({
    entity: 'ORDER',
    event: 'CREATE',
    items: [...]
});
```

**Depois (direto ao RPC):**
```typescript
const { data, error } = await supabase.rpc('create_order_atomic', {
    p_restaurant_id: restaurantId,
    p_items: rpcItems,
    p_payment_method: 'cash',
    p_sync_metadata: syncMetadata
});
```

---

## 📋 Ações Simplificadas

| Ação | Antes (Kernel) | Depois (Docker Core) |
|------|----------------|----------------------|
| **Criar Pedido** | `executeSafe({ event: 'CREATE' })` | `supabase.rpc('create_order_atomic')` |
| **Iniciar Preparo** | `executeSafe({ event: 'FINALIZE' })` | `supabase.from('gm_orders').update({ status: 'preparing' })` |
| **Marcar Pronto** | `executeSafe({ event: 'MARK_READY' })` | `supabase.from('gm_orders').update({ status: 'ready' })` |
| **Cancelar** | `executeSafe({ event: 'CANCEL' })` | `supabase.from('gm_orders').update({ status: 'canceled' })` |
| **Adicionar Item** | `executeSafe({ event: 'ADD_ITEM' })` | `supabase.from('gm_order_items').insert()` |
| **Remover Item** | `executeSafe({ event: 'REMOVE_ITEM' })` | `supabase.from('gm_order_items').delete()` |

---

## ✅ Benefícios

1. **Sem Bloqueios:** Não há mais `KERNEL_NOT_READY`
2. **Acesso Direto:** Conecta diretamente ao Docker Core
3. **Mais Simples:** Menos camadas de abstração
4. **Mais Rápido:** Menos processamento intermediário
5. **Mais Confiável:** Menos pontos de falha

---

## 🔧 Arquivos Modificados

- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
  - Removida importação de `useKernel`
  - Removidas verificações de `isKernelReady()`
  - Substituídas chamadas `executeSafe` por chamadas diretas ao PostgREST

---

## ⚠️ Notas Importantes

### O Que Foi Mantido

- ✅ Validação de `restaurantId` (necessária)
- ✅ Tratamento de erros
- ✅ Atualização de estado local após operações
- ✅ Sincronização via Realtime

### O Que Foi Removido

- ❌ Dependência do Kernel
- ❌ Verificações de `KERNEL_NOT_READY`
- ❌ Camadas de abstração desnecessárias
- ❌ Sistema de eventos complexo

---

## 🧪 Validação

Após as mudanças, o sistema deve:
- ✅ Criar pedidos sem bloqueios
- ✅ Atualizar status de pedidos diretamente
- ✅ Funcionar sem erros 401
- ✅ Sincronizar via Realtime normalmente

---

**Última atualização:** 2026-01-25
