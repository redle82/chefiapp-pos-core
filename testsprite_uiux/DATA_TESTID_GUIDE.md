# Guia de data-testid - Componentes Críticos

**Objetivo:** Adicionar `data-testid` nos componentes críticos para estabilizar os testes UI/UX.

---

## 🎯 Componentes Prioritários

### 1. TopBar / Header
**Arquivo:** `merchant-portal/src/ui/design-system/TopBar.tsx`

```tsx
<h1 className="topbar__title" data-testid="topbar-title">{title}</h1>
```

### 2. Primary CTA Buttons
**Arquivo:** `merchant-portal/src/ui/design-system/Button.tsx`

```tsx
<button 
  className="btn btn--primary" 
  data-testid={primary ? "primary-cta" : "secondary-cta"}
  {...props}
>
  {children}
</button>
```

### 3. Tabs / Navigation
**Arquivo:** `merchant-portal/src/pages/AppStaff/AppStaff.tsx` (ou onde houver tabs)

```tsx
<nav data-testid="tab-navigation">
  <button data-testid="tab-dashboard">Dashboard</button>
  <button data-testid="tab-tasks">Tarefas</button>
</nav>
```

### 4. Empty States
**Arquivo:** Qualquer componente com empty state

```tsx
<div data-testid="empty-state" className="empty-state">
  <p>Nenhum item encontrado</p>
  <button data-testid="empty-state-cta">Criar primeiro item</button>
</div>
```

### 5. Error States
**Arquivo:** Qualquer componente com error state

```tsx
<div data-testid="error-state" className="error-state">
  <p>Erro ao carregar</p>
  <button data-testid="error-state-retry">Tentar novamente</button>
</div>
```

### 6. Loading States
**Arquivo:** Qualquer componente com loading

```tsx
<div data-testid="loading-state" className="loading-state">
  <div className="spinner" />
  <p>Carregando...</p>
</div>
```

### 7. TPV Components
**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`

```tsx
<button data-testid="tpv-new-order">Novo Pedido</button>
<div data-testid="tpv-order-list">...</div>
<div data-testid="tpv-order-detail">...</div>
```

### 8. AppStaff Components
**Arquivo:** `merchant-portal/src/pages/AppStaff/AppStaff.tsx`

```tsx
<div data-testid="staff-landing">...</div>
<div data-testid="staff-task-stream">...</div>
<div data-testid="staff-check-in">...</div>
```

---

## 📋 Checklist de Implementação

- [ ] TopBar com `data-testid="topbar-title"`
- [ ] Todos os botões primários com `data-testid="primary-cta"`
- [ ] Tabs com `data-testid="tab-{name}"`
- [ ] Empty states com `data-testid="empty-state"`
- [ ] Error states com `data-testid="error-state"`
- [ ] Loading states com `data-testid="loading-state"`
- [ ] TPV com testIds específicos
- [ ] AppStaff com testIds específicos
- [ ] Forms com `data-testid="form-{name}"`
- [ ] Modals com `data-testid="modal-{name}"`

---

## 🔍 Como Encontrar Componentes

1. **Buscar por classes CSS:**
   ```bash
   grep -r "empty-state\|error-state\|loading-state" merchant-portal/src
   ```

2. **Buscar por textos:**
   ```bash
   grep -r "Nenhum\|Erro\|Carregando" merchant-portal/src
   ```

3. **Verificar componentes de UI:**
   ```bash
   ls merchant-portal/src/ui/components/
   ls merchant-portal/src/ui/design-system/
   ```

---

## ✅ Exemplo Completo

```tsx
// Componente com todos os estados
export const OrderList: React.FC = () => {
  const { orders, isLoading, error } = useOrders();

  if (isLoading) {
    return (
      <div data-testid="loading-state" className="loading">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="error-state" className="error">
        <p>Erro ao carregar pedidos</p>
        <button data-testid="error-state-retry" onClick={retry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div data-testid="empty-state" className="empty">
        <p>Nenhum pedido encontrado</p>
        <button data-testid="empty-state-cta" onClick={createOrder}>
          Criar primeiro pedido
        </button>
      </div>
    );
  }

  return (
    <div data-testid="order-list">
      {orders.map(order => (
        <div key={order.id} data-testid="order-item">
          {order.items.map(item => (
            <div key={item.id} data-testid="order-item-line">
              {item.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

---

**Próximo passo:** Adicionar testIds gradualmente, começando pelos componentes S0/S1.

