# TPV Order Editor - Implementação

**Data**: 2025-01-27  
**Status**: ✅ **EDITOR DE ITENS IMPLEMENTADO**

---

## 🎯 Objetivo

Permitir que o garçom edite itens do pedido ativo diretamente na UI:
- Incrementar/decrementar quantidade
- Remover item
- Ver total atualizado em tempo real

---

## ✅ Implementação

### 1. Componente OrderItemEditor ✅

**Arquivo**: `merchant-portal/src/pages/TPV/components/OrderItemEditor.tsx`

**Funcionalidades:**
- Lista todos os itens do pedido ativo
- Mostra preço unitário e total por item
- Botões +/- para ajustar quantidade
- Botão "Remover" para deletar item
- Total do pedido atualizado automaticamente
- Header com ID do pedido e mesa

**Código Principal:**
```typescript
<OrderItemEditor
  order={activeOrders.find(o => o.id === activeOrderId) || null}
  onUpdateQuantity={async (itemId, quantity) => {
    await updateItemQuantity(activeOrderId, itemId, quantity);
    success('Quantidade atualizada');
  }}
  onRemoveItem={async (itemId) => {
    await removeItemFromOrder(activeOrderId, itemId);
    success('Item removido');
  }}
  loading={ordersLoading}
/>
```

---

### 2. Integração no TPV ✅

**Lógica de Exibição:**
- Se há pedido ativo → mostra `OrderItemEditor`
- Se não há pedido ativo → mostra `QuickMenuPanel` ou `TableMapPanel`

**Código:**
```typescript
context={
  activeOrderId && activeOrders.find(o => o.id === activeOrderId) ? (
    <OrderItemEditor ... />
  ) : contextView === 'menu' ? (
    <QuickMenuPanel ... />
  ) : (
    <TableMapPanel ... />
  )
}
```

---

### 3. Funcionalidades do Editor ✅

#### Incrementar Quantidade
- Botão "+" aumenta quantidade em 1
- Chama `updateItemQuantity(orderId, itemId, quantity + 1)`
- Total recalcula automaticamente (via trigger)

#### Decrementar Quantidade
- Botão "−" diminui quantidade em 1
- Se quantidade = 1, remove item automaticamente
- Chama `updateItemQuantity` ou `removeItemFromOrder`

#### Remover Item
- Botão "Remover" deleta item completamente
- Chama `removeItemFromOrder(orderId, itemId)`
- Total recalcula automaticamente

---

## 📊 Fluxo de Uso

### Cenário 1: Editar Pedido Ativo
1. Garçom adiciona itens do menu
2. Pedido fica ativo automaticamente
3. **Painel muda**: Menu → Editor de Itens
4. Garçom vê todos os itens do pedido
5. Pode ajustar quantidades ou remover
6. Total atualiza em tempo real

### Cenário 2: Voltar ao Menu
1. Garçom remove todos os itens (ou cancela pedido)
2. **Painel muda**: Editor → Menu
3. Pode adicionar novos itens

---

## 🎨 UI/UX

### Visual
- **Header**: ID do pedido + Mesa (se houver)
- **Lista de Itens**: Card para cada item
  - Nome do item
  - Preço unitário
  - Controles de quantidade (+/−)
  - Total do item
  - Botão remover
- **Footer**: Subtotal + contagem de itens

### Feedback
- Toast de sucesso ao atualizar quantidade
- Toast de sucesso ao remover item
- Loading state durante operações
- Total sempre visível e atualizado

---

## 🔄 Integração com OrderEngine

### Backend
- `OrderEngine.updateItemQuantity()` - Atualiza quantidade
- `OrderEngine.removeItemFromOrder()` - Remove item
- Trigger SQL recalcula total automaticamente

### Frontend
- `OrderContextReal` expõe funções
- `TPV.tsx` conecta UI com contexto
- Real-time updates via Supabase

---

## ✅ Resultado

**Garçom agora pode:**
- ✅ Ver todos os itens do pedido ativo
- ✅ Ajustar quantidades facilmente
- ✅ Remover itens indesejados
- ✅ Ver total atualizado em tempo real
- ✅ Editar pedido sem sair do TPV

**Sistema:**
- ✅ Total recalcula automaticamente
- ✅ Mudanças persistem no banco
- ✅ Real-time sync entre dispositivos
- ✅ Validações (pedido fechado, etc.)

---

**Status**: ✅ **EDITOR DE ITENS COMPLETO E OPERACIONAL**

